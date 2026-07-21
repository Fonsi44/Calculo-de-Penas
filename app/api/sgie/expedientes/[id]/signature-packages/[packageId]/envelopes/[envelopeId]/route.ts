import { requireAbogado } from '@/lib/auth';
import { getEnvelope, signatureServiceErrorResponse } from '@/lib/sgie/signature-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; packageId: string; envelopeId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    const { envelopeId } = await params;
    const result = await getEnvelope(envelopeId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return signatureServiceErrorResponse(e);
  }
}
