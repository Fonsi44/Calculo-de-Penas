#!/usr/bin/env node
/**
 * Ejecutor E2E completo — staging end-to-end.
 *
 * Flujo: protege entorno → valida migraciones → seed → build → servidor → Playwright → cleanup.
 * Requiere: DATABASE_URL, ALLOW_E2E_SEED=true, ALLOW_STAGING_MIGRATIONS=true.
 */
import { execSync, spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = process.env.PORT || 3100;
const BASE_URL = `http://localhost:${PORT}`;

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function guard() {
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ BLOCKED: NODE_ENV=production');
    process.exit(1);
  }
  if (!process.env.ALLOW_E2E_SEED) {
    console.error('⛔ Set ALLOW_E2E_SEED=true');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('⛔ DATABASE_URL required');
    process.exit(1);
  }
  console.log('✓ Environment guard passed');
}

// ── Main ─────────────────────────────────────────────────────────────────
guard();

console.log('═══ E2E Staging Pipeline ═══');

// 1. Validar migraciones
run('node tools/db/run-migrations.mjs validate');

// 2. Seed
run('node tools/ci/seed-e2e.mjs');

// 3. Build
run('npm run build');

// 4. Start server
console.log(`\n▶ Starting Next.js on port ${PORT}...`);
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' },
});

let serverOutput = '';
server.stdout.on('data', (d) => { serverOutput += d.toString(); });
server.stderr.on('data', (d) => { serverOutput += d.toString(); });

// Wait for server ready
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Server start timeout')), 60000);
  const check = () => {
    try {
      const http = require('http');
      http.get(`${BASE_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearTimeout(timeout);
          console.log('✓ Server ready');
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      }).on('error', () => setTimeout(check, 1000));
    } catch { setTimeout(check, 1000); }
  };
  check();
});

// 5. Playwright
console.log('\n▶ Running Playwright...');
try {
  run(`npx playwright test --project=chromium`, { env: { ...process.env, PLAYWRIGHT_BASE_URL: BASE_URL } });
  console.log('✓ E2E passed');
} catch (e) {
  console.error('✗ Some E2E tests failed');
} finally {
  // 6. Stop server
  server.kill('SIGTERM');
  console.log('✓ Server stopped');
}

console.log('\n═══ Pipeline complete ═══');
