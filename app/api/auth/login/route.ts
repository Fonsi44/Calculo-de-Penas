import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, signToken, createAuthResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import { authLoginSchema, validate } from '@/lib/validation';

const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function POST(request: Request) {
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

  await audit({
    accion: 'login',
    usuarioId: user.id,
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
    exito: true,
  });

  const token = signToken({ userId: user.id, email: user.email, rol: user.rol });
  return createAuthResponse({
    message: 'Inicio de sesión exitoso',
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
  }, token);
}
