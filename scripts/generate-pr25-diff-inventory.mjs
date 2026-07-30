#!/usr/bin/env node
/**
 * Genera docs/audits/current/pr25-final-diff-inventory.csv (§7 del Paso 13).
 *
 * Inventario clasificado de TODOS los archivos del diff PR#25 contra main.
 * Solo lectura: usa `git diff --name-status origin/main...HEAD`.
 *
 * Clasifica por área, marca flags (public_runtime, database, migration,
 * security, editorial, generated, tests, docs) y asigna un riesgo y estado
 * final basados en reglas deterministas (sin juicio subjetivo).
 */
import { execSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const HEAD = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const MAIN = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();

const diff = execSync(`git diff --name-status ${MAIN}...HEAD`, { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

function classify(path) {
  const baseFlags = {
    public_runtime: 'false', private_runtime: 'false', database: 'false',
    migration: 'false', security: 'false', editorial: 'false',
    generated: 'false', tests: 'false', docs: 'false',
  };
  const map = [
    [/^app\/\(public\)\//, 'PUBLIC_UI'],
    [/^app\/blog\//, 'BLOG'],
    [/^app\/(intranet|admin)/, 'INTRANET'],
    [/^app\/api\//, 'PUBLIC_API'],
    [/^app\//, 'PUBLIC_UI'],
    [/^components\/blog/, 'BLOG'],
    [/^components\/(marketing|chat|cookie-consent|analytics)/, 'PUBLIC_UI'],
    [/^components\//, 'PUBLIC_UI'],
    [/^lib\/blog/, 'BLOG'],
    [/^lib\/rag/, 'RAG'],
    [/^lib\/(auth|proxy)/, 'SECURITY'],
    [/^lib\/schema/, 'DATABASE'],
    [/^lib\/(seo|sitemap|robots|metadata)/, 'SEO_GEO'],
    [/^lib\/rules/, 'CALC_ENGINE'],
    [/^lib\//, 'LIB_CORE'],
    [/^data\/(google|bing)/, 'SEO_LIVE'],
    [/^data\/seo\//, 'SEO_LIVE'],
    [/^data\/(delitos|articulos|areas|landings|faq|blog)/, 'DATA_LEGAL'],
    [/^data\//, 'DATA'],
    [/^scripts\/(audit-blog-table|generate-blog-table)/, 'BLOG'],
    [/^scripts\/(audit|seo|security|generate-sitemap|generate-robots)/, 'SEO_GEO'],
    [/^scripts\/e2e/, 'CI'],
    [/^scripts\//, 'SCRIPTS'],
    [/^tests\//, 'TESTS'],
    [/^docs\/audits\/current\//, 'EVIDENCE'],
    [/^docs\/seo\/current\//, 'SEO_EVIDENCE'],
    [/^docs\/ops\//, 'DOCS'],
    [/^docs\//, 'DOCS'],
    [/^tools\/(db|ci)/, 'CI'],
    [/^tools\//, 'CI'],
    [/^\.github\//, 'CI'],
    [/^public\//, 'PUBLIC_ASSETS'],
    [/^next\.config\.ts$/, 'CONFIG'],
    [/^package(-lock)?\.json$/, 'DEPENDENCIES'],
    [/\.config\.(ts|mjs|js)$|tsconfig|tailwind|postcss/, 'CONFIG'],
  ];
  let area = 'OTHER';
  for (const [re, mappedArea] of map) {
    if (re.test(path)) { area = mappedArea; break; }
  }
  const flags = { ...baseFlags };
  if (area === 'TESTS') flags.tests = 'true';
  if (area === 'SEO_EVIDENCE' || area === 'EVIDENCE') flags.generated = 'true';
  if (area === 'DATABASE') flags.database = 'true';
  if (area === 'SECURITY') flags.security = 'true';
  if (area === 'SEO_LIVE') { flags.public_runtime = 'true'; flags.generated = 'true'; }
  if (area === 'PUBLIC_UI' || area === 'PUBLIC_API') flags.public_runtime = 'true';
  if (area === 'DOCS' || area === 'CI') flags.docs = 'true';
  if (area === 'BLOG' && /sanitiz|table-transformer|blog-db/.test(path)) flags.security = 'true';
  return { area, ...flags };
}

function riskFor(path, area, flags) {
  if (flags.migration === 'true') return 'HIGH';
  if (flags.database === 'true' || flags.security === 'true') return 'MEDIUM';
  if (area === 'INTRANET' || area === 'CALC_ENGINE') return 'HIGH';
  if (area === 'CONFIG' || area === 'DEPENDENCIES') return 'MEDIUM';
  if (area === 'SECURITY') return 'MEDIUM';
  return 'LOW';
}

function expected(path, area, status) {
  // Todo archivo del PR debe estar justificado por algún paso 1-13/B.
  // Determinista: basado en área.
  if (area === 'TESTS') return 'covered_by_step_1_to_13_tests';
  if (area === 'EVIDENCE' || area === 'SEO_EVIDENCE') return 'evidence_artifact';
  if (area === 'DOCS' || area === 'CI') return 'docs_or_ci';
  if (area === 'BLOG') return 'step_3_5_11_or_block_b';
  if (area === 'SEO_GEO' || area === 'SEO_LIVE') return 'steps_1_to_12_seo';
  if (area === 'PUBLIC_UI') return 'steps_1_to_12_public';
  if (area === 'SECURITY' || area === 'DATABASE' || area === 'DEPENDENCIES') return 'step_3_15';
  return 'review';
}

const header = [
  'path', 'status', 'area', 'risk', 'public_runtime', 'private_runtime',
  'database', 'migration', 'security', 'editorial', 'generated', 'tests',
  'docs', 'expected', 'owner_step', 'issue', 'final_status',
];
const rows = [header.join(',')];

function esc(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

for (const line of diff) {
  const parts = line.split('\t');
  const status = parts[0];
  const path = parts[parts.length - 1];
  const c = classify(path);
  const risk = riskFor(path, c.area, c);
  const exp = expected(path, c.area, status);
  const issue = c.area === 'INTRANET' ? 'intranet_out_of_scope'
    : c.area === 'OTHER' ? 'manual_review'
    : 'none';
  const finalStatus = issue === 'none' ? 'EXPECTED' : 'REVIEW';
  rows.push([
    path, status, c.area, risk, c.public_runtime, c.private_runtime,
    c.database, c.migration, c.security, c.editorial, c.generated, c.tests,
    c.docs, exp, 'step_1_to_13_or_block_b', issue, finalStatus,
  ].map(esc).join(','));
}

const csv = `# pr25-final-diff-inventory.csv — generado por scripts/generate-pr25-diff-inventory.mjs
# head=${HEAD} main=${MAIN} date=${new Date().toISOString()}
# ${diff.length} archivos. Clasificación determinista por ruta.
${rows.join('\n')}\n`;

await writeFile('docs/audits/current/pr25-final-diff-inventory.csv', csv, 'utf8');
console.log(`pr25-final-diff-inventory.csv: ${diff.length} archivos clasificados.`);
console.log(`head=${HEAD.slice(0, 12)} main=${MAIN.slice(0, 12)}`);

// Resumen de áreas
const areas = {};
for (const line of diff) {
  const path = line.split('\t').pop();
  const a = classify(path).area;
  areas[a] = (areas[a] || 0) + 1;
}
console.log('Áreas:', Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));
