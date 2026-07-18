import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { revokeInvitation } from '@/lib/invitations';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    await revokeInvitation(id);
    await logAudit({
      usuarioId: actor.userId, accion: 'invitacion_revoked',
      recurso: 'invitacion', recursoId: id, request,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return authFailureResponse(error);
  }
}
