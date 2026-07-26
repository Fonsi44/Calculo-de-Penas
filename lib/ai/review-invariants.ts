/**
 * Validación de invariantes para ai_review_* en blog_posts.
 *
 * Reglas:
 *   confirmed + corrected + unresolved <= claims_count
 *   completed => unresolved_central = 0
 *   completed => official_sources_count > 0
 *   needs_human_review => ai_review_requires_human = true
 *   ai_reviewed_at != reviewed_at
 */

export interface ReviewInvariants {
  aiReviewStatus: string | null;
  aiReviewClaimsCount: number | null;
  aiReviewConfirmedClaims: number | null;
  aiReviewCorrectedClaims: number | null;
  aiReviewUnresolvedClaims: number | null;
  aiReviewRequiresHuman: boolean | null;
  aiOfficialSourcesCount: number | null;
  aiReviewedAt: string | null;
  reviewedAt: string | null;
  centralUnresolvedCount?: number;
}

export interface InvariantError {
  slug: string;
  invariant: string;
  message: string;
}

export function validateReviewInvariants(
  slug: string,
  data: ReviewInvariants,
): InvariantError[] {
  const errors: InvariantError[] = [];

  const claimsCount = data.aiReviewClaimsCount ?? 0;
  const confirmed = data.aiReviewConfirmedClaims ?? 0;
  const corrected = data.aiReviewCorrectedClaims ?? 0;
  const unresolved = data.aiReviewUnresolvedClaims ?? 0;
  const status = data.aiReviewStatus;
  const sourcesCount = data.aiOfficialSourcesCount ?? 0;
  const requiresHuman = data.aiReviewRequiresHuman ?? false;
  const centralUnresolved = data.centralUnresolvedCount;

  // Invariant 1: confirmed + corrected + unresolved <= claims_count
  if (confirmed + corrected + unresolved > claimsCount) {
    errors.push({
      slug,
      invariant: 'claims_sum_total',
      message: `confirmed(${confirmed}) + corrected(${corrected}) + unresolved(${unresolved}) > claims_count(${claimsCount})`,
    });
  }

  // Invariant 2: completed => unresolved_central = 0
  if (status === 'completed' && centralUnresolved !== undefined && centralUnresolved > 0) {
    errors.push({
      slug,
      invariant: 'completed_has_unresolved_central',
      message: `Status=completed pero tiene ${centralUnresolved} claims centrales sin resolver`,
    });
  }

  // Invariant 3: completed => official_sources_count > 0
  if (status === 'completed' && sourcesCount === 0) {
    errors.push({
      slug,
      invariant: 'completed_no_sources',
      message: 'Status=completed pero official_sources_count=0',
    });
  }

  // Invariant 4: needs_human_review => ai_review_requires_human = true
  if (status === 'needs_human_review' && !requiresHuman) {
    errors.push({
      slug,
      invariant: 'needs_human_not_flagged',
      message:
        'Status=needs_human_review pero ai_review_requires_human=false',
    });
  }

  // Invariant 5: ai_reviewed_at != reviewed_at
  if (
    data.aiReviewedAt &&
    data.reviewedAt &&
    data.aiReviewedAt === data.reviewedAt
  ) {
    errors.push({
      slug,
      invariant: 'ai_reviewed_equals_reviewed',
      message:
        'ai_reviewed_at coincide con reviewed_at (deben ser independientes)',
    });
  }

  return errors;
}
