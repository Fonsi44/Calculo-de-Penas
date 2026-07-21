import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { reconcileEnvelope, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; packageId: string; envelopeId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { envelopeId } = await params;
    const rl = await rateLimit(`sgie:envelope:reconcile:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const result = await reconcileEnvelope(envelopeId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}
