import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { requireAdmin, authFailureResponse, isAllowedAuthEmail, invalidateFreshness } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { actualizarRolUsuario } from '@/lib/sgie/usuarios-db';

const updateSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  rol: z.enum(['admin', 'abogado', 'supervisor']).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:update:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (Object.keys(parsed).length === 0) {
      return Response.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    if (id === auth.userId && parsed.rol && parsed.rol !== 'admin') {
      return Response.json({ error: 'No puedes cambiarte tu propio rol de administrador' }, { status: 403 });
    }

    if (parsed.email) {
      if (!isAllowedAuthEmail(parsed.email)) {
        return Response.json({ error: 'El email debe ser del dominio @pinedayasociadoshn.com' }, { status: 400 });
      }
      const [dup] = await db.select({ id: usuarios.id }).from(usuarios)
        .where(and(eq(usuarios.email, parsed.email.trim().toLowerCase()), eq(usuarios.active, true)));
      if (dup && dup.id !== id) {
        return Response.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
      }
    }

    if (parsed.rol && parsed.rol !== 'admin') {
      const [admins] = await db.select({ count: sql<number>`count(*)::int` })
        .from(usuarios)
        .where(and(eq(usuarios.rol, 'admin'), eq(usuarios.active, true)));
      if ((admins?.count ?? 0) <= 1) {
        return Response.json({ error: 'No se puede cambiar el rol: es el último administrador activo del sistema' }, { status: 403 });
      }
    }

    const changes: Record<string, unknown> = {};
    const values: Record<string, unknown> = {};
    if (parsed.nombre !== undefined) { values.nombre = parsed.nombre.trim(); changes.nombre = parsed.nombre.trim(); }
    if (parsed.email !== undefined) { values.email = parsed.email.trim().toLowerCase(); changes.email = parsed.email.trim().toLowerCase(); }
    if (parsed.rol !== undefined) { changes.rol = parsed.rol; }

    const [updated] = Object.keys(values).length > 0
      ? await db.update(usuarios).set(values).where(eq(usuarios.id, id))
        .returning({ id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre, rol: usuarios.rol, creadoEn: usuarios.creadoEn })
      : await db.select({
        id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre,
        rol: usuarios.rol, creadoEn: usuarios.creadoEn,
      }).from(usuarios).where(eq(usuarios.id, id));

    if (parsed.rol !== undefined) {
      await actualizarRolUsuario({ usuarioId: id, nuevoRol: parsed.rol });
    }

    // Revocar caché de frescura si se cambió contraseña, rol o email.
    if (parsed.rol !== undefined || parsed.email !== undefined) {
      invalidateFreshness(id);
    }

    if (!updated) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    await logAudit({
      usuarioId: auth.userId,
      accion: 'usuario_updated',
      recurso: 'usuario',
      recursoId: id,
      metadata: { changes },
      request,
    });

    return Response.json({ user: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:delete:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;

    if (id === auth.userId) {
      return Response.json({ error: 'No puedes desactivarte a ti mismo' }, { status: 403 });
    }

    const [target] = await db.select({ rol: usuarios.rol }).from(usuarios)
      .where(and(eq(usuarios.id, id), eq(usuarios.active, true)));

    if (!target) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (target.rol === 'admin') {
      const [admins] = await db.select({ count: sql<number>`count(*)::int` })
        .from(usuarios)
        .where(and(eq(usuarios.rol, 'admin'), eq(usuarios.active, true)));
      if ((admins?.count ?? 0) <= 1) {
        return Response.json({ error: 'No se puede desactivar el último administrador del sistema' }, { status: 403 });
      }
    }

    await db.update(usuarios)
      .set({ active: false })
      .where(eq(usuarios.id, id));

    invalidateFreshness(id);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'usuario_deleted',
      recurso: 'usuario',
      recursoId: id,
      request,
    });

    return Response.json({ deleted: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
