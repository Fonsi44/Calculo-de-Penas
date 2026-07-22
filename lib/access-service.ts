import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  expedienteAsignaciones,
  expedientePermisos,
  permisos,
  roles,
  rolesPermisos,
  usuarios,
  usuariosCapacidades,
  usuariosRoles,
  usuariosSgie,
} from '@/lib/schema';
import { ForbiddenError, NotFoundError } from '@/lib/http-errors';

export const CAPABILITIES = [
  'users.read', 'users.manage', 'users.invite', 'roles.manage',
  'cases.read', 'cases.read_all', 'cases.create', 'cases.assign', 'cases.update',
  'documents.read', 'documents.review', 'documents.approve',
  'signature.manage',
  'signature.send',
  'signature.read',
  'signature.cancel',
  'signature.retry',
  'calendar.read', 'calendar.write', 'calendar.manage_team',
  'calendar.external.connect', 'calendar.external.read',
  'search.use', 'search.reindex', 'search.configure',
  'knowledge.read', 'knowledge.create', 'knowledge.review', 'knowledge.approve', 'knowledge.publish', 'knowledge.withdraw', 'knowledge.configure',
  'settings.manage', 'audit.read',
] as const;

export type Capability = typeof CAPABILITIES[number];

const ROLE_DEFAULTS: Record<string, ReadonlySet<Capability>> = {
  admin: new Set(CAPABILITIES),
  administrador: new Set(CAPABILITIES),
  supervisor: new Set([
    'users.read', 'cases.read', 'cases.read_all', 'cases.create', 'cases.assign',
    'cases.update', 'documents.read', 'documents.review', 'documents.approve',
    'calendar.read', 'calendar.write', 'calendar.manage_team',
    'calendar.external.connect', 'calendar.external.read', 'audit.read',
  ]),
  abogado: new Set([
    'cases.read', 'cases.create', 'cases.update', 'documents.read',
    'documents.review', 'calendar.read', 'calendar.write',
  ]),
};

function key(recurso: string, accion: string): string {
  return `${recurso}.${accion}`;
}

export interface PersistedAccess {
  userId: string;
  rol: string;
  active: boolean;
  suspended: boolean;
  sgIeEnabled: boolean;
  capabilities: Set<Capability>;
}

export function defaultCapabilitiesForRole(rol: string): Set<Capability> {
  return new Set(ROLE_DEFAULTS[rol] ?? []);
}

export async function getPersistedAccess(userId: string): Promise<PersistedAccess> {
  const [account] = await db.select({
    userId: usuarios.id,
    rol: usuarios.rol,
    active: usuarios.active,
    suspended: usuarios.bloqueado,
    sgIeEnabled: usuariosSgie.activoSgie,
  }).from(usuarios)
    .leftJoin(usuariosSgie, eq(usuariosSgie.usuarioId, usuarios.id))
    .where(eq(usuarios.id, userId));

  if (!account) throw new NotFoundError('Usuario no encontrado');

  const [roleRows, overrides] = await Promise.all([
    db.select({ recurso: permisos.recurso, accion: permisos.accion })
      .from(usuariosRoles)
      .innerJoin(roles, eq(roles.id, usuariosRoles.rolId))
      .innerJoin(rolesPermisos, eq(rolesPermisos.rolId, roles.id))
      .innerJoin(permisos, eq(permisos.id, rolesPermisos.permisoId))
      .where(eq(usuariosRoles.usuarioId, userId)),
    db.select({
      recurso: permisos.recurso,
      accion: permisos.accion,
      permitido: usuariosCapacidades.permitido,
    }).from(usuariosCapacidades)
      .innerJoin(permisos, eq(permisos.id, usuariosCapacidades.permisoId))
      .where(eq(usuariosCapacidades.usuarioId, userId)),
  ]);

  const capabilities = defaultCapabilitiesForRole(account.rol);
  for (const row of roleRows) {
    const capability = key(row.recurso, row.accion);
    if (CAPABILITIES.includes(capability as Capability)) capabilities.add(capability as Capability);
  }
  for (const override of overrides) {
    const capability = key(override.recurso, override.accion);
    if (!CAPABILITIES.includes(capability as Capability)) continue;
    if (override.permitido) capabilities.add(capability as Capability);
    else capabilities.delete(capability as Capability);
  }

  return {
    userId: account.userId,
    rol: account.rol,
    active: Boolean(account.active),
    suspended: Boolean(account.suspended),
    sgIeEnabled: account.rol === 'admin' || account.rol === 'administrador'
      ? true
      : Boolean(account.sgIeEnabled),
    capabilities,
  };
}

export async function assertSgieAccess(userId: string, capability?: Capability): Promise<PersistedAccess> {
  const access = await getPersistedAccess(userId);
  if (!access.active) throw new ForbiddenError('La cuenta está inactiva');
  if (access.suspended) throw new ForbiddenError('La cuenta está suspendida');
  if (!access.sgIeEnabled) throw new ForbiddenError('El acceso SGIE está deshabilitado');
  if (capability && !access.capabilities.has(capability)) {
    throw new ForbiddenError(`Falta la capacidad ${capability}`);
  }
  return access;
}

export async function assertCapability(userId: string, capability: Capability): Promise<PersistedAccess> {
  const access = await getPersistedAccess(userId);
  if (!access.active || access.suspended) throw new ForbiddenError('Cuenta sin acceso');
  if (!access.capabilities.has(capability)) throw new ForbiddenError(`Falta la capacidad ${capability}`);
  return access;
}

export async function canAccessCase(userId: string, caseId: string): Promise<boolean> {
  const access = await assertSgieAccess(userId, 'cases.read');
  if (access.capabilities.has('cases.read_all')) return true;
  const [assignment, grant] = await Promise.all([
    db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones).where(and(
      eq(expedienteAsignaciones.expedienteId, caseId),
      eq(expedienteAsignaciones.abogadoId, userId),
      isNull(expedienteAsignaciones.revocadaEn),
    )).limit(1),
    db.select({ id: expedientePermisos.id }).from(expedientePermisos).where(and(
      eq(expedientePermisos.expedienteId, caseId),
      eq(expedientePermisos.abogadoId, userId),
      isNull(expedientePermisos.revocadoEn),
    )).limit(1),
  ]);
  return Boolean(assignment[0] || grant[0]);
}

export const accessService = {
  assertSgieAccess,
  assertCapability,
  async assertCaseAccess(params: { userId: string; caseId: string; capability: Capability }) {
    await assertSgieAccess(params.userId, params.capability);
    if (!(await canAccessCase(params.userId, params.caseId))) {
      throw new ForbiddenError('Sin acceso al expediente');
    }
  },
};
