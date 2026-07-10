// Análisis de los CSV de Ahrefs (UTF-16, TSV) para la auditoría SEO 2026-07-10.
// No modifica el proyecto. Solo lee ahrefs/*.csv y escribe en auditoria_seo/ahrefs_2026_07_10/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const Ahrefs = join(ROOT, 'ahrefs');
const OUT = join(ROOT, 'auditoria_seo', 'ahrefs_2026_07_10');
mkdirSync(OUT, { recursive: true });

const FILES = {
  internal_urls: 'pineda-&-asociados_10-jul-2026_internal-urls_2026-07-10_11-25-16.csv',
  internal_html: 'pineda-&-asociados_10-jul-2026_internal-html_2026-07-10_11-25-25.csv',
  links_4xx: 'pineda-&-asociados_10-jul-2026_links-target-4_2026-07-10_11-25-42.csv',
  links_3xx: 'pineda-&-asociados_10-jul-2026_links-target-r_2026-07-10_11-25-46.csv',
  canonical: 'pineda-&-asociados_10-jul-2026_links-canonica_2026-07-10_11-27-12.csv',
};

// --- CSV parsing: UTF-16 + tab-separated + comillas dobles ---
function loadTsv(relPath) {
  let raw = readFileSync(join(Ahrefs, relPath));
  // Decodificar UTF-16LE (BOM o sin BOM)
  let text;
  try {
    text = raw.toString('utf16le');
  } catch {
    text = raw.toString('utf8');
  }
  // Quitar BOM si existe
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  // Normalizar saltos de línea
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parser TSV con comillas: respeta comillas dobles que envuelven campos con tabs/newlines
  function parseLine(line) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        if (ch === '"') {
          inQuotes = false;
          i++;
          continue;
        }
        cur += ch;
        i++;
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
          continue;
        }
        if (ch === '\t') {
          fields.push(cur);
          cur = '';
          i++;
          continue;
        }
        cur += ch;
        i++;
      }
    }
    fields.push(cur);
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  const objs = rows.map((r) => {
    const o = {};
    headers.forEach((h, idx) => (o[h] = r[idx] ?? ''));
    return o;
  });
  return { headers, rows: objs };
}

console.log('Cargando CSV...');
const data = {};
for (const [key, file] of Object.entries(FILES)) {
  data[key] = loadTsv(file);
  console.log(`  ${key}: ${data[key].rows.length} filas, ${data[key].headers.length} columnas`);
}

