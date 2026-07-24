import { db } from '@/lib/db';
import { riskEvaluations, type RiskEvaluation, type RiskEvaluationInsert } from '@/lib/schema';
import { sql, eq, and, desc } from 'drizzle-orm';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface RiskResult {
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  blockingFactors: string[];
  dataQuality: number;
  confidence: number;
  suggestedActions: string[];
}

function computeRisk(
  pendingDocs: number,
  overdueDeadlines: number,
  openTasks: number,
  daysSinceLastUpdate: number | null,
  hasActiveBlock: boolean,
): RiskResult {
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

  let riskLevel: RiskLevel;
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

export async function evaluateRisk(expedienteId: string): Promise<RiskResult> {
  const data = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM documentos_expediente WHERE expediente_id=${expedienteId}::uuid AND estado NOT IN ('aprobado','rechazado')) as pending_docs,
      (SELECT count(*)::int FROM events WHERE event_type='deadline' AND resource_id=${expedienteId} AND due_date < NOW()) as overdue_deadlines,
      (SELECT count(*)::int FROM tareas WHERE expediente_id=${expedienteId}::uuid AND estado != 'completada') as open_tasks,
      (SELECT CASE WHEN count(*) > 0 THEN EXTRACT(DAY FROM NOW() - MAX(creado_en))::int ELSE NULL END FROM events WHERE resource_id=${expedienteId}) as days_since_last_update,
      (SELECT count(*)::int > 0 FROM requisitos_expediente WHERE expediente_id=${expedienteId}::uuid AND estado = 'pendiente') as has_active_block
  `);
  const row = (data as unknown as { rows: Record<string, unknown>[] }).rows?.[0] || {};
  const pendingDocs = Number(row.pending_docs) || 0;
  const overdueDeadlines = Number(row.overdue_deadlines) || 0;
  const openTasks = Number(row.open_tasks) || 0;
  const daysSinceLastUpdate = row.days_since_last_update != null ? Number(row.days_since_last_update) : null;
  const hasActiveBlock = Boolean(row.has_active_block);

  const result = computeRisk(pendingDocs, overdueDeadlines, openTasks, daysSinceLastUpdate, hasActiveBlock);
  return result;
}

export async function evaluateAndPersistRisk(expedienteId: string): Promise<RiskResult> {
  const result = await evaluateRisk(expedienteId);

  const insert: RiskEvaluationInsert = {
    expedienteId,
    riskLevel: result.riskLevel,
    score: result.score,
    reasons: JSON.parse(JSON.stringify(result.reasons)),
    blockingFactors: JSON.parse(JSON.stringify(result.blockingFactors)),
    dueDates: [],
    dataQuality: result.dataQuality,
    confidence: result.confidence,
    suggestedActions: JSON.parse(JSON.stringify(result.suggestedActions)),
    modelVersion: '1.0',
  };
  await db.insert(riskEvaluations).values(insert);

  return result;
}

export async function getLatestRisk(expedienteId: string): Promise<RiskEvaluation | null> {
  const rows = await db
    .select()
    .from(riskEvaluations)
    .where(eq(riskEvaluations.expedienteId, expedienteId))
    .orderBy(desc(riskEvaluations.calculatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listRisksByLevel(riskLevel: RiskLevel, limit = 50): Promise<RiskEvaluation[]> {
  return db
    .select()
    .from(riskEvaluations)
    .where(eq(riskEvaluations.riskLevel, riskLevel))
    .orderBy(desc(riskEvaluations.calculatedAt))
    .limit(limit);
}
