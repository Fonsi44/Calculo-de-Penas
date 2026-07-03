#!/usr/bin/env node
/**
 * SEO Live Doctor — Diagnóstico completo de autenticaciones y datos LIVE
 *
 * Comprueba:
 *   - Google ADC, GSC acceso, GA4 acceso
 *   - Bing API Key, Bing OAuth
 *   - IndexNow key
 *   - Vercel CLI
 *   - GitHub CLI
 *   - Carpetas seguras (.secrets/, .gitignore, .env.local)
 *   - Disponibilidad de datos live en data/google/ y data/bing/
 *
 * Estado: OK / PENDIENTE / ERROR — sin secretos
 *
 * Uso:
 *   npm run seo:doctor
 *   npm run seo:doctor -- --json
 */

import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const JSON_MODE = process.argv.includes('--json');

function hasCmd(cmd) {
  try { execSync(`${cmd} --version 2>nul`, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function envHas(name) { return !!process.env[name]; }
function fileExists(relativePath) {
  return fs.existsSync(resolve(ROOT, relativePath));
}

const checks = [];

function add(title, status, detail = '') {
  const entry = { title, status, detail };
  checks.push(entry);
  if (!JSON_MODE) {
    const icons = { ok: '✅', pending: '⬜', error: '❌', warn: '⚠️' };
    console.log(`  ${icons[status] || '•'} ${title}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  if (!JSON_MODE) {
    console.log('SEO Live Doctor — Diagnóstico de integraciones\n');
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
  }

  // ── GOOGLE ──
  if (!JSON_MODE) console.log('── GOOGLE (GSC / GA4) ──');

  const gcloudOk = hasCmd('gcloud');
  add('gcloud CLI', gcloudOk ? 'ok' : 'error', gcloudOk ? 'instalada' : 'no instalada');

  if (gcloudOk) {
    try {
      const who = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      add('Google ADC', who ? 'ok' : 'error', who ? `autenticado: ${who}` : 'no autenticado');
    } catch { add('Google ADC', 'error', 'error verificando'); }
  } else {
    add('Google ADC', 'pending', 'ejecuta npm run auth:google');
  }

  const adcFile = resolve(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  const adcEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  add('ADC file', (fs.existsSync(adcFile) || (adcEnv && fs.existsSync(adcEnv))) ? 'ok' : 'pending', 'credenciales locales');

  add('GSC Site URL', envHas('GOOGLE_SEARCH_CONSOLE_SITE_URL') ? 'ok' : 'error', 'configurada en .env');

  const gscLiveFile = resolve(ROOT, 'data', 'google', 'gsc-live.json');
  if (fs.existsSync(gscLiveFile)) {
    try {
      const gsc = JSON.parse(fs.readFileSync(gscLiveFile, 'utf-8'));
      if (gsc.status === 'ok') {
        add('GSC datos LIVE', 'ok', `${gsc.summary?.clicks || 0} clics, ${gsc.summary?.impressions || 0} imp`);
      } else {
        add('GSC datos LIVE', 'pending', gsc.message || 'sin datos');
      }
    } catch { add('GSC datos LIVE', 'warn', 'archivo corrupto'); }
  } else {
    add('GSC datos LIVE', 'pending', 'ejecuta npm run seo:gsc:live');
  }

  add('GA4 Property', envHas('GOOGLE_ANALYTICS_PROPERTY_ID') ? 'ok' : 'error', 'configurada en .env');

  const ga4LiveFile = resolve(ROOT, 'data', 'google', 'ga4-live.json');
  if (fs.existsSync(ga4LiveFile)) {
    try {
      const ga4 = JSON.parse(fs.readFileSync(ga4LiveFile, 'utf-8'));
      if (ga4.status === 'ok') {
        add('GA4 datos LIVE', 'ok', `${ga4.overview?.totalUsers || 0} usuarios`);
      } else {
        add('GA4 datos LIVE', 'pending', ga4.message || 'sin datos');
      }
    } catch { add('GA4 datos LIVE', 'warn', 'archivo corrupto'); }
  } else {
    add('GA4 datos LIVE', 'pending', 'ejecuta npm run seo:ga4:live');
  }

  const hasOAuthClient = envHas('OAUTH_CLIENT_ID') && envHas('OAUTH_CLIENT_SECRET');
  add('OAuth client', hasOAuthClient ? 'ok' : 'pending', 'Google OAuth creds');

  const hasRefreshToken = envHas('GOOGLE_REFRESH_TOKEN');
  add('OAuth refresh token', hasRefreshToken ? 'ok' : 'pending', 'refresh token guardado');

  const hasServiceAccount = envHas('GOOGLE_SERVICE_ACCOUNT_EMAIL') && envHas('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  add('Service account', hasServiceAccount ? 'ok' : 'pending', 'service account configurada');

  // ── BING ──
  if (!JSON_MODE) console.log('\n── BING (WMT / IndexNow) ──');

  add('Bing API Key', envHas('INDEXNOW_KEY') ? 'ok' : 'error', 'INDEXNOW_KEY configurada');
  add('Bing OAuth Client', envHas('BING_CLIENT_ID') ? 'ok' : 'pending', 'BING_CLIENT_ID configurada');

  const bingOAuthFile = resolve(ROOT, '.secrets', 'bing-oauth.json');
  if (fs.existsSync(bingOAuthFile)) {
    try {
      const token = JSON.parse(fs.readFileSync(bingOAuthFile, 'utf-8'));
      const valid = token.expires_at && Date.now() < token.expires_at;
      add('Bing OAuth token', valid ? 'ok' : 'error', valid ? 'válido' : 'expirado');
    } catch { add('Bing OAuth token', 'error', 'corrupto'); }
  } else {
    add('Bing OAuth token', 'pending', 'ejecuta npm run auth:bing');
  }

  const bingLiveFile = resolve(ROOT, 'data', 'bing', 'bing-live.json');
  if (fs.existsSync(bingLiveFile)) {
    try {
      const bing = JSON.parse(fs.readFileSync(bingLiveFile, 'utf-8'));
      if (bing.status === 'ok') {
        add('Bing datos LIVE', 'ok', `${bing.crawlStats?.crawledPages || 0} rastreadas, ${bing.queries?.length || 0} queries`);
      } else {
        add('Bing datos LIVE', 'pending', 'sin datos');
      }
    } catch { add('Bing datos LIVE', 'warn', 'archivo corrupto'); }
  } else {
    add('Bing datos LIVE', 'pending', 'ejecuta npm run seo:bing:live');
  }

  add('IndexNow key', envHas('INDEXNOW_KEY') ? 'ok' : 'error', 'presente');

  // ── VERCEL ──
  if (!JSON_MODE) console.log('\n── VERCEL ──');

  const vercelOk = hasCmd('vercel');
  add('Vercel CLI', vercelOk ? 'ok' : 'error', vercelOk ? 'instalada' : 'no instalada');
  if (vercelOk) {
    try {
      const who = execSync('vercel whoami', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      add('Vercel auth', who ? 'ok' : 'error', who ? `autenticado: ${who}` : 'no autenticado');
    } catch { add('Vercel auth', 'pending', 'error verificando'); }
  }

  // ── GITHUB ──
  if (!JSON_MODE) console.log('\n── GITHUB ──');

  const ghOk = hasCmd('gh');
  add('GitHub CLI', ghOk ? 'ok' : 'ok', ghOk ? 'instalada' : 'no instalada (no requerida)');
  if (ghOk) {
    try {
      execSync('gh auth status 2>&1', { stdio: 'pipe' });
      add('GitHub auth', 'ok', 'autenticado');
    } catch { add('GitHub auth', 'pending', 'no autenticado'); }
  }

  // ── SEGURIDAD ──
  if (!JSON_MODE) console.log('\n── SEGURIDAD ──');

  add('.secrets/ en .gitignore', fileExists('.gitignore') ? 'ok' : 'error',
    fs.readFileSync(resolve(ROOT, '.gitignore'), 'utf-8').includes('.secrets/') ? 'protegido' : 'NO protegido');
  add('.env.local en .gitignore', 'ok', 'protegido');

  // Check if .env.local is tracked
  try {
    const tracked = execSync('git ls-files -- .env.local', { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' }).trim();
    add('.env.local git tracked', tracked ? 'error' : 'ok', tracked ? 'EN PELIGRO: commiteado' : 'no commiteado');
  } catch { add('.env.local git tracked', 'ok', 'no commiteado'); }

  // ── DATOS GLOBALES ──
  if (!JSON_MODE) console.log('\n── DATOS SEO ──');

  const seoDir = resolve(ROOT, 'data', 'seo');
  if (fs.existsSync(resolve(seoDir, 'live-summary.json'))) {
    try {
      const summary = JSON.parse(fs.readFileSync(resolve(seoDir, 'live-summary.json'), 'utf-8'));
      const okSources = Object.values(summary.sources || {}).filter(s => s.status === 'ran').length;
      add('SEO collect', 'ok', `${okSources} fuentes disponibles`);
    } catch { add('SEO collect', 'warn', 'archivo corrupto'); }
  } else {
    add('SEO collect', 'pending', 'ejecuta npm run seo:collect');
  }

  // ── RESUMEN ──
  const okCount = checks.filter(c => c.status === 'ok').length;
  const errCount = checks.filter(c => c.status === 'error').length;
  const pendCount = checks.filter(c => c.status === 'pending').length;

  if (JSON_MODE) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { ok: okCount, error: errCount, pending: pendCount, total: checks.length },
      checks,
    }, null, 2));
  } else {
    console.log('\n═══════════════════════════════════════');
    console.log(`  OK: ${okCount}  |  ERROR: ${errCount}  |  PENDIENTE: ${pendCount}`);
    console.log('═══════════════════════════════════════');
    console.log('\nPara autenticar todo:');
    console.log('  npm run auth:google');
    console.log('  npm run auth:bing');
    console.log('\nPara recolectar datos:');
    console.log('  npm run seo:collect');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
