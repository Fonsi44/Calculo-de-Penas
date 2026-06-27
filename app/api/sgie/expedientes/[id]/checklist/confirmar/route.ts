import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  confirmarChecklist,
  type ContextoAbogado,
} from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

/**
 * POST /api/sgie/expedientes/:id/checklist/confirmar
 *
 * El abogado confirma el checklist del expediente: marca los requisitos como
 * confirmados y pasa el expediente a `pendiente_de_documentos`. Es una acción
 * del abogado (no del sistema). Verifica scope.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:checklist:${auth.userId}`, {
      max: 30,
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

    const result = await confirmarChecklist(id, ctx);
    if (result === null) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    await logSgie({
      usuarioId: auth.userId,
      accion: 'expediente_updated',
      recurso: 'expediente',
      recursoId: id,
      metadata: { accion: 'checklist_confirmado' },
      mensaje: 'Checklist confirmado por el abogado',
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Transición no permitida')) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    return authFailureResponse(err);
  }
}
