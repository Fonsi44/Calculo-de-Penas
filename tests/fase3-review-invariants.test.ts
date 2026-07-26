/**
 * Fase 3 — Tests de invariantes para ai_review_* en blog_posts.
 *
 * Valida las 5 reglas de lib/ai/review-invariants.ts:
 *   1. confirmed + corrected + unresolved <= claims_count
 *   2. completed => unresolved_central = 0
 *   3. completed => official_sources_count > 0
 *   4. needs_human_review => ai_review_requires_human = true
 *   5. ai_reviewed_at != reviewed_at
 */
import { describe, it, expect } from 'vitest';
import {
  validateReviewInvariants,
  type ReviewInvariants,
} from '@/lib/ai/review-invariants';

const base: ReviewInvariants = {
  aiReviewStatus: 'completed',
  aiReviewClaimsCount: 5,
  aiReviewConfirmedClaims: 3,
  aiReviewCorrectedClaims: 2,
  aiReviewUnresolvedClaims: 0,
  aiReviewRequiresHuman: false,
  aiOfficialSourcesCount: 3,
  aiReviewedAt: '2026-07-26T10:00:00Z',
  reviewedAt: '2026-07-20T10:00:00Z',
  centralUnresolvedCount: 0,
};

describe('Fase 3 — Invariantes de ai_review_*', () => {
  // ─── Caso válido: sin errores ───────────────────────────────────────────────
  it('no devuelve errores para un registro completed válido', () => {
    const errors = validateReviewInvariants('slug-valido', base);
    expect(errors).toEqual([]);
  });

  // ─── Invariante 1: claims_sum_total ────────────────────────────────────────
  it('detecta confirmed + corrected + unresolved > claims_count', () => {
    const errors = validateReviewInvariants('slug-sum', {
      ...base,
      aiReviewClaimsCount: 3,
      aiReviewConfirmedClaims: 2,
      aiReviewCorrectedClaims: 1,
      aiReviewUnresolvedClaims: 1, // 2+1+1 = 4 > 3
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].invariant).toBe('claims_sum_total');
  });

  // ─── Invariante 2: completed_has_unresolved_central ────────────────────────
  it('detecta completed con claims centrales sin resolver', () => {
    const errors = validateReviewInvariants('slug-central', {
      ...base,
      centralUnresolvedCount: 2,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].invariant).toBe('completed_has_unresolved_central');
  });

  it('no marca central unresolved si centralUnresolvedCount es 0', () => {
    const errors = validateReviewInvariants('slug-ok', {
      ...base,
      centralUnresolvedCount: 0,
    });
    expect(errors.filter((e) => e.invariant === 'completed_has_unresolved_central')).toEqual([]);
  });

  // ─── Invariante 3: completed_no_sources ────────────────────────────────────
  it('detecta completed con official_sources_count = 0', () => {
    const errors = validateReviewInvariants('slug-nosrc', {
      ...base,
      aiOfficialSourcesCount: 0,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].invariant).toBe('completed_no_sources');
  });

  // ─── Invariante 4: needs_human_not_flagged ─────────────────────────────────
  it('detecta needs_human_review con requires_human = false', () => {
    const errors = validateReviewInvariants('slug-human', {
      ...base,
      aiReviewStatus: 'needs_human_review',
      aiReviewRequiresHuman: false,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].invariant).toBe('needs_human_not_flagged');
  });

  it('acepta needs_human_review con requires_human = true', () => {
    const errors = validateReviewInvariants('slug-human-ok', {
      ...base,
      aiReviewStatus: 'needs_human_review',
      aiReviewRequiresHuman: true,
    });
    expect(errors.filter((e) => e.invariant === 'needs_human_not_flagged')).toEqual([]);
  });

  // ─── Invariante 5: ai_reviewed_equals_reviewed ─────────────────────────────
  it('detecta ai_reviewed_at igual a reviewed_at', () => {
    const mismoTimestamp = '2026-07-26T10:00:00Z';
    const errors = validateReviewInvariants('slug-equal-ts', {
      ...base,
      aiReviewedAt: mismoTimestamp,
      reviewedAt: mismoTimestamp,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].invariant).toBe('ai_reviewed_equals_reviewed');
  });

  it('acepta ai_reviewed_at distinto de reviewed_at', () => {
    const errors = validateReviewInvariants('slug-distinct-ts', {
      ...base,
      aiReviewedAt: '2026-07-26T10:00:00Z',
      reviewedAt: '2026-07-20T10:00:00Z',
    });
    expect(errors.filter((e) => e.invariant === 'ai_reviewed_equals_reviewed')).toEqual([]);
  });

  // ─── Estados no completed no disparan invariantes 2 ni 3 ──────────────────
  it('source_checked con unresolved central no dispara invariante 2', () => {
    const errors = validateReviewInvariants('slug-source', {
      ...base,
      aiReviewStatus: 'source_checked',
      centralUnresolvedCount: 1,
      aiOfficialSourcesCount: 0, // source_checked no exige >0 fuentes
    });
    expect(errors.filter((e) =>
      e.invariant === 'completed_has_unresolved_central' ||
      e.invariant === 'completed_no_sources'
    )).toEqual([]);
  });

  // ─── Múltiples invariantes violados a la vez ───────────────────────────────
  it('detecta múltiples violaciones simultáneas', () => {
    const errors = validateReviewInvariants('slug-multi', {
      ...base,
      aiReviewClaimsCount: 2,
      aiReviewConfirmedClaims: 2,
      aiReviewCorrectedClaims: 1,
      aiReviewUnresolvedClaims: 1, // 4 > 2 → invariante 1
      centralUnresolvedCount: 3,    // → invariante 2
      aiOfficialSourcesCount: 0,    // → invariante 3
    });
    const invs = errors.map((e) => e.invariant);
    expect(invs).toContain('claims_sum_total');
    expect(invs).toContain('completed_has_unresolved_central');
    expect(invs).toContain('completed_no_sources');
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Valores null se tratan como defaults seguros ──────────────────────────
  it('trata valores null como defaults (0/false) sin lanzar', () => {
    const errors = validateReviewInvariants('slug-null', {
      aiReviewStatus: null,
      aiReviewClaimsCount: null,
      aiReviewConfirmedClaims: null,
      aiReviewCorrectedClaims: null,
      aiReviewUnresolvedClaims: null,
      aiReviewRequiresHuman: null,
      aiOfficialSourcesCount: null,
      aiReviewedAt: null,
      reviewedAt: null,
    });
    // Status null no es completed ni needs_human, así que solo puede dispar
    // la invariante 1 si la suma > 0, pero todo es 0.
    expect(errors).toEqual([]);
  });
});
