#!/usr/bin/env node
/**
 * Bing WMT Site Explorer — vía API (GetUrlInfo masivo)
 * 
 * Extrae estado de indexación para todas las URLs del sitemap,
 * clasificándolas en: indexadas, excluidas, con warning, no rastreadas.
 * 
 * Uso: node scripts/bing-site-explorer.mjs
 * Requiere: INDEXNOW_KEY en .env o .env.local
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
config({ path: path.resolve(ROOT, '.env.local') });
config({ path: path.resolve(ROOT, '.env') });

const API_KEY = process.env.INDEXNOW_KEY;
if (!API_KEY) {
  console.error('ERROR: falta INDEXNOW_KEY');
  process.exit(1);
}

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const SITE_URL = 'https://www.pinedayasociadoshn.com/';
const SITE_URL_ENC = encodeURIComponent(SITE_URL);

async function getJson(method, params = {}) {
  const qs = new URLSearchParams({ apikey: API_KEY, ...params }).toString();
  const url = `${BASE}/${method}?${qs}`;
  const res = await fetch(url);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, ...JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, _raw: text.slice(0, 200) }; }
}

async function fetchSitemapUrls() {
  try {
    const xmlText = await (await fetch(`${SITE_URL}sitemap.xml`)).text();
    const matches = xmlText.matchAll(/<loc>([^<]+)<\/loc>/g);
    return [...matches].map(m => m[1]);
  } catch (e) {
    console.error('Error fetching sitemap:', e.message);
    return [];
  }
}

async function checkUrl(url) {
  const encoded = encodeURIComponent(url);
  const data = await getJson('GetUrlInfo', { siteUrl: SITE_URL_ENC, url: encoded });
  
  if (!data.ok || !data.d) {
    return { url, status: 'api_error', httpCode: null, indexed: null, crawled: null };
  }
  
  const d = data.d;
  return {
    url,
    httpCode: d.HttpCode || 0,
    indexed: d.Indexed || false,
    crawled: d.CrawlDate || null,
    inLinks: d.InLinks || 0,
    redirectTo: d.RedirectedTo || null,
    blockedByRobots: d.BlockedByRobots || false,
  };
}

async function main() {
  console.log('Bing WMT — Site Explorer (vía API)\n');
  
  const urls = await fetchSitemapUrls();
  console.log(`Sitemap URLs: ${urls.length}\n`);
  
  const results = [];
  const batchSize = 5;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    
    const indexed = results.filter(r => r.indexed).length;
    process.stdout.write(`\rProgreso: ${i + batch.length}/${urls.length}  Indexed: ${indexed}  Excluded: ${results.filter(r => r.indexed === false && r.httpCode > 0).length}`);
    
    // Rate limit: 1s entre batches
    if (i + batchSize < urls.length) await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n');
  
  // Clasificar
  const indexed = results.filter(r => r.indexed === true);
  const excluded = results.filter(r => r.indexed === false && r.httpCode > 0);
  const notCrawled = results.filter(r => r.crawled === null);
  const apiErrors = results.filter(r => r.status === 'api_error');
  const with4xx = results.filter(r => r.httpCode >= 400 && r.httpCode < 500);
  const redirected = results.filter(r => r.redirectTo);

  console.log('═══════════════════════════════════════');
  console.log('  RESUMEN SITE EXPLORER (vía API)');
  console.log('═══════════════════════════════════════');
  console.log(`  Indexed:        ${indexed.length}`);
  console.log(`  Excluded (no index): ${excluded.length}`);
  console.log(`  Not crawled yet:     ${notCrawled.length}`);
  console.log(`  API errors:     ${apiErrors.length}`);
  console.log(`  HTTP 4xx:       ${with4xx.length}`);
  console.log(`  Redirected:     ${redirected.length}`);
  console.log('');

  if (excluded.length > 0) {
    console.log('── EXCLUDED URLs ──');
    excluded.slice(0, 30).forEach(e => {
      console.log(`  ${e.url}  (HTTP ${e.httpCode})`);
    });
    if (excluded.length > 30) console.log(`  ... y ${excluded.length - 30} más`);
  }

  if (with4xx.length > 0) {
    console.log('\n── HTTP 4xx URLs ──');
    with4xx.slice(0, 20).forEach(e => {
      console.log(`  ${e.url}  -> ${e.httpCode}`);
    });
    if (with4xx.length > 20) console.log(`  ... y ${with4xx.length - 20} más`);
  }

  if (redirected.length > 0) {
    console.log('\n── REDIRECTED URLs ──');
    redirected.forEach(e => {
      console.log(`  ${e.url}  -> ${e.redirectTo}`);
    });
  }

  // Guardar JSON
  const outPath = path.resolve(ROOT, 'scripts/.bing-explorer.json');
  const output = {
    generatedAt: new Date().toISOString(),
    site: SITE_URL,
    summary: {
      total: results.length,
      indexed: indexed.length,
      excluded: excluded.length,
      notCrawled: notCrawled.length,
      apiErrors: apiErrors.length,
      http4xx: with4xx.length,
      redirected: redirected.length,
    },
    indexed: indexed.map(r => r.url),
    excluded: excluded.map(r => ({ url: r.url, httpCode: r.httpCode, crawled: r.crawled })),
    http4xx: with4xx.map(r => ({ url: r.url, httpCode: r.httpCode })),
    redirected: redirected.map(r => ({ url: r.url, to: r.redirectTo })),
    notCrawled: notCrawled.map(r => r.url),
    all: results,
  };
  
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Datos guardados en ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
