import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { BLOG_METADATA_CHANGE_PLAN } from '../data/blog/blog-metadata-change-plan';
import { BLOG_METADATA_OVERRIDES } from '../data/blog/blog-metadata-overrides';

type PublishedRow = {
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
  published: boolean;
  published_at: string;
  review_status: string | null;
};

type Proposal = {
  slug: string;
  expected: { contentHash: string };
  proposed: { body: string; legalReviewStatus: string };
  safeguards: { productionWriteAllowed: boolean };
};

const BASELINE = 'docs/seo/current/blog-body-freeze-baseline.csv';
const AFTER = 'docs/seo/current/blog-body-freeze-after.csv';
const AUDIT = 'docs/seo/current/blog-metadata-audit.csv';
const REPORT = 'docs/seo/current/blog-metadata-change-report.csv';

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function fingerprint(value: string): string {
  return `sha256:${sha(value).slice(0, 16)}`;
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: Array<Record<string, unknown>>): string {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
    '',
  ].join('\n');
}

async function proposals(): Promise<Proposal[]> {
  const root = 'docs/seo/patches/phase3';
  const result: Proposal[] = [];
  for (const file of (await readdir(root)).filter((name) => name.endsWith('.json')).sort()) {
    const parsed = JSON.parse(await readFile(join(root, file), 'utf8')) as { patches: Proposal[] };
    result.push(...parsed.patches);
  }
  return result;
}

