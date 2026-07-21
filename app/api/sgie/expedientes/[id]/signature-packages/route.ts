import { requireAbogado } from '@/lib/auth';
import { listPackages, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req);
    const { id: expedienteId } = await params;
    const result = await listPackages(expedienteId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
