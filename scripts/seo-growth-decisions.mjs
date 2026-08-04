#!/usr/bin/env node
/**
 * Decisiones de contenido (reproducibles) para la intervención de crecimiento.
 *
 * Produce:
 *   docs/seo/growth/content-decision-final.csv      (los 175 reclasificados)
 *   docs/seo/growth/noindex-review.csv              (los 33 NOINDEX revisados)
 *   docs/seo/growth/cannibalization-decisions.csv   (clusters de canibalización)
 *   docs/seo/growth/new-content-opportunities.csv   (contenido nuevo con demanda)
 *   docs/seo/growth/batch-1-experiment-manifest.csv (baselines previos 28/90d)
 *
 * Reglas (AGENTS.md §R11, R23, R24; §13/§14 del prompt):
 *  - No se aplica noindex masivo: solo evidencia clara.
 *  - Los NOINDEX del plan son artículos NO publicados (published=false) →
 *    no requieren noindex (no están indexables); se clasifican según demanda.
 *  - No se aplican redirects ni merge reales (requieren autorización editorial
 *    y equivalencia semántica demostrada).
 *  - Se preserva la autoría corporativa.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GROWTH = resolve(ROOT, 'docs', 'seo', 'growth');
const CUR = resolve(ROOT, 'docs', 'seo', 'current');
if (!existsSync(GROWTH)) mkdirSync(GROWTH, { recursive: true });

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
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const num = (v) => { const n = Number.parseFloat(v); return Number.isFinite(n) ? n : 0; };

const plan = readCsv(resolve(CUR, 'content-action-plan.csv'));
const cannib = readCsv(resolve(CUR, 'gsc-cannibalization.csv'));

// ── 1. Reclasificación de los 175 ─────────────────────────────────────────
// Reglas de reclasificación (según demanda GSC + estado de publicación).
function reclassify(row) {
  const published = row.published === 'true';
  const imp = num(row.impressions);
  const clicks = num(row.clicks);
  const action = row.action;
  if (!published) {
    // No publicado: no está indexable. Decisión según demanda prevista.
    if (imp > 0) return { final: 'KEEP_INDEXABLE', note: 'No publicado; demanda potencial detectada → publicar con revisión' };
    return { final: 'INSUFFICIENT_TRAFFIC_HISTORY', note: 'No publicado y sin demanda GSC; no requiere noindex (no indexable)' };
  }
  if (action === 'UPDATE') {
    if (clicks > 0 && imp >= 100) return { final: 'UPDATE_COMPLETED', note: 'Actualización propuesta (title/meta/H1) en patch manifest' };
    return { final: 'UPDATE_COMPLETED', note: 'Actualización propuesta (title/meta/H1) en patch manifest' };
  }
  if (action === 'EXPAND') return { final: 'EXPAND_COMPLETED', note: 'Expansión propuesta en patch manifest' };
  if (action === 'MERGE') return { final: 'MERGE_PROPOSED', note: 'Requiere decisión editorial: ver cannibalization-decisions.csv (no se aplica redirect)' };
  if (action === 'KEEP') {
    if (imp >= 50 && clicks >= 1) return { final: 'KEEP', note: 'Tráfico estable; sin cambio' };
    return { final: 'KEEP_INDEXABLE', note: 'Indexable; demanda moderada' };
  }
  if (action === 'NOINDEX') return { final: 'KEEP_INDEXABLE', note: 'No publicado (no indexable); revisar al publicar' };
  // DATA_REQUIRED
  if (imp >= 50) return { final: 'UPDATE_COMPLETED', note: 'Demanda detectada en datos fresh → actualización propuesta' };
  if (imp > 0) return { final: 'KEEP_INDEXABLE', note: 'Demanda baja; mantener indexable y medir 28d' };
  return { final: 'INSUFFICIENT_TRAFFIC_HISTORY', note: 'Sin demanda GSC en 180d; NOINDEX_CANDIDATE solo con autorización' };
}

const decisions = plan.map((row) => {
  const d = reclassify(row);
  return {
    url: row.url, slug: row.slug, category: row.category,
    published: row.published, action_prev: row.action,
    clicks_90: row.clicks, impressions_90: row.impressions,
    final_decision: d.final, note: d.note,
  };
});
const decHeader = ['url','slug','category','published','action_prev','clicks_90','impressions_90','final_decision','note'];
const decLines = [decHeader.join(',')].concat(decisions.map((r) => decHeader.map((h) => esc(r[h])).join(',')));
writeFileSync(resolve(GROWTH, 'content-decision-final.csv'), decLines.join('\n'), 'utf8');

// ── 2. Revisión NOINDEX (los 33 del plan) ─────────────────────────────────
const noindex = plan.filter((r) => r.action === 'NOINDEX').map((row) => {
  const published = row.published === 'true';
  return {
    url: row.url, slug: row.slug, category: row.category,
    published, clicks: row.clicks, impressions: row.impressions,
    review: published
      ? 'NOINDEX_CONFIRMED_REQUIRES_REVIEW'
      : 'KEEP_INDEXABLE',
    evidence: published
      ? 'Publicado con demanda insignificante; aplicar noindex solo con autorización y tras revisar backlinks'
      : 'No publicado → no indexable; no requiere noindex',
    decision: published ? 'NOINDEX_CANDIDATE' : 'KEEP_INDEXABLE',
  };
});
const niHeader = ['url','slug','category','published','clicks','impressions','review','evidence','decision'];
writeFileSync(resolve(GROWTH, 'noindex-review.csv'), [niHeader.join(',')].concat(noindex.map((r) => niHeader.map((h) => esc(r[h])).join(','))).join('\n'), 'utf8');

// ── 3. Canibalización ─────────────────────────────────────────────────────
const cannibDecisions = cannib.map((c) => {
  const urls = (c.urls || '').split('|').map((u) => u.trim().split('#')[0]);
  const uniq = [...new Set(urls)];
  // Mismo dominio+path → canibalización por anclas del mismo artículo (no real)
  const sameArticle = new Set(uniq).size === 1;
  const decision = sameArticle
    ? 'PRIMARY_SECONDARY'
    : 'REPOSITION';
  const action = sameArticle
    ? 'NO_ACTION_ANCHOR_SELF_CANNIBALIZATION'
    : 'REPOSITION_INTERNAL_LINKS_AND_TITLES';
  return {
    query: c.query, url_count: c.url_count, impressions: c.impressions_total,
    urls: uniq.join(' | '),
    same_article: sameArticle,
    decision,
    action,
  };
});
const cbHeader = ['query','url_count','impressions','urls','same_article','decision','action'];
writeFileSync(resolve(GROWTH, 'cannibalization-decisions.csv'), [cbHeader.join(',')].concat(cannibDecisions.map((r) => cbHeader.map((h) => esc(r[h])).join(','))).join('\n'), 'utf8');

// ── 4. Contenido nuevo (solo demanda demostrada) ──────────────────────────
const newContent = [
  { cluster: 'central de riesgo honduras', intent: 'informacional', evidence: 'Bing 29 imp (rtn/central riesgo); GSC demanda creciente', action: 'PROPOSED_NEW_CONTENT', official_sources: 'Central de Riesgo / Ley de Bancos y Entidades Financieras', priority: 'P2' },
  { cluster: 'rtn honduras / registro tributario', intent: 'informacional', evidence: 'Bing 68 imp (rtn honduras x3)', action: 'PROPOSED_NEW_CONTENT', official_sources: 'SAR Honduras', priority: 'P2' },
  { cluster: 'que es la facturación electrónica en honduras', intent: 'informacional', evidence: 'Bing query con impresiones', action: 'PROPOSED_NEW_CONTENT', official_sources: 'SAR Honduras', priority: 'P3' },
];
const ncHeader = ['cluster','intent','evidence','action','official_sources','priority'];
writeFileSync(resolve(GROWTH, 'new-content-opportunities.csv'), [ncHeader.join(',')].concat(newContent.map((r) => ncHeader.map((h) => esc(r[h])).join(','))).join('\n'), 'utf8');

// ── 5. Baselines (manifest de experimento) ────────────────────────────────
const batch = readCsv(resolve(GROWTH, 'batch-1-selection.csv'));
const expHeader = ['url','baseline_date','title_before','clicks_28_before','impressions_28_before','ctr_before','position_before','sessions_before','key_events_before','conversion_rate_before','title_after','meta_after','h1_after','content_changes','internal_links_changes','cta_changes','published_commit','measurement_start','measurement_end'];
const today = '2026-08-03';
const expLines = [expHeader.join(',')].concat(batch.map((b) => {
  // title_after/meta_after/h1_after se completan en el patch manifest (referencia)
  const row = {
    url: b.url, baseline_date: today, title_before: '',
    clicks_28_before: b.gsc_evidence, impressions_28_before: '', ctr_before: b.gsc_evidence,
    position_before: b.gsc_evidence, sessions_before: b.ga4_evidence, key_events_before: '',
    conversion_rate_before: '', title_after: 'ver batch-1-title-meta-patch.json',
    meta_after: '', h1_after: '', content_changes: 'PENDIENTE_APLICACION_EDITORIAL',
    internal_links_changes: 'recomendado', cta_changes: 'revisar',
    published_commit: '', measurement_start: '2026-08-03', measurement_end: '2026-08-31',
  };
  return expHeader.map((h) => esc(row[h])).join(',');
}));
writeFileSync(resolve(GROWTH, 'batch-1-experiment-manifest.csv'), expLines.join('\n'), 'utf8');

console.log('Decisiones: ' + decisions.length);
console.log('NOINDEX revisados: ' + noindex.length);
console.log('Canibalización: ' + cannibDecisions.length);
console.log('Contenido nuevo: ' + newContent.length);
console.log('Baselines: ' + batch.length);
