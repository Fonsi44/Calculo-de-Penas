import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const token = getTokenFromCookies(request);
  if (!token) {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }

  const [user] = await db.select({
    id: usuarios.id,
    email: usuarios.email,
    nombre: usuarios.nombre,
    rol: usuarios.rol,
  }).from(usuarios).where(eq(usuarios.id, payload.userId));

  if (!user) {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }

  return new Response(JSON.stringify({ user }), { status: 200 });
}
