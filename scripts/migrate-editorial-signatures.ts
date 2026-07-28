import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { hashEditorialContent } from '../lib/editorial-signature';

type Row = {
  slug: string;
  category: string;
  body: string;
  published: boolean;
  review_status: string | null;
};

const APPLY = process.argv.includes('--apply');
const allowlistPath = process.argv
  .find((value) => value.startsWith('--confirmed-slugs='))
  ?.slice('--confirmed-slugs='.length);

const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl || databaseUrl.includes('placeholder')) {
  throw new Error('DATABASE_URL no configurada.');
}
if (APPLY && (
  process.env.E2E_ENV !== 'staging'
  || process.env.ALLOW_TEST_DATABASE !== 'true'
  || (process.env.VERCEL_ENV ?? process.env.APP_ENV) === 'production'
)) {
  throw new Error('Aplicación bloqueada: solo se permite en una rama staging aislada.');
}

const CANDIDATE_BY_CATEGORY: Record<string, string> = {
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

async function main() {
const confirmed = new Map<string, string>();
if (allowlistPath) {
  const lines = (await readFile(allowlistPath, 'utf8')).split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const [slug, signer] = line.split(',').map((value) => value.trim());
    if (!slug || !signer) throw new Error(`Allowlist inválida: ${line}`);
    confirmed.set(slug, signer);
  }
}

const sql = neon(databaseUrl);
const rows = await sql`
  SELECT slug, category, body, published, review_status
  FROM blog_posts
  WHERE published = true
  ORDER BY slug
` as Row[];

const plan = rows.map((row) => ({
  slug: row.slug,
  reviewOrigin: 'firm_historical_review',
  signatureType: 'firm',
  signatureName: 'Pineda y Asociados',
  signatureCandidate: CANDIDATE_BY_CATEGORY[row.category] ?? null,
  reviewedContentHash: hashEditorialContent(row.body),
  individualSigner: confirmed.get(row.slug) ?? null,
}));

if (!APPLY) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    productionWrites: 0,
    publishedArticles: plan.length,
    institutionalSignatures: plan.length,
    individualCandidates: plan.filter((item) => item.signatureCandidate).length,
    confirmedIndividualSignatures: plan.filter((item) => item.individualSigner).length,
  }, null, 2));
  process.exit(0);
}

const allowedSigners = new Set([
  'Danilo Pineda Maradiaga',
  'Thania Marlene Paz',
  'Emil Barahona',
]);
for (const item of plan) {
  if (item.individualSigner && !allowedSigners.has(item.individualSigner)) {
    throw new Error(`${item.slug}: firmante no canónico en allowlist.`);
  }
}

await sql.transaction((tx) => plan.map((item) => {
  const signer = item.individualSigner;
  return tx`
    UPDATE blog_posts
    SET
      review_origin = ${signer ? 'individual_lawyer_review' : item.reviewOrigin},
      signature_type = ${signer ? 'lawyer' : item.signatureType},
      signature_name = ${signer ?? item.signatureName},
      signature_candidate = ${item.signatureCandidate},
      reviewed_content_hash = ${item.reviewedContentHash},
      signature_valid = true,
      review_status = ${signer ? 'published_lawyer_signed' : 'published_firm_reviewed'},
      reviewed_by = ${signer},
      reviewed_at = CASE WHEN ${signer}::text IS NULL THEN reviewed_at ELSE NOW() END,
      updated_at = updated_at
    WHERE slug = ${item.slug} AND published = true
  `;
}), { isolationLevel: 'Serializable' });

console.log(JSON.stringify({
  mode: 'apply-staging',
  updated: plan.length,
  transaction: 'serializable',
  rollback: 'transactional',
}, null, 2));
}

void main();
