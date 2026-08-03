/**
 * Auditoría de contenido público dinámico (inventario + política).
 *
 * Genera:
 *   - docs/seo/current/dynamic-content-inventory.csv      (inventario tipado)
 *   - docs/seo/current/dynamic-content-policy-audit.csv   (violaciones de política)
 *   - docs/seo/current/dynamic-content-manual-review.csv  (casos ambiguos)
 *
 * Alcance:
 *   - archivos versionados de contenido público (copy, FAQ, landings, CTA…);
 *   - seeds y fixtures sanitizados;
 *   - tablas de contenido administrable (blog_posts, faq_entries, page_content,
 *     configuracion_sitio) en local/staging, SOLO lectura.
 *
 * NUNCA escribe en producción. No modifica datos. Salida: exit 0 incluso si
 * encuentra violaciones (es un informe); exit 1 ante error interno.
 *
 * Uso:
 *   npx tsx scripts/audit-dynamic-content.ts [--env-file .env.e2e.local] [--json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  VERSIONED_CONTENT_SOURCES,
  csv,
  shortHash,
  scanVersionedFile,
  readPublicContentTables,
  inspectEnvironment,
  describeEnvironment,
  loadEnvFile,
  type ContentSource,
} from '@/scripts/lib/dynamic-content';
import { scanContentPolicyViolations, type ContentPolicyViolation } from '@/lib/content-policy';

/** Dedupe de violaciones por (código, fragmento) para reducir ruido. */
function dedupeViolations(
  violations: ContentPolicyViolation[],
): ContentPolicyViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}::${v.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs/seo/current');

interface AuditRecord {
  environment: string;
  table: string;
  record_id: string;
  field: string;
  route: string;
  violation: string;
  severity: string;
  match: string;
  before_hash: string;
  proposed_after_hash: string;
  automatic_or_manual: string;
  status: string;
}

function asAuditRecord(
  environment: string,
  table: string,
  recordId: string,
  field: string,
  route: string,
  v: ContentPolicyViolation,
  before: string,
  proposedAfter: string | null,
): AuditRecord {
  const automatic = v.code === 'prohibited_commercial_claim' && proposedAfter !== null;
  return {
    environment,
    table,
    record_id: recordId,
    field,
    route,
    violation: v.code,
    severity: v.severity,
    match: v.match,
    before_hash: shortHash(before),
    proposed_after_hash: proposedAfter !== null ? shortHash(proposedAfter) : '',
    automatic_or_manual: automatic ? 'automatic' : 'manual',
    status: 'OPEN',
  };
}

/** Reemplaza la primera ocurrencia del fragmento coincidente por la canónica. */
function proposeReplacement(content: string, v: ContentPolicyViolation): string | null {
  if (v.code !== 'prohibited_commercial_claim' || !v.suggestedReplacement) return null;
  const idx = content.indexOf(v.match);
  if (idx === -1) return null;
  return content.slice(0, idx) + v.suggestedReplacement + content.slice(idx + v.match.length);
}

/** Extrae todos los valores de string de un JSON (recursivo). */
function collectJsonStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectJsonStrings(item, out));
  else if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectJsonStrings(item, out));
  }
  return out;
}

