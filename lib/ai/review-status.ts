/**
 * Derivación honesta del estado de revisión AI (ai_review_status).
 *
 * EXTRAÍDO como módulo compartido en Fase 3B para evitar el bug raíz de
 * fase3-aplicar.ts (que hardcodeaba 'completed' sin verificar claims).
 *
 * Regla rectora: el estado se DERIVA de los conteos y las fuentes, nunca se
 * asume 'completed' solo porque la API devolvió JSON válido.
 *
 * Invariantes garantizados (coherentes con lib/ai/review-invariants.ts):
 *   - completed => unresolvedCentral = 0 AND officialSources > 0 AND !requiresHuman
 *   - needs_human_review => requiresHuman = true (lo marca el llamador)
 *   - blocked => sin fuentes y claims centrales sin resolver
 */

export type ReviewStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'source_checked'
  | 'needs_human_review'
  | 'blocked'
  | 'corrected';

export interface StatusInputs {
  /** Claims centrales confirmados (clasificación confirmed/confirmed_with_context). */
  centralConfirmed: number;
  /** Claims centrales corregidos (incorrect/outdated con correctedText aplicado). */
  centralCorrected: number;
  /** Claims centrales sin resolver (unsupported/ambiguous/requires_human_judgment). */
  centralUnresolved: number;
  /** Número de fuentes oficiales únicas con URL abierta y verificada. */
  officialSources: number;
  /** Si algún claim marcó requiresHumanReview = true. */
  requiresHuman: boolean;
}

export interface StatusResult {
  status: ReviewStatus;
  reason: string;
}

/**
 * Calcula el estado honesto a partir de los conteos.
 *
 * Orden de evaluación (primera coincidencia gana):
 *  1. Sin fuentes + unresolved + sin confirmados → blocked
 *  2. Sin fuentes + unresolved total ≤ 1 → blocked
 *  3. unresolved + sin confirmados → needs_human_review (o blocked si sin fuentes)
 *  4. unresolved ≥ 3 → needs_human_review
 *  5. unresolved 1-2 con mayoría (≥3) confirmados+corregidos → source_checked
 *  6. unresolved 1-2 sin mayoría → needs_human_review
 *  7. unresolved = 0 + fuentes > 0 + !requiresHuman → completed
 *  8. unresolved = 0 + sin fuentes → needs_human_review (no se valida sin fuentes)
 *  9. Caso base → needs_human_review
 */
export function deriveReviewStatus(inputs: StatusInputs): StatusResult {
  const {
    centralConfirmed,
    centralCorrected,
    centralUnresolved,
    officialSources,
    requiresHuman,
  } = inputs;

  // requiresHuman explícito siempre necesita revisión humana
  if (requiresHuman && centralUnresolved > 0) {
    return {
      status: 'needs_human_review',
      reason: `${centralUnresolved} claims centrales pendientes de revisión jurídica humana; ${officialSources} fuentes`,
    };
  }

  // Sin fuentes y con unresolved → blocked (no se puede validar)
  if (officialSources === 0 && centralUnresolved > 0 && centralConfirmed === 0) {
    return {
      status: 'blocked',
      reason: `${centralUnresolved} claims centrales sin resolver; sin fuentes oficiales`,
    };
  }

  if (officialSources === 0 && centralUnresolved <= 1 && centralConfirmed === 0) {
    return {
      status: 'blocked',
      reason: `${centralUnresolved} claims centrales sin resolver; sin fuentes oficiales`,
    };
  }

  // unresolved sin ningún confirmado → needs_human_review
  if (centralUnresolved > 0 && centralConfirmed === 0) {
    if (officialSources === 0) {
      return {
        status: 'blocked',
        reason: `${centralUnresolved} claims centrales sin resolver; sin fuentes oficiales`,
      };
    }
    return {
      status: 'needs_human_review',
      reason: `${centralUnresolved} claims centrales sin resolver; ${officialSources} fuentes`,
    };
  }

  // Muchos unresolved → needs_human_review
  if (centralUnresolved >= 3) {
    return {
      status: 'needs_human_review',
      reason: `${centralUnresolved} claims centrales sin resolver; ${officialSources} fuentes`,
    };
  }

  // 1-2 unresolved con mayoría cubierta → source_checked
  if (centralUnresolved >= 1 && centralUnresolved <= 2) {
    if (centralConfirmed + centralCorrected >= 3) {
      return {
        status: 'source_checked',
        reason: `${centralUnresolved} claims centrales sin resolver; mayoría cubierta (${centralConfirmed}+${centralCorrected}); ${officialSources} fuentes`,
      };
    }
    return {
      status: 'needs_human_review',
      reason: `${centralUnresolved} claims centrales sin resolver; ${centralConfirmed} confirmados, ${centralCorrected} corregidos; ${officialSources} fuentes`,
    };
  }

  // unresolved = 0
  if (centralUnresolved === 0) {
    if (officialSources > 0 && (centralConfirmed > 0 || centralCorrected > 0)) {
      return {
        status: 'completed',
        reason: `0 claims sin resolver; ${centralConfirmed} confirmados + ${centralCorrected} corregidos; ${officialSources} fuentes oficiales`,
      };
    }
    // Sin fuentes o sin claims resueltos: no se puede marcar completed
    return {
      status: 'needs_human_review',
      reason: '0 claims sin resolver pero sin fuentes oficiales o sin claims resueltos',
    };
  }

  return {
    status: 'needs_human_review',
    reason: 'Caso base — requiere revisión',
  };
}
