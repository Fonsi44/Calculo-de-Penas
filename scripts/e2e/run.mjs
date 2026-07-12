#!/usr/bin/env node
/**
 * E2E Runner — Subfase 2/3.
 *
 * Orquesta el ciclo completo:
 * 1. Guard de aislamiento
 * 2. Setup (migraciones + seed)
 * 3. Ejecución de Playwright
 * 4. Cleanup (SIEMPRE, incluso si 3 falla)
 *
 * Uso:
 *   node scripts/e2e/run.mjs                    # todas las specs
 *   node scripts/e2e/run.mjs --spec critical     # solo matriz crítica
 *   node scripts/e2e/run.mjs --spec navigation   # solo navegación
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n[E2E] Ejecutando: ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...opts.env },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

async function main() {
  const spec = process.argv.includes('--spec') 
    ? process.argv[process.argv.indexOf('--spec') + 1] 
    : 'all';

  let failed = false;

  try {
    // 1. Guard
    await run('node', ['scripts/e2e/guard.mjs']);

    // 2. Setup
    await run('node', ['scripts/e2e/setup.mjs']);

    // 3. Playwright
    const playwrightArgs = ['playwright', 'test'];
    if (spec === 'critical') {
      playwrightArgs.push('--grep', '@critical');
    } else if (spec === 'navigation') {
      playwrightArgs.push('--grep', '@navigation');
    }
    playwrightArgs.push('--config', 'playwright.e2e.config.ts');
    await run('npx', playwrightArgs);

  } catch (err) {
    failed = true;
    console.error('\n[E2E] ❌ Fallo durante la ejecución:', err.message);
  } finally {
    // 4. Cleanup SIEMPRE
    console.log('\n[E2E] Ejecutando cleanup...');
    try {
      await run('node', ['scripts/e2e/cleanup.mjs']);
    } catch {
      console.log('[E2E] Cleanup best-effort (ignorando error).');
    }
  }

  if (failed) {
    console.log('\n[E2E] ❌ E2E completado CON FALLOS.');
    process.exit(1);
  }
  console.log('\n[E2E] ✅ E2E completado exitosamente.');
}

main();
