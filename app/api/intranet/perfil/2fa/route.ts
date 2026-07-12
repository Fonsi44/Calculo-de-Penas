/**
 * /api/intranet/perfil/2fa
 *
 * GET  — estado 2FA del usuario autenticado (habilitado, no secret).
 * POST — iniciar enrolamiento: genera secret, lo guarda pendiente (no habilitado),
 *        devuelve otpauth_uri + secret para QR. No emite códigos de recuperación
 *        hasta confirmar en /enable.
 *
 * Sprint 5 — tarea 1. Requiere sesión (no admin necessarily; el usuario gestiona
 * su propio 2FA). CSRF en POST.
 */
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import {
  tiene2faHabilitado, generarSecretTotp, buildOtpAuthUri,
  guardarSecretPendiente, obtenerEmailUsuario,
} from '@/lib/auth-2fa';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const habilitado = await tiene2faHabilitado(auth.userId);
    return Response.json({ habilitado });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    validateCsrf(request);
    const rl = await rateLimit(`2fa:setup:${auth.userId}`, { keyPrefix: '2fa', windowMs: 60_000, max: 5 });
    if (!rl.ok) return rateLimitResponse(rl);

    // No permitir setup si ya está habilitado (usar regenerar en otro endpoint).
    if (await tiene2faHabilitado(auth.userId)) {
      return Response.json({ error: '2FA ya está habilitado. Desactívelo primero para regenerar.' }, { status: 400 });
    }

    const secret = generarSecretTotp();
    const email = await obtenerEmailUsuario(auth.userId) ?? auth.email;
    const otpauthUri = buildOtpAuthUri(email, secret);
    await guardarSecretPendiente(auth.userId, secret);

    await audit({
      accion: 'login',
      usuarioId: auth.userId,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: { evento: 'two_factor_setup_started' },
    });

    // Devolver secret y URI para QR. El cliente muestra el QR; el usuario
    // introduce un código para confirmar en /enable.
    return Response.json({ otpauthUri, secret });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    return authFailureResponse(err);
  }
}
