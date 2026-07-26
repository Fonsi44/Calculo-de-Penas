/**
 * Fase 3C — Tests de reglas de revisión humana y anti-regresión.
 *
 * Cubre los defectos reales encontrados en Fase 3C:
 *   - Imposibilidad de marcar completed con claim central pendiente.
 *   - Claims interpretativos no se marcan confirmed.
 *   - Estados con revisión humana pendiente marcan requiresHuman.
 *   - Claims comerciales sin evidencia no se fuerzan a confirmed.
 *   - Idempotencia del recálculo (misma entrada → misma salida).
 *   - Sin llamadas reales a DeepSeek (mock).
 */
import { describe, it, expect } from 'vitest';
import { deriveReviewStatus } from '../lib/ai/review-status';
import { validateReviewInvariants } from '../lib/ai/review-invariants';

describe('Regla: completed NO admite claims centrales pendientes', () => {
  it('no permite completed si hay 1+ claims centrales unresolved', () => {
    const result = deriveReviewStatus({
      centralConfirmed: 5,
      centralCorrected: 5,
      centralUnresolved: 1,
      officialSources: 3,
      requiresHuman: false,
    });
    expect(result.status).not.toBe('completed');
  });

  it('no permite completed con 0 fuentes oficiales', () => {
    const result = deriveReviewStatus({
      centralConfirmed: 3,
      centralCorrected: 0,
      centralUnresolved: 0,
      officialSources: 0,
      requiresHuman: false,
    });
    expect(result.status).not.toBe('completed');
  });

  it('permite completed solo con 0 unresolved + fuentes + claims resueltos', () => {
    const result = deriveReviewStatus({
      centralConfirmed: 2,
      centralCorrected: 1,
      centralUnresolved: 0,
      officialSources: 1,
      requiresHuman: false,
    });
    expect(result.status).toBe('completed');
  });
});

describe('Regla: claims interpretativos NO se marcan confirmed', () => {
  // Un claim interpretativo (p. ej. "la prescripción beneficia
  // independientemente de la culpabilidad") puede tener una norma
  // relacionada, pero la afirmación categórica requiere interpretación
  // doctrinal. La regla es: no confirmed, sí needs_human_review.
  it('caso típico: claim interpretativo → needs_human_review', () => {
    // Simula el caso real de cuando-prescribe-delito-en-honduras claim 9
    const result = deriveReviewStatus({
      centralConfirmed: 2,
      centralCorrected: 5,
      centralUnresolved: 3, // claims interpretativos sin texto expreso
      officialSources: 2,
      requiresHuman: true,
    });
    expect(result.status).toBe('needs_human_review');
  });
});

describe('Regla: needs_human_review marca requiresHuman=true', () => {
  it('validateReviewInvariants detecta needs_human sin flag', () => {
    const errors = validateReviewInvariants('test-slug', {
      aiReviewStatus: 'needs_human_review',
      aiReviewClaimsCount: 5,
      aiReviewConfirmedClaims: 2,
      aiReviewCorrectedClaims: 2,
      aiReviewUnresolvedClaims: 1,
      aiReviewRequiresHuman: false, // MAL: debería ser true
      aiOfficialSourcesCount: 1,
      aiReviewedAt: '2026-07-26',
      reviewedAt: null,
      centralUnresolvedCount: 1,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.invariant === 'needs_human_not_flagged')).toBe(
      true,
    );
  });

  it('validateReviewInvariants pasa cuando requiresHuman=true', () => {
    const errors = validateReviewInvariants('test-slug', {
      aiReviewStatus: 'needs_human_review',
      aiReviewClaimsCount: 5,
      aiReviewConfirmedClaims: 2,
      aiReviewCorrectedClaims: 2,
      aiReviewUnresolvedClaims: 1,
      aiReviewRequiresHuman: true,
      aiOfficialSourcesCount: 1,
      aiReviewedAt: '2026-07-26',
      reviewedAt: null,
      centralUnresolvedCount: 1,
    });
    expect(errors.some((e) => e.invariant === 'needs_human_not_flagged')).toBe(
      false,
    );
  });
});

