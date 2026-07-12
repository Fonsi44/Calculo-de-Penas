#!/usr/bin/env node
/**
 * E2E Environment Setup — Subfase 2.
 *
 * 1. Ejecuta guard de aislamiento.
 * 2. Aplica migraciones Drizzle en orden sobre base efímera.
 * 3. Inserta seed sintético mínimo (usuarios, clientes, expedientes).
 * 4. Genera .env.e2e con variables para Playwright.
 *
 * Uso: node scripts/e2e/setup.mjs
 *
 * Los seeds son DETERMINISTAS: mismos IDs, mismos datos en cada ejecución.
 * Datos 100% sintéticos, sin PII real.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
config({ path: resolve(ROOT, '.env.local') });
config();

const DB_URL = process.env.DATABASE_URL;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...opts.env },
    });
    child.on('exit', (code) => {
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function main() {
  console.log('[E2E-SETUP] Iniciando configuración del entorno E2E...\n');

  // 1. Guard
  console.log('[E2E-SETUP] Paso 1/4: Verificando aislamiento...');
  await run('node', ['scripts/e2e/guard.mjs']);

  // 2. Apply migrations
  console.log('\n[E2E-SETUP] Paso 2/4: Aplicando migraciones...');
  const migrationsDir = resolve(ROOT, 'drizzle', 'migrations');
  const journal = JSON.parse(readFileSync(resolve(migrationsDir, 'meta', '_journal.json'), 'utf8'));

  for (const entry of journal.entries) {
    const sqlFile = resolve(migrationsDir, entry.tag + '.sql');
    const sql = readFileSync(sqlFile, 'utf8');
    // Extract only the UP part (before >><down>)
    const upSql = sql.split('-->><down>')[0].trim();
    if (!upSql) continue;

    console.log(`  Aplicando ${entry.tag}...`);
    // Use psql to apply migration
    await run('psql', [DB_URL, '-f', sqlFile], {
      env: { ...process.env, PGCONNECT_TIMEOUT: '10' },
    });
  }

  // 3. Seed
  console.log('\n[E2E-SETUP] Paso 3/4: Insertando seed sintético...');
  await run('node', ['scripts/e2e/seed.mjs']);

  // 4. Generate .env.e2e
  console.log('\n[E2E-SETUP] Paso 4/4: Generando .env.e2e...');
  const e2eEnv = [
    `DATABASE_URL=${DB_URL}`,
    `E2E_BASE_URL=${process.env.E2E_BASE_URL || 'http://localhost:3100'}`,
    `E2E_ADMIN_EMAIL=admin@test.local`,
    `E2E_ADMIN_PASSWORD=TestAdmin123!`,
    `E2E_ABOGADO_A_EMAIL=abogado-a@test.local`,
    `E2E_ABOGADO_A_PASSWORD=TestAbogadoA123!`,
    `E2E_ABOGADO_B_EMAIL=abogado-b@test.local`,
    `E2E_ABOGADO_B_PASSWORD=TestAbogadoB123!`,
    `E2E_USER_2FA_EMAIL=twofactor@test.local`,
    `E2E_USER_2FA_PASSWORD=Test2FA123!`,
    `E2E_USER_2FA_TOTP_SECRET=JBSWY3DPEHPK3PXP`, // sintético, solo para tests
    `NODE_ENV=test`,
  ].join('\n') + '\n';
  writeFileSync(resolve(ROOT, '.env.e2e'), e2eEnv);
  console.log('  .env.e2e generado.');

  console.log('\n[E2E-SETUP] ✅ Entorno E2E listo.');
}

main().catch((err) => {
  console.error('[E2E-SETUP] ❌ Fallo:', err.message);
  process.exit(1);
});