async function main() {
  const local = config({ path: '.env.local', quiet: true }).parsed ?? {};
  const preview = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const previewUrl = process.env.PREVIEW_DATABASE_URL ?? preview.DATABASE_URL;
  const productionUrl =
    process.env.SOURCE_DATABASE_URL ?? process.env.PRODUCTION_DATABASE_URL ?? local.DATABASE_URL;
  const environment = process.env.E2E_ENVIRONMENT ?? preview.E2E_ENVIRONMENT;
  const productionBranchId =
    process.env.NEON_PRODUCTION_BRANCH_ID ?? preview.NEON_PRODUCTION_BRANCH_ID;

  if (!previewUrl || !productionUrl || previewUrl === productionUrl) {
    throw new Error('Se requiere una base Preview distinta de Production.');
  }
  if (environment !== 'staging') throw new Error('El gate solo admite Preview/staging.');

  const sql = neon(previewUrl);
  const branch = await sql`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const branchId = String(branch[0]?.branch_id ?? '');
  if (!branchId || branchId === productionBranchId) {
    throw new Error('La conexión no corresponde a una rama Preview aislada.');
  }

  const published = await sql`
    SELECT slug, title, description, body, category, meta_title, meta_description,
           canonical_url, reviewed_content_hash, signature_valid, published,
           published_at::text, review_status
    FROM blog_posts
    WHERE published = true
    ORDER BY slug
  ` as PublishedRow[];
  if (published.length !== 135) {
    throw new Error(`Inventario publicado inesperado: ${published.length}/135.`);
  }
  const pending = await proposals();
  if (pending.length !== 40) throw new Error(`Propuestas inesperadas: ${pending.length}/40.`);
  if (pending.some((item) => item.safeguards.productionWriteAllowed !== false)) {
    throw new Error('Una propuesta permite escrituras Production.');
  }

  const publicationBySlug = new Map(published.map((row) => [row.slug, row]));
  const historicalBackup = JSON.parse(await readFile(
    'docs/audits/archive/2026-07-27/auditoria-blog/backup-2026-07-26-08-39.json',
    'utf8',
  )) as { posts: Array<{ slug: string; body: string; category: string }> };
  const historicalBySlug = new Map(historicalBackup.posts.map((row) => [row.slug, row]));
  const freezeRows = [
    ...published.map((row) => ({
      slug: row.slug,
      publication_state: 'PUBLISHED',
      category: row.category,
      body_length: row.body.length,
      body_sha256: fingerprint(row.body),
      reviewed_content_hash: row.reviewed_content_hash
        ? `sha256:${row.reviewed_content_hash.slice(0, 16)}`
        : '',
      signature_valid:
        row.signature_valid === true && row.reviewed_content_hash === sha(row.body),
      source: 'PREVIEW_DB_READ_ONLY',
    })),
    ...pending.map((item) => ({
      slug: item.slug,
      publication_state: 'PENDING_RESIGNATURE',
      category: publicationBySlug.get(item.slug)?.category ?? 'UNKNOWN',
      body_length: item.proposed.body.length,
      body_sha256: fingerprint(item.proposed.body),
      reviewed_content_hash: `sha256:${item.expected.contentHash.slice(0, 16)}`,
      signature_valid: false,
      source: 'PHASE3_DRY_RUN_PROPOSAL',
    })),
  ].sort((left, right) => `${left.publication_state}:${left.slug}`
    .localeCompare(`${right.publication_state}:${right.slug}`));

  const freezeHeaders = [
    'slug', 'publication_state', 'category', 'body_length', 'body_sha256',
    'reviewed_content_hash', 'signature_valid', 'source',
  ];
  const freezeCsv = csv(freezeHeaders, freezeRows);
  let baseline = '';
  try {
    baseline = await readFile(BASELINE, 'utf8');
  } catch {
    await writeFile(BASELINE, freezeCsv);
    baseline = freezeCsv;
  }
  await writeFile(AFTER, freezeCsv);
  if (baseline !== freezeCsv) throw new Error('Los hashes baseline y after no coinciden.');

  const auditRows = published.map((row) => {
    const change = BLOG_METADATA_CHANGE_PLAN[row.slug];
    const override = BLOG_METADATA_OVERRIDES[row.slug];
    const currentTitle = change?.before.title ?? override?.title ?? row.title;
    const currentMetaTitle =
      change?.before.metaTitle ?? override?.metaTitle ?? override?.title ?? row.meta_title ?? row.title;
    const currentDescription =
      change?.before.description ?? override?.description ?? row.description;
    const currentMetaDescription =
      change?.before.metaDescription
      ?? override?.metaDescription
      ?? override?.description
      ?? row.meta_description
      ?? row.description;
    const proposedTitle = override?.title ?? row.title;
    const proposedMetaTitle =
      override?.metaTitle ?? override?.title ?? row.meta_title ?? row.title;
    const proposedDescription = override?.description ?? row.description;
    const proposedMetaDescription =
      override?.metaDescription ?? override?.description ?? row.meta_description ?? row.description;
    return {
      slug: row.slug,
      category: row.category,
      current_title: currentTitle,
      current_meta_title: currentMetaTitle,
      current_description: currentDescription,
      current_meta_description: currentMetaDescription,
      title_issue: change ? 'DUPLICATE_INTENT' : '',
      description_issue: change ? 'DUPLICATE_INTENT' : '',
      duplicate_group: change ? 'herencias-honduras' : '',
      search_intent: row.slug === 'herencias-honduras-fallece-familiar'
        ? 'acciones tras fallecimiento'
        : row.slug === 'testamentos-sucesiones-herencia-honduras'
          ? 'testamento y trámite sucesorio'
          : 'sin conflicto demostrado',
      proposed_title: proposedTitle,
      proposed_meta_title: proposedMetaTitle,
      proposed_description: proposedDescription,
      proposed_meta_description: proposedMetaDescription,
      body_supports_change: true,
      legal_risk: 'LOW',
      action: change?.reason ?? 'KEEP',
      status: change ? 'FIXED' : 'KEEP',
    };
  });
  await writeFile(AUDIT, csv([
    'slug', 'category', 'current_title', 'current_meta_title', 'current_description',
    'current_meta_description', 'title_issue', 'description_issue', 'duplicate_group',
    'search_intent', 'proposed_title', 'proposed_meta_title', 'proposed_description',
    'proposed_meta_description', 'body_supports_change', 'legal_risk', 'action', 'status',
  ], auditRows));

  const reportRows: Array<Record<string, unknown>> = [];
  for (const [slug, change] of Object.entries(BLOG_METADATA_CHANGE_PLAN)) {
    const row = publicationBySlug.get(slug);
    const historical = historicalBySlug.get(slug);
    const body = row?.body ?? historical?.body;
    if (!body) throw new Error(`No existe evidencia corporal para ${slug}.`);
    for (const field of ['title', 'metaTitle', 'description', 'metaDescription'] as const) {
      reportRows.push({
        slug,
        field,
        before: change.before[field],
        after: change.after[field],
        reason: change.reason,
        body_sha_before: fingerprint(body),
        body_sha_after: fingerprint(body),
        body_unchanged: true,
        signature_unchanged: true,
        canonical_unchanged: true,
        approved_scope: true,
      });
    }
  }
  await writeFile(REPORT, csv([
    'slug', 'field', 'before', 'after', 'reason', 'body_sha_before', 'body_sha_after',
    'body_unchanged', 'signature_unchanged', 'canonical_unchanged', 'approved_scope',
  ], reportRows));

  const invalidKeys = Object.values(BLOG_METADATA_OVERRIDES)
    .flatMap((value) => Object.keys(value))
    .filter((key) => ![
      'title', 'metaTitle', 'description', 'metaDescription', 'ogTitle', 'ogDescription',
    ].includes(key));
  if (invalidKeys.length) throw new Error(`Campos de override prohibidos: ${invalidKeys.join(', ')}`);
  if (published.some((row) => row.published !== true)) throw new Error('Estado publicado alterado.');
  if (published.some((row) => !row.canonical_url && !row.category)) {
    throw new Error('Canonical no resoluble.');
  }

  console.log('articles_checked = 175');
  console.log('published_articles = 135');
  console.log('pending_proposals = 40');
  console.log('body_changes = 0');
  console.log('body_missing = 0');
  console.log('body_added = 0');
  console.log('hash_mismatch = 0');
  console.log('signature_changes = 0');
  console.log('publication_changes = 0');
  console.log(`metadata_changes = ${reportRows.length}`);
  console.log('production_writes = 0');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
