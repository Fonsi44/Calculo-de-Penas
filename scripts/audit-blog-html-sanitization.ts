import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import {
  blogHtmlPlainText,
  containsActiveBlogHtml,
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
} from '../lib/blog-html-sanitizer';
import { injectHeadingIds } from '../lib/blog-toc';
import { normalizeBlogLinksForRender } from '../lib/blog-link-normalizer';
import { injectContextLinks } from '../lib/blog-context-linker';

type PublishedRow = {
  slug: string;
  body: string;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
};

type ProposalPatch = {
  slug: string;
  expected: { contentHash: string };
  proposed: {
    body: string;
    legalReviewStatus: string;
  };
  safeguards: {
    productionWriteAllowed: boolean;
    doesNotSetLawyerVerified: boolean;
  };
};

type AuditRow = Record<string, string | number | boolean>;

const HEADERS = [
  'slug',
  'publication_state',
  'stored_body_hash',
  'source_html_length',
  'sanitized_source_length',
  'final_html_length',
  'removed_tags',
  'removed_attributes',
  'removed_schemes',
  'removed_styles',
  'removed_images',
  'heading_count_before',
  'heading_count_after',
  'link_count_before',
  'link_count_after',
  'plain_text_equivalent',
  'signature_still_valid',
  'blocking',
  'status',
];

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function auditHash(value: string): string {
  return `sha256:${sha256(value).slice(0, 12)}`;
}

