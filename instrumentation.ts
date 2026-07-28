/**
 * Instrumentation hook de Next.js.
 *
 * Se ejecuta una vez por instancia del server (Node) al arrancar, DESPUÉS del
 * build. Esto permite leer variables de entorno en runtime real, evitando el
 * constant-folding que el bundler aplica a process.env durante el build de
 * producción.
 *
 * SEGURIDAD:
 *   Los globals runtime se inicializan a false. Solo se activan cuando:
 *   1. E2E_ENVIRONMENT === 'staging'
 *   2. VERCEL_ENV no es 'production' ni 'preview'
 *   3. La flag server-side correspondiente es exactamente 'true'
 *
 *   Esto garantiza que:
 *   - Vercel Production nunca activa modo E2E (aunque tenga env vars).
 *   - Vercel Preview nunca activa modo E2E.
 *   - El build no puede plegar la decisión (lectura runtime via globalThis).
 *   - Una instancia reutilizada no conserva un flag anterior (inicialización).
 */
export async function register() {
  const g = globalThis as unknown as {
    __E2E_DISABLE_RATE_LIMIT: boolean;
    __E2E_LOCAL_HTTP: boolean;
  };

  // Valores seguros por defecto: ningún flag activo.
  g.__E2E_DISABLE_RATE_LIMIT = false;
  g.__E2E_LOCAL_HTTP = false;

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
