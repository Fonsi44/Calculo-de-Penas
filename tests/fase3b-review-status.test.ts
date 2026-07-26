/**
 * Fase 3B — Tests de derivación honesta de ai_review_status.
 *
 * Valida lib/ai/review-status.ts: el estado se DERIVA de los conteos, nunca se
 * asume 'completed'. Esto ataca el bug raíz de fase3-aplicar.ts (hardcodeo).
 */
import { describe, it, expect } from 'vitest';
import { deriveReviewStatus, type StatusInputs } from '@/lib/ai/review-status';

const base: StatusInputs = {
  centralConfirmed: 0,
  centralCorrected: 0,
  centralUnresolved: 0,
  officialSources: 0,
  requiresHuman: false,
};

describe('Fase 3B — deriveReviewStatus (derivación honesta)', () => {
  it('devuelve completed solo con 0 unresolved + fuentes + confirmados', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 3,
      centralCorrected: 2,
      centralUnresolved: 0,
      officialSources: 5,
    });
    expect(r.status).toBe('completed');
    expect(r.reason).toContain('0 claims sin resolver');
  });

  it('NO devuelve completed con unresolved > 0 (bug raíz fase3-aplicar)', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 3,
      centralCorrected: 2,
      centralUnresolved: 1, // 1 central sin resolver
      officialSources: 5,
    });
    expect(r.status).not.toBe('completed');
    // Con mayoría cubierta y 1-2 unresolved → source_checked
    expect(r.status).toBe('source_checked');
  });

  it('NO devuelve completed con unresolved ≥ 3', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 3,
      centralCorrected: 2,
      centralUnresolved: 4,
      officialSources: 5,
    });
    expect(r.status).toBe('needs_human_review');
  });

  it('NO devuelve completed sin fuentes oficiales', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 3,
      centralCorrected: 2,
      centralUnresolved: 0,
      officialSources: 0, // sin fuentes
    });
    expect(r.status).not.toBe('completed');
    expect(r.status).toBe('needs_human_review');
  });

  it('NO devuelve completed sin claims resueltos (0/0/0)', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 0,
      centralCorrected: 0,
      centralUnresolved: 0,
      officialSources: 5, // fuentes pero sin claims resueltos
    });
    expect(r.status).not.toBe('completed');
    expect(r.status).toBe('needs_human_review');
  });

  it('devuelve blocked sin fuentes + unresolved + sin confirmados', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 0,
      centralCorrected: 0,
      centralUnresolved: 3,
      officialSources: 0,
    });
    expect(r.status).toBe('blocked');
  });

  it('devuelve needs_human_review con requiresHuman + unresolved', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 2,
      centralCorrected: 1,
      centralUnresolved: 1,
      officialSources: 3,
      requiresHuman: true, // marcado explícitamente
    });
    expect(r.status).toBe('needs_human_review');
    expect(r.reason).toContain('revisión jurídica humana');
  });

  it('devuelve needs_human_review con unresolved + sin confirmados + fuentes', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 0,
      centralCorrected: 2,
      centralUnresolved: 2,
      officialSources: 2,
    });
    expect(r.status).toBe('needs_human_review');
  });

  it('devuelve source_checked con 1-2 unresolved y mayoría cubierta (≥3)', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 2,
      centralCorrected: 1, // 2+1=3 ≥ 3
      centralUnresolved: 2,
      officialSources: 4,
    });
    expect(r.status).toBe('source_checked');
  });

  it('devuelve needs_human_review con 1-2 unresolved pero sin mayoría', () => {
    const r = deriveReviewStatus({
      ...base,
      centralConfirmed: 1,
      centralCorrected: 1, // 1+1=2 < 3
      centralUnresolved: 2,
      officialSources: 2,
    });
    expect(r.status).toBe('needs_human_review');
  });

  it('reason siempre explica la decisión (trazabilidad)', () => {
    const casos: StatusInputs[] = [
      { ...base, centralConfirmed: 3, centralCorrected: 2, centralUnresolved: 0, officialSources: 5 },
      { ...base, centralUnresolved: 3, officialSources: 0 },
      { ...base, centralConfirmed: 1, centralUnresolved: 1, officialSources: 2 },
    ];
    for (const inputs of casos) {
      const r = deriveReviewStatus(inputs);
      expect(r.reason).toBeTruthy();
      expect(r.reason.length).toBeGreaterThan(10);
    }
  });
});
