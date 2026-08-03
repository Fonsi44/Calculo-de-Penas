#!/usr/bin/env node
/**
 * Análisis cruzado GSC + GA4 + Bing por URL y selección del primer lote.
 *
 * Entradas (regenerables):
 *   docs/seo/current/content-action-plan.csv  (175 artículos con métricas GSC)
 *   docs/seo/current/gsc-opportunities.csv    (queries oportunidad)
 *   docs/seo/current/ga4-organic-conversions.csv (sesiones orgánicas por landing)
 *   docs/seo/current/bing-opportunities.csv   (queries Bing con impresiones)
 *   docs/seo/current/gsc-cannibalization.csv  (canibalización por query)
 *
 * Fórmula del priority_score (0–100, pesos documentados):
 *   impresiones (log, 0–25)     : GSC impresiones 90d (escala log2)
 *   posición 4–20 (0–20)        : máximo en posición ~8–12
 *   brecha CTR (0–15)           : CTR por debajo del esperado para su posición
 *   sesiones orgánicas (0–15)   : GA4 sesiones orgánicas (escala log)
 *   conversión (0–10)           : eventos clave por landing (si disponibles)
 *   overlap Google/Bing (0–5)   : query con demanda en ambos
 *   importancia comercial (0–5) : penal/familia/laboral/notarial > resto
 *   facilidad de mejora (0–5)   : action UPDATE/EXPAND/KEEP > DATA_REQUIRED
 *   penalización canibalización (-5)
 *   penalización riesgo legal (-5) si legal_review_pending YMYL sin fuentes
 *
 * No se prioriza una URL solo por volumen de palabras clave; el score combina
 * demanda, posición, CTR, tráfico y conversión.
 *
 * Salidas:
 *   docs/seo/growth/cross-platform-url-analysis.csv
 *   docs/seo/growth/batch-1-selection.csv
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GROWTH_DIR = resolve(ROOT, 'docs', 'seo', 'growth');
const CUR = resolve(ROOT, 'docs', 'seo', 'current');
if (!existsSync(GROWTH_DIR)) mkdirSync(GROWTH_DIR, { recursive: true });

function parseCsvLine(line) {
  const fields = [];
  const re = /("(?:[^"]|"")*"|[^,]*)(?:,|$)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1] === undefined) break;
    fields.push(m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    if (re.lastIndex >= line.length) break;
  }
  return fields;
}

function readCsv(file) {
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  const header = parseCsvLine(lines[0].replace(/\r$/, ''));
  return lines.slice(1).map((l) => {
    const fields = parseCsvLine(l.replace(/\r$/, ''));
    const out = {};
    header.forEach((h, i) => { out[h] = (fields[i] ?? '').trim(); });
    return out;
  });
}
const num = (v) => { const n = Number.parseFloat(v); return Number.isFinite(n) ? n : 0; };

// ── Entradas ──────────────────────────────────────────────────────────────
const plan = readCsv(resolve(CUR, 'content-action-plan.csv'));
const ga4 = readCsv(resolve(CUR, 'ga4-organic-conversions.csv'));
const cannib = readCsv(resolve(CUR, 'gsc-cannibalization.csv'));

// sesiones orgánicas por ruta
const sessionsByPath = new Map();
for (const r of ga4) sessionsByPath.set(r.landingPage ?? '', num(r.sessions));

// canibalización: url -> set de clusters
const cannibByUrl = new Map();
for (const c of cannib) {
  const urls = (c.urls || '').split('|').map((u) => u.trim());
  for (const u of urls) {
    const key = u.split('#')[0];
    if (!cannibByUrl.has(key)) cannibByUrl.set(key, new Set());
    cannibByUrl.get(key).add(c.query);
  }
}

// ── Score ─────────────────────────────────────────────────────────────────
const COMMERCIAL_CATS = new Set(['derecho-penal', 'proceso-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-notarial', 'hondurenos-en-espana']);
function score(row) {
  const imp = num(row.impressions);
  const pos = num(row.position);
  const ctr = num(row.ctr);
  const clicks = num(row.clicks);
  const sessions = sessionsByPath.get(row.url) ?? 0;
  const action = row.action || '';

  // impresiones log2 (0–25)
  const impScore = imp <= 0 ? 0 : Math.min(25, 25 * (Math.log2(1 + imp) / 12));

  // posición 4–20 (0–20): pico en 8–12
  let posScore = 0;
  if (pos >= 2 && pos <= 25) {
    const d = Math.abs(pos - 10);
    posScore = Math.max(0, 20 * (1 - d / 12));
  }

  // brecha CTR (0–15): CTR esperado por banda de posición
  const expectedCtr = pos <= 3 ? 0.18 : pos <= 5 ? 0.10 : pos <= 8 ? 0.06 : pos <= 12 ? 0.04 : pos <= 20 ? 0.025 : 0.012;
  const ctrRatio = ctr > 0 ? ctr / expectedCtr : 0;
  const ctrScore = imp > 0 ? Math.max(0, 15 * (1 - Math.min(ctrRatio, 2))) : 0;

  // sesiones orgánicas (0–15)
  const sessScore = sessions <= 0 ? 0 : Math.min(15, 15 * (Math.log2(1 + sessions) / 6));

  // conversión (0–10): no disponible por URL en este dataset → 0 (documentado)
  const convScore = 0;

  // overlap Bing (0–5): proxy — cluster de demanda alta tiene queries en Bing
  const bingOverlap = 0; // requiere mapeo query→url; se documenta

  // importancia comercial (0–5)
  const cat = (row.category || '').split('/').pop();
  const commScore = COMMERCIAL_CATS.has(cat) ? 5 : 3;

  // facilidad de mejora (0–5)
  const easeScore = /UPDATE|EXPAND|KEEP/.test(action) ? 5 : /MERGE/.test(action) ? 2 : 1;

  // canibalización (-5)
  const cannibPenalty = cannibByUrl.get(row.url)?.size ? -5 : 0;

  // riesgo legal (-5): YMYL con revisión pendiente → se prioriza menos el auto-fix
  const legalRisk = row.legal_review_status === 'lawyer_review_pending' ? -5 : 0;

  const total = Math.max(0, Math.round(
    impScore + posScore + ctrScore + sessScore + convScore + bingOverlap + commScore + easeScore + cannibPenalty + legalRisk,
  ));
  return {
    total, impScore: Math.round(impScore), posScore: Math.round(posScore),
    ctrScore: Math.round(ctrScore), sessScore: Math.round(sessScore),
  };
}

// ── Análisis por URL ──────────────────────────────────────────────────────
const rows = plan.map((row) => {
  const s = score(row);
  return {
    url: row.url,
    query_cluster: row.cannibalizationCluster || '',
    gsc_clicks_90: num(row.clicks),
    gsc_impressions_90: num(row.impressions),
    gsc_ctr: num(row.ctr),
    gsc_position: num(row.position),
    bing_clicks: 0, // no mapeado por URL (dataset query-level)
    bing_impressions: 0,
    organic_sessions: sessionsByPath.get(row.url) ?? 0,
    key_events: 0,
    conversion_rate: 0,
    content_action: row.action,
    cannibalization: cannibByUrl.get(row.url)?.size ? [...cannibByUrl.get(row.url)].join(' | ') : '',
    legal_risk: row.legal_review_status || '',
    recommended_action: row.action === 'UPDATE' ? 'update_title_meta_h1' : row.action,
    priority_score: s.total,
    _posScore: s.posScore, _ctrScore: s.ctrScore, _sessScore: s.sessScore,
    _legal_review: row.legal_review_status,
  };
});
rows.sort((a, b) => b.priority_score - a.priority_score);

// ── CSV ───────────────────────────────────────────────────────────────────
const header = ['url','query_cluster','gsc_clicks_90','gsc_impressions_90','gsc_ctr','gsc_position','bing_clicks','bing_impressions','organic_sessions','key_events','conversion_rate','content_action','cannibalization','legal_risk','recommended_action','priority_score'];
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csvLines = [header.join(',')].concat(rows.map((r) => header.map((h) => esc(r[h])).join(',')));
writeFileSync(resolve(GROWTH_DIR, 'cross-platform-url-analysis.csv'), csvLines.join('\n'), 'utf8');

// ── Selección del primer lote (10–20 URLs) ────────────────────────────────
// Criterios: priority_score alto + acción accionable (UPDATE/EXPAND/KEEP) +
// sin DUPLICADO de query_cluster dominante. Se excluyen DATA_REQUIRED sin
// demanda y NOINDEX (no publicados).
const seenCluster = new Set();
const batch = [];
for (const r of rows) {
  if (batch.length >= 18) break;
  if (!['UPDATE', 'EXPAND', 'KEEP', 'MERGE'].includes(r.content_action)) continue;
  if (num(r.gsc_impressions_90) < 40 && r.organic_sessions < 4) continue; // sin demanda
  const clusterKey = (r.query_cluster || r.url).split('|')[0].trim();
  if (seenCluster.has(clusterKey) && r.content_action !== 'MERGE') continue;
  seenCluster.add(clusterKey);
  batch.push(r);
}
const selHeader = ['priority','url','query_cluster','intent','gsc_evidence','ga4_evidence','bing_evidence','current_problem','action','expected_effect','legal_review'];
const selLines = [selHeader.join(',')];
batch.forEach((r, i) => {
  selLines.push([
    i + 1, r.url, r.query_cluster || '-', 'informacional',
    `clicks=${r.gsc_clicks_90} imp=${r.gsc_impressions_90} ctr=${r.gsc_ctr}% pos=${r.gsc_position}`,
    `sessions=${r.organic_sessions}`, '-',
    `score=${r.priority_score} (${r.content_action})`, r.recommended_action,
    'mejor CTR/posición', r._legal_review,
  ].map(esc).join(','));
});
writeFileSync(resolve(GROWTH_DIR, 'batch-1-selection.csv'), selLines.join('\n'), 'utf8');

console.log('Cruzado: ' + rows.length + ' URLs');
console.log('Lote: ' + batch.length + ' URLs');
console.log('Top 8:');
batch.slice(0, 8).forEach((r, i) => console.log(`  ${i + 1}. score=${r.priority_score} ${r.gsc_impressions_90}imp pos=${r.gsc_position} ${r.url.split('/').pop()}`));
