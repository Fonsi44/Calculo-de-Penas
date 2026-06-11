import { db } from './db';
import { roles, permisos, rolesPermisos, usuariosRoles, usuarios } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdmin, verifyToken, type AuthUser } from './auth';

export function requirePermission(recurso: string, accion: string) {
  return async (request: Request): Promise<AuthUser> => {
    const user = requireAdmin(request);
    if (user.rol === 'admin') return user;

    const [rolPermiso] = await db.select({ id: permisos.id })
      .from(permisos)
      .innerJoin(rolesPermisos, eq(permisos.id, rolesPermisos.permisoId))
      .innerJoin(roles, eq(roles.id, rolesPermisos.rolId))
      .innerJoin(usuariosRoles, eq(roles.id, usuariosRoles.rolId))
      .where(and(
        eq(usuariosRoles.usuarioId, user.userId),
        eq(permisos.recurso, recurso),
        eq(permisos.accion, accion),
      ))
      .limit(1);

    if (!rolPermiso) {
      throw new AuthError(`Permiso denegado: ${accion} ${recurso}`);
    }

    return user;
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
