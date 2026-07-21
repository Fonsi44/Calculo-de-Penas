#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const requestedTag = process.argv.find((value) => value.startsWith('--tag='))?.slice(6);
const MIGRATIONS = {
  '0032_fase1_admin_identidad_calendario': 1784390400000,
  '0033_fase1_calendario_version': 1784394000000,
};
const MIGRATION_TAG = requestedTag || '0032_fase1_admin_identidad_calendario';
const MIGRATION_WHEN = MIGRATIONS[MIGRATION_TAG];
if (!MIGRATION_WHEN) throw new Error('Migración no autorizada por este ejecutor');
if (process.env.ALLOW_TEST_DATABASE !== 'true' || process.env.E2E_ENV !== 'staging') {
  throw new Error('Guardas E2E incompletas');
}
const branchName = process.env.E2E_NEON_BRANCH_NAME || '';
const branchId = process.env.E2E_NEON_BRANCH_ID || '';
const expectedEndpoint = process.env.E2E_NEON_ENDPOINT_ID || '';
const productionEndpoint = process.env.E2E_NEON_PRODUCTION_ENDPOINT_ID || '';
if (!branchName || !branchId || !expectedEndpoint) {
  throw new Error('Metadatos Neon de staging incompletos o inválidos');
}

const url = new URL(process.env.DATABASE_URL);
const endpoint = url.hostname.split('.')[0].replace(/-pooler$/, '');
if (!url.hostname.endsWith('.neon.tech') || endpoint !== expectedEndpoint) {
  throw new Error('El endpoint no corresponde inequívocamente a una rama Neon aislada');
}

const migrationPath = new URL(`../../drizzle/migrations/${MIGRATION_TAG}.sql`, import.meta.url);
const source = await readFile(migrationPath, 'utf8');
const hash = createHash('sha256').update(source).digest('hex');

function splitStatements(sqlSource) {
  const clean = sqlSource.replaceAll('--> statement-breakpoint', '');
  const result = [];
  let current = '';
  let single = false;
  let double = false;
  let dollar = false;
  let lineComment = false;
  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (lineComment) {
      current += char;
      if (char === '\n') lineComment = false;
      continue;
    }
    if (!single && !double && !dollar && char === '-' && next === '-') {
      lineComment = true;
      current += char;
      continue;
    }
    if (!single && !double && char === '$' && next === '$') {
      dollar = !dollar;
      current += '$$';
      index += 1;
      continue;
    }
    if (!double && !dollar && char === "'" && clean[index - 1] !== '\\') single = !single;
    if (!single && !dollar && char === '"' && clean[index - 1] !== '\\') double = !double;
    if (!single && !double && !dollar && char === ';') {
      if (current.trim()) result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

const statements = splitStatements(source);

const sql = neon(process.env.DATABASE_URL);
const metadata = await sql`select current_setting('neon.branch_id', true) as branch_id`;
if (!metadata[0]?.branch_id || metadata[0].branch_id !== branchId) {
  throw new Error('PostgreSQL no confirma el Branch ID Neon esperado');
}
const existing = await sql`
  select to_regclass('drizzle.__drizzle_migrations') is not null as exists
`;
if (existing[0]?.exists) {
  const applied = await sql`
    select count(*)::int as count
    from drizzle.__drizzle_migrations
    where created_at = ${MIGRATION_WHEN} and hash = ${hash}
  `;
  if (applied[0]?.count === 1) {
    console.log(JSON.stringify({ ok: true, alreadyApplied: true, tag: MIGRATION_TAG }));
    process.exit(0);
  }
}

await sql.transaction((tx) => [
  tx`create schema if not exists drizzle`,
  tx`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `,
  ...statements.map((statement) => tx`${tx.unsafe(statement)}`),
  tx`
    insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${hash}, ${MIGRATION_WHEN})
  `,
], { isolationLevel: 'Serializable' });
console.log(JSON.stringify({
  ok: true,
  alreadyApplied: false,
  tag: MIGRATION_TAG,
  statements: statements.length,
  transaction: 'serializable',
}));
