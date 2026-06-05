import { db } from '@/lib/db';
import { usuarios, aceptacionesLegales } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signToken, createAuthResponse } from '@/lib/auth';
import { authRegisterSchema, validate } from '@/lib/validation';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';

const TERMINOS_VERSION = '2026-06-04';

export async function POST(request: Request) {
  try {
    const parsed = validate(authRegisterSchema, await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const { email, password, nombre } = parsed.data;

    const existing = await db.select().from(usuarios).where(eq(usuarios.email, email));
    if (existing.length > 0) {
      await audit({
        accion: 'login_failed',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        metadata: { email, kind: 'register_conflict' },
        mensaje: 'Email ya registrado',
      });
      return Response.json({ error: 'El email ya está registrado' }, { status: 409 });
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

    await audit({
      accion: 'login',
      usuarioId: user.id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: { email, kind: 'register' },
      mensaje: 'Cuenta creada',
    });

    const token = signToken({ userId: user.id, email: user.email, rol: user.rol });
    return createAuthResponse({
      message: 'Usuario registrado',
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    }, token);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
