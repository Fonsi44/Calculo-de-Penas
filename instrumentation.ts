/**
 * Instrumentation hook de Next.js.
 *
 * Se ejecuta una vez por instancia del server (Edge o Node) al arrancar,
 * DESPUÉS del build. Esto permite leer variables de entorno en runtime real,
 * evitando el constant-folding que el bundler aplica a process.env durante el
 * build de producción.
 *
 * Uso actual: propagar flags de entorno E2E a globalThis para que lib/rate-limit
 * y otros módulos puedan leerlas en runtime sin que el bundler las inline.
 *
 * Seguro para producción: las flags solo se activan si las variables de entorno
 * correspondientes están explícitamente seteadas a 'true' en el runtime.
 */
export async function register() {
  // Propagar flags E2E a globalThis (lectura runtime, no plegable por bundler).
  const g = globalThis as {
    __E2E_DISABLE_RATE_LIMIT?: boolean;
    __E2E_LOCAL_HTTP?: boolean;
  };
  if (process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true') {
    g.__E2E_DISABLE_RATE_LIMIT = true;
  }
  if (process.env.NEXT_PUBLIC_E2E_LOCAL_HTTP === 'true') {
    g.__E2E_LOCAL_HTTP = true;
  }
}
