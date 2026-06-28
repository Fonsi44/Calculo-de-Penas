/**
 * PATCH  /api/sgie/tareas/:id/comentarios/:comentarioId   (editar texto)
 * DELETE /api/sgie/tareas/:id/comentarios/:comentarioId   (borrado lógico)
 *
 * Sólo el autor puede editar/eliminar su comentario. Auditoría tarea_updated.
 * Sprint 4 — tarea 3.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { tareaComentarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const editSchema = z.object({
  comentario: z.string().min(1).max(2000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; comentarioId: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:comentario:edit:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { comentarioId } = await params;
    const parsed = editSchema.parse(await request.json());

    // Verificar autoría.
    const [existente] = await db.select({ autorId: tareaComentarios.autorId })
      .from(tareaComentarios).where(eq(tareaComentarios.id, comentarioId));
    if (!existente) return Response.json({ error: 'Comentario no encontrado' }, { status: 404 });
    if (existente.autorId !== auth.userId) return Response.json({ error: 'Sólo el autor puede editar' }, { status: 403 });

    const comentario = parsed.comentario.replace(/<[^>]*>/g, '').trim();
    await db.update(tareaComentarios).set({ comentario, editadoEn: new Date() })
      .where(eq(tareaComentarios.id, comentarioId));

    await logSgie({
      usuarioId: auth.userId, accion: 'tarea_updated', recurso: 'tarea_comentario',
      recursoId: comentarioId, metadata: { evento: 'comentario_updated' } as Record<string, unknown>,
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; comentarioId: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const { comentarioId } = await params;

    const [existente] = await db.select({ autorId: tareaComentarios.autorId })
      .from(tareaComentarios).where(eq(tareaComentarios.id, comentarioId));
    if (!existente) return Response.json({ error: 'Comentario no encontrado' }, { status: 404 });
    if (existente.autorId !== auth.userId && auth.rol !== 'admin') {
      return Response.json({ error: 'Sólo el autor o admin puede eliminar' }, { status: 403 });
    }

    await db.update(tareaComentarios).set({ eliminadoEn: new Date() })
      .where(eq(tareaComentarios.id, comentarioId));

    await logSgie({
      usuarioId: auth.userId, accion: 'tarea_updated', recurso: 'tarea_comentario',
      recursoId: comentarioId, metadata: { evento: 'comentario_deleted' } as Record<string, unknown>,
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
