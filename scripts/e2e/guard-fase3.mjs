#!/usr/bin/env node
/**
 * E2E Environment Guard — Fase 3 (fail-closed).
 *
 * Bloquea la ejecución de E2E si no se cumplen TODAS las condiciones de
 * aislamiento. Diseñado para ejecutarse antes de cualquier script E2E de Fase 3.
 *
 * Condiciones obligatorias:
 * 1. ALLOW_TEST_DATABASE=true
 * 2. DATABASE_URL definida y parseable
 * 3. Host local o nombre de DB con segmento test/staging/preview/testing
 * 4. URL no coincide con patrones productivos conocidos
 * 5. NODE_ENV = test o variable E2E_ENV = staging
 *
 * Uso: node scripts/e2e/guard-fase3.mjs
 * Exit code 0 = seguro, exit code 1 = bloqueado.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config();

const REQUIRED_ENV = ['ALLOW_TEST_DATABASE'];
const ALLOW_TEST = process.env.ALLOW_TEST_DATABASE;
const DB_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || '';
const E2E_ENV = process.env.E2E_ENV || '';
const NEON_BRANCH_NAME = process.env.E2E_NEON_BRANCH_NAME || '';
const NEON_BRANCH_ID = process.env.E2E_NEON_BRANCH_ID || '';
const NEON_ENDPOINT_ID = process.env.E2E_NEON_ENDPOINT_ID || '';

for (const envVar of REQUIRED_ENV) {
  if (!process.env[envVar]) {
    console.error(`\n[E2E-GUARD-FASE3] ❌ BLOQUEADO: Falta variable requerida: ${envVar}`);
    process.exit(1);
  }
}

function fail(reason) {
  console.error(`\n[E2E-GUARD-FASE3] ❌ BLOQUEADO: ${reason}`);
  console.error('[E2E-GUARD-FASE3] Las pruebas E2E de Fase 3 requieren una base de datos aislada.');
  console.error('[E2E-GUARD-FASE3] Configura:');
  console.error('  ALLOW_TEST_DATABASE=true');
  console.error('  DATABASE_URL=postgresql://.../app_test (nombre con segmento test/staging/preview/testing)');
  console.error('  NODE_ENV=test o E2E_ENV=staging');
  process.exit(1);
}

if (ALLOW_TEST !== 'true') {
  fail('ALLOW_TEST_DATABASE no es "true". Valor actual: ' + JSON.stringify(ALLOW_TEST));
}

if (NODE_ENV !== 'test' && E2E_ENV !== 'staging') {
  fail(`NODE_ENV=${NODE_ENV}, E2E_ENV=${E2E_ENV}. Se requiere NODE_ENV=test o E2E_ENV=staging.`);
}

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
const endpointId = host.split('.')[0].replace(/-pooler$/, '');

const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

const safeNamePattern = /(^|[-_/])(test|testing|staging|preview|validation)([-_/]|$)/;
const isSafeName = safeNamePattern.test(dbName);
const isNeon = host.endsWith('.neon.tech');
const isVerifiedNeonBranch =
  isNeon &&
  safeNamePattern.test(NEON_BRANCH_NAME.toLowerCase()) &&
  /^br-[a-z0-9-]+$/.test(NEON_BRANCH_ID) &&
  /^ep-[a-z0-9-]+$/.test(NEON_ENDPOINT_ID) &&
  endpointId === NEON_ENDPOINT_ID;

if (!isLocal && !isSafeName && !isVerifiedNeonBranch) {
  fail(`Base remota no aislada (host=${host}, db=${dbName}). ` +
       `El nombre debe contener un segmento seguro o deben verificarse rama e endpoint Neon.`);
}

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

console.log(`[E2E-GUARD-FASE3] ✅ Entorno seguro: ${isLocal ? 'local' : 'remoto'}, db=${dbName}, host=${host}`);
if (isVerifiedNeonBranch) {
  console.log(`[E2E-GUARD-FASE3] Rama Neon verificada: ${NEON_BRANCH_NAME} (${NEON_BRANCH_ID}), endpoint=${NEON_ENDPOINT_ID}`);
}
process.exit(0);
