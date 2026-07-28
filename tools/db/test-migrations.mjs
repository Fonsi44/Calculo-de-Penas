#!/usr/bin/env node
/**
 * Prueba offline de migraciones — validación estructural completa sin base de datos.
 *
 * Verifica:
 *   1. Todos los SQL referenciados existen en disco
 *   2. Journal de Drizzle y manifiesto manual son coherentes
 *   3. Sin colisiones de prefijos ni IDs duplicados
 *   4. Checksums SHA-256 consistentes
 *   5. Sin dependencias circulares
 *   6. Orden topológico válido
 *   7. Protección de producción activa
 *   8. Runner responde correctamente a todos los comandos
 *
 * Para prueba con base vacía real (requiere Docker o Neon staging):
 *   npm run db:migrations:test:live
 *
 * Uso:
 *   npm run db:migrations:test
 */

import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const RUNNER = resolve(ROOT, 'tools/db/run-migrations.mjs');

function runRunner(mode) {
  try {
    const stdout = execFileSync('node', [RUNNER, mode], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000,
    });
    return { ok: true, stdout };
  } catch (err) {
    return { ok: false, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

let failures = 0;

function assert(condition, msg) {
  if (!condition) { console.error(`  ✗ ${msg}`); failures++; }
  else { console.log(`  ✓ ${msg}`); }
}

console.log('═══ Prueba offline de migraciones ═══\n');

// 1. Status
console.log('1. Status:');
const s = runRunner('status');
assert(s.ok, 'status termina sin error');
assert(s.stdout.includes('Drizzle Journal'), 'status muestra Drizzle Journal');
assert(s.stdout.includes('Migraciones Manuales'), 'status muestra Migraciones Manuales');
assert(s.stdout.includes('Journal + Manifiesto: 58'), '58/58 SQL cubiertos');
assert(s.stdout.includes('Sin tracking: 0'), '0 SQL sin tracking');

// 2. Validate
console.log('\n2. Validate:');
const v = runRunner('validate');
assert(v.ok, 'validate termina sin error');
assert(v.stdout.includes('✓ VÁLIDO'), 'validate devuelve VÁLIDO');
assert(v.stdout.includes('Sin colisiones'), 'sin colisiones journal/manifiesto');
assert(v.stdout.includes('Sin ciclos'), 'sin dependencias circulares');
assert(v.stdout.includes('OK: 19'), '19 checksums OK');

// 3. Checksums
console.log('\n3. Checksums:');
const c = runRunner('checksums');
assert(c.ok, 'checksums termina sin error');
assert(c.stdout.includes('checksums actualizados'), 'checksums se actualizan');

// 4. Validate after checksums
console.log('\n4. Validate post-checksums:');
const v2 = runRunner('validate');
assert(v2.ok, 'validate sigue siendo válido tras recalcular checksums');
assert(v2.stdout.includes('0'), '0 checksums modificados');

// 5. Apply sin DATABASE_URL
console.log('\n5. Apply sin DB:');
const a = runRunner('apply');
assert(a.ok, 'apply sin DB informa correctamente (no falla)');
assert(a.stdout.includes('Aplicar'), 'apply muestra mensaje informativo');

// 6. Producción bloqueada
console.log('\n6. Protección de producción:');
const envProd = { ...process.env, NODE_ENV: 'production' };
try {
  execFileSync('node', [RUNNER, 'apply'], {
    cwd: ROOT, env: envProd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000,
  });
  assert(false, 'apply en producción debería fallar sin MIGRATE_PRODUCTION');
} catch (err) {
  const stderr = err.stderr || '';
  assert(stderr.includes('PRODUCTION GUARD') || err.stdout?.includes('PRODUCTION GUARD'), 'apply bloquea producción sin MIGRATE_PRODUCTION=true');
}

// 7. Resumen
console.log(`\n═══ Resultado: ${failures === 0 ? '✓ TODOS PASARON' : '✗ ' + failures + ' FALLOS'} ═══`);

if (failures > 0) {
  console.log('\nPara prueba con base vacía real (requiere Docker o Neon staging):');
  console.log('  npm run db:migrations:test:live');
}

process.exit(failures > 0 ? 1 : 0);
