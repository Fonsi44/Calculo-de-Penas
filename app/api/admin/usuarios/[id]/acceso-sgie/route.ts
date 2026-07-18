import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, authFailureResponse, invalidateFreshness } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios, usuariosSgie } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { logAudit } from '@/lib/audit';

const schema = z.object({ habilitado: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const { habilitado } = schema.parse(await request.json());
    await db.transaction(async (tx) => {
      await tx.insert(usuariosSgie).values({ usuarioId: id, activoSgie: habilitado })
        .onConflictDoUpdate({ target: usuariosSgie.usuarioId, set: { activoSgie: habilitado, actualizadoEn: new Date() } });
      await tx.update(usuarios).set({ tokenVersion: sql`${usuarios.tokenVersion} + 1` }).where(eq(usuarios.id, id));
    });
    invalidateFreshness(id);
    await logAudit({
      usuarioId: actor.userId, accion: 'permiso_updated', recurso: 'usuario_sgie',
      recursoId: id, metadata: { activoSgie: habilitado }, request,
    });
    return Response.json({ ok: true, activoSgie: habilitado });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 422 });
    return authFailureResponse(error);
  }
}
