#!/usr/bin/env node
/**
 * Auditoría de Bing Webmaster Tools — reproducible.
 *
 * Requiere la variable de entorno INDEXNOW_KEY (la API key de Bing WMT es
 * idéntica a la de IndexNow, gestionada desde el panel de Bing WMT →
 * Configuración → Acceso a la API).
 *
 * Uso:
 *   node scripts/bing-wmt-audit.mjs            # salida a scripts/.bing-audit.json
 *   INDEXNOW_KEY=xxx node scripts/bing-wmt-audit.mjs
 *
 * Endpoints operativos (2026-06-19): el host es
 *   https://ssl.bing.com/webmaster/api.svc/json/<Método>?apikey=KEY
 * El path DEBE llevar `/json/`. Los paths legacy `/2.0/` y `/v2/` devuelven
 * 404 (EndpointNotFoundException de WCF) y NO son operativos.
 *
 * Métodos confirmados operativos:
 *   - GetUserSites (GET)
 *   - GetCrawlStats (GET, por sitio)
 *   - GetUrlInfo (GET, por URL; inspección de URL)
 *   - GetLinkCounts (GET, backlinks)
 *   - SubmitUrlBatch (POST, envío de URLs para rastreo)
 *
 * Métodos NO operativos (404 "Endpoint not found"):
 *   - GetSitemaps, SubmitSitemap, GetUrlTrafficStats, GetIndexStats
 *
 * Métodos que devuelven 400 (sin datos todavía):
 *   - GetQueryStats, GetKeywordStats (vaciós hasta que haya impresiones)
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
  console.error('ERROR: falta INDEXNOW_KEY (API key de Bing WMT) en el entorno.');
  console.error('       Es el mismo valor que la key de IndexNow.');
  process.exit(1);
}

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const SITE_URL_RAW = 'https://www.pinedayasociadoshn.com/';
const SITE_URL_ENC = encodeURIComponent(SITE_URL_RAW);

// URLs prioritarias a inspeccionar y enviar (rutas REALES del sitio).
const PRIORITY_URLS = [
  'https://www.pinedayasociadoshn.com/',
  'https://www.pinedayasociadoshn.com/servicios-juridicos',
  'https://www.pinedayasociadoshn.com/derecho-penal',
  'https://www.pinedayasociadoshn.com/blog',
  'https://www.pinedayasociadoshn.com/preguntas-frecuentes',
  'https://www.pinedayasociadoshn.com/solicitar-consulta',
  'https://www.pinedayasociadoshn.com/despacho',
  'https://www.pinedayasociadoshn.com/como-llegar',
  'https://www.pinedayasociadoshn.com/abogados-en-nacaome',
  'https://www.pinedayasociadoshn.com/abogados-en-choluteca',
  'https://www.pinedayasociadoshn.com/abogados-en-san-lorenzo',
  'https://www.pinedayasociadoshn.com/hondurenos-en-espana',
];

async function getJson(method, params = {}) {
  const qs = new URLSearchParams({ apikey: API_KEY, ...params }).toString();
  const url = `${BASE}/${method}?${qs}`;
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { _ok: false, _status: res.status, _raw: text.slice(0, 200) };
  }
  return { _ok: res.ok, _status: res.status, ...data };
}

function decodeBingDate(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/\/Date\((-?\d+)/);
  if (!m) return null;
  const ms = parseInt(m[1], 10);
  // DateTime.MinValue sentinel (0001-01-01) → sin fecha
  if (ms < -62135500000000) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

async function main() {
  const out = { generatedAt: new Date().toISOString(), site: SITE_URL_RAW, sections: {} };

  // 1. GetUserSites
  console.log('→ GetUserSites');
  const sites = await getJson('GetUserSites');
  out.sections.sites = sites;
  if (sites.d) {
    for (const s of sites.d) {
      console.log(`   ${s.Url}  verified=${s.IsVerified}`);
    }
  }

  // 2. GetCrawlStats
  console.log('→ GetCrawlStats');
  const crawl = await getJson('GetCrawlStats', { siteUrl: SITE_URL_RAW });
  out.sections.crawlStats = crawl;
  if (Array.isArray(crawl.d)) {
    let totC = 0, tot2xx = 0, tot4xx = 0, tot5xx = 0, totErr = 0;
    for (const r of crawl.d) {
      totC += r.CrawledPages; tot2xx += r.Code2xx; tot4xx += r.Code4xx;
      tot5xx += r.Code5xx; totErr += r.CrawlErrors;
    }
    console.log(`   ${crawl.d.length} días | total: crawled=${totC} 2xx=${tot2xx} 4xx=${tot4xx} 5xx=${tot5xx} errors=${totErr}`);
  }

  // 3. GetUrlInfo por URL prioritaria
  console.log('→ GetUrlInfo (14 URLs)');
  const urlInfos = [];
  for (const u of PRIORITY_URLS) {
    const info = await getJson('GetUrlInfo', {
      siteUrl: SITE_URL_RAW,
      url: JSON.stringify(u), // Bing requiere el valor entre comillas
    });
    const d = info.d || {};
    const crawled = decodeBingDate(d.LastCrawledDate);
    urlInfos.push({ url: u, isPage: d.IsPage, lastCrawled: crawled, httpStatus: d.HttpStatus });
    console.log(`   ${crawled ? '✓' : '✗'} ${u}`);
  }
  out.sections.urlInspection = urlInfos;

  // 4. GetLinkCounts (backlinks)
  console.log('→ GetLinkCounts');
  const links = await getJson('GetLinkCounts', { siteUrl: SITE_URL_RAW });
  out.sections.backlinks = links;
  if (links.d) {
    console.log(`   totalPages=${links.d.TotalPages} links=${(links.d.Links || []).length}`);
  }

  // 5. GetQueryStats (probablemente vacío)
  console.log('→ GetQueryStats');
  const queries = await getJson('GetQueryStats', { siteUrl: SITE_URL_RAW });
  out.sections.queryStats = queries;
  console.log(`   ${(queries.d || []).length} queries`);

  // Guardar
  const outPath = path.join(ROOT, 'scripts', '.bing-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\n✓ Salida guardada en ${path.relative(ROOT, outPath)}`);
}

main().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});
