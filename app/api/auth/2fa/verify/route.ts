/**
 * POST /api/auth/2fa/verify
 *
 * Completa el login cuando el usuario tiene 2FA habilitado. Recibe el challenge
 * (del login) + el código TOTP (o código de recuperación). Si es válido, emite
 * el token de sesión definitivo.
 *
 * Seguridad: rate limit estricto por IP. Respuesta neutra. Auditoría
 * two_factor_verified / two_factor_failed / recovery_code_used.
 *
 * Sprint 5 — tarea 1.
 */
import { verifyToken, signToken, createAuthResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import { z } from 'zod';
import { verificarCodigoTotp, obtenerSecretCifrado, usarCodigoRecuperacion } from '@/lib/auth-2fa';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  challenge: z.string().min(10),
  codigo: z.string().min(6).max(20),
  // Si true, `codigo` se interpreta como código de recuperación.
  usarRecuperacion: z.boolean().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`2fa:verify:${ip}`, { keyPrefix: '2fa', windowMs: 60_000, max: 10 });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const parsed = schema.parse(await request.json());
    const payload = verifyToken(parsed.challenge);
    if (!payload || !payload.userId) {
      return Response.json({ error: 'Sesión de verificación inválida' }, { status: 401 });
    }

    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, payload.userId));
    if (!user || !user.active || user.bloqueado) {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const secretCifrado = await obtenerSecretCifrado(user.id);
    if (!secretCifrado) {
      return Response.json({ error: '2FA no configurado' }, { status: 400 });
    }

    let verificado = false;
    let usoRecuperacion = false;

    if (parsed.usarRecuperacion) {
      verificado = await usarCodigoRecuperacion(user.id, parsed.codigo);
      usoRecuperacion = verificado;
    } else {
      verificado = verificarCodigoTotp(secretCifrado, parsed.codigo);
    }

    if (!verificado) {
      await audit({
        accion: 'login_failed',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        metadata: { evento: 'two_factor_failed' },
        mensaje: 'Código TOTP/recuperación inválido',
      });
      return Response.json({ error: 'Código inválido' }, { status: 401 });
    }

    if (usoRecuperacion) {
      await audit({
        accion: 'login',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: true,
        metadata: { evento: 'recovery_code_used' },
      });
    }

    await audit({
      accion: 'login',
      usuarioId: user.id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: { evento: 'two_factor_verified' },
    });

    const token = signToken({ userId: user.id, email: user.email, rol: user.rol });
    return createAuthResponse({
      message: 'Inicio de sesión exitoso',
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    }, token);
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    return Response.json({ error: 'Error de verificación' }, { status: 500 });
  }
}
