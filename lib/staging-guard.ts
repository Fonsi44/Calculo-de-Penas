const STAGING_PROJECT_IDS = new Set([
  'justicia-verdadera',
]);
const STAGING_BRANCH_PREFIX = 'br-staging-';

export function isStagingEnvironment(): boolean {
  const appEnv = process.env.APP_ENV ?? process.env.VERCEL_ENV ?? '';
  if (appEnv === 'preview' || appEnv === 'development') return true;
  if (appEnv === 'production') return false;
  return false;
}

export function isAllowedTestDatabase(): boolean {
  return process.env.ALLOW_TEST_DATABASE === 'true';
}

export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.E2E_ENV === 'staging' ||
    process.env.APP_ENV === 'test' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

export function getEnvironmentName(): string {
  const appEnv = process.env.APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
  if (appEnv === 'production') return 'production';
  if (appEnv === 'preview') return 'staging';
  if (appEnv === 'development') return 'development';
  return appEnv;
}

export function assertNotProduction(): void {
  if (getEnvironmentName() === 'production') {
    throw new Error('Esta operación no está permitida en el entorno de producción');
  }
}

export function assertTestDatabase(): void {
  if (!isAllowedTestDatabase()) {
    throw new Error(
      'ALLOW_TEST_DATABASE no está activado. ' +
      'Configura ALLOW_TEST_DATABASE=true para operaciones de prueba.',
    );
  }
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl.includes('pinedayasociados') || dbUrl.includes('justicia-verdadera-prod')) {
    throw new Error('DATABASE_URL coincide con un patrón productivo. Operación bloqueada.');
  }
}

export function assertStagingBranch(branchId: string, projectId: string): void {
  if (!STAGING_PROJECT_IDS.has(projectId)) {
    throw new Error(`Proyecto Neon no autorizado: ${projectId}`);
  }
  if (!branchId.startsWith(STAGING_BRANCH_PREFIX) && branchId !== 'br-staging') {
    throw new Error(`Rama Neon no es de staging: ${branchId}`);
  }
}
