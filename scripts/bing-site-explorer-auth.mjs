#!/usr/bin/env node
/**
 * Bing WMT Site Explorer — con soporte OAuth
 *
 * Intenta extraer datos de Site Explorer usando:
 * 1. OAuth token (preferido, más endpoints disponibles)
 * 2. API Key (fallback, endpoints limitados)
 *
 * Uso:
 *   npm run bing:site-explorer   # intenta OAuth, fallback a API Key
 *   node scripts/bing-site-explorer-auth.mjs --limit 30
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const SITE_URL = 'https://www.pinedayasociadoshn.com/';
const TOKEN_FILE = resolve(ROOT, '.secrets', 'bing-oauth.json');
const API_KEY = process.env.INDEXNOW_KEY;

function loadOAuthToken() {
  try { return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')); }
  catch { return null; }
}

async function getJsonOAuth(method, params = {}) {
  const token = loadOAuthToken();
  if (!token || Date.now() >= token.expires_at) return null;
  
  const qs = new URLSearchParams({ ...params }).toString();
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?${qs}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, ...JSON.parse(text) }; }
  catch { return { ok: false, status: res.status }; }
}

async function getJsonApiKey(method, params = {}) {
  if (!API_KEY) return null;
  const qs = new URLSearchParams({ apikey: API_KEY, ...params }).toString();
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?${qs}`;
  const res = await fetch(url);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, ...JSON.parse(text) }; }
  catch { return { ok: false, status: res.status }; }
}

async function getJson(method, params = {}) {
  let result = await getJsonOAuth(method, params);
  if (result) return { ...result, _auth: 'OAuth' };
  result = await getJsonApiKey(method, params);
  if (result) return { ...result, _auth: 'API Key' };
  return { ok: false, status: 0, _auth: 'none' };
}

async function fetchSitemapUrls() {
  try {
    const xmlText = await (await fetch(`${SITE_URL}sitemap.xml`)).text();
    const matches = xmlText.matchAll(/<loc>([^<]+)<\/loc>/g);
    return [...matches].map(m => m[1]);
  } catch { return []; }
}

function classify(r) {
  if (!r.crawled || r.crawled === '01/01/0001 09:00:00') return 'not_crawled';
  if (r.httpCode >= 400 && r.httpCode < 500) return 'error_4xx';
  if (r.httpCode >= 500) return 'error_5xx';
  if (r.redirectTo) return 'redirected';
  // API no expone "indexed" directamente
  return 'crawled';
}

async function main() {
  const limit = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0;
  
  console.log('Bing WMT — Site Explorer\n');

  const token = loadOAuthToken();
  const hasOAuth = token && Date.now() < token.expires_at;
  console.log(`Modo: ${hasOAuth ? 'OAuth ✅' : 'API Key (limitado) ⚠️'}`);
  
  if (!hasOAuth && !API_KEY) {
    console.log('❌ Sin autenticación. Ejecuta npm run bing:auth o configura INDEXNOW_KEY.');
    process.exit(1);
  }

  // Intentar endpoints avanzados con OAuth
  if (hasOAuth) {
    console.log('\nProbando endpoints avanzados con OAuth...');
    
    const issuesRes = await getJson('GetCrawlIssues', { siteUrl: encodeURIComponent(SITE_URL) });
    console.log(`  GetCrawlIssues: ${issuesRes.ok ? '✅ disponible (' + (issuesRes.d?.length || 0) + ' issues)' : '❌ no disponible'}`);

    const scoreRes = await getJson('GetPageScore', {
      siteUrl: encodeURIComponent(SITE_URL),
      pageUrl: encodeURIComponent(SITE_URL),
    });
    console.log(`  GetPageScore: ${scoreRes.ok ? '✅ disponible' : '❌ no disponible'}`);
  }

  // Obtener y analizar URLs del sitemap
  console.log('\nAnalizando URLs del sitemap...');
  let urls = await fetchSitemapUrls();
  if (limit > 0) urls = urls.slice(0, limit);
  
  console.log(`Total a analizar: ${urls.length}\n`);

  const results = [];
  const batchSize = 3;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async url => {
      const encoded = encodeURIComponent(url);
      const data = await getJson('GetUrlInfo', {
        siteUrl: encodeURIComponent(SITE_URL),
        url: encoded,
      });
      if (data.ok && data.d) {
        return {
          url,
          crawled: data.d.LastCrawledDate,
          httpCode: data.d.HttpStatus || 0,
          anchors: data.d.AnchorCount || 0,
          size: data.d.DocumentSize || 0,
          isPage: data.d.IsPage,
        };
      }
      return { url, error: true };
    }));
    results.push(...batchResults);
    
    const notCrawled = results.filter(r => !r.crawled || r.crawled.startsWith('01/01/0001')).length;
    const crawled = results.filter(r => r.crawled && !r.crawled.startsWith('01/01/0001')).length;
    const errors = results.filter(r => r.error || r.httpCode >= 400).length;
    process.stdout.write(`\rProgreso: ${i + batch.length}/${urls.length} | crawled: ${crawled} | not_crawled: ${notCrawled} | errors: ${errors}`);
    
    if (i + batchSize < urls.length) await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n');

  // Clasificar
  const crawled = results.filter(r => r.crawled && !r.crawled.startsWith('01/01/0001'));
  const notCrawled = results.filter(r => !r.crawled || r.crawled.startsWith('01/01/0001'));
  const errors = results.filter(r => r.error || r.httpCode >= 400);
  const smallDocs = results.filter(r => r.size > 0 && r.size < 10000); // posibles thin

  console.log('═══════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════');
  console.log(`  Rastreadas:       ${crawled.length}`);
  console.log(`  No rastreadas:    ${notCrawled.length}`);
  console.log(`  Errores:          ${errors.length}`);
  console.log(`  Docs pequeños:    ${smallDocs.length} (posible thin content)`);
  console.log(`  Total analizado:  ${results.length}`);

  if (notCrawled.filter(u => !u.url.includes('/blog/')).length > 0) {
    console.log('\n── URLs NO rastreadas (no blog) ──');
    notCrawled.filter(u => !u.url.includes('/blog/')).forEach(u => {
      console.log(`  ${u.url}`);
    });
  }

  // Guardar
  const outDir = resolve(ROOT, 'data', 'bing');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'site-explorer.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    site: SITE_URL,
    authMode: hasOAuth ? 'OAuth' : 'API Key',
    summary: {
      total: results.length,
      crawled: crawled.length,
      notCrawled: notCrawled.length,
      errors: errors.length,
      smallDocs: smallDocs.length,
    },
    crawled: crawled.map(r => ({ url: r.url, crawled: r.crawled, anchors: r.anchors, size: r.size })),
    notCrawled: notCrawled.map(r => r.url),
    errors: errors.map(r => ({ url: r.url, httpCode: r.httpCode })),
  }, null, 2));
  
  console.log(`\n✅ Datos guardados en ${outPath}`);
  
  if (!hasOAuth) {
    console.log('\n⚠️  Modo API Key: no se puede verificar indexación real.');
    console.log('Para datos completos de Site Explorer, autoriza con OAuth: npm run bing:auth');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
