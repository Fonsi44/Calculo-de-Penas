/**
 * Guardián de entorno para scripts de datos.
 *
 * Detecta el entorno a partir de variables y del host de DATABASE_URL, y
 * ABORTA cualquier operación de escritura cuando detecta producción o un
 * entorno desconocido (fail-closed). Los scripts de datos deben:
 *
 *   - rechazar producción salvo bandera explícita por script
 *     (`allowProductionWriteEnv`, p. ej. ALLOW_PRODUCTION_EDITORIAL_UPSERT)
 *     y solo si DATABASE_URL es el endpoint Neon de producción conocido;
 *   - permitir dry-run por defecto;
 *   - no revelar secretos en logs.
 *
 * Orden de preferencia de entornos (§4.2 del PROMPT 2): local → staging →
 * snapshot sanitizado → producción de solo lectura (solo si existe y está
 * configurada claramente).
 */
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'node:path';

export type EnvKind = 'local' | 'staging' | 'production' | 'unknown';

/** Bandera de escritura editorial en producción. Nunca se asume; debe ser `true`. */
export const PRODUCTION_EDITORIAL_UPSERT_FLAG = 'ALLOW_PRODUCTION_EDITORIAL_UPSERT';

/** Endpoints Neon conocidos (sin secretos). Se actualizan si cambian. */
const KNOWN_ENDPOINTS: Record<string, EnvKind> = {
  // neondb (producción). Endpoint verificado en .env 2026-08-03.
  'ep-super-leaf-appekgbu': 'production',
  // e2e_pr20 (staging / rama de validación E2E). Verificado en .env.e2e.local.
  'ep-bold-band-asjxcjyd': 'staging',
};

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'db',
  'postgres',
]);

/** True solo si la URL apunta al endpoint Neon de producción conocido. */
function isKnownProductionDatabaseUrl(url?: string): boolean {
  const endpoint = endpointFromUrl(url);
  return Boolean(endpoint && KNOWN_ENDPOINTS[endpoint] === 'production');
}

/** Normaliza el host sin puerto ni sufijo pooler para comparar endpoints. */
export function endpointFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let host = parsed.hostname.toLowerCase();
    if (host.endsWith('-pooler')) host = host.slice(0, -'-pooler'.length);
    return host.split('.')[0];
  } catch {
    return null;
  }
}

export interface EnvInspection {
  kind: EnvKind;
  appEnv: string | null;
  host: string | null;
  database: string | null;
  neonBranchId: string | null;
  allowStagingMigrations: boolean;
  /** Modo de conexión: 'pooled' | 'direct' | 'none' */
  connectionMode: 'pooled' | 'direct' | 'none';
  reasons: string[];
}

/** Parseo seguro de DATABASE_URL; devuelve null si no es URL válida. */
function parseDbUrl(url: string | undefined): { host: string | null; database: string | null } | null {
  if (!url || url === 'undefined' || url.includes('placeholder')) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

/** Inspecciona el entorno actual sin revelar secretos. */
export function inspectEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): EnvInspection {
  const appEnv = (env.APP_ENV ?? env.VERCEL_ENV ?? '').toLowerCase() || null;
  const url = env.DATABASE_URL;
  const parsed = parseDbUrl(url);
  const host = parsed?.host ?? null;
  const database = parsed?.database ?? null;
  const reasons: string[] = [];

  // 1. Variable explícita de entorno (Vercel/APP_ENV).
  if (appEnv === 'production') reasons.push('APP_ENV/VERCEL_ENV=production');
  if (appEnv === 'staging' || appEnv === 'preview') reasons.push(`entorno explícito=${appEnv}`);

  // 2. Host local.
  if (host && LOCAL_HOSTS.has(host)) reasons.push(`host local ${host}`);

  // 3. Endpoint conocido.
  let kind: EnvKind = 'unknown';
  if (appEnv === 'production') {
    kind = 'production';
  } else if (host && LOCAL_HOSTS.has(host)) {
    kind = 'local';
  } else if (host) {
    const endpoint = endpointFromUrl(url);
    kind = KNOWN_ENDPOINTS[endpoint ?? ''] ?? 'unknown';
    if (kind === 'production') reasons.push(`endpoint conocido de producción: ${endpoint}`);
    if (kind === 'staging') reasons.push(`endpoint conocido de staging: ${endpoint}`);
    if (kind === 'unknown') {
      reasons.push(`endpoint Neon desconocido (${endpoint ?? host}); fail-closed`);
      kind = 'production'; // desconocido → tratar como producción (no escribir).
    }
  } else if (!url) {
    kind = 'local';
    reasons.push('sin DATABASE_URL (local/build)');
  }

  const neonBranchId = env.NEON_BRANCH_ID ?? null;
  if (neonBranchId && env.NEON_PRODUCTION_BRANCH_ID === neonBranchId) {
    reasons.push('NEON_BRANCH_ID coincide con NEON_PRODUCTION_BRANCH_ID');
    kind = 'production';
  }

  return {
    kind,
    appEnv,
    host,
    database,
    neonBranchId,
    allowStagingMigrations: env.ALLOW_STAGING_MIGRATIONS === 'true',
    connectionMode: url
      ? (url.includes('-pooler') ? 'pooled' : 'direct')
      : 'none',
    reasons,
  };
}

