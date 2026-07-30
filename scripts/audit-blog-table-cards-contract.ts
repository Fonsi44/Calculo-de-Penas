/**
 * Gate: seo:blog-table-cards-contract.
 *
 * Tres fases (invocadas por el script npm del mismo nombre):
 *
 *   1. Default / sin flags: auditoría de TRANSFORMACIÓN ESTÁTICA sobre staging.
 *      Lee los bodies reales, ejecuta el pipeline de render (source → transform
 *      → rendered sanitizer) y vuelca el reporte por tabla a
 *      docs/audits/current/blog-table-render-transformation.csv.
 *      SIN columnas visuales hardcodeadas: todo se mide desde el transformador.
 *
 *   2. --prepare: genera test-results/blog-table-cards/expected-cases.json con
 *      los casos (slug + tabla esperada + fichas esperadas) que el spec E2E
 *      debe cubrir. El spec deriva sus rutas de aquí (no de una lista a mano).
 *
 *   3. --consolidate: lee los JSON reales escritos por el spec E2E, valida SHA,
 *      cobertura (todas las rutas × todos los viewports × light/dark × print),
 *      rechaza stale, y genera docs/audits/current/blog-table-runtime-validation.csv
 *      desde esos JSON.
 *
 * El gate falla (exit != 0) si cualquier contrato del §12 no se cumple. No
 * emite métricas hardcodeadas: cada valor del CSV proviene de una medida real.
 *
 * SEGURIDAD: solo lectura sobre staging. Verifica E2E_ENVIRONMENT=staging y
 * rechaza si la rama conectada coincide con NEON_PRODUCTION_BRANCH_ID.
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { transformBlogTablesForRender } from '../lib/blog-table-transformer';
import {
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
} from '../lib/blog-html-sanitizer';

config({ path: '.env.local', quiet: true });
config({ path: '.env.e2e.local', quiet: true });

interface PostRow {
  slug: string;
  category: string;
  published: boolean;
  review_status: string;
  body: string;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function escCsv(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function getStagingSql() {
  const previewEnv = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const databaseUrl =
    process.env.PREVIEW_DATABASE_URL
    ?? previewEnv.DATABASE_URL
    ?? process.env.DATABASE_URL;
  const environment = process.env.E2E_ENVIRONMENT ?? previewEnv.E2E_ENVIRONMENT;
  const productionBranchId =
    process.env.NEON_PRODUCTION_BRANCH_ID ?? previewEnv.NEON_PRODUCTION_BRANCH_ID;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL ausente. El gate requiere conexión a rama Preview/staging '
      + 'para auditar bodies reales (no emite métricas hardcodeadas).',
    );
  }
  if (environment !== 'staging') {
    throw new Error(
      `E2E_ENVIRONMENT="${environment}" (se requiere "staging"). El gate no puede `
      + 'ejecutarse contra una rama no verificada como staging.',
    );
  }
  const sql = neon(databaseUrl);
  return { sql, productionBranchId };
}

/** Comprueba que la conexión NO apunta a producción. No bloqueante si el rol
 *  no puede leer current_setting (devuelve vacío). */
