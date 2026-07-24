import { db } from '@/lib/db';
import { sql, eq, and } from 'drizzle-orm';
import { encolarEvento, OUTBOX_EVENTS } from '@/lib/sgie/outbox';
import { evaluateAndPersistRisk } from '@/lib/sgie/risk-service';
import { calculateAndPersistWorkload } from '@/lib/sgie/workload-service';

export async function requestRiskEvaluation(expedienteId: string): Promise<void> {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.RISK_EVALUATION_REQUESTED,
    aggregateType: 'expediente',
    aggregateId: expedienteId,
    payload: { expedienteId },
  });
}

export async function requestWorkloadCalculation(userId: string): Promise<void> {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.WORKLOAD_CALCULATION_REQUESTED,
    aggregateType: 'usuario',
    aggregateId: userId,
    payload: { userId },
  });
}

export async function processRiskEvaluationJob(event: {
  aggregateId?: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const expedienteId = event.aggregateId ?? (event.payload.expedienteId as string);
  if (!expedienteId) throw new Error('expedienteId requerido');
  await evaluateAndPersistRisk(expedienteId);
}

export async function processWorkloadCalculationJob(event: {
  aggregateId?: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const userId = event.aggregateId ?? (event.payload.userId as string);
  if (!userId) throw new Error('userId requerido');
  await calculateAndPersistWorkload(userId);
}

export async function recalculateAllRisk(): Promise<number> {
  const expedientes = await db.execute(sql`
    SELECT id FROM expedientes WHERE estado NOT IN ('cerrado','archivado')
  `);
  const rows = (expedientes as unknown as { rows: Array<{ id: string }> }).rows ?? [];
  for (const row of rows) {
    await requestRiskEvaluation(row.id);
  }
  return rows.length;
}

export async function recalculateAllWorkload(): Promise<number> {
  const usuarios = await db.execute(sql`
    SELECT id FROM usuarios WHERE activo = true
  `);
  const rows = (usuarios as unknown as { rows: Array<{ id: string }> }).rows ?? [];
  for (const row of rows) {
    await requestWorkloadCalculation(row.id);
  }
  return rows.length;
}
