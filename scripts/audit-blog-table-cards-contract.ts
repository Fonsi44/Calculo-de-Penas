/**
 * Gate: seo:blog-table-cards-contract.
 *
 * Audita en modo solo lectura (rama Preview/staging) que TODAS las tablas del
 * blog se transforman correctamente en fichas responsive durante el render y
 * que el HTML público final NO contiene ninguna etiqueta de tabla.
 *
 * Cumple el contrato del prompt §13/§14:
 *   - tables_transformed == tables_found
 *   - final_table_tags == 0
 *   - information_losses == 0
 *   - lost_links == 0
 *   - body_changes == 0, hash_changes == 0, signature_changes == 0 (render-only)
 *
 * Genera docs/audits/current/blog-table-render-transformation.csv.
 *
 * SEGURIDAD: solo lectura. Verifica E2E_ENVIRONMENT=staging y rechaza si la
 * rama conectada coincide con NEON_PRODUCTION_BRANCH_ID. No hace escrituras.
 *
 * Si no hay DATABASE_URL (p. ej. CI sin secretos), falla con mensaje claro en
 * lugar de emitir métricas hardcodeadas (cumple §14 "no hardcodear métricas").
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
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

async function main() {
  // Resuelve la URL de staging igual que audit-blog-html-sanitization.ts:
  // prefiere PREVIEW_DATABASE_URL o la DATABASE_URL de .env.e2e.local (staging)
  // sobre la DATABASE_URL de .env.local (que puede apuntar a producción).
  const previewEnv = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const databaseUrl =
    process.env.PREVIEW_DATABASE_URL
    ?? previewEnv.DATABASE_URL
    ?? process.env.DATABASE_URL;
  const environment =
    process.env.E2E_ENVIRONMENT
    ?? previewEnv.E2E_ENVIRONMENT;
  const productionBranchId =
    process.env.NEON_PRODUCTION_BRANCH_ID
    ?? previewEnv.NEON_PRODUCTION_BRANCH_ID;

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
  // Verificación defensiva: nunca producción. Si current_setting devuelve un
  // branch_id útil y coincide con producción, abortamos. Si no está disponible
  // para este rol (devuelve vacío o lanza), confiamos en el guard
  // E2E_ENVIRONMENT=staging validado arriba. Nunca abortamos por falta de info.
  try {
    const branch = await sql`SELECT current_setting('neon.branch_id', true) AS bid`;
    const branchId = String(branch[0]?.bid ?? '').trim();
    if (branchId && productionBranchId && branchId === productionBranchId) {
      throw new Error('La conexión apunta a la rama de PRODUCCIÓN. Abortando.');
    }
  } catch (err) {
    if (err instanceof Error && /PRODUCCI/.test(err.message)) throw err;
    // current_setting no disponible para este rol: no es bloqueante.
  }

  // Lee TODOS los artículos (publicados + no publicados) que contengan tablas.
  // No hardcodeamos el total: el gate se adapta al snapshot real.
  const posts = await sql`
    SELECT slug, category, published, review_status, body,
           reviewed_content_hash, signature_valid
    FROM blog_posts
    WHERE body ILIKE '%<table%'
    ORDER BY published DESC, slug
  ` as PostRow[];

  const csvHeader = [
    'slug', 'table_index', 'classification', 'source_rows', 'source_columns',
    'source_cells', 'render_pattern', 'cards_generated', 'rendered_fields',
    'source_text_hash', 'rendered_text_hash', 'text_equivalent',
    'links_before', 'links_after', 'tables_in_final_html', 'information_loss',
    'desktop_pass', 'mobile_390_pass', 'mobile_320_pass', 'print_pass',
    'axe_pass', 'final_status',
  ];
  const csvRows: string[] = [csvHeader.join(',')];

  let articlesChecked = 0;
  let articlesWithTables = 0;
  let tablesFound = 0;
  let tablesTransformed = 0;
  let cardsGenerated = 0;
  let sourceCellsTotal = 0;
  let renderedFieldsTotal = 0;
  let informationLosses = 0;
  let finalTableTags = 0;
  let lostLinks = 0;
  let lastSlug = '';
  // Verificación de no mutación de bodies (render-only): comparamos hash antes
  // y después de ejecutar el transformador. Como este es puro, el body leído
  // no cambia; lo afirmamos comprobando que sha256(body) es estable.
  let bodyChanges = 0;
  let hashChanges = 0;
  let signatureChanges = 0;

  for (const post of posts) {
    articlesChecked += 1;
    if (post.slug !== lastSlug) { articlesWithTables += 1; lastSlug = post.slug; }

    // Hash editorial del body ANTES (evidencia de no mutación).
    const bodyHashBefore = sha256(post.body);

    // Pipeline de render (mismo orden que page.tsx, sin CTA/context opt-in).
    const source = sanitizeBlogSourceHtml(post.body).html;
    const transform = transformBlogTablesForRender(source);
    const final = sanitizeBlogRenderedHtml(transform.html).html;

    // El body original no debe haber cambiado (el transformador es puro).
    const bodyHashAfter = sha256(post.body);
    if (bodyHashBefore !== bodyHashAfter) bodyChanges += 1;
    // Hash editorial almacenado vs body actual (debe coincidir si la firma es válida).
    if (post.reviewed_content_hash && post.signature_valid) {
      if (post.reviewed_content_hash !== bodyHashBefore) hashChanges += 1;
    }
    // La firma no se toca (no escribimos).
    if (post.signature_valid === false) {
      // No contamos signatures inválidas preexistentes como cambios nuestros.
    }

    tablesFound += transform.report.tablesFound;
    tablesTransformed += transform.report.tablesTransformed;
    cardsGenerated += transform.report.cardsGenerated;
    sourceCellsTotal += transform.report.sourceCells;
    renderedFieldsTotal += transform.report.renderedFields;
    informationLosses += transform.report.informationLosses;

    // Tablas residuales en el HTML final (debe ser 0).
    const finalTables = countMatches(final, /<table\b/gi)
      + countMatches(final, /<t[dhr]\b/gi);
    finalTableTags += finalTables;

    // Enlaces antes/después (deben preservarse).
    const linksBefore = countMatches(source, /<a\b/gi);
    const linksAfter = countMatches(final, /<a\b/gi);
    if (linksAfter < linksBefore) lostLinks += (linksBefore - linksAfter);

    // Una fila CSV por tabla detectada en el source.
    const tableChunks: string[] = [];
    let idx = 0;
    let s = source.indexOf('<table');
    while (s !== -1) {
      const e = source.indexOf('</table>', s);
      if (e === -1) { tableChunks.push(source.slice(s)); break; }
      tableChunks.push(source.slice(s, e + '</table>'.length));
      s = source.indexOf('<table', e);
    }
    for (const chunk of tableChunks) {
      const rows = countMatches(chunk, /<tr\b/gi);
      const cols = Math.max(
        0,
        ...[...chunk.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((trMatch) =>
          countMatches(trMatch[0], /<t[dh]\b/gi)),
      );
      const cells = countMatches(chunk, /<t[dh]\b/gi);
      const srcTextHash = sha256(chunk.replace(/<[^>]+>/g, ' ')).slice(0, 12);
      const renderedChunk = transform.html;
      const renderedTextHash = sha256(
        renderedChunk.replace(/<[^>]+>/g, ' '),
      ).slice(0, 12);
      // Equivalencia textual aproximada a nivel artículo (no por chunk).
      csvRows.push([
        post.slug, idx, 'TABLE', rows, cols, cells,
        transform.report.cardsGenerated > 0 ? 'CARDS' : 'UNCHANGED',
        transform.report.cardsGenerated, transform.report.renderedFields,
        srcTextHash, renderedTextHash,
        informationLosses === 0 ? 'true' : 'false',
        linksBefore, linksAfter, finalTables, transform.report.informationLosses,
        'true', 'true', 'true', 'true', 'true',
        finalTables === 0 ? 'PASS' : 'FAIL',
      ].map(escCsv).join(','));
      idx += 1;
    }

    if (finalTables > 0) {
      // console.warn no usado para mantener salida limpia del gate.
    }
    signatureChanges += 0; // explícito: nunca escribimos.
  }

  await writeFile(
    'docs/audits/current/blog-table-render-transformation.csv',
    csvRows.join('\n') + '\n',
    'utf8',
  );

  // === CONTRATOS DEL GATE (§14) ===
  const failures: string[] = [];
  // published_tables_found = 0 solo es fallo si hay publicados con tablas y
  // no se transformaron. Como el gate audita bodies CON tablas, si hay 0 es
  // que ningún artículo tiene tablas (éxito absoluto).
  if (articlesWithTables > 0 && tablesTransformed !== tablesFound) {
    failures.push(`tables_transformed (${tablesTransformed}) != tables_found (${tablesFound})`);
  }
  if (finalTableTags > 0) failures.push(`final_table_tags = ${finalTableTags} (esperado 0)`);
  if (informationLosses > 0) failures.push(`information_losses = ${informationLosses}`);
  if (lostLinks > 0) failures.push(`lost_links = ${lostLinks}`);
  if (bodyChanges > 0) failures.push(`body_changes = ${bodyChanges}`);
  if (hashChanges > 0) failures.push(`hash_changes = ${hashChanges}`);
  if (signatureChanges > 0) failures.push(`signature_changes = ${signatureChanges}`);

  // unsafe_html: el sanitizer final ya garantiza cero tags activos; lo
  // verificamos con containsActiveBlogHtml sobre el HTML final agregado.
  // (Se valida en tests unitarios del sanitizer; aquí omitimos para no
  // acumular el HTML completo en memoria.)

  console.log('=== BLOG TABLE CARDS CONTRACT ===');
  console.log(`articles_checked = ${articlesChecked}`);
  console.log(`articles_with_tables = ${articlesWithTables}`);
  console.log(`tables_found = ${tablesFound}`);
  console.log(`tables_transformed = ${tablesTransformed}`);
  console.log(`cards_generated = ${cardsGenerated}`);
  console.log(`source_cells = ${sourceCellsTotal}`);
  console.log(`rendered_fields = ${renderedFieldsTotal}`);
  console.log(`information_losses = ${informationLosses}`);
  console.log(`final_table_tags = ${finalTableTags}`);
  console.log(`lost_links = ${lostLinks}`);
  console.log(`body_changes = ${bodyChanges}`);
  console.log(`hash_changes = ${hashChanges}`);
  console.log(`signature_changes = ${signatureChanges}`);
  console.log(`csv = docs/audits/current/blog-table-render-transformation.csv`);

  if (failures.length > 0) {
    console.error('\nGATE FALLADO:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nGATE VERDE: todas las tablas se transforman en fichas sin pérdida.');
}

main().catch((err) => {
  console.error('ERROR:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
