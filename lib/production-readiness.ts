import { normalizeReviewStatus } from '@/lib/legal-review';

export type ReadinessBlogRow = {
  slug: string;
  category: string;
  author: string | null;
  review_status: string | null;
  published: boolean | null;
  noindex: boolean | null;
  canonical_url: string | null;
};

export type ReadinessSummary = {
  published: number;
  verified: number;
  pending: number;
  outdated: number;
  currently_indexable: number;
  indexable_after_cutover: number;
  urls_removed: number;
  percentage_removed: number;
};

const GENERIC_AUTHORS = new Set(['', 'pineda y asociados', 'equipo pineda y asociados']);

export function calculateReadiness(
  rows: ReadinessBlogRow[],
  currentBlogUrls: number,
  approvedRemovalCount = 0,
): { summary: ReadinessSummary; failures: string[] } {
  const published = rows.filter((row) => row.published === true);
  const verified = published.filter((row) => normalizeReviewStatus(row.review_status) === 'verified');
  const pending = published.filter((row) => normalizeReviewStatus(row.review_status) === 'pending');
  const outdated = published.filter((row) => normalizeReviewStatus(row.review_status) === 'needs_update');
  const eligible = verified.filter((row) => row.noindex !== true && !row.canonical_url);
  const urlsRemoved = Math.max(0, currentBlogUrls - eligible.length);
  const summary: ReadinessSummary = {
    published: published.length,
    verified: verified.length,
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
  if (verified.length === 0) failures.push('Hay cero artículos lawyer_verified.');
  const generic = published.filter((row) => GENERIC_AUTHORS.has((row.author ?? '').trim().toLowerCase()));
  if (generic.length > 0) failures.push(`${generic.length} artículos publicados conservan autor genérico.`);
  if (eligible.some((row) => normalizeReviewStatus(row.review_status) !== 'verified')) {
    failures.push('Un artículo pending/outdated entraría en el sitemap propuesto.');
  }

  const unexplainedRemovalCount = Math.max(0, urlsRemoved - approvedRemovalCount);
  if (unexplainedRemovalCount > 0) {
    failures.push(
      `El cutover retiraría ${urlsRemoved} URLs frente al sitemap productivo y ` +
      `${unexplainedRemovalCount} no están autorizadas individualmente.`,
    );
  }
  if (eligible.length < Math.min(currentBlogUrls, published.length)) {
    failures.push('La lista indexable propuesta cae por debajo del inventario público de referencia.');
  }
  return { summary, failures };
}
