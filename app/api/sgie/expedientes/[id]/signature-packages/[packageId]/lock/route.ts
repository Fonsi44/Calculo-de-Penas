import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { lockPackage, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId, packageId } = await params;
    const rl = await rateLimit(`sgie:sp:lock:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const result = await lockPackage(
      { packageId, expedienteId },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
