import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const token = getTokenFromCookies(request);
  if (!token) {
    return Response.json({ user: null }, { status: 200 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return Response.json({ user: null }, { status: 200 });
  }

  const [user] = await db.select({
    id: usuarios.id,
    email: usuarios.email,
    nombre: usuarios.nombre,
    rol: usuarios.rol,
    tokenVersion: usuarios.tokenVersion,
    active: usuarios.active,
    bloqueado: usuarios.bloqueado,
  }).from(usuarios).where(eq(usuarios.id, payload.userId));

  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }

  // SGIE — revocación de sesión activa para usuarios bloqueados o desactivados.
  // El JWT es stateless; si un admin bloquea al usuario tras la emisión del token,
  // el token seguiría siendo válido 24h. Aquí cerramos esa ventana: devolvemos
  // `user: null` para que el cliente cierre sesión. Referencia: pinedayasociados.md
  // Fase 2 — Riesgo "sesión activa persiste tras bloqueo".
  if (!user.active || user.bloqueado || user.tokenVersion !== payload.tokenVersion) {
    return Response.json({ user: null }, { status: 200 });
  }

  // No exponer campos internos en la respuesta.
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
}
