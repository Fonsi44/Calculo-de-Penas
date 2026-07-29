import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { hashEditorialContent } from '../lib/editorial-signature';

type Row = {
  slug: string;
  category: string;
  body: string;
  published: boolean;
  review_status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_origin: string | null;
  signature_type: string | null;
  signature_name: string | null;
  signature_candidate: string | null;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
};

const APPLY = process.argv.includes('--apply');
const snapshotPath = resolve(
  process.argv.find((value) => value.startsWith('--snapshot='))?.slice(11)
    ?? '.local/editorial-signatures-before.json',
);
const allowlistPath = process.argv
  .find((value) => value.startsWith('--confirmed-slugs='))
  ?.slice('--confirmed-slugs='.length);
const databaseUrl = process.env.DATABASE_URL ?? '';

const REQUIRED_COLUMNS = [
  'review_origin',
  'signature_type',
  'signature_name',
  'signature_candidate',
  'reviewed_content_hash',
  'signature_valid',
] as const;
const allowedSigners = new Set([
  'Danilo Pineda Maradiaga',
  'Thania Marlene Paz',
  'Emil Barahona',
]);
const candidateByCategory: Record<string, string> = {
  'derecho-penal': 'Danilo Pineda Maradiaga',
  'derecho-laboral': 'Emil Barahona',
  'derecho-de-familia': 'Thania Marlene Paz',
  'derecho-civil': 'Thania Marlene Paz',
  'derecho-notarial': 'Thania Marlene Paz',
  'derecho-mercantil': 'Thania Marlene Paz',
  'derecho-administrativo': 'Thania Marlene Paz',
  'propiedad-intelectual': 'Thania Marlene Paz',
  'hondurenos-en-espana': 'Thania Marlene Paz',
};

function assertSafeConfiguration() {
  if (!databaseUrl || databaseUrl.includes('placeholder')) throw new Error('DATABASE_URL no configurada.');
  if (!APPLY) return;
  if (
    process.env.E2E_ENVIRONMENT !== 'staging'
    || process.env.ALLOW_TEST_DATABASE !== 'true'
    || (process.env.VERCEL_ENV ?? process.env.APP_ENV) === 'production'
  ) throw new Error('Aplicación bloqueada: solo se permite en una rama staging aislada.');
}

async function main() {
  assertSafeConfiguration();
  const confirmed = new Map<string, string>();
  if (allowlistPath) {
    for (const line of (await readFile(allowlistPath, 'utf8')).split(/\r?\n/).filter(Boolean)) {
      const [slug, signer] = line.split(',').map((value) => value.trim());
      if (!slug || !signer || !allowedSigners.has(signer)) {
        throw new Error(`Allowlist inválida: ${line}`);
      }
      confirmed.set(slug, signer);
    }
  }

  const sql = neon(databaseUrl);
  const metadata = await sql`
    SELECT current_setting('neon.branch_id', true) AS branch_id
  `;
  const branchId = String(metadata[0]?.branch_id ?? '');
  const expectedBranch = process.env.E2E_NEON_BRANCH_ID ?? '';
  const productionBranch = process.env.NEON_PRODUCTION_BRANCH_ID
    ?? process.env.E2E_NEON_PRODUCTION_BRANCH_ID
    ?? '';
  if (APPLY && (!branchId || (expectedBranch && branchId !== expectedBranch) || branchId === productionBranch)) {
    throw new Error('La identidad de la rama Neon staging no coincide o apunta a Production.');
  }

  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
  `;
  const existingColumns = new Set(columns.map((row) => String(row.column_name)));
  const missing = REQUIRED_COLUMNS.filter((column) => !existingColumns.has(column));
  if (missing.length) throw new Error(`Faltan columnas de migración 0059: ${missing.join(', ')}`);

  const rows = await sql`
    SELECT slug, category, body, published, review_status, reviewed_by, reviewed_at,
           review_origin, signature_type, signature_name, signature_candidate,
           reviewed_content_hash, signature_valid
    FROM blog_posts
    WHERE published = true
    ORDER BY slug
  ` as Row[];
  const plan = rows.map((row) => ({
    ...row,
    currentHash: hashEditorialContent(row.body),
    candidate: candidateByCategory[row.category] ?? null,
    signer: confirmed.get(row.slug) ?? null,
  }));

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      branchVerified: Boolean(branchId),
      schemaReady: true,
      productionWrites: 0,
      publishedArticles: plan.length,
      institutionalSignatures: plan.length,
      individualCandidates: plan.filter((item) => item.candidate).length,
      confirmedIndividualSignatures: plan.filter((item) => item.signer).length,
    }, null, 2));
    return;
  }

  const snapshot = {
    version: 1,
    createdAt: new Date().toISOString(),
    branchId,
    rowCount: rows.length,
    rows: rows.map(({ body, ...row }) => ({
      ...row,
      body_hash: hashEditorialContent(body),
    })),
  };
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });

  const results = await sql.transaction((tx) => plan.map((item) => tx`
    UPDATE blog_posts
    SET review_origin = ${item.signer ? 'individual_lawyer_review' : 'firm_historical_review'},
        signature_type = ${item.signer ? 'lawyer' : 'firm'},
        signature_name = ${item.signer ?? 'Pineda y Asociados'},
        signature_candidate = ${item.candidate},
        reviewed_content_hash = ${item.currentHash},
        signature_valid = true,
        review_status = ${item.signer ? 'published_lawyer_signed' : 'published_firm_reviewed'},
        reviewed_by = ${item.signer},
        reviewed_at = CASE WHEN ${item.signer}::text IS NULL THEN reviewed_at ELSE NOW() END
    WHERE slug = ${item.slug} AND published = true
    RETURNING slug
  `), { isolationLevel: 'Serializable' });
  const affected = results.reduce((total, result) => total + result.length, 0);
  if (affected !== plan.length) throw new Error(`Filas afectadas ${affected}; esperadas ${plan.length}.`);

  const verification = await sql`
    SELECT slug, body, review_origin, signature_type, signature_name,
           reviewed_content_hash, signature_valid, reviewed_by
    FROM blog_posts WHERE published = true
  `;
  const failures = verification.filter((row) => (
    row.review_origin !== (row.reviewed_by ? 'individual_lawyer_review' : 'firm_historical_review')
    || row.signature_type !== (row.reviewed_by ? 'lawyer' : 'firm')
    || row.signature_name !== (row.reviewed_by ?? 'Pineda y Asociados')
    || row.reviewed_content_hash !== hashEditorialContent(String(row.body))
    || row.signature_valid !== true
  ));
  if (failures.length) throw new Error(`Verificación posterior falló para ${failures.length} filas.`);

  console.log(JSON.stringify({
    mode: 'apply-staging',
    branchVerified: true,
    snapshot: snapshotPath,
    snapshotSha256: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
    affected,
    verified: verification.length,
    individualSignatures: verification.filter((row) => row.reviewed_by).length,
    transaction: 'serializable',
    idempotent: true,
  }, null, 2));
}

void main();
