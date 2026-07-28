import {
  isEditoriallyIndexable,
  resolveArticleEditorialState,
} from '@/lib/editorial-signature';

export type ReadinessBlogRow = {
  slug: string;
  category: string;
  author: string | null;
  body: string;
  review_status: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | Date | null;
  reviewed_content_hash?: string | null;
  published: boolean | null;
  noindex: boolean | null;
  canonical_url: string | null;
};

export type ReadinessSummary = {
  published: number;
  verified: number;
  firm_reviewed: number;
  lawyer_signed: number;
  pending: number;
  outdated: number;
  currently_indexable: number;
  indexable_after_cutover: number;
  urls_removed: number;
  percentage_removed: number;
};

function articleFromRow(row: ReadinessBlogRow) {
  return {
    body: row.body,
    author: row.author,
    published: row.published,
    reviewStatus: row.review_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewedContentHash: row.reviewed_content_hash,
  };
}

export function calculateReadiness(
  rows: ReadinessBlogRow[],
  currentBlogUrls: number,
  approvedRemovalCount = 0,
): { summary: ReadinessSummary; failures: string[] } {
  const published = rows.filter((row) => row.published === true);
  const states = published.map((row) => ({
    row,
    editorial: resolveArticleEditorialState(articleFromRow(row)),
  }));
  const valid = states.filter(({ editorial }) => editorial.signatureValid);
  const firmReviewed = valid.filter(({ editorial }) => editorial.signature?.type === 'firm');
  const lawyerSigned = valid.filter(({ editorial }) => editorial.signature?.type === 'lawyer');
  const pending = states.filter(({ editorial }) => editorial.publicationState === 'pending_resignature');
  const outdated = states.filter(({ editorial }) => editorial.publicationState === 'outdated');
  const eligible = states.filter(({ row }) => (
    row.noindex !== true
    && !row.canonical_url
    && isEditoriallyIndexable(articleFromRow(row))
  ));
  const urlsRemoved = Math.max(0, currentBlogUrls - eligible.length);
  const summary: ReadinessSummary = {
    published: published.length,
    verified: valid.length,
    firm_reviewed: firmReviewed.length,
    lawyer_signed: lawyerSigned.length,
    pending: pending.length,
    outdated: outdated.length,
    currently_indexable: currentBlogUrls,
    indexable_after_cutover: eligible.length,
    urls_removed: urlsRemoved,
    percentage_removed: currentBlogUrls === 0
      ? 0
      : Number(((urlsRemoved / currentBlogUrls) * 100).toFixed(2)),
  };

  const failures: string[] = [];
  if (valid.length === 0) failures.push('Hay cero artículos con firma editorial válida.');
  if (eligible.some(({ row }) => !isEditoriallyIndexable(articleFromRow(row)))) {
    failures.push('Un artículo sin firma válida entraría en el sitemap propuesto.');
  }

  const unexplainedRemovalCount = Math.max(0, urlsRemoved - approvedRemovalCount);
  if (unexplainedRemovalCount > 0) {
    failures.push(
      `El cutover retiraría ${urlsRemoved} URLs frente al sitemap productivo y ` +
      `${unexplainedRemovalCount} no están autorizadas individualmente.`,
    );
  }
  if (eligible.length < Math.min(currentBlogUrls, published.length) && unexplainedRemovalCount > 0) {
    failures.push('La lista indexable propuesta cae por debajo del inventario público de referencia.');
  }
  return { summary, failures };
}
