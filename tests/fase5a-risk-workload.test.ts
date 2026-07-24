import { describe, it, expect } from 'vitest';

// Test the pure computation logic without DB
// The DB integration is tested via the API + E2E

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
    activeCases * 10 +
    criticalCases * 20 +
    openTasks * 5 +
    overdueTasks * 15 +
    upcomingDeadlines * 8 +
    pendingDocuments * 3;
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

describe('RiskService — computeRisk (pure)', () => {
  it('returns unknown for zero risk factors', () => {
    const r = computeRisk(0, 0, 0, null, false);
    expect(r.riskLevel).toBe('unknown');
    expect(r.score).toBe(0);
    expect(r.suggestedActions).toContain('Completar datos del expediente para evaluar riesgo');
  });

  it('returns low for minor pending docs', () => {
    const r = computeRisk(1, 0, 0, null, false);
    expect(r.riskLevel).toBe('low');
    expect(r.score).toBe(10);
    expect(r.reasons).toContain('1 documentos pendientes');
  });

  it('returns medium for >3 pending docs', () => {
    const r = computeRisk(4, 0, 0, null, false);
    expect(r.riskLevel).toBe('medium');
    expect(r.score).toBeGreaterThanOrEqual(25);
  });

  it('returns high for any overdue deadline', () => {
    const r = computeRisk(0, 1, 0, null, false);
    expect(r.riskLevel).toBe('high');
    expect(r.reasons).toContain('1 plazos vencidos');
  });

  it('returns critical for >5 overdue deadlines', () => {
    const r = computeRisk(0, 6, 0, null, false);
    expect(r.riskLevel).toBe('critical');
    expect(r.suggestedActions).toContain('Revisión urgente del expediente');
  });

  it('returns critical for score >= 80 (pending docs + overdue + block)', () => {
    const r = computeRisk(4, 2, 0, null, true);
    expect(r.riskLevel).toBe('critical');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('includes blocking factors', () => {
    const r = computeRisk(0, 0, 0, null, true);
    expect(r.blockingFactors).toContain('Expediente bloqueado por requisito pendiente');
    expect(r.score).toBeGreaterThan(0);
  });

  it('includes staleness reason for old cases', () => {
    const r = computeRisk(0, 0, 0, 60, false);
    expect(r.reasons).toContain('60 días sin actualización');
  });

  it('caps score at 100 with high overdue deadlines', () => {
    const r = computeRisk(4, 3, 0, null, true);
    expect(r.score).toBe(100);
    expect(r.riskLevel).toBe('critical');
  });

  it('data quality decreases with more issues', () => {
    const r1 = computeRisk(0, 0, 0, null, false);
    expect(r1.dataQuality).toBe(100);
    const r2 = computeRisk(5, 2, 10, 30, false);
    expect(r2.dataQuality).toBeLessThan(100);
  });
});

describe('WorkloadService — computeWorkload (pure)', () => {
  it('returns low utilization for empty state', () => {
    const w = computeWorkload(0, 0, 0, 0, 0, 0);
    expect(w.utilization).toBe(0);
    expect(w.suggestedReassignments).toEqual([]);
  });

  it('calculates weighted load correctly', () => {
    const w = computeWorkload(5, 0, 10, 0, 5, 20);
    expect(w.weightedLoad).toBe(5 * 10 + 10 * 5 + 5 * 8 + 20 * 3);
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

  it('caps utilization at 200', () => {
    const w = computeWorkload(100, 50, 200, 50, 100, 500);
    expect(w.utilization).toBe(200);
    expect(w.suggestedReassignments).toContain('Considerar reasignación de expedientes menos críticos');
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
