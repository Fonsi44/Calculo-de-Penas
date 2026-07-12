import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const bodySchema = z.object({
  decision: z.enum(['revisado', 'requiere_nuevo_archivo']),
  notas: z.string().max(500).optional(),
});

/**
 * POST /api/sgie/documentos/:id/extraccion/revisar
 * Body: { decision: 'revisado' | 'requiere_nuevo_archivo', notas?: string }
 *
 * Revisión manual del asistente/abogado sobre la extracción:
 *  - 'revisado' → marca el documento como aprobado (revisado manualmente).
 *  - 'requiere_nuevo_archivo' → marca como incorrecto (hay que pedir otro).
 * Audita `document_manual_reviewed`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:extraccion:revisar:${auth.userId}`, {
      max: 30, windowMs: 60_000, keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id: documentoId } = await params;
    const parsed = bodySchema.parse(await request.json());

    const [doc] = await db.select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      estado: documentosExpediente.estado,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const nuevoEstado = parsed.decision === 'revisado' ? 'aprobado' : 'incorrecto';
    await db.update(documentosExpediente)
      .set({
        estado: nuevoEstado,
        aprobadoPor: parsed.decision === 'revisado' ? auth.userId : null,
        aprobadoEn: parsed.decision === 'revisado' ? new Date() : null,
      })
      .where(eq(documentosExpediente.id, documentoId));

    await logSgie({
      usuarioId: auth.userId,
      accion: 'document_manual_reviewed',
      recurso: 'documento_expediente',
      recursoId: documentoId,
      metadata: {
        expedienteId: doc.expedienteId,
        decision: parsed.decision,
        estadoAnterior: doc.estado,
        estadoNuevo: nuevoEstado,
        notas: parsed.notas ?? null,
      },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
