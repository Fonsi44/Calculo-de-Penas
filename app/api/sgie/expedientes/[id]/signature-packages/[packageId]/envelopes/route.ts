import { requireAbogado } from '@/lib/auth';
import { listEnvelopes, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; packageId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    const { packageId } = await params;
    const result = await listEnvelopes(packageId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}
