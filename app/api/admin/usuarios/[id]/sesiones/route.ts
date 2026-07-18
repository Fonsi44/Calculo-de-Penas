import { eq, sql } from 'drizzle-orm';
import { requireAdmin, authFailureResponse, invalidateFreshness } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const [updated] = await db.update(usuarios)
      .set({ tokenVersion: sql`${usuarios.tokenVersion} + 1` })
      .where(eq(usuarios.id, id)).returning({ id: usuarios.id });
    if (!updated) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    invalidateFreshness(id);
    await logAudit({
      usuarioId: actor.userId, accion: 'permiso_updated', recurso: 'sesiones',
      recursoId: id, metadata: { revocadas: true }, request,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return authFailureResponse(error);
  }
}
