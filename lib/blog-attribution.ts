import type { EditorialSignatureSchemaMode } from '@/lib/editorial-signature';

export type ArticleAttributionRow = {
  slug: string;
  title: string;
  category: string;
  publishedAt: Date | string;
  author: string | null;
  published: boolean | null;
  noindex: boolean | null;
  reviewStatus: string | null;
  reviewedBy: string | null;
  reviewOrigin: string | null;
  signatureType: string | null;
  signatureName: string | null;
  signatureCandidate: string | null;
  signatureValid: boolean | null;
  hashValid: boolean;
  redirected: boolean;
};

export type PublicArticleAttribution = {
  slug: string;
  category: string;
  title: string;
  publishedAt: Date | string;
  authorName: string | null;
  individualReviewerName: string | null;
  institutionalReview: boolean;
  indexable: boolean;
  href: string;
};

const PENDING_STATUSES = new Set([
  'draft',
  'documentary_review',
  'pending_resignature',
  'lawyer_review_pending',
  'outdated',
  'needs_update',
  'withdrawn',
]);

export function projectPublicAttribution(
  row: ArticleAttributionRow,
  mode: EditorialSignatureSchemaMode,
): PublicArticleAttribution {
  const status = row.reviewStatus?.trim().toLowerCase() ?? '';
  const publicRoute = row.published === true
    && row.noindex !== true
    && !row.redirected
    && !PENDING_STATUSES.has(status);

  let individualReviewerName: string | null = null;
  let institutionalReview = false;
  let editoriallyValid = false;

  if (mode === 'MIGRATED_SIGNATURE_MODE') {
    editoriallyValid = row.signatureValid === true && row.hashValid;
    institutionalReview = editoriallyValid
      && row.reviewOrigin === 'firm_historical_review'
      && row.signatureType === 'firm'
      && row.signatureName === 'Pineda y Asociados';
    if (
      editoriallyValid
      && row.reviewOrigin === 'individual_lawyer_review'
      && row.signatureType === 'lawyer'
    ) {
      individualReviewerName = row.signatureName?.trim() || null;
    }
  } else {
    institutionalReview = row.hashValid;
    editoriallyValid = row.hashValid;
    if (
      editoriallyValid
      && ['verified', 'lawyer_verified', 'published_lawyer_signed'].includes(status)
    ) {
      individualReviewerName = row.reviewedBy?.trim() || null;
      institutionalReview = individualReviewerName === null;
    }
  }

  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    publishedAt: row.publishedAt,
    authorName: row.author?.trim() || null,
    individualReviewerName,
    institutionalReview,
    indexable: publicRoute && editoriallyValid,
    href: `/blog/${row.category}/${row.slug}`,
  };
}

export function attributionForProfile(
  rows: PublicArticleAttribution[],
  canonicalName: string,
) {
  const authored = rows.filter(
    (row) => row.indexable && row.authorName === canonicalName,
  );
  const reviewed = rows.filter(
    (row) => row.indexable && row.individualReviewerName === canonicalName,
  );
  return { authored, reviewed };
}
