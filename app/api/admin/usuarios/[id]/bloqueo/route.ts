import { requireAdmin, authFailureResponse, invalidateFreshness } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { bloquearUsuario, desbloquearUsuario, contarAdminsActivos } from '@/lib/sgie/usuarios-db';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const bloqueoSchema = z.object({
  bloqueado: z.boolean(),
  motivo: z.string().max(500).optional(),
});

/**
 * PATCH /api/admin/usuarios/:id/bloqueo
 *
 * Bloquea (revoca acceso) o desbloquea a un usuario. El bloqueo es distinguible
 * de la desactivación (active=false): el usuario sigue existiendo y visible,
 * pero no puede iniciar sesión ni mantener sesión activa (ver /api/auth/me).
 *
 * Protege contra bloquearse a uno mismo y contra bloquear al último admin.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:bloqueo:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = bloqueoSchema.parse(body);

    // No bloquearse a uno mismo.
    if (id === auth.userId && parsed.bloqueado) {
      return Response.json(
        { error: 'No puedes bloquear tu propia cuenta' },
        { status: 403 },
      );
    }

    const [actual] = await db
      .select({ rol: usuarios.rol, bloqueado: usuarios.bloqueado })
      .from(usuarios)
      .where(eq(usuarios.id, id));
    if (!actual) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No bloquear al último admin activo.
    if (parsed.bloqueado && actual.rol === 'admin' && !actual.bloqueado) {
      const admins = await contarAdminsActivos();
      if (admins <= 1) {
        return Response.json(
          { error: 'No se puede bloquear al último administrador activo del sistema' },
          { status: 403 },
        );
      }
    }

    if (parsed.bloqueado) {
      await bloquearUsuario({ usuarioId: id, motivo: parsed.motivo });
    } else {
      await desbloquearUsuario({ usuarioId: id });
    }

    invalidateFreshness(id);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'permiso_updated',
      recurso: 'usuario',
      recursoId: id,
      metadata: { bloqueado: parsed.bloqueado, motivo: parsed.motivo ?? null },
      request,
    });

    return Response.json({ ok: true, bloqueado: parsed.bloqueado });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
