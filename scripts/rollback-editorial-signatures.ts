import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { hashEditorialContent } from '../lib/editorial-signature';

async function main() {
const APPLY = process.argv.includes('--apply');
const snapshotArg = process.argv.find((value) => value.startsWith('--snapshot='))?.slice(11);
if (!snapshotArg) throw new Error('--snapshot es obligatorio.');
const snapshot = JSON.parse(await readFile(resolve(snapshotArg), 'utf8'));
const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl) throw new Error('DATABASE_URL no configurada.');
if (APPLY && (
  process.env.E2E_ENVIRONMENT !== 'staging'
  || process.env.ALLOW_TEST_DATABASE !== 'true'
  || (process.env.VERCEL_ENV ?? process.env.APP_ENV) === 'production'
)) throw new Error('Rollback bloqueado fuera de staging aislado.');

const sql = neon(databaseUrl);
const metadata = await sql`SELECT current_setting('neon.branch_id', true) AS branch_id`;
const branchId = String(metadata[0]?.branch_id ?? '');
if (!branchId || branchId !== snapshot.branchId || branchId === process.env.NEON_PRODUCTION_BRANCH_ID) {
  throw new Error('Snapshot y rama Neon no coinciden o la rama es Production.');
}
const current = await sql`SELECT slug, body FROM blog_posts WHERE published = true`;
const hashes = new Map(current.map((row) => [String(row.slug), hashEditorialContent(String(row.body))]));
const drift = snapshot.rows.filter((row: { slug: string; body_hash: string }) => hashes.get(row.slug) !== row.body_hash);
if (drift.length) throw new Error(`Rollback bloqueado: ${drift.length} cuerpos cambiaron desde el snapshot.`);

if (!APPLY) {
  console.log(JSON.stringify({ mode: 'dry-run', branchVerified: true, restorable: snapshot.rows.length, drift: 0 }, null, 2));
} else {
  const results = await sql.transaction((tx) => snapshot.rows.map((row: Record<string, unknown>) => tx`
    UPDATE blog_posts SET
      review_status = ${row.review_status},
      reviewed_by = ${row.reviewed_by},
      reviewed_at = ${row.reviewed_at},
      review_origin = ${row.review_origin},
      signature_type = ${row.signature_type},
      signature_name = ${row.signature_name},
      signature_candidate = ${row.signature_candidate},
      reviewed_content_hash = ${row.reviewed_content_hash},
      signature_valid = ${row.signature_valid}
    WHERE slug = ${row.slug} AND published = true
    RETURNING slug
  `), { isolationLevel: 'Serializable' });
  const restored = results.reduce((total, result) => total + result.length, 0);
  if (restored !== snapshot.rows.length) throw new Error(`Rollback incompleto: ${restored}/${snapshot.rows.length}.`);
  console.log(JSON.stringify({ mode: 'rollback-staging', restored, drift: 0, transaction: 'serializable' }, null, 2));
}
}

void main();