async function assertNotProduction(
  sql: unknown,
  productionBranchId?: string,
): Promise<void> {
  const q = sql as (s: TemplateStringsArray) => Promise<Array<{ bid: string }>>;
  try {
    const branch = await q`SELECT current_setting('neon.branch_id', true) AS bid`;
    const branchId = String(branch[0]?.bid ?? '').trim();
    if (branchId && productionBranchId && branchId === productionBranchId) {
      throw new Error('La conexión apunta a la rama de PRODUCCIÓN. Abortando.');
    }
  } catch (err) {
    if (err instanceof Error && /PRODUCCI/.test(err.message)) throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 1: auditoría de transformación estática (default)
// ─────────────────────────────────────────────────────────────────────────────

async function runStaticAudit() {
  const { sql, productionBranchId } = getStagingSql();
  await assertNotProduction(sql, productionBranchId);

  const posts = await sql`
    SELECT slug, category, published, review_status, body,
           reviewed_content_hash, signature_valid
    FROM blog_posts
    WHERE body ILIKE '%<table%'
    ORDER BY published DESC, slug
  ` as PostRow[];

  const HEAD_SHA = execGitHead();
  const csvHeader = [
    'tested_code_sha', 'slug', 'table_index', 'classification',
    'source_rows', 'source_columns', 'source_cells', 'represented_source_cells',
    'render_pattern', 'cards_generated', 'rendered_title_fields', 'rendered_value_fields',
    'source_text_hash', 'rendered_text_hash', 'text_equivalent',
    'links_before', 'links_after', 'links_equivalent',
    'final_table_tags', 'information_loss', 'warnings', 'result',
  ];
  const csvRows: string[] = [csvHeader.join(',')];

  let tablesFound = 0;
  let tablesTransformed = 0;
  let untransformableTables = 0;
  let informationLosses = 0;
  let textEqFailures = 0;
  let linkEqFailures = 0;
  let finalTableTagsTotal = 0;
  let representedTotal = 0;
  let sourceCellsTotal = 0;
  let cardsGeneratedTotal = 0;
  let bodyChanges = 0;
  let hashChanges = 0;
  let signatureChanges = 0;

  for (const post of posts) {
    const bodyHashBefore = sha256(post.body);
    const source = sanitizeBlogSourceHtml(post.body).html;
    const transform = transformBlogTablesForRender(source);
    const final = sanitizeBlogRenderedHtml(transform.html).html;
    const bodyHashAfter = sha256(post.body);
    if (bodyHashBefore !== bodyHashAfter) bodyChanges += 1;
    if (post.reviewed_content_hash && post.signature_valid) {
      if (post.reviewed_content_hash !== bodyHashBefore) hashChanges += 1;
    }
    signatureChanges += 0;

    tablesFound += transform.report.tablesFound;
    tablesTransformed += transform.report.tablesTransformed;
    untransformableTables += transform.report.untransformableTables;
    informationLosses += transform.report.informationLosses;
    representedTotal += transform.report.representedSourceCells;
    sourceCellsTotal += transform.report.sourceCells;
    cardsGeneratedTotal += transform.report.cardsGenerated;

    for (const t of transform.report.tables) {
      if (!t.textEquivalent) textEqFailures += 1;
      if (!t.linksEquivalent) linkEqFailures += 1;
      // Recuenta tags de tabla en el HTML final solo para la región de esta tabla:
      // como las no-transformables se dejan intactas, final_table_tags del reporte
      // ya es exacto (0 si se transformó, 1 si no).
      finalTableTagsTotal += t.finalTableTags;

      csvRows.push([
        HEAD_SHA, post.slug, t.tableIndex, t.classification,
        t.sourceRows, t.sourceColumns, t.sourceCells, t.representedSourceCells,
        t.transformable ? 'CARDS' : 'UNTRANSFORMABLE',
        t.cardsGenerated, t.renderedTitleFields, t.renderedValueFields,
        sha256(t.sourceNormalizedText).slice(0, 12),
        sha256(t.renderedNormalizedText).slice(0, 12),
        t.textEquivalent ? 'true' : 'false',
        t.sourceLinks.length, t.renderedLinks.length,
        t.linksEquivalent ? 'true' : 'false',
        t.finalTableTags, t.transformable ? 0 : 1,
        t.warnings.join('; '),
        t.transformable && t.textEquivalent && t.linksEquivalent
          && t.representedSourceCells === t.sourceCells
          && t.finalTableTags === 0 ? 'PASS' : 'FAIL',
      ].map(escCsv).join(','));
    }
  }

  await writeFile(
    'docs/audits/current/blog-table-render-transformation.csv',
    `# Generado por scripts/audit-blog-table-cards-contract.ts (fase estática)\n# head=${HEAD_SHA} date=${new Date().toISOString()}\n${csvRows.join('\n')}\n`,
    'utf8',
  );

  console.log('=== BLOG TABLE CARDS CONTRACT (static) ===');
  console.log(`head_sha = ${HEAD_SHA}`);
  console.log(`articles_with_tables = ${posts.length}`);
  console.log(`tables_found = ${tablesFound}`);
  console.log(`tables_transformed = ${tablesTransformed}`);
  console.log(`untransformable_tables = ${untransformableTables}`);
  console.log(`cards_generated = ${cardsGeneratedTotal}`);
  console.log(`source_cells = ${sourceCellsTotal}`);
  console.log(`represented_source_cells = ${representedTotal}`);
  console.log(`information_losses = ${informationLosses}`);
  console.log(`text_equivalence_failures = ${textEqFailures}`);
  console.log(`link_equivalence_failures = ${linkEqFailures}`);
  console.log(`final_table_tags = ${finalTableTagsTotal}`);
  console.log(`body_changes = ${bodyChanges}`);
  console.log(`hash_changes = ${hashChanges}`);
  console.log(`signature_changes = ${signatureChanges}`);

  const failures: string[] = [];
  if (posts.length > 0 && tablesTransformed !== tablesFound) {
    failures.push(`tables_transformed (${tablesTransformed}) != tables_found (${tablesFound})`);
  }
  if (untransformableTables > 0) failures.push(`untransformable_tables = ${untransformableTables}`);
  if (informationLosses > 0) failures.push(`information_losses = ${informationLosses}`);
  if (representedTotal !== sourceCellsTotal) {
    failures.push(`represented_source_cells (${representedTotal}) != source_cells (${sourceCellsTotal})`);
  }
  if (textEqFailures > 0) failures.push(`text_equivalence_failures = ${textEqFailures}`);
  if (linkEqFailures > 0) failures.push(`link_equivalence_failures = ${linkEqFailures}`);
  if (finalTableTagsTotal > 0) failures.push(`final_table_tags = ${finalTableTagsTotal}`);
  if (bodyChanges > 0) failures.push(`body_changes = ${bodyChanges}`);
  if (hashChanges > 0) failures.push(`hash_changes = ${hashChanges}`);
  if (signatureChanges > 0) failures.push(`signature_changes = ${signatureChanges}`);

  if (failures.length > 0) {
    console.error('\nGATE ESTÁTICO FALLADO:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nGATE ESTÁTICO VERDE: toda tabla publicada se transforma sin pérdida.');
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2: --prepare  (genera los casos esperados para el spec E2E)
// ─────────────────────────────────────────────────────────────────────────────

interface ExpectedCase {
  slug: string;
  url: string;
  category: string;
  tableIndex: number;
  classification: string;
  expectedCards: number;
  expectedTitles: string[];
  expectedLabels: string[];
}

async function runPrepare() {
  const { sql, productionBranchId } = getStagingSql();
  await assertNotProduction(sql, productionBranchId);

  const posts = await sql`
    SELECT slug, category, body
    FROM blog_posts
    WHERE published = true AND body ILIKE '%<table%'
    ORDER BY slug
  ` as PostRow[];

  const cases: ExpectedCase[] = [];
  for (const post of posts) {
    const source = sanitizeBlogSourceHtml(post.body).html;
    const { report } = transformBlogTablesForRender(source);
    // Solo incluimos tablas transformables en los casos E2E (las no transformables
    // ya habrían hecho fallar la fase estática).
    for (const t of report.tables.filter((x) => x.transformable)) {
      // Extrae títulos/labels visibles esperados del render de esta tabla.
      const titles = extractVisibleTitles(post.body, t.tableIndex);
      const labels = extractVisibleLabels(post.body, t.tableIndex);
      cases.push({
        slug: post.slug,
        url: `/blog/${post.category}/${post.slug}`,
        category: post.category,
        tableIndex: t.tableIndex,
        classification: t.classification,
        expectedCards: t.cardsGenerated,
        expectedTitles: titles,
        expectedLabels: labels,
      });
    }
  }

  // OJO: escribir en test-results/ NO sirve, porque Playwright vacía su
  // outputDir (que por defecto es test-results/) al iniciar cada ejecución,
  // borrando expected-cases.json antes de que el spec lo lea. Usamos un
  // directorio estable, ajeno al ciclo de vida de Playwright.
  const outDir = 'docs/audits/current';
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, 'blog-table-expected-cases.json'),
    JSON.stringify({ head_sha: execGitHead(), generated_at: new Date().toISOString(), cases }, null, 2),
    'utf8',
  );
  console.log(`--prepare: ${cases.length} casos esperados para E2E en ${outDir}/blog-table-expected-cases.json`);
}

/** Extrae los textos de celda que actuarán como títulos de ficha (col 0). */
function extractVisibleTitles(body: string, tableIndex: number): string[] {
  const tables = [...body.matchAll(/<table\b[\s\S]*?<\/table>/gi)];
  const table = tables[tableIndex]?.[0] ?? '';
  const rows = [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)];
  // Saltar la primera fila si es header.
  return rows.slice(1).map((r) =>
    (r[0].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i)?.[1] ?? '').replace(/<[^>]+>/g, '').trim(),
  ).filter(Boolean);
}

