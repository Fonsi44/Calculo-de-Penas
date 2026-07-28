#!/usr/bin/env node
/**
 * E2E Staging Pipeline — reproducible, propaga fallos, limpia siempre.
 *
 * Flujo:
 *   1. Cargar .env.e2e.local.
 *   2. Guard de entorno (no producción, staging, ALLOW_E2E_SEED).
 *   3. Verificar branch Neon (≠ producción).
 *   4. Validar migraciones.
 *   5. Cleanup namespace E2E.
 *   6. Seed namespace E2E.
 *   7. npm run build.
 *   8. next start (NODE_ENV=production sobre build real).
 *   9. Esperar a /api/health.
 *  10. Playwright completo (propaga exit code).
 *  11. Detener servidor (siempre).
 *
 * Reglas de la especificación:
 *   - No usar `next dev` con NODE_ENV=production.
 *   - El runner debe fallar si Playwright falla (sin capturar a 0).
 *   - Manejar SIGINT, SIGTERM, SIGHUP, timeout y procesos huérfanos.
 *
 * Uso:
 *   node tools/ci/run-e2e-staging.mjs
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_PASSWORDS } from './e2e-credentials.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PORT = process.env.PORT || 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_TIMEOUT_MS = 180_000;
const SHUTDOWN_GRACE_MS = 8_000;
const RESULTS_PATH = resolve(ROOT, '.local', 'e2e-results.json');

// ── Carga explícita de .env.e2e.local ────────────────────────────────────
// E2E_TEST_MODE=1 desactiva la carga del archivo (para tests unitarios de guards).
function loadE2EEnv() {
  if (process.env.E2E_TEST_MODE === '1') {
    console.log('⚠  E2E_TEST_MODE=1: no se cargará .env.e2e.local.');
    return;
  }
  const envPath = resolve(ROOT, '.env.e2e.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Solo setear si no está ya en el entorno (prioridad al shell del usuario).
      if (!(key in process.env)) process.env[key] = val;
    }
    console.log('✓ .env.e2e.local cargado.');
  } catch {
    console.error('⛔ No se encontró .env.e2e.local. Crea el archivo de entorno E2E.');
    process.exit(1);
  }
}
loadE2EEnv();

// ── Helpers ──────────────────────────────────────────────────────────────
function sh(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
    return 0;
  } catch (err) {
    // err.status es el código de salida del subproceso.
    return typeof err.status === 'number' ? err.status : 1;
  }
}

function guard() {
  if (!process.env.DATABASE_URL) {
    console.error('⛔ DATABASE_URL requerido.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ BLOCKED: NODE_ENV=production. Usa NODE_ENV=development para staging.');
    process.exit(1);
  }
  if (process.env.E2E_ENVIRONMENT !== 'staging') {
    console.error('⛔ BLOCKED: E2E_ENVIRONMENT debe ser "staging".');
    process.exit(1);
  }
  if (process.env.ALLOW_E2E_SEED !== 'true') {
    console.error('⛔ BLOCKED: ALLOW_E2E_SEED=true requerido.');
    process.exit(1);
  }
  if (/prod|production/.test(process.env.DATABASE_URL.toLowerCase())) {
    console.error('⛔ BLOCKED: DATABASE_URL parece apuntar a producción.');
    process.exit(1);
  }
  console.log('✓ Environment guard passed.');
}

async function assertNotProductionBranch() {
  const prodBranchId = process.env.NEON_PRODUCTION_BRANCH_ID;
  if (!prodBranchId) {
    console.error('⛔ NEON_PRODUCTION_BRANCH_ID no definido. Abortando.');
    process.exit(1);
  }
  const { Pool } = await import('@neondatabase/serverless');
  let pool;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const r = await pool.query("SELECT current_setting('neon.branch_id', true) AS id");
    const current = r.rows[0]?.id;
    if (!current) {
      console.error('⛔ No se pudo obtener el branch_id de Neon. Abortando.');
      process.exit(1);
    }
    if (current === prodBranchId) {
      console.error('⛔ BLOCKED: branch_id coincide con NEON_PRODUCTION_BRANCH_ID.');
      process.exit(1);
    }
    console.log(`✓ Neon branch_id verificado (≠ producción).`);
  } catch (e) {
    console.error(`⛔ Error al verificar branch Neon: ${e.message}`);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

async function waitForServer() {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < SERVER_TIMEOUT_MS) {
    try {
      const resp = await fetch(`${BASE_URL}/api/health`);
      if (resp.ok) {
        console.log(`✓ Server ready en ${Math.round((Date.now() - start) / 1000)}s.`);
        return;
      }
    } catch (e) { lastErr = e.message; }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`Server no respondió en ${SERVER_TIMEOUT_MS / 1000}s (último error: ${lastErr}).`);
}

// ── Shutdown robusto: mata proceso + hijos + fuerzas kill si grace expira ─
function killServer(server) {
  if (!server || server.killed) return Promise.resolve();
  return new Promise((resolveKill) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolveKill(); } };
    try { server.once('exit', finish); } catch {}
    try { server.kill('SIGTERM'); } catch {}

    // Tras grace, SIGKILL al proceso y a todo su grupo (huérfanos).
    setTimeout(() => {
      if (!done) {
        try {
          if (process.platform !== 'win32') process.kill(-server.pid, 'SIGKILL');
          else server.kill('SIGKILL');
        } catch { try { server.kill('SIGKILL'); } catch {} }
        finish();
      }
    }, SHUTDOWN_GRACE_MS);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────
guard();
await assertNotProductionBranch();

console.log('\n═══ E2E Staging Pipeline ═══\n');

const startedAt = new Date().toISOString();
let server = null;
let exitCode = 0;
let failureReason = null;
let playwrightDone = false;
const steps = [];

function recordStep(name, ok, detail = '') {
  steps.push({ name, ok, detail, at: new Date().toISOString() });
}

// ── Derivar variables E2E_* desde el fixture canónico ────────────────────
// Esto evita que los specs dependan de un .env.e2e manual: cualquier spec que
// lea process.env.E2E_* recibirá el valor del fixture automáticamente.
// Las contraseñas se importan del módulo compartido tools/ci/e2e-credentials.mjs
// (única fuente de credenciales sintéticas para seed, runner y tests).
// Fallo-closed: si no se puede cargar el fixture o las credenciales, aborta.
function exportE2EVarsFromFixture() {
  const fixturePath = resolve(ROOT, 'tests/e2e/fixtures/identities.json');
  let f;
  try {
    f = JSON.parse(readFileSync(fixturePath, 'utf8'));
	  } catch {
	    console.error(`⛔ No se pudo cargar el fixture: ${fixturePath}`);
    process.exit(1);
  }
  const map = {
    E2E_ADMIN_EMAIL: f.users.admin.email,
    E2E_ADMIN_PASSWORD: E2E_PASSWORDS.admin,
    E2E_ABOGADO_A_EMAIL: f.users.lawyerA.email,
    E2E_ABOGADO_A_PASSWORD: E2E_PASSWORDS.lawyerA,
    E2E_ABOGADO_B_EMAIL: f.users.lawyerB.email,
    E2E_ABOGADO_B_PASSWORD: E2E_PASSWORDS.lawyerB,
    E2E_USER_2FA_EMAIL: f.users.twoFactorUser.email,
    E2E_USER_2FA_PASSWORD: E2E_PASSWORDS.twoFactorUser,
    E2E_AUTH_USER_EMAIL: f.users.authUser.email,
    E2E_AUTH_USER_PASSWORD: E2E_PASSWORDS.authUser,
    E2E_SIDEBAR_USER_EMAIL: f.users.sidebarUser.email,
    E2E_SIDEBAR_USER_PASSWORD: E2E_PASSWORDS.sidebarUser,
  };
  for (const [k, v] of Object.entries(map)) {
    if (!process.env[k]) process.env[k] = v;
  }
  console.log('✓ Variables E2E_* derivadas del fixture.');
}
exportE2EVarsFromFixture();

// Handlers de signal: detienen el server y salen con código != 0.
const handleSignal = async (signal) => {
  console.error(`\n⛔ Recibida señal ${signal}. Deteniendo server...`);
  await killServer(server);
  writeResults(130, `signal ${signal}`);
  process.exit(130);
};
process.once('SIGINT', () => handleSignal('SIGINT'));
process.once('SIGTERM', () => handleSignal('SIGTERM'));
process.once('SIGHUP', () => handleSignal('SIGHUP'));

function writeResults(code, reason) {
  try {
    mkdirSync(dirname(RESULTS_PATH), { recursive: true });
    writeFileSync(RESULTS_PATH, JSON.stringify({
      exitCode: code,
      reason: reason || null,
      startedAt,
      finishedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      port: PORT,
      database: process.env.DATABASE_URL ? '(set)' : '(missing)',
      steps,
    }, null, 2));
    console.log(`\n📝 Informe JSON: ${RESULTS_PATH}`);
  } catch (e) {
    console.error(`⚠  No se pudo escribir informe JSON: ${e.message}`);
  }
}

try {
  // 4. Validar migraciones
  const vCode = sh('node tools/db/run-migrations.mjs validate');
  if (vCode !== 0) { exitCode = vCode; failureReason = 'migration validate failed'; recordStep('validate', false); throw new Error(failureReason); }
  recordStep('validate', true);

  // 5. Cleanup namespace E2E
  const cCode = sh('node tools/ci/cleanup-e2e.mjs');
  if (cCode !== 0) { exitCode = cCode; failureReason = 'cleanup failed'; recordStep('cleanup', false); throw new Error(failureReason); }
  recordStep('cleanup', true);

  // 6. Seed namespace E2E
  const sCode = sh('node tools/ci/seed-e2e.mjs');
  if (sCode !== 0) { exitCode = sCode; failureReason = 'seed failed'; recordStep('seed', false); throw new Error(failureReason); }
  recordStep('seed', true);

  // 7. Build (NODE_ENV debe estar ausente para que Next.js aplique production).
  // Si el shell lo tiene seteado a development, se elimina solo para este paso.
  const savedNodeEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;
  const bCode = sh('npm run build');
  if (savedNodeEnv) process.env.NODE_ENV = savedNodeEnv;
  if (bCode !== 0) { exitCode = bCode; failureReason = 'build failed'; recordStep('build', false); throw new Error(failureReason); }
  recordStep('build', true);

  // 8. Iniciar next start (build real, NODE_ENV=production).
  // El runner pasa explícitamente las variables E2E al servidor.
  // E2E_LOCAL_HTTP=true: el server corre sobre HTTP (no HTTPS), por
  // lo que las cookies __Host-token (que requieren Secure) no funcionarían.
  // instrumentation.ts lee estas variables y setea globalThis.__E2E_LOCAL_HTTP.
  // NUNCA se usan NEXT_PUBLIC_* para flags de seguridad.
  console.log(`\n▶ Starting next start on port ${PORT}...`);
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      E2E_ENVIRONMENT: 'staging',
      E2E_LOCAL_HTTP: 'true',
      E2E_DISABLE_RATE_LIMIT: 'true',
    },
    detached: true, // grupo propio para matar huérfanos
  });
  const serverLog = [];
  server.stdout.on('data', d => { const s = d.toString(); serverLog.push(s); process.stdout.write('[server] ' + s); });
  server.stderr.on('data', d => { const s = d.toString(); serverLog.push(s); process.stderr.write('[server] ' + s); });
  server.on('exit', (code, _sig) => {
    // Solo registrar fallo si el server muere ANTES de que Playwright termine.
    // Tras el finally (cleanup), el server se mata intencionalmente con SIGTERM
    // y su código de salida (143/null) no debe afectar el resultado del pipeline.
    if (code !== null && code !== 0 && exitCode === 0 && !playwrightDone) {
      exitCode = code; failureReason = `server exited with ${code}`;
    }
  });

  // 9. Esperar a /api/health
  await waitForServer();
  recordStep('server-start', true);

  // 10. Playwright completo — propaga código exacto.
  // Se excluyen los specs etiquetados @production-only (fase3e/4b-visual), que
  // validan contenido real de blog contra el sitio en producción y requieren
  // posts específicos que no existen en una DB E2E vacía. Esos specs se
  // ejecutan por separado contra producción.
  //
  // PW_WORKERS=1: los specs critical-auth y critical-authorization comparten
  // usuarios (abogado-a) y mutan estado (token_version, bloqueo). Si corren
  // en paralelo se interfieren. Workers=1 garantiza aislamiento secuencial.
  //
  // DISABLE_RATE_LIMIT (para Playwright, no para el servidor): los specs
  // auth-flow y critical-descargar usan esta variable para elegir su expectativa
  // sobre rate limiting. El servidor usa E2E_DISABLE_RATE_LIMIT (vía
  // instrumentation.ts) que ya se pasa en el entorno del servidor arriba.
  console.log('\n▶ Running Playwright (staging suite, excluye @production-only)...');
  const pwEnv = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: BASE_URL,
    DISABLE_RATE_LIMIT: 'true',
    TEST_WORKERS: '1',
  };
  try {
    execSync('npx playwright test --project=chromium --workers=1 --grep-invert "@production-only"', {
      cwd: ROOT, stdio: 'inherit', env: pwEnv,
    });
    recordStep('playwright', true);
    playwrightDone = true;
    console.log('✓ All E2E passed.');
  } catch (err) {
    // err.status es el código exacto devuelto por Playwright.
    exitCode = typeof err.status === 'number' ? err.status : 1;
    failureReason = `playwright failed (exit ${exitCode})`;
    recordStep('playwright', false, `exit ${exitCode}`);
    playwrightDone = true;
    console.error(`✗ Playwright failed with exit code ${exitCode}.`);
  }
} catch (err) {
  if (!failureReason) {
    failureReason = err.message || 'unknown pipeline error';
    if (exitCode === 0) exitCode = 1;
  }
  if (/Server did not start|did not respond/i.test(err.message)) {
    recordStep('server-start', false, err.message);
  }
  console.error(`✗ Pipeline error: ${err.message}`);
} finally {
  // 11. Detener server SIEMPRE.
  if (server) {
    console.log('\n▶ Stopping server...');
    await killServer(server);
    console.log('✓ Server stopped.');
  }
  // 12. Retirar SIEMPRE el namespace sintético. El cleanup inicial garantiza
  // un punto de partida limpio; este cleanup final evita dejar fixtures tras
  // una ejecución verde o fallida.
  const finalCleanupCode = sh('node tools/ci/cleanup-e2e.mjs');
  recordStep('final-cleanup', finalCleanupCode === 0);
  if (finalCleanupCode !== 0 && exitCode === 0) {
    exitCode = finalCleanupCode;
    failureReason = 'final cleanup failed';
  }
}

console.log(`\n═══ Pipeline complete (exit ${exitCode}) — ${failureReason || 'success'} ═══`);
writeResults(exitCode, failureReason);
process.exit(exitCode);
