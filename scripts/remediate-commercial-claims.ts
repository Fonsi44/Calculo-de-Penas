/**
 * Patch de remediación de claims comerciales en contenido dinámico (DB).
 *
 * Modo por defecto: DRY-RUN (no escribe nada).
 *
 * Genera artefactos deterministas listos para ejecutar después en producción
 * con autorización humana:
 *   - docs/seo/current/dynamic-content-remediation.json     (patch + precondiciones)
 *   - docs/seo/current/dynamic-content-remediation-backup.json  (respaldo lógico)
 *   - docs/seo/current/dynamic-content-remediation-rollback.json (operación de rollback)
 *   - docs/seo/current/dynamic-content-manual-review.csv    (casos ambiguos)
 *
 * Requisitos de seguridad (AGENTS.md §11 / PROMPT 2 §5.3 y §11):
 *   - rechaza producción y entornos desconocidos (fail-closed);
 *   - no escribe sin --apply (y --apply NO se usa en esta intervención);
 *   - transacción, idempotencia, verificación de hash previo (aborta si la
 *     fila cambió desde la auditoría), respaldo y rollback;
 *   - logs sin secretos; no copia datos personales innecesarios (el body del
 *     blog es contenido público, no datos personales).
 *
 * Uso:
 *   npx tsx scripts/remediate-commercial-claims.ts --env-file .env.e2e.local        # dry-run
 *   npx tsx scripts/remediate-commercial-claims.ts --env-file .env.e2e.local --apply # NO usar aquí
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import {
  inspectEnvironment,
  assertAllowedEnvironment,
  describeEnvironment,
  loadEnvFile,
} from '@/scripts/lib/environment-guard';
import {
  scanProhibitedClaims,
  remediateProhibitedClaims,
} from '@/lib/marketing-policy';
import { shortHash } from '@/scripts/lib/dynamic-content';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs/seo/current');

/** Claims simples de frase nominal con reemplazo inequívoco. */
export const SIMPLE_CLAIM_NORMALIZED = new Set([
  'consulta gratuita',
  'consulta gratis',
  'consulta sin costo',
  'consulta inicial gratuita',
  'consulta inicial sin costo',
  'evaluación gratuita',
  'evaluación inicial gratuita',
  'primera consulta gratuita',
  'primera consulta gratis',
  'primera consulta sin costo',
]);

export const normalize = (s: string) => s.toLocaleLowerCase('es-HN').replace(/\s+/g, ' ').trim();

export interface RemediacionOp {
  table: string;
  record_id: string;
  field: string;
  route: string;
  before_hash: string;
  after_hash: string;
  before_excerpt: string;
  after_excerpt: string;
  replacements: number;
  automatic: boolean;
}

interface AffectedRow {
  table: string;
  record_id: string;
  field: string;
  route: string;
  content: string;
  ops: RemediacionOp[];
}

