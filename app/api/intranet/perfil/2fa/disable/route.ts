/**
 * POST /api/intranet/perfil/2fa/disable
 *
 * Desactiva el 2FA del usuario autenticado. Requiere confirmación con el
 * código TOTP actual o un código de recuperación (para evitar desactivación
 * accidental o por atacante con sesión robada). CSRF + rate limit + auditoría.
 *
 * Sprint 5 — tarea 1.
 */
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import { verificarCodigoTotp, obtenerSecretCifrado, usarCodigoRecuperacion, deshabilitar2fa } from '@/lib/auth-2fa';

const schema = z.object({
  codigo: z.string().min(6).max(20),
  usarRecuperacion: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    validateCsrf(request);
    const rl = await rateLimit(`2fa:disable:${auth.userId}`, { keyPrefix: '2fa', windowMs: 60_000, max: 5 });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = schema.parse(await request.json());
    const secretCifrado = await obtenerSecretCifrado(auth.userId);

    let verificado = false;
    if (parsed.usarRecuperacion) {
      verificado = await usarCodigoRecuperacion(auth.userId, parsed.codigo);
    } else if (secretCifrado) {
      verificado = verificarCodigoTotp(secretCifrado, parsed.codigo);
    }

    if (!verificado) {
      return Response.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    await deshabilitar2fa(auth.userId);
    await audit({
      accion: 'login',
      usuarioId: auth.userId,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: { evento: 'two_factor_disabled' },
    });

    return Response.json({ habilitado: false });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    return authFailureResponse(err);
  }
}
