import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { cancelPackage, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

const cancelSchema = z.object({
  motivo: z.string().min(10).max(500),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId, packageId } = await params;
    const rl = await rateLimit(`sgie:sp:cancel:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = cancelSchema.parse(await req.json());
    const result = await cancelPackage(
      { packageId, motivo: body.motivo, expedienteId },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