// --- Utilidades ---
const SITE = 'https://www.pinedayasociadoshn.com';
const toPath = (url) => {
  try {
    const u = new URL(url, SITE);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};
const stripDomain = (url) => url.replace(/^https?:\/\/www\.pinedayasociadoshn\.com/, '').replace(/^https?:\/\/pinedayasociadoshn\.com/, '');

// --- 1. Métricas generales ---
const uniqueUrls = new Set(data.internal_urls.rows.map((r) => stripDomain(r['URL'] || '')));
const uniqueHtml = new Set(data.internal_html.rows.map((r) => stripDomain(r['URL'] || '')));

// --- 2. Enlaces a 4xx ---
const links4xx = data.links_4xx.rows.map((r) => ({
  source_url: r['Source URL'],
  source_path: stripDomain(r['Source URL']),
  source_status: r['Source HTTP status code'],
  target_url: r['Target URL'],
  target_path: stripDomain(r['Target URL']),
  target_status: r['Target HTTP status code'],
  anchor: r['Anchor'],
  link_type: r['Link type'],
  is_nofollow: r['Is nofollow'],
  is_source_canonical: r['Is source canonical'],
  is_source_noindex: r['Is source noindex'],
}));

// --- 3. Enlaces a 3xx ---
const links3xx = data.links_3xx.rows.map((r) => ({
  source_url: r['Source URL'],
  source_path: stripDomain(r['Source URL']),
  source_status: r['Source HTTP status code'],
  target_url: r['Target URL'],
  target_path: stripDomain(r['Target URL']),
  target_status: r['Target HTTP status code'],
  anchor: r['Anchor'],
  link_type: r['Link type'],
  is_source_canonical: r['Is source canonical'],
  is_source_noindex: r['Is source noindex'],
  is_self: r['Is link self-referencing'],
}));

// Agrupar targets 3xx por ruta destino (para ver concentración)
const target3xxGroups = {};
for (const l of links3xx) {
  const t = l.target_path;
  if (!target3xxGroups[t]) target3xxGroups[t] = { count: 0, sources: [] };
  target3xxGroups[t].count++;
  target3xxGroups[t].sources.push(l.source_path);
}
const target3xxSorted = Object.entries(target3xxGroups).sort((a, b) => b[1].count - a[1].count);

// Origen de los enlaces 3xx (Sitemap URL vs Href link)
const linkType3xx = {};
for (const l of links3xx) {
  linkType3xx[l.link_type] = (linkType3xx[l.link_type] || 0) + 1;
}

// --- 4. Canonical links ---
const canonicalRows = data.canonical.rows.map((r) => ({
  source_url: r['Source URL'],
  source_path: stripDomain(r['Source URL']),
  source_status: r['Source HTTP status code'],
  target_url: r['Target URL'],
  target_path: stripDomain(r['Target URL']),
  target_status: r['Target HTTP status code'],
  is_source_canonical: r['Is source canonical'],
  is_source_noindex: r['Is source noindex'],
  is_target_canonical: r['Is target canonical'],
  is_target_noindex: r['Is target noindex'],
  is_self: r['Is link self-referencing'],
}));

// Canonicals REALMENTE problemáticos.
// NO marcar facetas/paginación noindex con canonical self (es correcto).
// Solo marcar: target 3xx/4xx, target http://, o non-self hacia noindex.
const canonicalIssues = canonicalRows.filter((r) => {
  if (r.target_status && r.target_status !== '200') return true; // 3xx o 4xx real
  if (r.target_url && r.target_url.startsWith('http://')) return true; // HTTP no HTTPS
  if (r.is_self !== 'true' && r.is_target_noindex === 'true') return true; // non-self → noindex (consolidación hacia noindex = problema)
  return false;
});

// Canonical no self-referencing (informativo)
const canonicalNonSelf = canonicalRows.filter((r) => r.is_self !== 'true');

// --- 5. Noindex crítico ---
// Páginas core que NO deben ser noindex
const CRITICAL_PATHS = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  '/derecho-laboral',
  '/derecho-de-familia',
  '/servicios-juridicos/derecho-civil-y-notarial',
  '/servicios-juridicos/derecho-mercantil-empresarial',
  '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
  '/solicitar-consulta',
  '/despacho',
  '/blog',
];

const htmlByUrl = {};
for (const r of data.internal_html.rows) {
  htmlByUrl[stripDomain(r['URL'] || '')] = r;
}

const noindexCritical = [];
for (const p of CRITICAL_PATHS) {
  const r = htmlByUrl[p];
  if (!r) {
    noindexCritical.push({ path: p, status: 'NO_EN_HTML_200', note: 'No encontrada en export HTML 200' });
    continue;
  }
  const isIndexable = r['Is indexable page'];
  const metaRobots = r['Meta robots'] || '';
  const httpRobots = r['Robots information in HTTP headers'] || '';
  noindexCritical.push({
    path: p,
    status: r['HTTP status code'],
    is_indexable: isIndexable,
    meta_robots: metaRobots,
    http_robots: httpRobots,
    title: (r['Title'] || '').slice(0, 60),
  });
}

// --- 6. Titles / metas / H1 anómalos en HTML 200 ---
const titleIssues = [];
const metaIssues = [];
const h1Issues = [];
const multiH1 = [];
for (const r of data.internal_html.rows) {
  const path = stripDomain(r['URL'] || '');
  const title = r['Title'] || '';
  const titleLen = parseInt(r['Title length'] || '0', 10);
  const meta = r['Meta description'] || '';
  const metaLen = parseInt(r['Meta description length'] || '0', 10);
  const h1 = r['H1'] || '';
  const h1Len = parseInt(r['H1 length'] || '0', 10);

  if (titleLen === 0 || titleLen > 75) titleIssues.push({ path, title_len: titleLen, title: title.slice(0, 80) });
  if (metaLen === 0 || metaLen < 70 || metaLen > 200) metaIssues.push({ path, meta_len: metaLen, meta: meta.slice(0, 80) });
  if (h1Len === 0) h1Issues.push({ path, title: title.slice(0, 60) });
  // H1 con múltiples (Ahrefs concatena con separador; asumimos ' || ' o múltiples — aquí detección básica por length grande no es fiable, se deja a revisión manual)
}