function count(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function renderForAudit(body: string, slug: string) {
  const source = sanitizeBlogSourceHtml(body);
  const headings = injectHeadingIds(source.html);
  const links = normalizeBlogLinksForRender(headings.html).html;
  const context = injectContextLinks(links, {
    excludeHrefs: [`/blog/audit/${slug}`],
  });
  const final = sanitizeBlogRenderedHtml(context);
  return { source, headings, final };
}

function makeAuditRow(
  slug: string,
  publicationState: 'PUBLISHED' | 'PENDING_RESIGNATURE',
  body: string,
  storedHash: string,
  signatureStillValid: boolean,
): AuditRow {
  const beforeHash = sha256(body);
  const rendered = renderForAudit(body, slug);
  const afterHash = sha256(body);
  const plainTextEquivalent =
    blogHtmlPlainText(body) === blogHtmlPlainText(rendered.source.html);
  const active = containsActiveBlogHtml(rendered.final.html);
  const hashChanged = beforeHash !== afterHash;
  const blocking = active || hashChanged || !plainTextEquivalent;
  const removed =
    rendered.source.report.removedTags
    + rendered.source.report.removedAttributes
    + rendered.source.report.removedSchemes
    + rendered.source.report.removedStyles
    + rendered.source.report.removedImages;
  const status = blocking
    ? 'BLOCKING'
    : removed > 0
      ? 'SANITIZED_NON_SEMANTIC'
      : 'UNCHANGED_SAFE';

  return {
    slug,
    publication_state: publicationState,
    stored_body_hash: storedHash,
    source_html_length: body.length,
    sanitized_source_length: rendered.source.html.length,
    final_html_length: rendered.final.html.length,
    removed_tags: rendered.source.report.removedTags + rendered.final.report.removedTags,
    removed_attributes:
      rendered.source.report.removedAttributes + rendered.final.report.removedAttributes,
    removed_schemes:
      rendered.source.report.removedSchemes + rendered.final.report.removedSchemes,
    removed_styles:
      rendered.source.report.removedStyles + rendered.final.report.removedStyles,
    removed_images:
      rendered.source.report.removedImages + rendered.final.report.removedImages,
    heading_count_before: count(body, /<h[2-6]\b/gi),
    heading_count_after: rendered.headings.headings.length,
    link_count_before: count(body, /<a\b/gi),
    link_count_after: count(rendered.final.html, /<a\b/gi),
    plain_text_equivalent: plainTextEquivalent,
    signature_still_valid: signatureStillValid,
    blocking,
    status,
  };
}

async function readProposals(): Promise<ProposalPatch[]> {
  const root = 'docs/seo/patches/phase3';
  const proposals: ProposalPatch[] = [];
  for (const filename of (await readdir(root)).filter((file) => file.endsWith('.json')).sort()) {
    const batch = JSON.parse(await readFile(join(root, filename), 'utf8')) as {
      patches: ProposalPatch[];
    };
    proposals.push(...batch.patches);
  }
  return proposals;
}

async function main() {
  const local = config({ path: '.env.local', quiet: true }).parsed ?? {};
  const preview = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const previewUrl = process.env.PREVIEW_DATABASE_URL ?? preview.DATABASE_URL;
  const productionUrl =
    process.env.SOURCE_DATABASE_URL
    ?? process.env.PRODUCTION_DATABASE_URL
    ?? local.DATABASE_URL;
  const previewEnvironment = process.env.E2E_ENVIRONMENT ?? preview.E2E_ENVIRONMENT;
  const productionBranchId =
    process.env.NEON_PRODUCTION_BRANCH_ID
    ?? preview.NEON_PRODUCTION_BRANCH_ID;

  if (!previewUrl || !productionUrl || previewUrl === productionUrl) {
    throw new Error('Se requiere una base Preview distinta de Production.');
  }
  if (previewEnvironment !== 'staging') {
    throw new Error('La auditoría solo puede leer una rama Preview/staging verificada.');
  }

  const sql = neon(previewUrl);
  const branch = await sql`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const branchId = String(branch[0]?.branch_id ?? '');
  if (!branchId || branchId === productionBranchId) {
    throw new Error('La conexión no corresponde a una rama Preview aislada.');
  }

  const columns = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
  ` as Array<{ column_name: string }>;
  const names = new Set(columns.map((row) => String(row.column_name)));
  for (const required of ['reviewed_content_hash', 'signature_valid']) {
    if (!names.has(required)) {
      throw new Error(`La rama Preview no contiene la columna editorial ${required}.`);
    }
  }

  const published = await sql`
    SELECT slug, body, reviewed_content_hash, signature_valid
    FROM blog_posts
    WHERE published = true
    ORDER BY slug
  ` as PublishedRow[];
  if (published.length !== 135) {
    throw new Error(`Inventario publicado inesperado: ${published.length}/135.`);
  }

  const proposals = await readProposals();
  if (proposals.length !== 40) {
    throw new Error(`Inventario de propuestas inesperado: ${proposals.length}/40.`);
  }

  const rows: AuditRow[] = [];
  for (const row of published) {
    const currentHash = sha256(String(row.body));
    const signatureStillValid =
      row.signature_valid === true
      && row.reviewed_content_hash === currentHash;
    rows.push(makeAuditRow(
      String(row.slug),
      'PUBLISHED',
      String(row.body),
      auditHash(String(row.body)),
      signatureStillValid,
    ));
  }

  for (const proposal of proposals) {
    const pending =
      proposal.proposed.legalReviewStatus === 'lawyer_review_pending'
      && proposal.safeguards.productionWriteAllowed === false
      && proposal.safeguards.doesNotSetLawyerVerified === true;
    rows.push(makeAuditRow(
      proposal.slug,
      'PENDING_RESIGNATURE',
      proposal.proposed.body,
      `sha256:${proposal.expected.contentHash.slice(0, 12)}`,
      pending,
    ));
  }

  const publishedRows = rows.filter((row) => row.publication_state === 'PUBLISHED');
  const proposalRows = rows.filter((row) => row.publication_state === 'PENDING_RESIGNATURE');
  const blocking = rows.filter((row) => row.blocking === true);
  const invalidPublishedSignatures = publishedRows.filter(
    (row) => row.signature_still_valid !== true,
  );
  const invalidPendingState = proposalRows.filter(
    (row) => row.signature_still_valid !== true,
  );

  await writeFile(
    'docs/security/blog-html-sanitization-audit.csv',
    `${HEADERS.map(csvCell).join(',')}\n`
      + `${rows.map((row) => HEADERS.map((header) => csvCell(row[header])).join(',')).join('\n')}\n`,
  );

  const summary = {
    published: publishedRows.length,
    proposals: proposalRows.length,
    validPublishedSignatures: publishedRows.length - invalidPublishedSignatures.length,
    pendingProposals: proposalRows.length - invalidPendingState.length,
    sanitizedNonSemantic: rows.filter((row) => row.status === 'SANITIZED_NON_SEMANTIC').length,
    unchangedSafe: rows.filter((row) => row.status === 'UNCHANGED_SAFE').length,
    activePayloads: rows.filter((row) => row.status === 'SANITIZED_UNSAFE_CONTENT').length,
    semanticDifferences: rows.filter(
      (row) => row.plain_text_equivalent !== true,
    ).length,
    blocking: blocking.length,
    productionWrites: 0,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (
    blocking.length > 0
    || invalidPublishedSignatures.length > 0
    || invalidPendingState.length > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Fallo de auditoría HTML.');
  process.exitCode = 1;
});
