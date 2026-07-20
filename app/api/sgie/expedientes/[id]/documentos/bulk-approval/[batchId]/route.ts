import { requireAbogado } from '@/lib/auth';
import { consultarResultado, bulkApprovalErrorResponse } from '@/lib/sgie/bulk-approval-service';

/** GET /api/sgie/expedientes/:id/documentos/bulk-approval/:batchId
 *  Consulta el estado y resultados de un lote. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  try {
    const auth = await requireAbogado(req);
    const { batchId } = await params;
    const result = await consultarResultado(batchId, { actorId: auth.userId });
    return Response.json(result);
  } catch (e) {
    return bulkApprovalErrorResponse(e);
  }
}