export function describeEnvironment(
  inspection: EnvInspection = inspectEnvironment(),
): string {
  return [
    `entorno=${inspection.kind}`,
    inspection.appEnv ? `app_env=${inspection.appEnv}` : '',
    inspection.host ? `host=${inspection.host}` : '',
    inspection.database ? `base=${inspection.database}` : '',
    inspection.neonBranchId ? `rama_neon=${inspection.neonBranchId}` : '',
    `modo_conexion=${inspection.connectionMode}`,
    `allow_staging_migrations=${inspection.allowStagingMigrations}`,
  ].filter(Boolean).join(' | ');
}

/**
 * Aborta si el entorno es producción o desconocido (tratado como producción).
 * `write` = true para operaciones de escritura; `read` = true para lectura
 * (solo lectura permitida en staging).
 *
 * Escritura en producción: solo si el caller pasa `allowProductionWriteEnv`,
 * esa variable vale exactamente `true`, y DATABASE_URL es el endpoint conocido.
 * Un endpoint desconocido (fail-closed como production) nunca se autoriza.
 */
export function assertAllowedEnvironment(
  context: string,
  opts: {
    write: boolean;
    read?: boolean;
    allowProductionWriteEnv?: string;
  } = { write: true },
): EnvInspection {
  const inspection = inspectEnvironment();
  const productionWriteAuthorized = Boolean(
    opts.write
    && opts.allowProductionWriteEnv
    && process.env[opts.allowProductionWriteEnv] === 'true'
    && isKnownProductionDatabaseUrl(process.env.DATABASE_URL),
  );
  const blocked = (inspection.kind === 'production' || inspection.kind === 'unknown')
    && !productionWriteAuthorized;
  if (blocked) {
    throw new Error(
      `[environment-guard] Operación ${opts.write ? 'de ESCRITURA' : 'de LECTURA'} `
      + `bloqueada en ${context}: ${describeEnvironment(inspection)}. `
      + 'No se permiten operaciones sobre producción en esta intervención.',
    );
  }
  if (opts.write && inspection.kind === 'staging' && !inspection.allowStagingMigrations) {
    // Escritura en staging solo con autorización explícita del entorno.
    throw new Error(
      `[environment-guard] Escritura en staging sin ALLOW_STAGING_MIGRATIONS=true: `
      + describeEnvironment(inspection),
    );
  }
  return inspection;
}

/** Carga un archivo de entorno (default .env.local) sin sobrescribir secretos en logs. */
export function loadEnvFile(envFile?: string): NodeJS.ProcessEnv {
  const path = envFile ? resolve(envFile) : resolve('.env.local');
  // override=true: el script elige explícitamente el archivo de entorno; sin
  // ello, dotenv no reemplaza vars ya presentes (p. ej. DATABASE_URL='').
  dotenvConfig({ path, quiet: true, override: true });
  return process.env;
}
