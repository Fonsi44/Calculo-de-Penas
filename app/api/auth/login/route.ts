import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, signToken, createAuthResponse } from '@/lib/auth';

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email y contraseña son obligatorios' }), { status: 400 });
  }

  const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email));
  if (!user) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email, rol: user.rol });
  return createAuthResponse({
    message: 'Inicio de sesión exitoso',
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
  }, token);
}
