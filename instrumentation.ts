/**
 * Instrumentation hook de Next.js.
 *
 * Se ejecuta una vez por instancia del server (Node) al arrancar, DESPUÉS del
 * build. Esto permite leer variables de entorno en runtime real, evitando el
 * constant-folding que el bundler aplica a process.env durante el build de
 * producción.
 *
 * SEGURIDAD:
 *   Solo las siguientes condiciones ACTIVAN el modo E2E local:
 *   - E2E_ENVIRONMENT === 'staging'
 *   - E2E_LOCAL_HTTP === 'true' (para cookies sin Secure)
 *   - E2E_DISABLE_RATE_LIMIT === 'true' (para tests paralelos)
 *   - VERCEL_ENV !== 'production' (Vercel Production nunca activa modo E2E)
 *
 *   En Vercel Preview: E2E_ENVIRONMENT no está definido → modo E2E inactivo.
 *   En producción local tradicional: E2E_ENVIRONMENT no está definido → inactivo.
 */
export async function register() {
  const g = globalThis as {
    __E2E_DISABLE_RATE_LIMIT?: boolean;
    __E2E_LOCAL_HTTP?: boolean;
  };

  const isE2E =
    process.env.E2E_ENVIRONMENT === 'staging' &&
    process.env.VERCEL_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'preview';

  if (isE2E) {
    if (process.env.E2E_DISABLE_RATE_LIMIT === 'true') {
      g.__E2E_DISABLE_RATE_LIMIT = true;
    }
    if (process.env.E2E_LOCAL_HTTP === 'true') {
      g.__E2E_LOCAL_HTTP = true;
    }
  }
}
