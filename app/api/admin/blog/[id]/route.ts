import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const updateSchema = z.object({
  slug: z.string().min(1).max(300).optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional().nullable(),
  category: z.string().min(1).max(200).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().max(200).optional(),
  readingTime: z.string().max(20).optional(),
  coverImage: z.string().max(500).optional().nullable(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

/**
 * Umbral mínimo de palabras para publicar (refuerza R13: peso editorial
 * objetivo 800-1000 palabras). Posts por debajo no se publican hasta que un
 * humano los amplíe con información verificable (R17: prohibido rellenar con
 * texto genérico autogenerado).
 */
const MIN_WORDS_TO_PUBLISH = 800;

/** Cuenta palabras reales de un HTML, eliminando tags. */
function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) return Response.json({ error: 'Post no encontrado' }, { status: 404 });
    return Response.json({ post });
  } catch (err) { return authFailureResponse(err); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`blog:update:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    if (Object.keys(parsed).length === 0) return Response.json({ error: 'Sin campos para actualizar' }, { status: 400 });

    if (parsed.slug) {
      const [dup] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, parsed.slug));
      if (dup && dup.id !== id) return Response.json({ error: 'Ya existe un post con ese slug' }, { status: 409 });
    }

    const [existing] = await db.select({ slug: blogPosts.slug, category: blogPosts.category, body: blogPosts.body }).from(blogPosts).where(eq(blogPosts.id, id));
    if (!existing) return Response.json({ error: 'Post no encontrado' }, { status: 404 });
    const oldCategory = existing.category;

    // R13/R17 — bloquear publicación de posts sin peso editorial suficiente.
    // Si se intenta publicar (published: true), el body resultante (nuevo o
    // existente) debe alcanzar el mínimo de palabras. Esto evita publicar
    // plantillas generadas por IA sin editar (H16) y refuerza R13.
    if (parsed.published === true) {
      const effectiveBody = parsed.body !== undefined ? parsed.body : existing.body;
      const words = countWords(effectiveBody);
      if (words < MIN_WORDS_TO_PUBLISH) {
        return Response.json({
          error: `No se puede publicar: el post tiene ${words} palabras (mínimo ${MIN_WORDS_TO_PUBLISH}). Amplía el contenido con información verificable antes de publicar (R13/R17).`,
        }, { status: 422 });
      }
    }

    const values: Record<string, unknown> = {};
    if (parsed.slug !== undefined) values.slug = parsed.slug;
    if (parsed.title !== undefined) values.title = parsed.title;
    if (parsed.description !== undefined) values.description = parsed.description;
    if (parsed.body !== undefined) values.body = sanitizeHtml(parsed.body);
    if (parsed.publishedAt !== undefined) values.publishedAt = new Date(parsed.publishedAt);
    if (parsed.updatedAt !== undefined) values.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : null;
    if (parsed.category !== undefined) values.category = parsed.category;
    if (parsed.tags !== undefined) values.tags = parsed.tags;
    if (parsed.author !== undefined) values.author = parsed.author;
    if (parsed.readingTime !== undefined) values.readingTime = parsed.readingTime;
    if (parsed.coverImage !== undefined) values.coverImage = parsed.coverImage;
    if (parsed.featured !== undefined) values.featured = parsed.featured;
    if (parsed.published !== undefined) values.published = parsed.published;

    const [updated] = await db.update(blogPosts).set(values).where(eq(blogPosts.id, id)).returning();
    if (!updated) return Response.json({ error: 'Post no encontrado' }, { status: 404 });

    await logAudit({ usuarioId: auth.userId, accion: 'blog_updated', recurso: 'blog', recursoId: id, metadata: { slug: updated.slug }, request });

    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${updated.slug}`);
      revalidatePath(`/blog/${updated.category}`);
      if (oldCategory !== updated.category) revalidatePath(`/blog/${oldCategory}`);
    } catch {}

    return Response.json({ post: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`blog:delete:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const [existing] = await db.select({ slug: blogPosts.slug, category: blogPosts.category }).from(blogPosts).where(eq(blogPosts.id, id));
    if (!existing) return Response.json({ error: 'Post no encontrado' }, { status: 404 });

    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    await logAudit({ usuarioId: auth.userId, accion: 'blog_deleted', recurso: 'blog', recursoId: id, metadata: { slug: existing.slug }, request });

    try { revalidatePath('/blog'); revalidatePath(`/blog/${existing.slug}`); revalidatePath(`/blog/${existing.category}`); } catch {}

    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
