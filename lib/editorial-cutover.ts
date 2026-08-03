export type EditorialIndexingMode = 'legacy-preserve' | 'strict-review';

type CutoverEnvironment = {
  [key: string]: string | undefined;
  VERCEL_ENV?: string;
  APP_ENV?: string;
  SEO_EDITORIAL_CUTOVER?: string;
  SEO_EDITORIAL_CUTOVER_APPROVAL_ID?: string;
};

/**
 * Preview valida siempre el contrato editorial estricto. Production conserva
 * las señales actuales hasta una activación doble, explícita y trazable.
 * Rollback: retirar cualquiera de las dos variables de autorización.
 */
export function resolveEditorialIndexingMode(
  env: CutoverEnvironment = process.env,
): EditorialIndexingMode {
  const environment = (env.VERCEL_ENV ?? env.APP_ENV ?? '').toLowerCase();
  if (environment !== 'production') return 'strict-review';

  const enabled = env.SEO_EDITORIAL_CUTOVER === 'approved';
  const approvalId = env.SEO_EDITORIAL_CUTOVER_APPROVAL_ID?.trim() ?? '';
  return enabled && approvalId.length >= 8 ? 'strict-review' : 'legacy-preserve';
}

export function requiresVerifiedEditorialStatus(
  env: CutoverEnvironment = process.env,
): boolean {
  return resolveEditorialIndexingMode(env) === 'strict-review';
}
