import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { resendInvitation } from '@/lib/invitations';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const result = await resendInvitation(id, actor.userId);
    await logAudit({
      usuarioId: actor.userId, accion: 'invitacion_resent',
      recurso: 'invitacion', recursoId: result.id,
      metadata: { reemplazaInvitacionId: id, emailEstado: result.emailEstado }, request,
    });
    return Response.json({ invitacion: result });
  } catch (error) {
    return authFailureResponse(error);
  }
}
