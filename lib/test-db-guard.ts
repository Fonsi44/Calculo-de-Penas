/**
 * Evita que pruebas con escritura usen una base de datos no aislada.
 *
 * Reglas:
 * - Host local (localhost / 127.0.0.1 / ::1): siempre permitido, cualquier nombre.
 * - Host remoto: el nombre de la DB debe contener "test" como segmento delimitado
 *   completo (p. ej. `app_test`, `test_app`, `app-test`, `test`), NO como subcadena
 *   dentro de otra palabra (`mytest_prod` se rechaza).
 * - El scheme debe ser postgresql/postgres.
 */
export function assertSafeTestDatabaseUrl(databaseUrl: string | undefined): void {
  if (!databaseUrl) throw new Error('DATABASE_URL de pruebas no configurada');
  const url = new URL(databaseUrl);
  const scheme = url.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'postgresql' && scheme !== 'postgres') {
    throw new Error(`DATABASE_URL de pruebas con scheme no permitido: ${scheme}`);
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const dbName = url.pathname.replace(/^\//, '').toLowerCase();
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  // "test" como segmento delimitado completo, sufijo _test o prefijo test_.
  // \btest\b o (^|[-_/])test([-_/]|$) cubre `app_test`, `test_app`, `app-test`,
  // `app/test`, `test` a secas. NO casa `mytest`, `test_prod`, `mytest_prod`.
  const namedTest = /(^|[-/_])test([-/_]|$)/.test(dbName);
  if (!local && !namedTest) {
    throw new Error(
      `DATABASE_URL de pruebas no es una base aislada autorizada (host=${host}, db=${dbName}). ` +
      'Use un host local o una DB cuyo nombre contenga "test" como segmento delimitado.',
    );
  }
}
