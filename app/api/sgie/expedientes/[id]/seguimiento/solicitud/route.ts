import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { verificarAccesoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { enviarSolicitudDocumental } from '@/lib/sgie/recordatorios-cliente';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { cambiarEstadoExpediente } from '@/lib/sgie/expedientes-db';

/**
 * POST /api/sgie/expedientes/:id/seguimiento/solicitud
 *
 * Envía la solicitud documental inicial al cliente: crea/reutiliza un magic
 * link y envía el email con la URL de carga (idempotente por día). Pasa el
 * expediente a `enlace_enviado`. Acción del abogado. Verifica scope.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:seguimiento:solicitud:${auth.userId}`, {
      max: 20,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;

    const ctx: ContextoAbogado = {
      usuarioId: auth.userId,
      rol: auth.rol,
      esAdmin: auth.rol === 'admin',
    };
    const tieneAcceso = await verificarAccesoExpediente(id, ctx);
    if (!tieneAcceso) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const resultado = await enviarSolicitudDocumental(id, auth.userId);

    // Avanzar el estado del expediente a enlace_enviado si procede.
    try {
      await cambiarEstadoExpediente(id, 'enlace_enviado', ctx);
    } catch {
      // Si la transición no aplica (ej. ya avanzado), se ignora; el envío se hizo.
    }

    await logSgie({
      usuarioId: auth.userId,
      accion: 'reminder_sent',
      recurso: 'expediente',
      recursoId: id,
      metadata: {
        slug: 'solicitud_documental',
        enviado: resultado.enviado,
        motivo: resultado.motivo,
        enlaceId: resultado.enlaceId,
      },
      mensaje: 'Solicitud documental enviada al cliente',
      request,
    });

    return Response.json({ ok: true, resultado });
  } catch (err) {
    return authFailureResponse(err);
  }
}
