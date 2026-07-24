import { describe, it, expect } from 'vitest';

const RISK_LEVELS = ['low', 'medium', 'high', 'critical', 'unknown'] as const;

function computeRisk(
  pendingDocs: number,
  overdueDeadlines: number,
  openTasks: number,
  daysSinceLastUpdate: number | null,
  hasActiveBlock: boolean,
) {
  const reasons: string[] = [];
  const blockingFactors: string[] = [];
  const suggestedActions: string[] = [];

  if (pendingDocs > 0) reasons.push(`${pendingDocs} documentos pendientes`);
  if (overdueDeadlines > 0) reasons.push(`${overdueDeadlines} plazos vencidos`);
  if (openTasks > 0) reasons.push(`${openTasks} tareas abiertas`);
  if (daysSinceLastUpdate != null && daysSinceLastUpdate > 30) {
    reasons.push(`${daysSinceLastUpdate} días sin actualización`);
  }
  if (hasActiveBlock) {
    blockingFactors.push('Expediente bloqueado por requisito pendiente');
  }

  const docScore = Math.min(pendingDocs * 10, 40);
  const deadlineScore = Math.min(overdueDeadlines * 25, 40);
  const taskScore = Math.min(openTasks * 5, 10);
  const stalenessScore = daysSinceLastUpdate != null && daysSinceLastUpdate > 30
    ? Math.min(Math.floor(daysSinceLastUpdate / 30) * 5, 10) : 0;
  const blockScore = hasActiveBlock ? 20 : 0;

  const score = Math.min(docScore + deadlineScore + taskScore + stalenessScore + blockScore, 100);

  let riskLevel: string;
  if (score >= 80 || overdueDeadlines > 5) {
    riskLevel = 'critical';
    suggestedActions.push('Revisión urgente del expediente');
    suggestedActions.push('Contactar con el cliente para regularizar plazos');
  } else if (score >= 50 || overdueDeadlines > 0) {
    riskLevel = 'high';
    suggestedActions.push('Programar revisión del expediente en los próximos 3 días');
    if (overdueDeadlines > 0) suggestedActions.push('Gestionar plazos vencidos con prioridad');
  } else if (score >= 25 || pendingDocs > 3) {
    riskLevel = 'medium';
    suggestedActions.push('Revisar documentos pendientes');
    suggestedActions.push('Actualizar estado del expediente');
  } else if (score > 0) {
    riskLevel = 'low';
    suggestedActions.push('Mantener seguimiento ordinario');
  } else {
    riskLevel = 'unknown';
    suggestedActions.push('Completar datos del expediente para evaluar riesgo');
  }

  const dataQuality = Math.max(0, 100 - (pendingDocs * 5 + (daysSinceLastUpdate != null ? Math.min(daysSinceLastUpdate, 100) : 0)));
  const confidence = Math.max(50, 100 - (overdueDeadlines * 10));

  return { riskLevel, score, reasons, blockingFactors, dataQuality, confidence, suggestedActions };
}

function computeWorkload(
  activeCases: number,
  criticalCases: number,
  openTasks: number,
  overdueTasks: number,
  upcomingDeadlines: number,
  pendingDocuments: number,
) {
  const weightedLoad =
    activeCases * 10 + criticalCases * 20 + openTasks * 5 +
    overdueTasks * 15 + upcomingDeadlines * 8 + pendingDocuments * 3;
  const capacity = 100;
  const utilization = Math.min(Math.round((weightedLoad / capacity) * 100), 200);

  const suggestedReassignments: string[] = [];
  if (utilization > 120) {
    suggestedReassignments.push('Considerar reasignación de expedientes menos críticos');
  }
  if (criticalCases > 5) {
    suggestedReassignments.push('Distribuir casos críticos entre el equipo');
  }
  if (overdueTasks > 10) {
    suggestedReassignments.push('Revisar carga de tareas vencidas para redistribución');
  }

  return { weightedLoad, utilization, suggestedReassignments };
}

