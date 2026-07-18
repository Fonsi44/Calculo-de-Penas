import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { acceptInvitation, inspectInvitation } from '@/lib/invitations';
import { authFailureResponse } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const acceptSchema = z.object({
  password: z.string().min(12).max(128)
    .regex(/[a-z]/, 'Debe incluir una minúscula')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  termsAccepted: z.literal(true),
});

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return Response.json(await inspectInvitation(token));
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    validateCsrf(request);
    const ip = getClientIp(request);
    const rl = await rateLimit(`invite-accept:${ip}`, {
      max: 8, windowMs: 15 * 60_000, keyPrefix: 'auth',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = acceptSchema.parse(await request.json());
    const { token } = await params;
    const result = await acceptInvitation({ token, ...parsed });
    await logAudit({
      usuarioId: result.userId,
      accion: 'invitacion_accepted',
      recurso: 'invitacion',
      metadata: { requiresTwoFactorSetup: result.requiresTwoFactorSetup },
      request,
    });
    return Response.json({
      activated: true,
      requiresTwoFactorSetup: result.requiresTwoFactorSetup,
      next: result.requiresTwoFactorSetup ? '/intranet/login?setup2fa=1' : '/intranet/login',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 422 });
    }
    return authFailureResponse(error);
  }
}
