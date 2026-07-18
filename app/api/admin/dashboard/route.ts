import { requireAuth, authFailureResponse } from '@/lib/auth';
import { accessService } from '@/lib/access-service';
import { httpErrorResponse, correlationIdFrom } from '@/lib/http-errors';
import { obtenerDashboardCompleto } from '@/lib/sgie/admin-operations-service';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const correlationId = correlationIdFrom(request);
    await accessService.assertCapability(auth.userId, 'audit.read');

    if (auth.rol !== 'admin' && auth.rol !== 'administrador') {
      return Response.json({ error: 'Solo administradores', correlationId }, { status: 403 });
    }

    const dashboard = await obtenerDashboardCompleto();

    return Response.json({
      ...dashboard,
      correlationId,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof Error && 'status' in err) return authFailureResponse(err);
    return httpErrorResponse(err, request);
  }
}
