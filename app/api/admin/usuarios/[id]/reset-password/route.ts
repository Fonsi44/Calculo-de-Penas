import crypto from 'crypto';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { requireAdmin, authFailureResponse, hashPassword, invalidateFreshness } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;

    if (id === auth.userId) {
      return Response.json({ error: 'Usa /api/auth/change-password para cambiar tu propia contraseña' }, { status: 400 });
    }

    const [target] = await db.select({ id: usuarios.id, nombre: usuarios.nombre })
      .from(usuarios)
      .where(and(eq(usuarios.id, id), eq(usuarios.active, true)));

    if (!target) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);

    await db.update(usuarios)
      .set({ passwordHash, mustChangePassword: true })
      .where(eq(usuarios.id, id));

    invalidateFreshness(id);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'password_reset',
      recurso: 'usuario',
      recursoId: id,
      metadata: { mustChangePassword: true },
      request,
    });

    return Response.json({
      success: true,
      tempPassword,
      warning: 'Esta contraseña temporal se muestra UNA SOLA VEZ. El usuario deberá cambiarla al iniciar sesión. Anótela ahora.',
      mustChangePassword: true,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