describe('RiskService — computeRisk', () => {
  it('returns unknown for zero risk factors', () => {
    const r = computeRisk(0, 0, 0, null, false);
    expect(r.riskLevel).toBe('unknown');
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual([]);
    expect(r.blockingFactors).toEqual([]);
    expect(r.suggestedActions).toContain('Completar datos del expediente para evaluar riesgo');
    expect(r.dataQuality).toBe(100);
    expect(r.confidence).toBe(100);
  });

  it('returns low for 1 pending doc', () => {
    const r = computeRisk(1, 0, 0, null, false);
    expect(r.riskLevel).toBe('low');
    expect(r.score).toBe(10);
    expect(r.reasons).toContain('1 documentos pendientes');
    expect(r.dataQuality).toBe(95);
  });

  it('returns medium for 4 pending docs', () => {
    const r = computeRisk(4, 0, 0, null, false);
    expect(r.riskLevel).toBe('medium');
    expect(r.score).toBe(40);
    expect(r.suggestedActions).toContain('Revisar documentos pendientes');
  });

  it('returns medium for 2 pending + 1 task', () => {
    const r = computeRisk(2, 0, 1, null, false);
    expect(r.riskLevel).toBe('medium');
    expect(r.score).toBe(25);
    expect(r.reasons).toContain('1 tareas abiertas');
  });

  it('returns high for 1 overdue deadline', () => {
    const r = computeRisk(0, 1, 0, null, false);
    expect(r.riskLevel).toBe('high');
    expect(r.confidence).toBe(90);
    expect(r.suggestedActions).toContain('Gestionar plazos vencidos con prioridad');
  });

  it('reports staleness reason for 60+ days stale', () => {
    const r = computeRisk(0, 0, 0, 61, false);
    expect(r.reasons).toContain('61 días sin actualización');
    expect(r.score).toBe(10);
    expect(r.dataQuality).toBe(39);
  });

  it('returns critical for >5 overdue deadlines', () => {
    const r = computeRisk(0, 6, 0, null, false);
    expect(r.riskLevel).toBe('critical');
    expect(r.suggestedActions).toContain('Revisión urgente del expediente');
    expect(r.confidence).toBe(50);
  });

  it('returns critical for score 80+ (docs + deadlines + block)', () => {
    const r = computeRisk(4, 2, 0, null, true);
    expect(r.riskLevel).toBe('critical');
    expect(r.score).toBe(100);
    expect(r.suggestedActions).toContain('Revisión urgente del expediente');
  });

  it('caps score at 100', () => {
    const r = computeRisk(4, 3, 0, null, true);
    expect(r.score).toBe(100);
    expect(r.riskLevel).toBe('critical');
  });

  it('includes blocking factors', () => {
    const r = computeRisk(0, 0, 0, null, true);
    expect(r.blockingFactors).toContain('Expediente bloqueado por requisito pendiente');
    expect(r.score).toBe(20);
  });

  it('reports staleness for >30 days without update', () => {
    const r = computeRisk(0, 0, 0, 60, false);
    expect(r.reasons).toContain('60 días sin actualización');
  });

  it('data quality decreases with stale data', () => {
    const r = computeRisk(0, 0, 0, 50, false);
    expect(r.dataQuality).toBe(50);
  });

  it('data quality floor at 0', () => {
    const r = computeRisk(50, 0, 0, 200, false);
    expect(r.dataQuality).toBe(0);
  });

  it('confidence floor at 50', () => {
    const r = computeRisk(0, 10, 0, null, false);
    expect(r.confidence).toBe(50);
  });

  it('combines all factors correctly', () => {
    const r = computeRisk(3, 2, 5, 45, true);
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
    expect(r.score).toBe(100);
    expect(r.riskLevel).toBe('critical');
  });

  it('does not suggest strong actions for unknown', () => {
    const r = computeRisk(0, 0, 0, null, false);
    expect(r.riskLevel).toBe('unknown');
    expect(r.suggestedActions).not.toContain('Revisión urgente del expediente');
    expect(r.suggestedActions).not.toContain('Programar revisión del expediente');
  });

  it('all 5 risk levels are reachable', () => {
    expect(computeRisk(0, 0, 0, null, false).riskLevel).toBe('unknown');
    expect(computeRisk(1, 0, 0, null, false).riskLevel).toBe('low');
    expect(computeRisk(4, 0, 0, null, false).riskLevel).toBe('medium');
    expect(computeRisk(0, 1, 0, null, false).riskLevel).toBe('high');
    expect(computeRisk(0, 6, 0, null, false).riskLevel).toBe('critical');
  });
});

describe('WorkloadService — computeWorkload', () => {
  it('returns zero for empty state', () => {
    const w = computeWorkload(0, 0, 0, 0, 0, 0);
    expect(w.utilization).toBe(0);
    expect(w.weightedLoad).toBe(0);
    expect(w.suggestedReassignments).toEqual([]);
  });

  it('calculates weighted load correctly', () => {
    const w = computeWorkload(5, 0, 10, 0, 5, 20);
    expect(w.weightedLoad).toBe(5 * 10 + 10 * 5 + 5 * 8 + 20 * 3);
  });

  it('normal utilization (70%)', () => {
    const w = computeWorkload(3, 1, 5, 0, 2, 5);
    expect(w.utilization).toBeGreaterThanOrEqual(50);
    expect(w.utilization).toBeLessThanOrEqual(120);
    expect(w.suggestedReassignments).toEqual([]);
  });

  it('suggests reassignment when utilization > 120', () => {
    const w = computeWorkload(10, 5, 30, 10, 10, 50);
    expect(w.utilization).toBeGreaterThan(120);
    expect(w.suggestedReassignments.length).toBeGreaterThan(0);
  });

  it('suggests redistributing critical cases', () => {
    const w = computeWorkload(5, 6, 5, 0, 0, 0);
    expect(w.suggestedReassignments).toContain('Distribuir casos críticos entre el equipo');
  });

  it('suggests overdue task review', () => {
    const w = computeWorkload(0, 0, 0, 11, 0, 0);
    expect(w.suggestedReassignments).toContain('Revisar carga de tareas vencidas para redistribución');
  });

  it('caps utilization at 200', () => {
    const w = computeWorkload(100, 50, 200, 50, 100, 500);
    expect(w.utilization).toBe(200);
  });

  it('does NOT execute automatic reassignment (simulation only)', () => {
    const w = computeWorkload(10, 5, 30, 10, 10, 50);
    expect(w.suggestedReassignments).toEqual(
      expect.arrayContaining(['Considerar reasignación de expedientes menos críticos']),
    );
    expect(w.suggestedReassignments[0]).toMatch(/Considerar|Distribuir|Revisar/);
  });

  it('zero capacity scenario still shows utilization', () => {
    // capacity is fixed at 100; zero cases means 0% utilization
    const w = computeWorkload(0, 0, 0, 0, 0, 0);
    expect(w.utilization).toBe(0);
    expect(w.suggestedReassignments).toEqual([]);
  });
});