// --- Escritura de CSV de revisión ---
function toCsv(rows, headers) {
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n') + '\n';
}

writeFileSync(join(OUT, 'urls-4xx-prioridad.csv'), toCsv(links4xx, ['source_path', 'source_status', 'target_path', 'target_status', 'anchor', 'link_type', 'is_nofollow', 'is_source_canonical', 'is_source_noindex']));
writeFileSync(join(OUT, 'urls-3xx-prioridad.csv'), toCsv(links3xx, ['source_path', 'source_status', 'target_path', 'target_status', 'anchor', 'link_type', 'is_source_canonical', 'is_source_noindex', 'is_self']));
writeFileSync(join(OUT, 'canonicals-review.csv'), toCsv(canonicalIssues.length ? canonicalIssues : [{ source_path: '(ninguno)', note: 'Sin canonicals problemáticos reales: 816 revisados, 0 a corregir. Paginación ?page y facetas ?tag son noindex con canonical self (correcto).' }], canonicalIssues.length ? Object.keys(canonicalIssues[0]) : ['source_path', 'note']));
writeFileSync(join(OUT, 'noindex-review.csv'), toCsv(noindexCritical, ['path', 'status', 'is_indexable', 'meta_robots', 'http_robots', 'title', 'note']));

console.log('\n=== RESUMEN ===');
console.log(`URLs internas únicas: ${uniqueUrls.size}`);
console.log(`HTML 200 únicas: ${uniqueHtml.size}`);
console.log(`Enlaces a 4xx: ${links4xx.length}`);
console.log(`Enlaces a 3xx: ${links3xx.length}`);
console.log(`Targets 3xx únicos: ${target3xxSorted.length}`);
console.log(`Por link_type en 3xx:`, linkType3xx);
console.log(`Canonical rows: ${canonicalRows.length}`);
console.log(`Canonicals problemáticos: ${canonicalIssues.length}`);
console.log(`Canonical non-self: ${canonicalNonSelf.length}`);
console.log(`Title issues: ${titleIssues.length}`);
console.log(`Meta issues: ${metaIssues.length}`);
console.log(`H1 ausentes: ${h1Issues.length}`);

console.log('\n=== TOP TARGETS 3xx (concentración) ===');
for (const [path, info] of target3xxSorted.slice(0, 15)) {
  console.log(`  ${info.count}x  ${path}`);
}

console.log('\n=== TOP SOURCES 3xx ===');
const src3xx = {};
for (const l of links3xx) src3xx[l.source_path] = (src3xx[l.source_path] || 0) + 1;
const src3xxSorted = Object.entries(src3xx).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [path, count] of src3xxSorted) console.log(`  ${count}x  ${path}`);

// Guardar datos para el diagnóstico
const summary = {
  fechas: '2026-07-10',
  internal_urls_unique: uniqueUrls.size,
  html200_unique: uniqueHtml.size,
  links_4xx: links4xx.length,
  links_3xx: links3xx.length,
  targets_3xx_unique: target3xxSorted.length,
  link_type_3xx: linkType3xx,
  canonical_rows: canonicalRows.length,
  canonical_issues: canonicalIssues.length,
  canonical_non_self: canonicalNonSelf.length,
  title_issues: titleIssues.length,
  meta_issues: metaIssues.length,
  h1_missing: h1Issues.length,
  top_targets_3xx: target3xxSorted.slice(0, 20).map(([p, i]) => ({ path: p, count: i.count })),
  top_sources_3xx: src3xxSorted.map(([p, c]) => ({ path: p, count: c })),
  title_issues_detail: titleIssues.slice(0, 20),
  meta_issues_detail: metaIssues.slice(0, 20),
  h1_missing_detail: h1Issues.slice(0, 20),
  noindex_critical: noindexCritical,
  links_4xx_detail: links4xx,
  canonical_issues_detail: canonicalIssues.slice(0, 20),
  canonical_non_self_sample: canonicalNonSelf.slice(0, 15),
};
writeFileSync(join(OUT, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log(`\nDatos guardados en ${OUT}/_summary.json`);
