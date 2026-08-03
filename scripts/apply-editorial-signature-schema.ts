import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

async function main() {
  const apply = process.argv.includes('--apply');
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!databaseUrl) throw new Error('DATABASE_URL no configurada.');
  if (apply && (
    process.env.E2E_ENVIRONMENT !== 'staging'
    || process.env.ALLOW_TEST_DATABASE !== 'true'
    || (process.env.VERCEL_ENV ?? process.env.APP_ENV) === 'production'
  )) throw new Error('Migración bloqueada fuera de staging aislado.');

  const sql = neon(databaseUrl);
  const metadata = await sql`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const branchId = String(metadata[0]?.branch_id ?? '');
  if (
    !branchId
    || (process.env.E2E_NEON_BRANCH_ID && branchId !== process.env.E2E_NEON_BRANCH_ID)
    || branchId === process.env.NEON_PRODUCTION_BRANCH_ID
  ) throw new Error('Rama Neon no verificada o coincide con Production.');

  const before = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
    ORDER BY ordinal_position
  `;
  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', branchVerified: true, columnsBefore: before.length }, null, 2));
    return;
  }

  const source = await readFile('drizzle/migrations/0059_blog_editorial_signatures.sql', 'utf8');
  const statements = source
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
  await sql.transaction((tx) => statements.map((statement) => tx`${tx.unsafe(statement)}`), {
    isolationLevel: 'Serializable',
  });

  const required = [
    'review_origin', 'signature_type', 'signature_name',
    'signature_candidate', 'reviewed_content_hash', 'signature_valid',
  ];
  const after = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
  `;
  const names = new Set(after.map((row) => String(row.column_name)));
  const missing = required.filter((column) => !names.has(column));
  if (missing.length) throw new Error(`Migración incompleta: ${missing.join(', ')}`);
  console.log(JSON.stringify({
    mode: 'apply-staging',
    branchVerified: true,
    statements: statements.length,
    columnsBefore: before.length,
    columnsAfter: after.length,
    requiredColumns: required.length,
  }, null, 2));
}

void main();
