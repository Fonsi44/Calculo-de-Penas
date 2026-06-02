import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signToken, createAuthResponse } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let body: any;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }

    const { email, password, nombre } = body;
    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'Email, contraseña y nombre son obligatorios' }), { status: 400 });
    }

    const existing = await db.select().from(usuarios).where(eq(usuarios.email, email));
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado' }), { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usuarios).values({
      email,
      passwordHash,
      nombre,
    }).returning();

    const token = signToken({ userId: user.id, email: user.email, rol: user.rol });
    return createAuthResponse({
      message: 'Usuario registrado',
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    }, token);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
