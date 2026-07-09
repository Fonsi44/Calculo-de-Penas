import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { verificarAccesoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { desbloquearExpediente } from '@/lib/sgie/seguimiento-documental';

/**
 * POST /api/sgie/expedientes/:id/seguimiento/desbloquear
 *
 * Desbloquea un expediente que estaba en `bloqueado_por_cliente` (falta de
 * respuesta del cliente). Lo devuelve a `pendiente_de_documentos`. Acción del
 * abogado. Audita `case_unblocked`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:seguimiento:desbloquear:${auth.userId}`, {
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

    const result = await desbloquearExpediente(id, ctx);
    if (result === null) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }
    if (!result.ok) {
      return Response.json({ error: 'El expediente no está bloqueado' }, { status: 409 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
