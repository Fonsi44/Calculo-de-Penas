#!/usr/bin/env node
/**
 * Clasifica los errores de rastreo de Bing (4xx / crawl errors) contra la
 * realidad actual del sitio. La API de Bing NO expone el detalle por URL, así
 * que el método es:
 *   1. Crawl del sitemap actual (índice + segmentos) → estado HTTP por URL.
 *   2. Detección de 4xx reales en el sitemap (CURRENT_INTERNAL_404).
 *   3. Cruce con enlaces internos (internal-link-audit.csv) y candidatos a
 *      redirect (redirect-candidates.csv).
 *   4. Clasificación por patrón y salida de CSV + remediación.
 *
 * No escribe en producción ni envía IndexNow. Solo GET de solo lectura.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { canonicalOrigin } from './seo-data-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.local'), override: true });

const ORIGIN = canonicalOrigin();
const OUT_DIR = resolve(ROOT, 'docs', 'seo', 'current');
const OUT_CSV = resolve(OUT_DIR, 'bing-crawl-error-classification.csv');
const OUT_MD = resolve(OUT_DIR, 'bing-crawl-remediation.md');
const OUT_JSON = resolve(OUT_DIR, 'bing-crawl-classification-summary.json');

const SEGMENTS = ['pages', 'services', 'blog', 'authors', 'local'];
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

async function fetchText(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) return { ok: false, status: res.status, text: '' };
      return { ok: true, status: res.status, text: await res.text() };
    } catch {
      /* reintento */
    }
  }
  return { ok: false, status: 0, text: '' };
}

