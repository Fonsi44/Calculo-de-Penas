#!/usr/bin/env node
/**
 * Runner efímero para los E2E de Fase 2/3 contra la rama Neon aislada
 * (prompt §4: fase3-e2e-validation-20260718, endpoint ep-fancy-field-ap04213c).
 *
 * NO modifica .env ni .env.local. Todo se configura en memoria para esta
 * sesión y se descarta al terminar.
 *
 * - Reescribe DATABASE_URL al endpoint de la rama aislada.
 * - Activa ALLOW_TEST_DATABASE + E2E_ENV=staging + vars E2E_NEON_BRANCH_*
 *   requeridas por guard.mjs / guard-fase3.mjs.
 * - Alias seguro DeepSeek: IA_DOCUMENTAL_API_KEY ??= DEEPSEEK_API_KEY.
 *
 * Uso:
 *   node scripts/e2e/run-fase3-isolated.mjs fase2     # solo fase 2
 *   node scripts/e2e/run-fase3-isolated.mjs fase3     # solo fase 3
 *   node scripts/e2e/run-fase3-isolated.mjs           # ambas
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Cargar con la misma precedencia que los scripts.
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config({ path: resolve(__dirname, '..', '..', '.env') });

// ─── Endpoint aislado (prompt §4) ────────────────────────────────────────────
const ISOLATED_HOST = 'ep-fancy-field-ap04213c.c-7.us-east-1.aws.neon.tech';
const BRANCH_NAME = 'fase3-e2e-validation-20260718';
const BRANCH_ID = 'br-dark-term-apjtoeoj';
const ENDPOINT_ID = 'ep-fancy-field-ap04213c';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no configurada ni en .env.local ni en .env');
  process.exit(2);
}

const base = new URL(process.env.DATABASE_URL);
const isolated = new URL(process.env.DATABASE_URL);
isolated.hostname = ISOLATED_HOST;

// ─── Configurar entorno efímero ──────────────────────────────────────────────
const env = { ...process.env };
env.DATABASE_URL = isolated.toString();
env.ALLOW_TEST_DATABASE = 'true';
env.E2E_ENV = 'staging';
env.NODE_ENV = env.NODE_ENV || 'test';
env.E2E_NEON_BRANCH_NAME = BRANCH_NAME;
env.E2E_NEON_BRANCH_ID = BRANCH_ID;
env.E2E_NEON_ENDPOINT_ID = ENDPOINT_ID;
// Alias seguro DeepSeek (prompt §9).
env.IA_DOCUMENTAL_API_KEY = env.IA_DOCUMENTAL_API_KEY || env.DEEPSEEK_API_KEY || '';
env.IA_DOCUMENTAL_BASE_URL = env.IA_DOCUMENTAL_BASE_URL || env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
env.IA_DOCUMENTAL_MODEL = env.IA_DOCUMENTAL_MODEL || env.DEEPSEEK_MODEL || 'deepseek-chat';
// Asegurar modo ai para que el bloque DeepSeek del E2E realmente llame al proveedor.
if (!env.IA_DOCUMENTAL_MODE || env.IA_DOCUMENTAL_MODE === 'disabled') {
  env.IA_DOCUMENTAL_MODE = 'ai';
}

const which = process.argv[2] || 'ambas';
const runs = [];
if (which === 'fase2' || which === 'ambas') runs.push('fase2-e2e.mjs');
if (which === 'fase3' || which === 'ambas') runs.push('fase3-e2e.mjs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Runner E2E aislado — rama Neon:', BRANCH_NAME);
console.log('  Endpoint:', ISOLATED_HOST);
console.log('  DB original (no usada):', base.hostname);
console.log('  Scripts:', runs.join(', '));
console.log('  Alias DeepSeek:', env.IA_DOCUMENTAL_API_KEY ? 'configurado' : 'AUSENTE');
console.log('  Resend:', env.RESEND_API_KEY ? 'configurado' : 'AUSENTE');
console.log('═══════════════════════════════════════════════════════════════\n');

let overall = 0;
for (const script of runs) {
  console.log(`\n▶ Ejecutando ${script}...`);
  const r = spawn(process.execPath, [resolve(__dirname, script)], {
    env,
    stdio: 'inherit',
  });
  const code = await new Promise((res) => r.on('close', res));
  console.log(`◀ ${script} terminó con código ${code}`);
  if (code !== 0) overall = code;
}

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  Resultado global: ${overall === 0 ? '✅ OK' : '❌ FALLÓ (' + overall + ')'}`);
console.log(`═══════════════════════════════════════════════════════════════`);
process.exit(overall);
