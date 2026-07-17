#!/usr/bin/env node
/**
 * SEO Auth Doctor — Diagnóstico de todas las autenticaciones
 *
 * Revisa el estado de cada sistema de autenticación sin exponer secretos.
 *
 * Uso:
 *   npm run seo:doctor
 *   node scripts/seo-auth-doctor.mjs --json
 */

import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { resolveGcloudCli, runGcloud } from './gcloud-cli.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const jsonMode = process.argv.includes('--json');

function ok(msg) { return jsonMode ? { status: 'OK', detail: msg } : `   ✅ ${msg}`; }
function warn(msg) { return jsonMode ? { status: 'WARN', detail: msg } : `   ⚠️  ${msg}`; }
function err(msg) { return jsonMode ? { status: 'ERROR', detail: msg } : `   ❌ ${msg}`; }
function pend(msg) { return jsonMode ? { status: 'PENDING', detail: msg } : `   ⬜ ${msg}`; }

function hasCmd(cmd) {
  try { execSync(`${cmd} --version 2>nul`, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function envVar(name) {
  const v = process.env[name];
  if (v) return ok(`${name}=***configurada***`);
  return err(`${name} no configurada`);
}

function checkFile(path, label) {
  const full = resolve(ROOT, path);
  if (fs.existsSync(full)) return ok(`${label}: ${path}`);
  return pend(`${label}: ${path} (no existe aún)`);
}

function print(title, results) {
  if (jsonMode) return;
  console.log(`── ${title} ──`);
  results.forEach(r => console.log(typeof r === 'string' ? r : r));
  console.log('');
}

async function main() {
  const checks = {};

  if (!jsonMode) {
    console.log('SEO Auth Doctor — Diagnóstico de autenticaciones\n');
    console.log(`Fecha: ${new Date().toISOString()}\n`);
  }

  // Google
  const googleResults = [];
  const hasGcloud = Boolean(resolveGcloudCli());
  googleResults.push(hasGcloud ? ok('gcloud CLI instalada') : err('gcloud CLI no instalada — npm run auth:google para instrucciones'));
  
  if (hasGcloud) {
    try {
      const who = runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']).stdout;
      googleResults.push(who ? ok(`Google: autenticado como ${who}`) : err('Google: no autenticado — npm run auth:google'));
    } catch { googleResults.push(err('Google: error verificando estado')); }
  }

  const adcFile = resolve(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  googleResults.push(fs.existsSync(adcFile) ? ok('ADC file presente') : pend('ADC file no encontrado'));
  
  googleResults.push(envVar('GOOGLE_ANALYTICS_PROPERTY_ID'));
  googleResults.push(envVar('GOOGLE_SEARCH_CONSOLE_SITE_URL'));

  // Verificar service account
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    googleResults.push(ok('Service Account configurada'));
  }

  checks.google = { cli: hasGcloud, results: googleResults };
  if (!jsonMode) print('GOOGLE (GSC / GA4 / GBP)', googleResults);

  // Bing
  const bingResults = [];
  bingResults.push(process.env.INDEXNOW_KEY ? ok('Bing API Key (INDEXNOW_KEY) configurada') : err('INDEXNOW_KEY no configurada'));
  
  const bingOAuthFile = resolve(ROOT, '.secrets', 'bing-oauth.json');
  if (fs.existsSync(bingOAuthFile)) {
    try {
      const token = JSON.parse(fs.readFileSync(bingOAuthFile, 'utf-8'));
      const valid = token.expires_at && Date.now() < token.expires_at;
      bingResults.push(valid ? ok('Bing OAuth: token válido') : warn('Bing OAuth: token expirado — npm run auth:bing'));
      if (token.refresh_token) bingResults.push(ok('Bing OAuth: refresh token disponible'));
    } catch { bingResults.push(err('Bing OAuth: archivo corrupto')); }
  } else {
    const hasClientId = !!process.env.BING_CLIENT_ID;
    bingResults.push(hasClientId ? warn('Bing OAuth: BING_CLIENT_ID configurada pero sin token — npm run auth:bing') : pend('Bing OAuth: falta BING_CLIENT_ID (registrar app Azure AD)'));
  }
  
  bingResults.push(checkFile('.secrets/', '.secrets/ en gitignore'));

  checks.bing = { oauth: fs.existsSync(bingOAuthFile), results: bingResults };
  if (!jsonMode) print('BING (WMT / IndexNow)', bingResults);

  // Vercel
  const vercelResults = [];
  const hasVercel = hasCmd('vercel');
  vercelResults.push(hasVercel ? ok('Vercel CLI instalada') : err('Vercel CLI no instalada — npm i -g vercel'));

  if (hasVercel) {
    try {
      const who = execSync('vercel whoami', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      vercelResults.push(who ? ok(`Vercel: autenticado como ${who}`) : err('Vercel: no autenticado — npm run auth:vercel'));
    } catch { vercelResults.push(err('Vercel: error verificando estado')); }
  }

  checks.vercel = { cli: hasVercel, results: vercelResults };
  if (!jsonMode) print('VERCEL', vercelResults);

  // GitHub
  const ghResults = [];
  const hasGh = hasCmd('gh');
  ghResults.push(hasGh ? ok('GitHub CLI instalada') : ok('GitHub CLI no instalada (no requerida para SEO)'));

  if (hasGh) {
    try {
      const who = execSync('gh auth status 2>&1', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      ghResults.push(who.includes('Logged in') ? ok('GitHub: autenticado') : pend('GitHub: no autenticado'));
    } catch { ghResults.push(pend('GitHub: no autenticado')); }
  }

  checks.github = { cli: hasGh, results: ghResults };
  if (!jsonMode) print('GITHUB', ghResults);

  // Resumen
  const allOk = 
    (hasGcloud && googleResults.some(r => typeof r === 'string' && r.includes('autenticado como'))) &&
    bingResults.some(r => typeof r === 'string' && r.includes('API Key')) &&
    hasVercel;

  if (!jsonMode) {
    console.log('═══════════════════════════════════════');
    console.log(`  Estado general: ${allOk ? '✅ Mayoría OK' : '⚠️  Faltan autenticaciones'}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Para autenticar todo:');
    console.log('  npm run auth:google');
    console.log('  npm run auth:bing');
    console.log('  npm run auth:vercel');
    console.log('');
    console.log('Para recolectar datos:');
    console.log('  npm run seo:collect');
  }

  if (jsonMode) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), checks }, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
