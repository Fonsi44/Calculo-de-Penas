import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { generarPreview, bulkApprovalErrorResponse } from '@/lib/sgie/bulk-approval-service';

const previewSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(50),
});

/** POST /api/sgie/expedientes/:id/documentos/bulk-approval/preview
 *  Genera una preview sin mutar datos. Devuelve hash de confirmación + items. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId } = await params;
    const rl = await rateLimit(`sgie:bulk:preview:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = previewSchema.parse(await req.json());
    const result = await generarPreview(
      { expedienteId, documentIds: body.documentIds },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return bulkApprovalErrorResponse(e);
  }
}
