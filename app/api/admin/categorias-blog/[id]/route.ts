import { db } from '@/lib/db';
import { categoriasBlog, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const updateSchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(500).optional(),
  color: z.string().max(50).optional(),
  icono: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`cat-blog:update:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    if (Object.keys(parsed).length === 0) return Response.json({ error: 'Sin campos' }, { status: 400 });
    const [updated] = await db.update(categoriasBlog).set({ ...parsed, actualizadoEn: new Date() }).where(eq(categoriasBlog.id, id)).returning();
    if (!updated) return Response.json({ error: 'No encontrada' }, { status: 404 });
    await logAudit({ usuarioId: auth.userId, accion: 'categoria_blog_updated' as AuditoriaAccion, recurso: 'categoria_blog', recursoId: id, metadata: { slug: updated.slug }, request });
    return Response.json({ categoria: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`cat-blog:delete:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const [existing] = await db.select({ id: categoriasBlog.id }).from(categoriasBlog).where(eq(categoriasBlog.id, id));
    if (!existing) return Response.json({ error: 'No encontrada' }, { status: 404 });
    await db.delete(categoriasBlog).where(eq(categoriasBlog.id, id));
    await logAudit({ usuarioId: auth.userId, accion: 'categoria_blog_deleted' as AuditoriaAccion, recurso: 'categoria_blog', recursoId: id, request });
    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
