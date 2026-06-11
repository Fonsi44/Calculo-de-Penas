import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, ilike, or, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

const createSchema = z.object({
  slug: z.string().min(1).max(300).optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  body: z.string().min(1),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional().nullable(),
  category: z.string().min(1).max(200),
  tags: z.array(z.string()).default([]),
  author: z.string().max(200).default('Pineda y Asociados'),
  readingTime: z.string().max(20).default('3 min'),
  coverImage: z.string().max(500).optional().nullable(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  published: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 200);
}

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const conditions = [];
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(blogPosts.title, term), ilike(blogPosts.description, term))!);
    }
    if (query.category) conditions.push(eq(blogPosts.category, query.category));
    if (query.published !== 'all') conditions.push(eq(blogPosts.published, query.published === 'true'));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [countRow]] = await Promise.all([
      db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.publishedAt)).limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ count: sql<number>`count(*)::int` }).from(blogPosts).where(where),
    ]);

    return Response.json({ posts: rows, total: countRow?.count ?? 0, page: query.page, limit: query.limit });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const slug = parsed.slug || slugify(parsed.title);
    if (!slug) return Response.json({ error: 'No se pudo generar un slug' }, { status: 400 });

    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (existing) return Response.json({ error: 'Ya existe un post con ese slug' }, { status: 409 });

    const now = new Date();
    const [post] = await db.insert(blogPosts).values({
      slug, title: parsed.title, description: parsed.description, body: parsed.body,
      publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : now,
      updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : null,
      category: parsed.category, tags: parsed.tags, author: parsed.author,
      readingTime: parsed.readingTime, coverImage: parsed.coverImage ?? null,
      featured: parsed.featured, published: parsed.published,
    }).returning();

    await logAudit({ usuarioId: auth.userId, accion: 'blog_created', recurso: 'blog', recursoId: post.id, metadata: { slug: post.slug, title: post.title }, request });
    if (parsed.published) { revalidatePath('/blog'); revalidatePath(`/blog/${slug}`); }

    return Response.json({ post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
