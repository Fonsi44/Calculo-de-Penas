import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { sendEnvelope, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

const sendSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId, packageId } = await params;
    const rl = await rateLimit(`sgie:envelope:send:${auth.userId}`, { max: 5, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = sendSchema.parse(await req.json());
    const result = await sendEnvelope(
      { signaturePackageId: packageId, idempotencyKey: body.idempotencyKey, expedienteId },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}
