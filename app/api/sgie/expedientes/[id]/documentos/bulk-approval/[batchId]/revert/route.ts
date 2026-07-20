import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { revertirAprobacion, bulkApprovalErrorResponse } from '@/lib/sgie/bulk-approval-service';

const revertSchema = z.object({
  motivo: z.string().min(10).max(500),
  documentIds: z.array(z.string().uuid()).optional(),
});

/** POST /api/sgie/expedientes/:id/documentos/bulk-approval/:batchId/revert
 *  Revierte la aprobación de documentos solo si es jurídicamente segura. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { batchId } = await params;
    const rl = await rateLimit(`sgie:bulk:revert:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = revertSchema.parse(await req.json());
    const result = await revertirAprobacion(
      { batchId, motivo: body.motivo, documentIds: body.documentIds },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return bulkApprovalErrorResponse(e);
  }
}