function excerpt(text: string, max = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function classifyAndPropose(content: string, route: string, table: string, recordId: string, field: string): RemediacionOp | null {
  const matches = scanProhibitedClaims(content);
  if (matches.length === 0) return null;
  const proposed = remediateProhibitedClaims(content);
  if (proposed.replacements === 0) return null;
  const allSimple = matches.every((m) => SIMPLE_CLAIM_NORMALIZED.has(normalize(m.matched)));
  return {
    table,
    record_id: recordId,
    field,
    route,
    before_hash: shortHash(content),
    after_hash: shortHash(proposed.text),
    before_excerpt: excerpt(content),
    after_excerpt: excerpt(proposed.text),
    replacements: proposed.replacements,
    automatic: allSimple,
  };
}

async function collectAffectedRows(): Promise<AffectedRow[]> {
  const url = process.env.DATABASE_URL;
  const sql: NeonQueryFunction<false, false> = neon(url!);
  const affected: AffectedRow[] = [];

  const posts = (await sql`select id, slug, category, title, description, body, meta_title, meta_description from blog_posts`) as Array<{
    id: string; slug: string; category: string; title: string; description: string;
    body: string; meta_title: string | null; meta_description: string | null;
  }>;
  for (const p of posts) {
    const route = `/blog/${p.category}/${p.slug}`;
    for (const [field, content] of Object.entries({
      title: p.title,
      description: p.description,
      body: p.body,
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
    })) {
      const op = classifyAndPropose(content, route, 'blog_posts', p.id, field);
      if (op) affected.push({ table: 'blog_posts', record_id: p.id, field, route, content, ops: [op] });
    }
  }

  const faq = (await sql`
    select id, question, answer, category from faq_entries`) as Array<{ id: string; question: string; answer: string; category: string }>;
  for (const r of faq) {
    const route = `/preguntas-frecuentes#${r.category}`;
    for (const [field, content] of Object.entries({ question: r.question, answer: r.answer })) {
      const op = classifyAndPropose(content, route, 'faq_entries', r.id, field);
      if (op) affected.push({ table: 'faq_entries', record_id: r.id, field, route, content, ops: [op] });
    }
  }

  const pc = (await sql`
    select id, page, section, field, content from page_content`) as Array<{ id: string; page: string; section: string; field: string; content: string }>;
  for (const r of pc) {
    const route = `/${r.page}`;
    const op = classifyAndPropose(r.content, route, 'page_content', r.id, `${r.section}.${r.field}`);
    if (op) affected.push({ table: 'page_content', record_id: r.id, field: `${r.section}.${r.field}`, route, content: r.content, ops: [op] });
  }

  const conf = (await sql`
    select id, clave, valor from configuracion_sitio`) as Array<{ id: string; clave: string; valor: string }>;
  for (const r of conf) {
    const op = classifyAndPropose(r.valor, 'global', 'configuracion_sitio', r.id, r.clave);
    if (op) affected.push({ table: 'configuracion_sitio', record_id: r.id, field: r.clave, route: 'global', content: r.valor, ops: [op] });
  }

  return affected;
}

function generateArtifacts(affected: AffectedRow[], dryRun: boolean, inspection: ReturnType<typeof inspectEnvironment>) {
  const ops = affected.flatMap((a) => a.ops);
  const automatic = ops.filter((o) => o.automatic);
  const manual = ops.filter((o) => !o.automatic);

  const manifest = {
    schema_version: 1,
    environment: inspection.kind,
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    tool: 'content:remediate-commercial-claims',
    tables: [...new Set(ops.map((o) => o.table))],
    rows_affected: affected.length,
    operations_total: ops.length,
    automatic_operations: automatic.length,
    manual_review_operations: manual.length,
    preconditions: {
      not_production: true,
      hash_must_match_before_apply: true,
      idempotent: true,
      transactional: true,
    },
  };

  const patch = {
    ...manifest,
    operations: automatic.map((o) => ({
      table: o.table,
      record_id: o.record_id,
      field: o.field,
      route: o.route,
      before_hash: o.before_hash,
      after_hash: o.after_hash,
      replacements: o.replacements,
    })),
  };

  const backup = {
    schema_version: 1,
    environment: inspection.kind,
    generated_at: new Date().toISOString(),
    purpose: 'Respaldo lógico de filas afectadas para rollback. El body del blog es contenido público, no datos personales.',
    rows: affected.map((a) => ({
      table: a.table,
      record_id: a.record_id,
      field: a.field,
      route: a.route,
      content_hash: shortHash(a.content),
      content: a.content,
    })),
  };

  const rollback = {
    schema_version: 1,
    environment: inspection.kind,
    generated_at: new Date().toISOString(),
    purpose: 'Operación de rollback: restaura los valores originales (hash verificado).',
    operations: affected.map((a) => ({
      table: a.table,
      record_id: a.record_id,
      field: a.field,
      restore_hash: shortHash(a.content),
      restore_content: a.content,
    })),
  };

  writeFileSync(
    join(OUT_DIR, 'dynamic-content-remediation.json'),
    JSON.stringify(patch, null, 2) + '\n',
  );
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-remediation-backup.json'),
    JSON.stringify(backup, null, 2) + '\n',
  );
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-remediation-rollback.json'),
    JSON.stringify(rollback, null, 2) + '\n',
  );
  writeFileSync(
    join(OUT_DIR, 'dynamic-content-manual-review.csv'),
    [
      'environment,table,record_id,field,route,match,suggested_replacement,decision',
      ...manual.map((o) => [
        inspection.kind, o.table, o.record_id, o.field, o.route,
        o.before_excerpt, 'Evaluación inicial confidencial', 'PENDING_HUMAN_REVIEW',
      ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')),
    ].join('\n') + '\n',
  );

  return { automatic, manual, manifest };
}

/** Columnas permitidas por tabla (whitelist; evita identificadores dinámicos). */
const TABLE_FIELDS: Record<string, string[]> = {
  blog_posts: ['title', 'description', 'body', 'meta_title', 'meta_description'],
  faq_entries: ['question', 'answer'],
  page_content: ['content'],
  configuracion_sitio: ['valor'],
};

export function isAllowedField(table: string, field: string): boolean {
  return (TABLE_FIELDS[table] ?? []).includes(field);
}

/**
 * Aplica el patch en una transacción. Verifica hash previo por fila; si una
 * fila cambió desde la auditoría, aborta ANTES de escribir (rollback lógico:
 * nada se modifica) con salida != 0. Idempotente: no duplica cambios.
 *
 * Solo se tocan tablas/columnas de la whitelist (sin identificadores
 * dinámicos) y los valores van parametrizados. La transacción ejecuta el
 * lote de UPDATEs de forma atómica (todo o nada) mediante el estilo por
 * array de @neondatabase/serverless.
 */
export async function applyPatch(affected: AffectedRow[]): Promise<{ applied: number; verified: number }> {
  const url = process.env.DATABASE_URL;
  const sql: NeonQueryFunction<false, false> = neon(url!);
  const ops = affected.flatMap((a) => a.ops).filter((o) => o.automatic);
  if (ops.length === 0) return { applied: 0, verified: 0 };
  for (const op of ops) {
    if (!isAllowedField(op.table, op.field)) {
      throw new Error(`[remediate] columna no permitida: ${op.table}.${op.field}`);
    }
  }

  // 1. Pre-verificación de hash (aborta sin escribir si la fila cambió).
  const currents = new Map<string, string>();
  for (const op of ops) {
    const rows = (await sql`select ${sql.unsafe(op.field)} as val from ${sql.unsafe(op.table)} where id = ${op.record_id}`) as Array<{ val: string | null }>;
    const current = rows[0]?.val as string | undefined;
    if (current === undefined) {
      throw new Error(`[remediate] fila no encontrada: ${op.table}/${op.record_id}/${op.field}`);
    }
    if (shortHash(current) !== op.before_hash) {
      throw new Error(
        `[remediate] hash no coincide (la fila cambió desde la auditoría): `
        + `${op.table}/${op.record_id}/${op.field}. Abortando.`,
      );
    }
    currents.set(`${op.table}::${op.record_id}::${op.field}`, current);
  }

  // 2. Construir el lote de UPDATEs (solo los que realmente cambian).
  const statements: Array<ReturnType<NeonQueryFunction<false, false>>> = [];
  for (const op of ops) {
    const current = currents.get(`${op.table}::${op.record_id}::${op.field}`)!;
    const proposed = remediateProhibitedClaims(current);
    if (proposed.replacements === 0) continue; // idempotente: ya remediado
    statements.push(
      sql`update ${sql.unsafe(op.table)} set ${sql.unsafe(op.field)} = ${proposed.text} where id = ${op.record_id}`,
    );
  }

  // 3. Transacción atómica (todo o nada).
  if (statements.length > 0) {
    await sql.transaction(statements);
  }
  return { applied: statements.length, verified: ops.length };
}

async function main() {
  const envFile = process.argv.includes('--env-file')
    ? process.argv[process.argv.indexOf('--env-file') + 1]
    : '.env.local';
  const apply = process.argv.includes('--apply');
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  // Bloquea producción y entornos desconocidos SIEMPRE (incluso dry-run, para
  // no generar artefactos contra producción).
  assertAllowedEnvironment('content:remediate-commercial-claims', { write: true });

  mkdirSync(OUT_DIR, { recursive: true });
  const affected = await collectAffectedRows();
  const { automatic, manual, manifest } = generateArtifacts(affected, !apply, inspection);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Remediation de claims comerciales (contenido dinámico)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Entorno: ${describeEnvironment(inspection)}`);
  console.log(`Modo: ${apply ? 'APPLY (transacción)' : 'DRY-RUN (sin escrituras)'}`);
  console.log(`Filas afectadas: ${affected.length}`);
  console.log(`Operaciones automáticas: ${automatic.length}`);
  console.log(`Operaciones manuales (revisión): ${manual.length}`);
  for (const op of automatic) {
    console.log(`  [auto] ${op.table}/${op.record_id} ${op.field} @ ${op.route}`);
    console.log(`         before: ${op.before_excerpt}`);
    console.log(`         after : ${op.after_excerpt}`);
  }
  for (const op of manual) {
    console.log(`  [manual] ${op.table}/${op.record_id} ${op.field} @ ${op.route}: ${op.before_excerpt}`);
  }

  if (apply) {
    console.log('\n Aplicando patch en transacción…');
    const result = await applyPatch(affected);
    console.log(` Aplicadas: ${result.applied}, verificadas: ${result.verified}`);
    console.log('✅ Patch aplicado (entorno local/staging autorizado).');
  } else {
    console.log('\n Artefactos generados (sin escrituras):');
    console.log('  docs/seo/current/dynamic-content-remediation.json');
    console.log('  docs/seo/current/dynamic-content-remediation-backup.json');
    console.log('  docs/seo/current/dynamic-content-remediation-rollback.json');
    console.log('  docs/seo/current/dynamic-content-manual-review.csv');
    console.log('\n No se ejecutó ninguna escritura. Revisar manuales y aprobar antes de producción.');
  }
}

const isEntry = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main().catch((error) => {
    console.error('[remediate-commercial-claims]', (error as Error).message);
    process.exit(1);
  });
}