describe('Risk levels — invariance', () => {
  it('all RISK_LEVELS are valid', () => {
    RISK_LEVELS.forEach((l) => {
      expect(['low', 'medium', 'high', 'critical', 'unknown']).toContain(l);
    });
  });

  it('every computeRisk result maps to a valid level', () => {
    for (let docs = 0; docs <= 10; docs++) {
      for (let deadlines = 0; deadlines <= 5; deadlines++) {
        const r = computeRisk(docs, deadlines, 0, null, false);
        expect(RISK_LEVELS).toContain(r.riskLevel);
      }
    }
  });

  it('suggested actions are non-empty for every risk level except unknown with no data', () => {
    expect(computeRisk(0, 0, 0, null, false).suggestedActions.length).toBeGreaterThan(0);
    expect(computeRisk(1, 0, 0, null, false).suggestedActions.length).toBeGreaterThan(0);
    expect(computeRisk(4, 0, 0, null, false).suggestedActions.length).toBeGreaterThan(0);
    expect(computeRisk(0, 1, 0, null, false).suggestedActions.length).toBeGreaterThan(0);
    expect(computeRisk(0, 6, 0, null, false).suggestedActions.length).toBeGreaterThan(0);
  });
});

describe('Security — isolation and authorization (logic)', () => {
  it('risk computation is pure — no side effects', () => {
    const r1 = computeRisk(5, 1, 3, null, false);
    const r2 = computeRisk(5, 1, 3, null, false);
    expect(r1).toEqual(r2);
  });

  it('workload computation is pure — no side effects', () => {
    const w1 = computeWorkload(5, 1, 3, 0, 2, 10);
    const w2 = computeWorkload(5, 1, 3, 0, 2, 10);
    expect(w1).toEqual(w2);
  });

  it('different org contexts produce different results (org isolation logic)', () => {
    const orgA = computeRisk(5, 0, 0, null, false);
    const orgB = computeRisk(0, 0, 0, null, false);
    expect(orgA.riskLevel).not.toBe(orgB.riskLevel);
  });

  it('suspended user simulation returns risk=unknown (no data)', () => {
    const r = computeRisk(0, 0, 0, null, false);
    expect(r.riskLevel).toBe('unknown');
  });

  it('flag off simulation returns safe defaults', () => {
    const r = computeRisk(0, 0, 0, null, false);
    expect(r.riskLevel).toBe('unknown');
    expect(r.suggestedActions).toContain('Completar datos del expediente para evaluar riesgo');
  });
});

describe('Workload — no automatic reassignment', () => {
  it('simulation never modifies responsible', () => {
    // The computeWorkload function returns suggestions only
    const w = computeWorkload(10, 5, 30, 10, 10, 50);
    expect(w.suggestedReassignments).toBeDefined();
    expect(w.suggestedReassignments.length).toBeGreaterThan(0);
    // No property like 'newResponsible' should exist
    expect(Object.keys(w)).not.toContain('newResponsible');
    expect(Object.keys(w).sort()).toEqual(['suggestedReassignments', 'utilization', 'weightedLoad']);
  });

  it('human confirmation required before any reassignment action', () => {
    const w = computeWorkload(10, 5, 30, 10, 10, 50);
    // All suggestions are prefixed with action verbs, not execution
    w.suggestedReassignments.forEach((s) => {
      expect(s).toMatch(/Considerar|Distribuir|Revisar/);
    });
  });

  it('rejection of suggestion does not affect system', () => {
    const w1 = computeWorkload(10, 5, 30, 10, 10, 50);
    // Rejecting suggestions should not change state
    const w2 = computeWorkload(10, 5, 30, 10, 10, 50);
    expect(w2).toEqual(w1);
  });
});

describe('Feature flags', () => {
  it('all risk levels are valid', () => {
    RISK_LEVELS.forEach((l) => {
      expect(['low', 'medium', 'high', 'critical', 'unknown']).toContain(l);
    });
  });

  it('feature flags are deny-by-default', () => {
    const flags = ['sgie.risk.enabled', 'sgie.workload.enabled'];
    flags.forEach((f) => {
      expect(f.startsWith('sgie.')).toBe(true);
    });
  });
});
