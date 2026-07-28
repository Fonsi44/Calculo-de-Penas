#!/usr/bin/env node
/**
 * SEO Data Collector — Recolecta datos de todas las fuentes disponibles
 *
 * Usa las credenciales autenticadas para extraer:
 * - Bing WMT (API Key)
 * - IndexNow (dry-run)
 * - Auditorías locales (seo:health, audit:indexacion, etc.)
 * - GSC/GA4 (requiere gcloud ADC o service account)
 *
 * Guarda resultados en data/seo/ y data/bing/
 *
 * Uso:
 *   npm run seo:collect
 *   npm run seo:collect -- --bing-only
 *   npm run seo:collect -- --local-only
 */

import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const SEO_DATA_DIR = resolve(ROOT, 'data', 'seo');
const BING_DATA_DIR = resolve(ROOT, 'data', 'bing');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runCmd(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd }).trim();
  } catch (e) {
    return `ERROR: ${e.message.substring(0, 200)}`;
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

function saveJson(filename, data) {
  const path = resolve(SEO_DATA_DIR, filename);
  ensureDir(SEO_DATA_DIR);
  fs.writeFileSync(path, JSON.stringify({
    generatedAt: new Date().toISOString(),
    ...data,
  }, null, 2));
  console.log(`  Guardado: ${path}`);
}

async function main() {
  const args = process.argv.slice(2);
  const bingOnly = args.includes('--bing-only');
  const localOnly = args.includes('--local-only');

  console.log('SEO Data Collector\n');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const collection = {
    timestamp: new Date().toISOString(),
    sources: {},
  };

  // Bing WMT
  if (!localOnly) {
    section('Bing WMT');
    try {
      const bingResult = runCmd('node scripts/bing-wmt-audit.mjs');
      const summary = bingResult.includes('ERROR') ? 'error' : 'ok';
      console.log(`  ${summary === 'ok' ? '✅' : '⚠️'} Bing API: ${summary}`);
      collection.sources.bing = { status: summary, ran: true };
    } catch (e) {
      console.log(`  ❌ Bing API: ${e.message.substring(0, 100)}`);
      collection.sources.bing = { status: 'error', error: e.message };
    }
  }

  // IndexNow dry-run
  if (!localOnly) {
    section('IndexNow');
    try {
      const idxResult = runCmd('node scripts/submit-indexnow.mjs --dry-run');
      const urls = (idxResult.match(/https:\/\/[^\s]+/g) || []).length;
      console.log(`  ✅ IndexNow dry-run: ${urls} URLs`);
      collection.sources.indexnow = { status: 'ok', dryRunUrls: urls };
    } catch (e) {
      console.log(`  ❌ IndexNow: error`);
      collection.sources.indexnow = { status: 'error' };
    }
  }

  // SEO Health
  section('SEO Health');
  try {
    const health = runCmd('node scripts/seo-health-check.mjs --json');
    console.log(`  ✅ seo:health ejecutado`);
    collection.sources.seoHealth = { status: 'ok' };
  } catch (e) {
    console.log(`  ❌ seo:health: error`);
    collection.sources.seoHealth = { status: 'error' };
  }

  // Sitemap
  section('Sitemap');
  try {
    const sitemap = runCmd('node scripts/auditar-indexacion-prioritaria.mjs');
    console.log(`  ✅ Sitemap verificado`);
    collection.sources.sitemap = { status: 'ok' };
  } catch (e) {
    console.log(`  ❌ Sitemap: error`);
    collection.sources.sitemap = { status: 'error' };
  }

  // GSC (si hay credenciales)
  if (!localOnly && !bingOnly) {
    section('Google Search Console');
    const hasOAuth = process.env.OAUTH_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN;
    const hasServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    if (hasOAuth || hasServiceAccount) {
      try {
        const gsc = runCmd('node scripts/gsc-analytics.mjs');
        console.log(`  ✅ GSC: datos extraídos`);
        collection.sources.gsc = { status: 'ok' };
      } catch (e) {
        console.log(`  ❌ GSC: ${e.message.substring(0, 100)}`);
        collection.sources.gsc = { status: 'error', error: e.message.substring(0, 200) };
      }
    } else {
      console.log(`  ⬜ GSC: sin credenciales (requiere gcloud ADC o service account)`);
      collection.sources.gsc = { status: 'no_credentials' };
    }
  }

  // Resumen
  saveJson('collection-summary.json', collection);

  console.log('\n═══════════════════════════════════════');
  const sources = Object.values(collection.sources);
  const okCount = sources.filter(s => s.status === 'ok').length;
  const total = sources.length;
  console.log(`  Recolectado: ${okCount}/${total} fuentes`);
  console.log(`  Datos en: data/seo/ y data/bing/`);
  console.log('═══════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
