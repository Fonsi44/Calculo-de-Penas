#!/usr/bin/env node
/**
 * Bing Webmaster Tools — Datos LIVE para el proyecto
 *
 * Extrae datos de Bing WMT (API Key u OAuth) y los guarda en
 * data/bing/bing-live.json y genera reporte sanitizado en
 * docs/audits/bing-live-report.md.
 *
 * Endpoints operativos: GetUserSites, GetCrawlStats, GetUrlInfo,
 * GetLinkCounts, GetQueryStats.
 *
 * NO expone Site Scan ni Site Explorer (solo vía dashboard).
 *
 * Uso:
 *   npm run seo:bing:live
 *   npm run seo:bing:live -- --json-only
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const BING_DATA_DIR = resolve(ROOT, 'data', 'bing');
const OUT_JSON = resolve(BING_DATA_DIR, 'bing-live.json');
const OUT_MD = resolve(ROOT, 'docs', 'audits', 'bing-live-report.md');
const TOKEN_FILE = resolve(ROOT, '.secrets', 'bing-oauth.json');

const API_KEY = process.env.INDEXNOW_KEY;
const SITE_URL = 'https://www.pinedayasociadoshn.com/';
const SITE_URL_ENC = encodeURIComponent(SITE_URL);

const JSON_ONLY = process.argv.includes('--json-only');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadOAuthToken() {
  try { return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')); }
  catch { return null; }
}

async function getJson(method, params = {}) {
  const qs = new URLSearchParams(params);
  const hasOAuth = loadOAuthToken();
  const authHeader = hasOAuth ? { Authorization: `Bearer ${hasOAuth.access_token}` } : {};
  if (API_KEY) qs.set('apikey', API_KEY);

  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?${qs.toString()}`;
  try {
    const res = await fetch(url, { headers: authHeader });
    const text = await res.text();
    try { return { ok: res.ok, ...JSON.parse(text) }; }
    catch { return { ok: false, error: text.slice(0, 200) }; }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function getCrawlStats() {
  const data = await getJson('GetCrawlStats', { siteUrl: SITE_URL });
  if (data.ok && Array.isArray(data.d)) {
    let crawled = 0, code2xx = 0, code4xx = 0, code5xx = 0, errors = 0;
    for (const r of data.d) {
      crawled += r.CrawledPages || 0;
      code2xx += r.Code2xx || 0;
      code4xx += r.Code4xx || 0;
      code5xx += r.Code5xx || 0;
      errors += r.CrawlErrors || 0;
    }
    return { daysReported: data.d.length, crawledPages: crawled, code2xx, code4xx, code5xx, crawlErrors: errors };
  }
  return null;
}

async function getQueryStats() {
  const data = await getJson('GetQueryStats', { siteUrl: SITE_URL });
  if (data.ok && data.d) {
    return (data.d || []).map(q => ({
      query: q.Query,
      clicks: q.Clicks || 0,
      impressions: q.Impressions || 0,
      position: q.Position || 0,
      ctr: q.Ctr || 0,
    }));
  }
  return [];
}

async function getLinkCounts() {
  const data = await getJson('GetLinkCounts', { siteUrl: SITE_URL });
  if (data.ok && data.d) {
    return { totalLinks: data.d.TotalLinks || 0, totalPages: data.d.TotalPages || 0 };
  }
  return null;
}

async function getUrlInfo(url) {
  const data = await getJson('GetUrlInfo', {
    siteUrl: SITE_URL,
    url,
  });
  if (data.ok && data.d) {
    return {
      url,
      crawled: data.d.LastCrawledDate,
      httpCode: data.d.HttpStatus || data.d.HttpCode || 0,
      anchors: data.d.AnchorCount || 0,
      size: data.d.DocumentSize || 0,
      isPage: data.d.IsPage,
    };
  }
  return null;
}

async function main() {
  if (!JSON_ONLY) console.log('Bing Webmaster Tools — LIVE Data Extractor\n');

  if (!API_KEY) {
    const result = {
      status: 'no_credentials',
      timestamp: new Date().toISOString(),
      message: 'INDEXNOW_KEY no configurada en .env.local',
    };
    ensureDir(BING_DATA_DIR);
    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const oauth = loadOAuthToken();
  const hasOAuth = oauth && Date.now() < (oauth.expires_at || 0);
  if (!JSON_ONLY) console.log(`Auth: ${hasOAuth ? 'OAuth ✅' : 'API Key'} | Timestamp: ${new Date().toISOString()}\n`);

  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    site: SITE_URL,
    authMode: hasOAuth ? 'OAuth' : 'API Key',
    crawlStats: null,
    queries: [],
    backlinks: null,
    priorityUrls: [],
  };

  // Crawl stats
  if (!JSON_ONLY) console.log('Consultando crawl stats...');
  result.crawlStats = await getCrawlStats();
  if (!JSON_ONLY && result.crawlStats) {
    console.log(`  Días: ${result.crawlStats.daysReported} | crawled: ${result.crawlStats.crawledPages} | 4xx: ${result.crawlStats.code4xx} | errors: ${result.crawlStats.crawlErrors}`);
  }

  // Query stats
  if (!JSON_ONLY) console.log('Consultando queries...');
  result.queries = await getQueryStats();
  if (!JSON_ONLY) console.log(`  Queries encontradas: ${result.queries.length}`);

  // Backlinks
  if (!JSON_ONLY) console.log('Consultando backlinks...');
  result.backlinks = await getLinkCounts();
  if (!JSON_ONLY && result.backlinks) {
    console.log(`  Links totales: ${result.backlinks.totalLinks}`);
  }

  // Priority URLs: check key pages
  const PRIORITY_URLS = [
    SITE_URL,
    `${SITE_URL}servicios-juridicos`,
    `${SITE_URL}blog`,
    `${SITE_URL}despacho`,
    `${SITE_URL}derecho-penal`,
    `${SITE_URL}hondurenos-en-espana`,
    `${SITE_URL}abogados-en-nacaome`,
    `${SITE_URL}abogados-en-choluteca`,
    `${SITE_URL}abogados-en-san-lorenzo`,
    `${SITE_URL}abogados-en-goascoran`,
    `${SITE_URL}abogados-en-san-marcos-de-colon`,
    `${SITE_URL}abogados-en-el-triunfo`,
    `${SITE_URL}abogados-en-marcovia`,
    `${SITE_URL}abogados-en-pespire`,
    `${SITE_URL}abogados-en-namasigue`,
    `${SITE_URL}abogados-en-orocuina`,
  ];

  if (!JSON_ONLY) console.log('Consultando URLs prioritarias...');
  for (let i = 0; i < PRIORITY_URLS.length; i += 3) {
    const batch = PRIORITY_URLS.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map(getUrlInfo));
    for (const r of batchResults) {
      if (r) result.priorityUrls.push(r);
    }
    if (i + 3 < PRIORITY_URLS.length) await new Promise(r => setTimeout(r, 500));
  }

  const crawled = result.priorityUrls.filter(u => u.crawled && !u.crawled.startsWith('01/01/0001'));
  const notCrawled = result.priorityUrls.filter(u => !u.crawled || u.crawled.startsWith('01/01/0001'));
  if (!JSON_ONLY) {
    console.log(`\n  URLs prioritarias rastreadas: ${crawled.length}/${result.priorityUrls.length}`);
    if (notCrawled.length > 0) {
      console.log('  No rastreadas aún:');
      notCrawled.forEach(u => console.log(`    ${u.url.replace(SITE_URL, '/')}`));
    }
  }

  // Save JSON
  ensureDir(BING_DATA_DIR);
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
  if (!JSON_ONLY) console.log(`\nDatos guardados en: ${OUT_JSON}`);

  // Generate Markdown report
  ensureDir(resolve(ROOT, 'docs', 'audits'));
  let md = `# Bing WMT — Datos LIVE\n\n`;
  md += `**Generado:** ${new Date().toISOString()}\n`;
  md += `**Modo:** ${hasOAuth ? 'OAuth' : 'API Key'}\n\n`;

  md += `## Crawl Stats\n\n`;
  if (result.crawlStats) {
    md += `| Métrica | Valor |\n|---------|-------|\n`;
    md += `| Días reportados | ${result.crawlStats.daysReported} |\n`;
    md += `| Páginas rastreadas | ${result.crawlStats.crawledPages} |\n`;
    md += `| Respuestas 2xx | ${result.crawlStats.code2xx} |\n`;
    md += `| Errores 4xx | ${result.crawlStats.code4xx} |\n`;
    md += `| Errores 5xx | ${result.crawlStats.code5xx} |\n`;
    md += `| Errores de rastreo | ${result.crawlStats.crawlErrors} |\n`;
  }

  md += `\n## Top Queries\n\n`;
  if (result.queries.length > 0) {
    md += `| Query | Clics | Impresiones | Posición | CTR |\n`;
    md += `|-------|-------|-------------|----------|-----|\n`;
    result.queries.slice(0, 20).forEach(q => {
      md += `| ${q.query} | ${q.clicks} | ${q.impressions} | ${q.position} | ${q.ctr}% |\n`;
    });
  } else {
    md += `Sin datos de queries.\n`;
  }

  md += `\n## URLs Prioritarias\n\n`;
  md += `| URL | Rastreada | HTTP | Anchors |\n`;
  md += `|-----|-----------|------|--------|\n`;
  result.priorityUrls.forEach(u => {
    const crawled = u.crawled && !u.crawled.startsWith('01/01/0001') ? 'Sí' : 'No';
    md += `| ${u.url} | ${crawled} | ${u.httpCode || '?'} | ${u.anchors || 0} |\n`;
  });

  md += `\n## Certificaciones\n\n`;
  md += `- [ ] No se expusieron secretos\n`;
  md += `- [ ] \`.secrets/\` está en \`.gitignore\`\n`;
  md += `- [ ] Datos guardados en \`data/bing/\`\n`;

  fs.writeFileSync(OUT_MD, md, 'utf-8');
  if (!JSON_ONLY) console.log(`Reporte guardado en: ${OUT_MD}`);
}

main().catch(e => { console.error(e); process.exit(1); });