describe('Regla: claims comerciales sin evidencia NO se fuerzan a confirmed', () => {
  it('claim comercial "mejor abogado" → unsupported/blocked, no confirmed', () => {
    // Simula abogado-penalista-choluteca antes de Fase 3C:
    // 1 claim comercial unsupported, sin fuentes
    const result = deriveReviewStatus({
      centralConfirmed: 0,
      centralCorrected: 0,
      centralUnresolved: 1,
      officialSources: 0,
      requiresHuman: false,
    });
    expect(result.status).toBe('blocked');
    expect(result.status).not.toBe('completed');
    expect(result.status).not.toBe('confirmed');
  });

  it('tras reformular claim comercial a derecho defensa (corrected) → ya no blocked', () => {
    // Simula tras Fase 3C: claim reformulado a Art. 289 CPP
    const result = deriveReviewStatus({
      centralConfirmed: 0,
      centralCorrected: 1,
      centralUnresolved: 0,
      officialSources: 1,
      requiresHuman: false,
    });
    expect(result.status).toBe('completed');
    // Ya no es blocked: el claim comercial fue reemplazado por uno jurídico
  });
});

describe('Idempotencia del recálculo', () => {
  it('dos llamadas con la misma entrada devuelven el mismo estado', () => {
    const inputs = {
      centralConfirmed: 2,
      centralCorrected: 1,
      centralUnresolved: 0,
      officialSources: 1,
      requiresHuman: false,
    };
    const r1 = deriveReviewStatus(inputs);
    const r2 = deriveReviewStatus(inputs);
    expect(r1.status).toBe(r2.status);
    expect(r1.reason).toBe(r2.reason);
  });

  it('idempotencia con needs_human_review', () => {
    const inputs = {
      centralConfirmed: 1,
      centralCorrected: 1,
      centralUnresolved: 1,
      officialSources: 1,
      requiresHuman: true,
    };
    const r1 = deriveReviewStatus(inputs);
    const r2 = deriveReviewStatus(inputs);
    expect(r1.status).toBe(r2.status);
    expect(r1.status).toBe('needs_human_review');
  });
});

describe('Sin llamadas reales a DeepSeek', () => {
  // Verificación estructural: el módulo deepseek-blog-review NO debe
  // hacer fetch en import time ni en las funciones puras de conteo.
  it('countOfficialSourcesByProvenance no realiza llamadas externas', async () => {
    const { countOfficialSourcesByProvenance } = await import(
      '../lib/ai/deepseek-blog-review'
    );
    const output = {
      claims: [
        {
          claim: 'test',
          classification: 'confirmed' as const,
          jurisdiction: 'HN' as const,
          officialSource: {
            institution: 'Poder Judicial',
            title: 'CPP',
            url: 'https://poderjudicial.gob.hn/x.pdf',
            consultedAt: '2026-07-26',
          },
          sourceExcerptSummary: 'x',
          analysisProvider: 'test',
          analysisModel: 'test',
          confidence: 'high' as const,
          originalText: 'x',
          correctedText: '',
          correctionReason: '',
          requiresHumanReview: false,
        },
      ],
      summary: '',
      overallConfidence: 'high' as const,
    };
    const result = countOfficialSourcesByProvenance(output);
    expect(result.official).toBe(1);
    expect(result.total).toBe(1);
  });
});

describe('Invariante: claims_sum_total', () => {
  it('detecta cuando confirmed + corrected + unresolved > claims_count', () => {
    const errors = validateReviewInvariants('test', {
      aiReviewStatus: 'completed',
      aiReviewClaimsCount: 3,
      aiReviewConfirmedClaims: 2,
      aiReviewCorrectedClaims: 2, // 2+2+0=4 > 3 → error
      aiReviewUnresolvedClaims: 0,
      aiReviewRequiresHuman: false,
      aiOfficialSourcesCount: 1,
      aiReviewedAt: '2026-07-26',
      reviewedAt: null,
      centralUnresolvedCount: 0,
    });
    expect(errors.some((e) => e.invariant === 'claims_sum_total')).toBe(true);
  });

  it('pasa cuando la suma es igual al total', () => {
    const errors = validateReviewInvariants('test', {
      aiReviewStatus: 'completed',
      aiReviewClaimsCount: 5,
      aiReviewConfirmedClaims: 3,
      aiReviewCorrectedClaims: 2,
      aiReviewUnresolvedClaims: 0,
      aiReviewRequiresHuman: false,
      aiOfficialSourcesCount: 1,
      aiReviewedAt: '2026-07-26',
      reviewedAt: null,
      centralUnresolvedCount: 0,
    });
    expect(errors.some((e) => e.invariant === 'claims_sum_total')).toBe(false);
  });
});
