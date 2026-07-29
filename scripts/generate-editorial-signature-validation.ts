import 'dotenv/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { hashEditorialContent } from '../lib/editorial-signature';

function csv(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function proposalFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const area of await readdir(root)) {
    for (const file of await readdir(join(root, area))) {
      if (file.endsWith('.json')) files.push(join(root, area, file));
    }
  }
  return files;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!databaseUrl || process.env.EDITORIAL_SIGNATURE_SCHEMA_READY !== 'true') {
    throw new Error('La validación requiere staging en MIGRATED_SIGNATURE_MODE.');
  }
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT slug, published, body, review_origin, signature_type, signature_name,
           reviewed_content_hash, signature_valid, signature_candidate,
           noindex, canonical_url
    FROM blog_posts WHERE published = true ORDER BY slug
  `;
  const validation = rows.map((row) => {
    const currentHash = hashEditorialContent(String(row.body));
    const hashMatches = row.reviewed_content_hash === currentHash;
    const indexable = row.signature_valid === true && hashMatches && row.noindex !== true;
    return [
      row.slug, row.published, row.review_origin, row.signature_type,
      row.signature_name, row.reviewed_content_hash, currentHash, hashMatches,
      row.signature_valid, indexable, indexable && !row.canonical_url,
      row.signature_candidate, indexable ? 'VALID' : 'BLOCKED',
    ];
  });
  const header = [
    'slug', 'published', 'review_origin', 'signature_type', 'signature_name',
    'stored_hash', 'current_hash', 'hash_matches', 'signature_valid',
    'indexable', 'sitemap', 'individual_candidate', 'status',
  ];
  await writeFile(
    'docs/seo/current/editorial-signature-validation.csv',
    `${header.map(csv).join(',')}\n${validation.map((row) => row.map(csv).join(',')).join('\n')}\n`,
  );

  const productionBySlug = new Map(rows.map((row) => [String(row.slug), row]));
  const proposals = [];
  for (const path of await proposalFiles('data/seo/article-editorial-proposals')) {
    const proposal = JSON.parse(await readFile(path, 'utf8'));
    const production = productionBySlug.get(proposal.slug);
    const productionHash = production ? hashEditorialContent(String(production.body)) : '';
    const proposalHash = hashEditorialContent(String(proposal.proposed.body));
    proposals.push([
      proposal.slug,
      Boolean(production),
      production?.signature_valid === true,
      productionHash,
      true,
      proposalHash,
      productionHash !== proposalHash,
      proposal.proposed.reviewerProposed ?? '',
      'PENDING_RESIGNATURE',
      production?.reviewed_content_hash === productionHash,
      production && productionHash !== proposalHash ? 'BLOCKED_SIGNATURE_APPROVAL' : 'REVIEW_REQUIRED',
    ]);
  }
  const proposalHeader = [
    'slug', 'production_version_exists', 'production_version_signed',
    'production_hash', 'proposal_exists', 'proposal_hash', 'hash_differs',
    'proposed_signer', 'signature_status', 'production_unchanged', 'status',
  ];
  await writeFile(
    'docs/seo/current/pending-resignature-validation.csv',
    `${proposalHeader.map(csv).join(',')}\n${proposals.map((row) => row.map(csv).join(',')).join('\n')}\n`,
  );

  const valid = validation.filter((row) => row[12] === 'VALID');
  console.log(JSON.stringify({
    published: validation.length,
    institutionalSignatures: validation.filter((row) => row[3] === 'firm').length,
    storedHashes: validation.filter((row) => row[5]).length,
    matchingHashes: validation.filter((row) => row[7] === true).length,
    validSignatures: validation.filter((row) => row[8] === true).length,
    indexable: valid.length,
    proposals: proposals.length,
    pendingResignatures: proposals.filter((row) => row[8] === 'PENDING_RESIGNATURE').length,
  }, null, 2));
}

void main();
