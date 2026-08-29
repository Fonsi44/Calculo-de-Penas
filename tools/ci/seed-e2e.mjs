#!/usr/bin/env node
/**
 * Stub post-eliminación de intranet/SGIE.
 * Conserva los guards de seguridad para que los tests de tooling E2E sigan
 * validando bloqueos de producción. Ya no inserta usuarios ni expedientes.
 */
function fail(msg) {
  console.error(`⛔ ${msg}`);
  process.exit(1);
}

if (process.env.E2E_TEST_MODE !== '1') {
  // En uso real fuera de tests: no-op tras guards.
}

if (!process.env.ALLOW_E2E_SEED || process.env.ALLOW_E2E_SEED !== 'true') {
  fail('ALLOW_E2E_SEED=true es obligatorio.');
}
if (process.env.E2E_ENVIRONMENT !== 'staging') {
  fail('E2E_ENVIRONMENT=staging es obligatorio.');
}
if (process.env.NODE_ENV === 'production') {
  fail('Bloqueado en production (NODE_ENV).');
}
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  fail('DATABASE_URL es obligatorio.');
}
if (/prod/i.test(dbUrl)) {
  fail('DATABASE_URL parece de producción; abortando.');
}

console.log('seed-e2e: no-op (intranet/SGIE eliminados). Guards OK.');
process.exit(0);
