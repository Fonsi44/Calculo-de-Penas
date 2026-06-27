import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const bodySchema = z.object({ motivo: z.string().min(1).max(500) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id: documentoId } = await params;
    const { motivo } = bodySchema.parse(await request.json());

    const [doc] = await db.select({ expedienteId: documentosExpediente.expedienteId })
      .from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    await db.update(documentosExpediente).set({ estado: 'rechazado', rechazadoPor: auth.userId, rechazadoEn: new Date(), rechazoMotivo: motivo })
      .where(eq(documentosExpediente.id, documentoId));

    await logSgie({ usuarioId: auth.userId, accion: 'documento_updated', recurso: 'documento', recursoId: documentoId, metadata: { accion: 'rechazar', motivo }, request });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
