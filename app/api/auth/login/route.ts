import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, signSessionToken, signTwoFactorChallenge, createAuthResponse, maybeRehashPassword } from '@/lib/auth';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import { authLoginSchema, validate } from '@/lib/validation';
import { tiene2faHabilitado } from '@/lib/auth-2fa';
import { crearChallenge2fa } from '@/lib/two-factor-challenges';

const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(ip, { keyPrefix: 'login', windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX });
    if (!rl.ok) {
      await audit({
        accion: 'rate_limited',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: `Login rate limit exceeded from ${ip}`,
      });
      return rateLimitResponse(rl);
    }

    const parsed = validate(authLoginSchema, await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email));
    if (!user) {
      await audit({
        accion: 'login_failed',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        metadata: { email },
        mensaje: 'Usuario no existe',
      });
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await audit({
        accion: 'login_failed',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: 'Contraseña incorrecta',
      });
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // SGIE — acceso revocado: usuario desactivado (active=false) o bloqueado
    // (bloqueado=true). Se verifica DESPUÉS de la contraseña para no filtrar
    // información sobre qué cuentas existen. Ver docs/architecture/ §6.2.
    if (!user.active) {
      await audit({
        accion: 'login_failed',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: 'Usuario desactivado',
      });
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }
    if (user.bloqueado) {
      await audit({
        accion: 'unauthorized_access',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: 'Intento de login de usuario bloqueado',
      });
      return Response.json({ error: 'Su acceso ha sido bloqueado. Contacte con la administración.' }, { status: 403 });
    }

    // SGIE — registra último acceso (campo `ultimo_acceso`).
    await db.update(usuarios).set({ ultimoAcceso: new Date() }).where(eq(usuarios.id, user.id));

    // Seguridad — rehash progresivo: si el hash del usuario se generó con
    // menos rounds que SALT_ROUNDS (12), se re-hashea ahora. No bloqueante.
    await maybeRehashPassword(password, user.passwordHash, async (newHash) => {
      await db.update(usuarios).set({ passwordHash: newHash }).where(eq(usuarios.id, user.id));
    });

    // Sprint 5 — 2FA: si el usuario tiene 2FA habilitado, no emitir el token
    // final. Devolver un challenge temporal firmado para completar el login en
    // /api/auth/2fa/verify. No rompe a quienes no tienen 2FA (flujo normal).
    const habilitado2fa = await tiene2faHabilitado(user.id);
    if (habilitado2fa) {
      await audit({
        accion: 'login',
        usuarioId: user.id,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: true,
        metadata: { etapa: '2fa_challenge' },
      });
      // Challenge mínimo, persistido y de un único uso. No es una sesión.
      const { jti } = await crearChallenge2fa(user.id);
      const challenge = signTwoFactorChallenge({ userId: user.id, jti });
      return Response.json({
        requiere2fa: true,
        challenge,
        message: 'Introduzca su código de autenticación de dos factores.',
      });
    }

    await audit({
      accion: 'login',
      usuarioId: user.id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
    });

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      tokenVersion: user.tokenVersion,
    });
    return createAuthResponse({
      message: 'Inicio de sesión exitoso',
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    }, token);
  } catch (e: unknown) {
    console.error('[login] Error:', e);
    return Response.json({ error: 'No se pudo iniciar sesión. Intente más tarde.' }, { status: 500 });
  }
}
