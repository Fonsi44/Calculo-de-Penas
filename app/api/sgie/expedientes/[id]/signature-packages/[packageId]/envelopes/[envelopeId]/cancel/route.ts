import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { cancelEnvelope, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

const cancelSchema = z.object({
  motivo: z.string().min(10).max(500),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string; packageId: string; envelopeId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId, envelopeId } = await params;
    const rl = await rateLimit(`sgie:envelope:cancel:${auth.userId}`, { max: 5, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = cancelSchema.parse(await req.json());
    await cancelEnvelope(
      { envelopeId, motivo: body.motivo, expedienteId },
      { actorId: auth.userId },
    );
    return Response.json({ ok: true });
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}
