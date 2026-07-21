import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { confirmPackage, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

const confirmSchema = z.object({
  packageId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(120),
  previewHash: z.string().length(64),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId } = await params;
    const rl = await rateLimit(`sgie:sp:confirm:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = confirmSchema.parse(await req.json());
    const result = await confirmPackage(
      { packageId: body.packageId, idempotencyKey: body.idempotencyKey, previewHash: body.previewHash, expedienteId },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