async function main() {
  const envFile = process.argv.includes('--env-file')
    ? process.argv[process.argv.indexOf('--env-file') + 1]
    : '.env.local';
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  const environment = inspection.kind;

  mkdirSync(OUT_DIR, { recursive: true });

  // ── 1. Inventario tipado ────────────────────────────────────────────────
  const inventoryRows = VERSIONED_CONTENT_SOURCES.map((s) => ({
    source: s.source,
    table_or_file: s.table_or_file,
    field: s.field,
    public_route: s.public_route,
    content_type: s.content_type,
    editable_from_admin: s.editable_from_admin,
    validation_status: s.validation_status,
  }));
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-inventory.csv'),
    csv([
      'source', 'table_or_file', 'field', 'public_route',
      'content_type', 'editable_from_admin', 'validation_status',
    ], inventoryRows),
  );

  // ── 2. Escaneo de archivos versionados ──────────────────────────────────
  const records: AuditRecord[] = [];
  for (const src of VERSIONED_CONTENT_SOURCES) {
    if (src.source !== 'file' && src.source !== 'seed' && src.source !== 'fixture') continue;
    const path = join(ROOT, src.table_or_file);
    let violations: ContentPolicyViolation[];
    let before: string;
    try {
      before = readFileSync(path, 'utf8');
      if (src.table_or_file.endsWith('.json')) {
        // Escaneo por entrada de fixture: permite marcar fixture_only como
        // datos de prueba permitidos (§5.4) y localizar el slug.
        const parsed = JSON.parse(before) as {
          fixtures?: Array<{ slug: string; fixture_only?: boolean }>;
        };
        violations = [];
        for (const entry of parsed.fixtures ?? []) {
          const entryViolations = dedupeViolations(
            collectJsonStrings(entry).flatMap((s) =>
              scanContentPolicyViolations(s, {
                field: src.table_or_file,
                context: `/blog/* (fixture ${entry.slug})`,
                mode: 'script',
              })),
          );
          for (const v of entryViolations) {
            records.push(asAuditRecord(
              environment,
              src.table_or_file,
              entry.slug,
              '*',
              `/blog/* (fixture ${entry.slug})`,
              v,
              before,
              proposeReplacement(before, v),
            ));
            // Los fixtures fixture_only con claims se permiten (datos de
            // prueba aislados y no publicables).
            if (entry.fixture_only) records[records.length - 1].status = 'TEST_FIXTURE_ALLOWED';
          }
        }
        violations = [];
      } else {
        violations = dedupeViolations(scanVersionedFile(src.table_or_file, src.public_route));
      }
    } catch (err) {
      records.push({
        environment,
        table: src.table_or_file,
        record_id: '',
        field: '*',
        route: src.public_route,
        violation: 'scan_error',
        severity: 'warning',
        match: (err as Error).message.slice(0, 120),
        before_hash: '',
        proposed_after_hash: '',
        automatic_or_manual: 'manual',
        status: 'SCAN_ERROR',
      });
      continue;
    }
    for (const v of violations) {
      const proposed = proposeReplacement(before, v);
      records.push(asAuditRecord(environment, src.table_or_file, '', '*', src.public_route, v, before, proposed));
    }
  }

  // Fixtures marcados como datos de prueba (fixture_only) con claims: la
  // política §5.4 permite conservarlos si no pueden publicarse y están
  // ── 3. Lectura de tablas de contenido (local/staging, solo lectura) ─────
  const dbRead = await readPublicContentTables(envFile);
  if (dbRead.ok) {
    for (const row of dbRead.rows) {
      const violations = dedupeViolations(scanContentPolicyViolations(row.content, {
        field: `${row.table}.${row.field}`,
        context: row.route,
        mode: 'database',
      }));
      for (const v of violations) {
        const proposed = proposeReplacement(row.content, v);
        records.push(asAuditRecord(
          environment,
          row.table,
          row.record_id,
          row.field,
          row.route,
          v,
          row.content,
          proposed,
        ));
      }
    }
  } else {
    records.push({
      environment,
      table: 'database',
      record_id: '',
      field: '*',
      route: '*',
      violation: 'db_unavailable',
      severity: 'warning',
      match: dbRead.reason ?? 'no reason',
      before_hash: '',
      proposed_after_hash: '',
      automatic_or_manual: 'manual',
      status: 'SKIPPED_WITH_REASON',
    });
  }

  // ── 4. Salidas ──────────────────────────────────────────────────────────
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-policy-audit.csv'),
    csv([
      'environment', 'table', 'record_id', 'field', 'route', 'violation',
      'severity', 'match', 'before_hash', 'proposed_after_hash',
      'automatic_or_manual', 'status',
    ], records),
  );

  const manual = records.filter((r) => r.status === 'OPEN' && r.automatic_or_manual === 'manual');
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-manual-review.csv'),
    csv([
      'environment', 'table', 'record_id', 'field', 'route', 'violation',
      'severity', 'match', 'suggested_replacement', 'decision',
    ], manual.map((r) => ({
      ...r,
      suggested_replacement: '',
      decision: 'PENDING_HUMAN_REVIEW',
    }))),
  );

  const automaticCount = records.filter((r) => r.automatic_or_manual === 'automatic').length;
  const openCount = records.filter((r) => r.status === 'OPEN').length;
  const skipped = records.filter((r) => r.status === 'SKIPPED_WITH_REASON');

  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Auditoría de contenido dinámico');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Entorno: ${describeEnvironment(inspection)}`);
  console.log(`Inventario: ${inventoryRows.length} fuentes`);
  console.log(`Violaciones OPEN: ${openCount} (automáticas: ${automaticCount})`);
  if (skipped.length) {
    console.log(`⚠ ${skipped.length} fila(s) omitida(s): ${skipped[0].match}`);
  }
  console.log('Salidas:');
  console.log(`  ${join('docs/seo/current/dynamic-content-inventory.csv')}`);
  console.log(`  ${join('docs/seo/current/dynamic-content-policy-audit.csv')}`);
  console.log(`  ${join('docs/seo/current/dynamic-content-manual-review.csv')}`);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      environment,
      inventory: inventoryRows.length,
      open: openCount,
      automatic: automaticCount,
      manual: manual.length,
      skipped: skipped.length,
    }, null, 2));
  }
}

main().catch((error) => {
  console.error('[audit-dynamic-content] Error:', error);
  process.exit(1);
});
