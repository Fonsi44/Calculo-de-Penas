import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { requireAuth, authFailureResponse, verifyPassword, hashPassword, invalidateFreshness } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    validateCsrf(request);
    const body = await request.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const [user] = await db.select({ passwordHash: usuarios.passwordHash })
      .from(usuarios)
      .where(eq(usuarios.id, auth.userId));

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return Response.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await db.update(usuarios)
      .set({ passwordHash: newHash, mustChangePassword: false, tokenVersion: sql`${usuarios.tokenVersion} + 1` })
      .where(eq(usuarios.id, auth.userId));

    invalidateFreshness(auth.userId);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'password_changed',
      recurso: 'usuario',
      recursoId: auth.userId,
      request,
    });

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