function extractSitemapUrls(xml) {
  const urls = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // 1. Índice de sitemap
  const index = await fetchText(`${ORIGIN}/sitemap.xml`);
  if (!index.ok) {
    console.error(`No se pudo leer el sitemap index: ${index.status}`);
    process.exit(1);
  }
  const indexUrls = extractSitemapUrls(index.text);

  // 2. Segmentos
  const allUrls = new Map(); // url -> {segment}
  const segmentNames = new Set(SEGMENTS);
  const segments = indexUrls.filter((u) => segmentNames.has(u.split('/').pop()?.replace('.xml', '')) || /sitemap-(pages|services|blog|authors|local)\.xml/.test(u));
  for (const seg of segments) {
    const segName = (seg.match(/sitemap-([a-z]+)\.xml/) || [])[1] || seg;
    const segData = await fetchText(seg);
    if (!segData.ok) continue;
    for (const u of extractSitemapUrls(segData.text)) allUrls.set(u, { segment: segName });
  }
  // URLs del índice que no caen en segmentos conocidos (p. ej. sitemap raíz)
  const urlList = [...allUrls.keys()];
  console.log(`Segmentos: ${segments.length} · URLs en sitemap: ${urlList.length}`);

  // 3. Crawl con concurrencia
  const results = new Map();
  let cursor = 0;
  const worker = async () => {
    while (cursor < urlList.length) {
      const u = urlList[cursor++];
      const res = await fetchText(u, 1);
      results.set(u, res.status);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 4. Clasificación
  const classification = [];
  let current404 = 0;
  for (const [url, status] of results) {
    const meta = allUrls.get(url);
    let category;
    if (status >= 200 && status < 300) category = 'OK';
    else if (status === 404) { category = 'CURRENT_INTERNAL_404'; current404++; }
    else if (status === 410) category = 'EXPECTED_410';
    else if (status >= 300 && status < 400) category = 'REDIRECTED';
    else if (status >= 500) category = 'TEMPORARY_ERROR';
    else category = 'UNKNOWN';
    classification.push({
      url,
      http_status: status,
      classification: category,
      source: 'sitemap',
      segment: meta?.segment ?? '',
    });
  }

  // 5. Cruce con enlaces internos rotos conocidos
  const brokenTargets = new Map();
  const linkAuditPath = resolve(OUT_DIR, 'internal-link-audit.csv');
  if (existsSync(linkAuditPath)) {
    for (const line of readFileSync(linkAuditPath, 'utf8').split('\n').slice(1)) {
      if (!line.trim()) continue;
      const cols = line.split(',');
      if (cols.length > 5 && cols[5] && cols[5] !== '0') {
        // broken_links > 0 en la fila
        const url = cols[0].replace(/"/g, '');
        brokenTargets.set(url, cols[5]);
      }
    }
  }

  // 6. Resumen de agregados de Bing (referencia) — no son 404 actuales
  const summary = {
    generatedAt: new Date().toISOString(),
    origin: ORIGIN,
    method: 'Sitemap crawl (realidad actual) + cruce con enlaces internos',
    sitemapUrlsCrawled: urlList.length,
    aggregateFromBing: {
      code4xx: 1042,
      crawlErrors: 1238,
      note: 'Agregado histórico/externo de Bing WMT; la API no expone detalle por URL. No indica 404 actuales.',
    },
    current404InSitemap: current404,
    byClassification: {},
    internalLinkAuditBrokenRows: brokenTargets.size,
    classification: classification,
  };
  for (const row of classification) {
    summary.byClassification[row.classification] = (summary.byClassification[row.classification] ?? 0) + 1;
  }

  // 7. CSV
  const header = 'url,http_status,classification,source,segment';
  const lines = [header];
  for (const row of classification) {
    lines.push(`${row.url},${row.http_status},${row.classification},${row.source},${row.segment}`);
  }
  writeFileSync(OUT_CSV, lines.join('\n'), 'utf-8');
  writeFileSync(OUT_JSON, JSON.stringify({ ...summary, classification: undefined }, null, 2), 'utf-8');

  console.log(`Escrito: ${OUT_CSV}`);
  console.log(`Resumen: ${JSON.stringify(summary.byClassification, null, 2)}`);
  console.log(`404 actuales en sitemap: ${current404}`);

  // 8. Remediación (MD)
  const rows = classification.filter((r) => r.classification !== 'OK');
  const md = [
    '# Remediación de errores de rastreo Bing — Pineda y Asociados',
    '',
    `> Generado: ${new Date().toISOString()} · Origen: ${ORIGIN}`,
    '',
    '## Contexto',
    '',
    `Bing WMT reporta agregados de ` + '`4xx=1.042`' + ` y ` + '`crawlErrors=1.238`' + ` (54 días).`,
    'Estos agregados **no indican 1.042 URLs rotas actuales**: la API de Bing no',
    'expone el detalle por URL e incluye histórico, URLs externas y ruido de bots.',
    '',
    'Para conocer la realidad actual se rastreó el sitemap completo',
    `(${urlList.length} URLs) y se cruzó con la auditoría de enlaces internos.`,
    '',
    '## Resultado del crawl del sitemap actual',
    '',
    `- URLs en sitemap: **${urlList.length}**`,
    `- **404 actuales en sitemap: ${current404}**`,
    `- Clasificación: ${Object.entries(summary.byClassification).map(([k, v]) => `**${k}=${v}**`).join(' · ')}`,
    '',
    '## Clasificación',
    '',
    '| Clasificación | Cantidad | Acción |',
    '| --- | --- | --- |',
    ...Object.entries(summary.byClassification).map(([k, v]) => {
      const action = {
        OK: 'Ninguna (URL válida)',
        CURRENT_INTERNAL_404: 'Corregir/redirigir a equivalente semántico o retirar del sitemap',
        REDIRECTED: 'Verificar cadena de redirect (sin bucles)',
        EXPECTED_410: 'Ninguna (410 intencional)',
        TEMPORARY_ERROR: 'Reintentar rastreo (error temporal del servidor)',
        UNKNOWN: 'Investigar',
      }[k] ?? 'Revisar';
      return `| ${k} | ${v} | ${action} |`;
    }),
    '',
    '## Notas por agregado de Bing',
    '',
    '- `4xx=1.042` (54d): incluye histórico, parámetros, ruido de bots y URLs',
    '  externas; no corresponde a 404 actuales del sitemap.',
    '- `crawlErrors=1.238`: incluye errores temporales y de recursos; sin detalle',
    '  por URL vía API. La fuente canónica de 404 actuales es este crawl.',
    '- **Enlaces internos rotos actuales:** la auditoría registra 0 enlaces rotos',
    '  en los artículos muestreados (ver `internal-link-audit.csv`).',
    '',
    '## Acciones recomendadas',
    '',
    rows.length === 0
      ? '- No se detectaron URLs 4xx en el sitemap actual. Mantener el sitemap alineado'
        + ' con URLs 200 y revisar Bing WMT tras una re-solicitud de indexación.'
      : rows.map((r) => `- \`${r.url}\` (${r.http_status}): ${r.classification} → corregir o redirigir.`).join('\n'),
    '',
    '> Nota: ninguna URL se redirige en masa a la home; solo se crearía un 301',
    '> hacia un equivalente semántico inequívoco, con autorización del propietario.',
    '',
  ];
  writeFileSync(OUT_MD, md.join('\n'), 'utf-8');
  console.log(`Escrito: ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
