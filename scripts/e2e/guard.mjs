#!/usr/bin/env node
/**
 * E2E Environment Guard — Subfase 2 (fail-closed).
 *
 * Bloquea la ejecución de E2E si no se cumplen TODAS las condiciones de
 * aislamiento. Diseñado para ejecutarse antes de cualquier script E2E
 * (preparación, ejecución, limpieza).
 *
 * Condiciones obligatorias:
 * 1. ALLOW_TEST_DATABASE=true
 * 2. DATABASE_URL definida y parseable
 * 3. Host local o nombre de DB con segmento test/staging/preview/testing
 * 4. URL no coincide con patrones productivos conocidos
 * 5. NODE_ENV = test o variable E2E_ENV = staging
 *
 * Uso: node scripts/e2e/guard.mjs
 * Exit code 0 = seguro, exit code 1 = bloqueado.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config(); // también carga .env por si acaso

const ALLOW_TEST = process.env.ALLOW_TEST_DATABASE;
const DB_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || '';
const E2E_ENV = process.env.E2E_ENV || '';

function fail(reason) {
  console.error(`\n[E2E-GUARD] ❌ BLOQUEADO: ${reason}`);
  console.error('[E2E-GUARD] Las pruebas E2E requieren una base de datos aislada.');
  console.error('[E2E-GUARD] Configura:');
  console.error('  ALLOW_TEST_DATABASE=true');
  console.error('  DATABASE_URL=postgresql://.../app_test (nombre con segmento test/staging/preview/testing)');
  console.error('  NODE_ENV=test o E2E_ENV=staging');
  process.exit(1);
}

// 1. ALLOW_TEST_DATABASE must be explicitly 'true'
if (ALLOW_TEST !== 'true') {
  fail('ALLOW_TEST_DATABASE no es "true". Valor actual: ' + JSON.stringify(ALLOW_TEST));
}

// 2. NODE_ENV or E2E_ENV must indicate test/staging
if (NODE_ENV !== 'test' && E2E_ENV !== 'staging') {
  fail(`NODE_ENV=${NODE_ENV}, E2E_ENV=${E2E_ENV}. Se requiere NODE_ENV=test o E2E_ENV=staging.`);
}

// 3. DATABASE_URL must be present and valid
if (!DB_URL) {
  fail('DATABASE_URL no está definida.');
}

let url;
try {
  url = new URL(DB_URL);
} catch {
  fail(`DATABASE_URL no es una URL válida: ${DB_URL.substring(0, 30)}...`);
}

const scheme = url.protocol.replace(':', '').toLowerCase();
if (scheme !== 'postgresql' && scheme !== 'postgres') {
  fail(`Scheme no es postgresql/postgres: ${scheme}`);
}

const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
const dbName = url.pathname.replace(/^\//, '').toLowerCase();

// 4. Localhost always OK
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

// 5. Remote: name must contain test/staging/preview/testing as delimited segment
const safeNamePattern = /(^|[-_/])(test|testing|staging|preview)([-_/]|$)/;
const isSafeName = safeNamePattern.test(dbName);

if (!isLocal && !isSafeName) {
  fail(`Base remota no aislada (host=${host}, db=${dbName}). ` +
       `El nombre debe contener "test", "testing", "staging" o "preview" como segmento delimitado.`);
}

// 6. Known production patterns blocklist
const PROD_PATTERNS = [
  /pineda.*prod/i, /prod.*pineda/i,
  /justicia.*prod/i, /prod.*justicia/i,
  /abogados.*prod/i, /prod.*abogados/i,
  /pinedayasociados/i,
  /verdadera.*prod/i,
];
const hostDb = host + '/' + dbName;
for (const pattern of PROD_PATTERNS) {
  if (pattern.test(hostDb)) {
    fail(`DATABASE_URL coincide con patrón productivo: ${pattern}. Host+DB: ${hostDb}`);
  }
}

console.log(`[E2E-GUARD] ✅ Entorno seguro: ${isLocal ? 'local' : 'remoto'}, db=${dbName}, host=${host}`);
process.exit(0);
