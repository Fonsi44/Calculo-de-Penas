import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const bodySchema = z.object({
  decision: z.enum(['aceptar', 'ignorar', 'asistente', 'abogado', 'correccion']),
  notas: z.string().max(500).optional(),
});

/**
 * POST /api/sgie/documentos/:id/ia/revision
 * Body: { decision: 'aceptar'|'ignorar'|'asistente'|'abogado'|'correccion', notas? }
 *
 * Revisión humana del resultado IA:
 *  - aceptar     → aprueba operativamente (no jurídico); audita ai_suggestion_accepted.
 *  - ignorar     → descarta la sugerencia IA; audita ai_suggestion_rejected.
 *  - asistente   → envía a revisión asistente; audita ai_human_review_requested.
 *  - abogado     → envía a revisión abogado; audita ai_human_review_requested.
 *  - correccion  → pedir corrección al cliente; audita ai_correction_requested.
 *
 * La decisión NO es aprobación jurídica final ni cierra el expediente.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:ia:revision:${auth.userId}`, {
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

    // Mapeo decisión → estado operativo + evento auditoría.
    let nuevoEstado = doc.estado;
    let evento: 'ai_suggestion_accepted' | 'ai_suggestion_rejected' | 'ai_human_review_requested' | 'ai_correction_requested';
    let aprobadoPor: string | null = null;
    let aprobadoEn: Date | null = null;
    let rechazoMotivo: string | null = null;

    switch (parsed.decision) {
      case 'aceptar':
        nuevoEstado = 'aprobado';
        aprobadoPor = auth.userId;
        aprobadoEn = new Date();
        evento = 'ai_suggestion_accepted';
        break;
      case 'ignorar':
        nuevoEstado = 'pendiente_abogado';
        evento = 'ai_suggestion_rejected';
        break;
      case 'asistente':
        nuevoEstado = 'pendiente_abogado';
        evento = 'ai_human_review_requested';
        break;
      case 'abogado':
        nuevoEstado = 'pendiente_abogado';
        evento = 'ai_human_review_requested';
        break;
      case 'correccion':
        nuevoEstado = 'incorrecto';
        rechazoMotivo = parsed.notas ?? 'Requiere corrección (revisión IA)';
        evento = 'ai_correction_requested';
        break;
    }

    await db.update(documentosExpediente)
      .set({
        estado: nuevoEstado as typeof documentosExpediente.$inferSelect.estado,
        aprobadoPor,
        aprobadoEn,
        rechazoMotivo,
      })
      .where(eq(documentosExpediente.id, documentoId));

    await logSgie({
      usuarioId: auth.userId,
      accion: evento,
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
