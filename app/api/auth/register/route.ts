import { db } from '@/lib/db';
import { usuarios, aceptacionesLegales } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signToken, createAuthResponse } from '@/lib/auth';

const TERMINOS_VERSION = '2026-06-04';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }

    const { email, password, nombre } = body as { email?: unknown; password?: unknown; nombre?: unknown };
    if (typeof email !== 'string' || typeof password !== 'string' || typeof nombre !== 'string' || !email || !password || !nombre) {
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

    await db.insert(aceptacionesLegales).values({
      usuarioId: user.id,
      version: TERMINOS_VERSION,
    }).onConflictDoNothing();

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
