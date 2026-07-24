export const ROLES_ADMIN = new Set(['admin', 'administrador']);
export const ROLES_SGIE = new Set(['admin', 'administrador', 'abogado', 'supervisor']);

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'administrador';
}

export function isSgieRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'administrador' || role === 'abogado' || role === 'supervisor';
}

export function isAdminOrSgieRole(role: string | null | undefined): boolean {
  return isAdminRole(role) || role === 'abogado' || role === 'supervisor';
}

export function normalizeRole(role: string): string {
  if (role === 'administrador') return 'admin';
  return role;
}
