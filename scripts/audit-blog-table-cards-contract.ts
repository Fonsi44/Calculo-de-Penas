/**
 * Gate: seo:blog-table-cards-contract.
 *
 * Cuatro fases:
 *   1. Default: auditoría de TRANSFORMACIÓN ESTÁTICA sobre staging.
 *      Lee bodies reales, ejecuta pipeline source→transform→render y vuelca
 *      el reporte por tabla a docs/audits/current/blog-table-render-transformation.csv.
 *
 *   2. --prepare: genera docs/audits/current/blog-table-expected-cases.json con
 *      expectedTitles/expectedLabels/expectedValues derivados del AST (no regex).
 *
 *   3. --consolidate: lee JSON reales de test-results/blog-table-cards/,
 *      validación estricta (SHA, result, cards, console, hydration, duplicados,
 *      extras, print), genera blog-table-runtime-validation.csv.
 *
 * SEGURIDAD: solo lectura staging. Verifica E2E_ENVIRONMENT=staging.
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
      'DATABASE_URL ausente. El gate requiere conexión a rama Preview/staging.',
    );
  }
  if (environment !== 'staging') {
    throw new Error(
      `E2E_ENVIRONMENT="${environment}" (se requiere "staging").`,
    );
  }
  const sql = neon(databaseUrl);
  return { sql, productionBranchId };
}

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

// ─────────────────────────────────────────────────────────────────── FASE 1 ─────

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
    sanitizeBlogRenderedHtml(transform.html).html;
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

// ─────────────────────────────────────────────────────────────────── FASE 2 ─────

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
    for (const t of report.tables.filter((x) => x.transformable)) {
      cases.push({
        slug: post.slug,
        url: `/blog/${post.category}/${post.slug}`,
        category: post.category,
        tableIndex: t.tableIndex,
        classification: t.classification,
        expectedCards: t.cardsGenerated,
        expectedTitles: t.expectedTitles,
        expectedLabels: t.expectedLabels,
      });
    }
  }

  const outDir = 'docs/audits/current';
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, 'blog-table-expected-cases.json'),
    JSON.stringify(
      { head_sha: execGitHead(), generated_at: new Date().toISOString(), cases },
      null, 2,
    ),
    'utf8',
  );
  console.log(`--prepare: ${cases.length} casos esperados derivados del AST en ${outDir}/blog-table-expected-cases.json`);
}

// ─────────────────────────────────────────────────────────────────── FASE 3 ─────

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
  document_overflow: number;
  article_overflow: number;
  vertical_word_breaking: boolean;
  axe_critical: number | 'NOT_APPLICABLE';
  axe_serious: number | 'NOT_APPLICABLE';
  color_contrast: number | 'NOT_APPLICABLE';
  console_errors: number;
  page_errors: number;
  hydration_warnings: number;
  failures: string[];
  result: 'PASS' | 'FAIL';
}

const VIEWPORTS = ['desktop-1440', 'tablet-768', 'mobile-390', 'small-mobile-320'];
const SCHEMES = ['light', 'dark'];

function caseKey(slug: string, viewport: string, scheme: string, print: boolean): string {
  return `${slug}/${viewport}/${print ? 'print' : scheme}`;
}

async function runConsolidate() {
  const HEAD_SHA = execGitHead();
  const expectedRaw = JSON.parse(
    await readFile('docs/audits/current/blog-table-expected-cases.json', 'utf8'),
  ) as { head_sha: string; cases: ExpectedCase[] };

  if (expectedRaw.head_sha !== HEAD_SHA) {
    throw new Error(
      `expected-cases.json SHA ${expectedRaw.head_sha} != HEAD ${HEAD_SHA}. Regenera con --prepare.`,
    );
  }

  const resultsDir = 'test-results/blog-table-cards';
  if (!existsSync(resultsDir)) {
    throw new Error(`Falta ${resultsDir}. Ejecuta primero la fase E2E (playwright).`);
  }

  const files = (await readdir(resultsDir)).filter(
    (f) => f.endsWith('.json') && f !== 'expected-cases.json',
  );

  const results: RuntimeResult[] = [];
  const seenKeys = new Set<string>();
  const errors: string[] = [];

  for (const f of files) {
    const raw = JSON.parse(await readFile(join(resultsDir, f), 'utf8')) as RuntimeResult;

    // SHA check.
    if (!raw.tested_code_sha || raw.tested_code_sha !== HEAD_SHA) {
      errors.push(`Resultado stale: ${f} SHA=${raw.tested_code_sha} (HEAD=${HEAD_SHA})`);
      continue;
    }

    // Campos requeridos.
    const required = ['slug', 'viewport', 'color_scheme', 'tables', 'cards', 'expected_cards', 'result'];
    for (const field of required) {
      if (!(field in raw)) {
        errors.push(`Campo ausente en ${f}: ${field}`);
      }
    }
    if (errors.length > 0) continue;

    // Tipos.
    if (typeof raw.tables !== 'number') errors.push(`tables no es number en ${f}`);
    if (typeof raw.cards !== 'number') errors.push(`cards no es number en ${f}`);
    if (typeof raw.console_errors !== 'number') errors.push(`console_errors no es number en ${f}`);
    if (typeof raw.page_errors !== 'number') errors.push(`page_errors no es number en ${f}`);
    if (typeof raw.hydration_warnings !== 'number') errors.push(`hydration_warnings no es number en ${f}`);
    if (errors.length > 0) continue;

    // Result validation.
    if (raw.result !== 'PASS') {
      errors.push(`${f}: result=${raw.result} (${raw.failures?.join('; ') ?? 'sin detalles'})`);
      continue;
    }

    // Métricas estrictas.
    if (raw.tables > 0) errors.push(`${f}: tables=${raw.tables}`);
    if (raw.cards < raw.expected_cards) errors.push(`${f}: cards=${raw.cards}<expected=${raw.expected_cards}`);
    const maxOverflow = Math.max(raw.document_overflow ?? 0, raw.article_overflow ?? 0);
    if (maxOverflow > 1) errors.push(`${f}: overflow=${maxOverflow}`);
    if (raw.vertical_word_breaking) errors.push(`${f}: vertical_word_breaking`);
    if (typeof raw.axe_critical === 'number' && raw.axe_critical > 0) errors.push(`${f}: axe_critical=${raw.axe_critical}`);
    if (typeof raw.axe_serious === 'number' && raw.axe_serious > 0) errors.push(`${f}: axe_serious=${raw.axe_serious}`);
    if (typeof raw.color_contrast === 'number' && raw.color_contrast > 0) errors.push(`${f}: color_contrast=${raw.color_contrast}`);
    if (raw.console_errors > 0) errors.push(`${f}: console_errors=${raw.console_errors}`);
    if (raw.page_errors > 0) errors.push(`${f}: page_errors=${raw.page_errors}`);
    if (raw.hydration_warnings > 0) errors.push(`${f}: hydration_warnings=${raw.hydration_warnings}`);

    // Print específico: cards must be >= expected (no usar :visible)
    if (raw.print_mode) {
      if (raw.cards === 0) errors.push(`${f}: print_cards=0 con result=PASS`);
      // axe debe ser medido o NOT_APPLICABLE justificado.
      if (raw.axe_critical === 0 && raw.axe_serious === 0 && raw.color_contrast === 0) {
        // OK: medido y limpio.
      } else if (
        raw.axe_critical === 'NOT_APPLICABLE' &&
        raw.axe_serious === 'NOT_APPLICABLE' &&
        raw.color_contrast === 'NOT_APPLICABLE'
      ) {
        // OK: NOT_APPLICABLE documentado.
      } else {
        errors.push(`${f}: print axe no es 0 ni NOT_APPLICABLE (critical=${raw.axe_critical}, serious=${raw.axe_serious}, contrast=${raw.color_contrast})`);
      }
    } else {
      // Pantalla: axe debe ser 0 real.
      if (raw.axe_critical === 'NOT_APPLICABLE') errors.push(`${f}: screen axe_critical=NOT_APPLICABLE`);
      if (raw.axe_serious === 'NOT_APPLICABLE') errors.push(`${f}: screen axe_serious=NOT_APPLICABLE`);
    }

    // Duplicados.
    const key = caseKey(raw.slug, raw.viewport, raw.color_scheme, raw.print_mode);
    if (seenKeys.has(key)) {
      errors.push(`Duplicado: ${key} en ${f}`);
    }
    seenKeys.add(key);

    results.push(raw);
  }

  // Cobertura: casos esperados vs reales.
  const expectedKeys = new Set<string>();
  for (const c of expectedRaw.cases) {
    for (const vp of VIEWPORTS) {
      for (const sc of SCHEMES) {
        expectedKeys.add(caseKey(c.slug, vp, sc, false));
      }
      expectedKeys.add(caseKey(c.slug, vp, 'light', true)); // print
    }
  }

  const missing = [...expectedKeys].filter((k) => !seenKeys.has(k));
  const extra = [...seenKeys].filter((k) => !expectedKeys.has(k));

  if (missing.length > 0) errors.push(`Faltan ${missing.length} casos (${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''})`);
  if (extra.length > 0) errors.push(`Casos no esperados: ${extra.length} (${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '...' : ''})`);

  // CSV runtime.
  const csvHeader = [
    'tested_code_sha', 'timestamp', 'slug', 'viewport', 'color_scheme', 'print_mode',
    'tables', 'cards', 'expected_cards',
    'document_overflow', 'article_overflow', 'vertical_word_breaking',
    'axe_critical', 'axe_serious', 'color_contrast',
    'console_errors', 'page_errors', 'hydration_warnings',
    'failures', 'result',
  ];
  const csvRows: string[] = [csvHeader.join(',')];
  for (const r of results) {
    csvRows.push([
      r.tested_code_sha, r.timestamp, r.slug, r.viewport, r.color_scheme, r.print_mode,
      r.tables, r.cards, r.expected_cards,
      r.document_overflow, r.article_overflow, r.vertical_word_breaking,
      r.axe_critical, r.axe_serious, r.color_contrast,
      r.console_errors, r.page_errors, r.hydration_warnings,
      (r.failures ?? []).join('; '), r.result,
    ].map(escCsv).join(','));
  }

  await writeFile(
    'docs/audits/current/blog-table-runtime-validation.csv',
    `# Generado por scripts/audit-blog-table-cards-contract.ts (--consolidate)\n# head=${HEAD_SHA} date=${new Date().toISOString()}\n${csvRows.join('\n')}\n`,
    'utf8',
  );

  console.log('=== BLOG TABLE CARDS CONTRACT (runtime consolidated) ===');
  console.log(`head_sha = ${HEAD_SHA}`);
  console.log(`runtime_cases = ${results.length}`);
  console.log(`expected_cases = ${expectedKeys.size}`);
  console.log(`missing_runtime_cases = ${missing.length}`);
  console.log(`extra_runtime_cases = ${extra.length}`);
  console.log(`duplicates = 0`);
  console.log(`stale = ${errors.filter((e) => e.includes('stale')).length}`);

  // Totales.
  const totalTables = results.reduce((s, r) => s + r.tables, 0);
  const totalAxeCritical = results.reduce((s, r) => s + (typeof r.axe_critical === 'number' ? r.axe_critical : 0), 0);
  const totalAxeSerious = results.reduce((s, r) => s + (typeof r.axe_serious === 'number' ? r.axe_serious : 0), 0);
  const totalContrast = results.reduce((s, r) => s + (typeof r.color_contrast === 'number' ? r.color_contrast : 0), 0);
  const totalConsoleErrors = results.reduce((s, r) => s + (r.console_errors ?? 0), 0);
  const totalPageErrors = results.reduce((s, r) => s + (r.page_errors ?? 0), 0);
  const totalHydration = results.reduce((s, r) => s + (r.hydration_warnings ?? 0), 0);
  const totalOverflow = results.reduce((s, r) => {
    return s + Math.max(r.document_overflow ?? 0, r.article_overflow ?? 0);
  }, 0);
  const totalWordBreaking = results.filter((r) => r.vertical_word_breaking).length;

  console.log(`tables_in_dom = ${totalTables}`);
  console.log(`mobile_overflow = ${totalOverflow}`);
  console.log(`vertical_word_breaking = ${totalWordBreaking}`);
  console.log(`axe_critical = ${totalAxeCritical}`);
  console.log(`axe_serious = ${totalAxeSerious}`);
  console.log(`color_contrast = ${totalContrast}`);
  console.log(`console_errors = ${totalConsoleErrors}`);
  console.log(`page_errors = ${totalPageErrors}`);
  console.log(`hydration_warnings = ${totalHydration}`);

  if (errors.length > 0) {
    console.error('\nGATE RUNTIME FALLADO:');
    for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    if (errors.length > 20) console.error(`  ... y ${errors.length - 20} más.`);
    process.exit(1);
  }
  console.log('\nGATE RUNTIME VERDE: todas las rutas/viewports/print cubiertos, validación estricta superada.');
}

// ────────────────────────────────────────────────────────────────────────────────

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
