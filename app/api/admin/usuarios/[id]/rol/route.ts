import { requireAdmin, authFailureResponse, invalidateFreshness } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { actualizarRolUsuario, contarAdminsActivos } from '@/lib/sgie/usuarios-db';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const rolSchema = z.object({
  rol: z.enum(['admin', 'abogado']),
});

/**
 * PATCH /api/admin/usuarios/:id/rol
 *
 * Cambia el rol de un usuario (admin ↔ abogado). Sincroniza el perfil SGIE:
 * al asignar abogado asegura `usuarios_sgie`; al quitarlo lo desactiva.
 * Protege contra dejarse sin admin y contra autodescartarse.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:rol:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = rolSchema.parse(body);

    // No permitir quitarse el rol admin a uno mismo.
    if (id === auth.userId && parsed.rol !== 'admin') {
      return Response.json(
        { error: 'No puedes quitarte tu propio rol de administrador' },
        { status: 403 },
      );
    }

    // Verificar que el usuario existe y obtener su rol actual.
    const [actual] = await db
      .select({ rol: usuarios.rol })
      .from(usuarios)
      .where(eq(usuarios.id, id));
    if (!actual) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    if (actual.rol === parsed.rol) {
      return Response.json({ ok: true, sinCambios: true });
    }

    // Proteger último admin activo si se va a quitar el rol admin.
    if (actual.rol === 'admin' && parsed.rol === 'abogado') {
      const admins = await contarAdminsActivos();
      if (admins <= 1) {
        return Response.json(
          { error: 'No se puede cambiar el rol: es el último administrador activo del sistema' },
          { status: 403 },
        );
      }
    }

    const updated = await actualizarRolUsuario({ usuarioId: id, nuevoRol: parsed.rol });
    if (!updated) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    invalidateFreshness(id);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'rol_updated',
      recurso: 'usuario',
      recursoId: id,
      metadata: { rolAnterior: actual.rol, rolNuevo: parsed.rol },
      request,
    });

    return Response.json({ ok: true, rol: updated.rol });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
