import { requireAbogado } from '@/lib/auth';
import { verifyIntegrity, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    const { packageId } = await params;
    const result = await verifyIntegrity(packageId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