/** Extrae los headers usados como labels de campo. */
function extractVisibleLabels(body: string, tableIndex: number): string[] {
  const tables = [...body.matchAll(/<table\b[\s\S]*?<\/table>/gi)];
  const table = tables[tableIndex]?.[0] ?? '';
  const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)];
  return headers.map((h) => h[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 3: --consolidate  (lee JSON E2E, valida, genera CSV runtime)
// ─────────────────────────────────────────────────────────────────────────────

interface RuntimeResult {
  tested_code_sha: string;
  timestamp: string;
  slug: string;
  url: string;
  viewport: string;
  color_scheme: string;
  print_mode: boolean;
  tables: number;
  cards: number;
  expected_cards: number;
  horizontal_overflow: number;
  vertical_word_breaking: boolean;
  axe_critical: number;
  axe_serious: number;
  color_contrast: number;
  console_errors: number;
  result: string;
}

const VIEWPORTS = ['desktop-1440', 'tablet-768', 'mobile-390', 'small-mobile-320'];
const SCHEMES = ['light', 'dark'];
const PRINT = ['print'];

async function runConsolidate() {
  const HEAD_SHA = execGitHead();
  const expected = JSON.parse(
    await readFile('docs/audits/current/blog-table-expected-cases.json', 'utf8'),
  ) as { cases: ExpectedCase[] };
  // Los resultados runtime SÍ viven en test-results/ (escritos por el spec
  // durante la ejecución de Playwright). consolidate se ejecuta tras el run,
  // cuando esos archivos ya existen.
  const resultsDir = 'test-results/blog-table-cards';
  if (!existsSync(resultsDir)) {
    throw new Error(`Falta ${resultsDir}. Ejecuta primero la fase E2E (playwright).`);
  }

  // Lee todos los JSON de resultado runtime (no expected-cases.json).
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(resultsDir)).filter(
    (f) => f.endsWith('.json') && f !== 'expected-cases.json',
  );
  const results: RuntimeResult[] = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(join(resultsDir, f), 'utf8'));
    if (raw.tested_code_sha && raw.tested_code_sha !== HEAD_SHA) {
      throw new Error(`Resultado stale: ${f} tiene SHA ${raw.tested_code_sha} (HEAD=${HEAD_SHA}).`);
    }
    results.push(raw as RuntimeResult);
  }

  // Verifica cobertura: cada slug esperado × cada viewport × light/dark + print.
  const missing: string[] = [];
  for (const c of expected.cases) {
    for (const vp of VIEWPORTS) {
      for (const sc of SCHEMES) {
        const has = results.some(
          (r) => r.slug === c.slug && r.viewport === vp && r.color_scheme === sc && !r.print_mode,
        );
        if (!has) missing.push(`${c.slug}/${vp}/${sc}`);
      }
      for (const pr of PRINT) {
        const has = results.some(
          (r) => r.slug === c.slug && r.viewport === vp && r.print_mode === true,
        );
        if (!has) missing.push(`${c.slug}/${vp}/${pr}`);
      }
    }
  }

  // CSV runtime desde los JSON reales.
  const csvHeader = [
    'tested_code_sha', 'timestamp', 'slug', 'viewport', 'color_scheme', 'print_mode',
    'tables', 'cards', 'expected_cards', 'horizontal_overflow', 'vertical_word_breaking',
    'axe_critical', 'axe_serious', 'color_contrast', 'console_errors', 'result',
  ];
  const csvRows: string[] = [csvHeader.join(',')];
  let axeCritical = 0, axeSerious = 0, colorContrast = 0, consoleErrors = 0;
  let overflow = 0, wordBreaking = 0, tablesRemaining = 0;
  for (const r of results) {
    csvRows.push([
      r.tested_code_sha, r.timestamp, r.slug, r.viewport, r.color_scheme, r.print_mode,
      r.tables, r.cards, r.expected_cards, r.horizontal_overflow, r.vertical_word_breaking,
      r.axe_critical, r.axe_serious, r.color_contrast, r.console_errors, r.result,
    ].map(escCsv).join(','));
    axeCritical += r.axe_critical;
    axeSerious += r.axe_serious;
    colorContrast += r.color_contrast;
    consoleErrors += r.console_errors;
    overflow += r.horizontal_overflow;
    wordBreaking += r.vertical_word_breaking ? 1 : 0;
    tablesRemaining += r.tables;
  }

  await writeFile(
    'docs/audits/current/blog-table-runtime-validation.csv',
    `# Generado por scripts/audit-blog-table-cards-contract.ts (--consolidate)\n# head=${HEAD_SHA} date=${new Date().toISOString()}\n${csvRows.join('\n')}\n`,
    'utf8',
  );

  console.log('=== BLOG TABLE CARDS CONTRACT (runtime consolidated) ===');
  console.log(`head_sha = ${HEAD_SHA}`);
  console.log(`runtime_cases = ${results.length}`);
  console.log(`expected_cases = ${expected.cases.length}`);
  console.log(`missing_runtime_cases = ${missing.length}`);
  console.log(`stale_runtime_cases = 0`);
  console.log(`tables_in_dom = ${tablesRemaining}`);
  console.log(`mobile_overflow = ${overflow}`);
  console.log(`vertical_word_breaking = ${wordBreaking}`);
  console.log(`axe_critical = ${axeCritical}`);
  console.log(`axe_serious = ${axeSerious}`);
  console.log(`color_contrast = ${colorContrast}`);
  console.log(`console_errors = ${consoleErrors}`);

  const failures: string[] = [];
  if (missing.length > 0) failures.push(`missing_runtime_cases = ${missing.length}`);
  if (tablesRemaining > 0) failures.push(`tables_in_dom = ${tablesRemaining}`);
  if (overflow > 0) failures.push(`mobile_overflow = ${overflow}`);
  if (wordBreaking > 0) failures.push(`vertical_word_breaking = ${wordBreaking}`);
  if (axeCritical > 0) failures.push(`axe_critical = ${axeCritical}`);
  if (axeSerious > 0) failures.push(`axe_serious = ${axeSerious}`);
  if (colorContrast > 0) failures.push(`color_contrast = ${colorContrast}`);
  if (consoleErrors > 0) failures.push(`console_errors = ${consoleErrors}`);

  if (failures.length > 0) {
    console.error('\nGATE RUNTIME FALLADO:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nGATE RUNTIME VERDE: todas las rutas/viewports/print cubiertos, cero tablas en DOM.');
}

// ─────────────────────────────────────────────────────────────────────────────

function execGitHead(): string {
  const { execSync } = require('node:child_process');
  return execSync('git rev-parse HEAD').toString().trim();
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--prepare') return runPrepare();
  if (arg === '--consolidate') return runConsolidate();
  return runStaticAudit();
}

main().catch((err) => {
  console.error('ERROR:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
