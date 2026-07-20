import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { confirmarAprobacion, bulkApprovalErrorResponse } from '@/lib/sgie/bulk-approval-service';

const confirmSchema = z.object({
  batchId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(100),
  previewHash: z.string().length(64),
});

/** POST /api/sgie/expedientes/:id/documentos/bulk-approval/confirm
 *  Confirma la aprobación de un lote. Idempotente por idempotencyKey. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    await params; // expedienteId validado vía batchId en el servicio.
    const rl = await rateLimit(`sgie:bulk:confirm:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = confirmSchema.parse(await req.json());
    const result = await confirmarAprobacion(
      { batchId: body.batchId, idempotencyKey: body.idempotencyKey, previewHash: body.previewHash },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return bulkApprovalErrorResponse(e);
  }
}
