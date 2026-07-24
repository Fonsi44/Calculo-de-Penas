import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { encolarEvento, OUTBOX_EVENTS, despacharEventos, completarEvento } from '@/lib/sgie/outbox';
import { evaluateAndPersistRisk } from '@/lib/sgie/risk-service';
import { calculateAndPersistWorkload } from '@/lib/sgie/workload-service';

function makeIdempotencyKey(prefix: string, entityId: string): string {
  return `${prefix}:${entityId}:v1`;
}

export async function requestRiskEvaluation(expedienteId: string): Promise<void> {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.RISK_EVALUATION_REQUESTED,
    aggregateType: 'expediente',
    aggregateId: expedienteId,
    payload: { expedienteId },
    idempotencyKey: makeIdempotencyKey('risk-eval', expedienteId),
  });
}

export async function requestWorkloadCalculation(userId: string): Promise<void> {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.WORKLOAD_CALCULATION_REQUESTED,
    aggregateType: 'usuario',
    aggregateId: userId,
    payload: { userId },
    idempotencyKey: makeIdempotencyKey('workload-calc', userId),
  });
}

export async function processRiskEvaluationJob(event: {
  id: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const expedienteId = event.aggregateId ?? (event.payload.expedienteId as string);
  if (!expedienteId) throw new Error('expedienteId requerido');
  await evaluateAndPersistRisk(expedienteId);
  await completarEvento(event.id);
}

export async function processWorkloadCalculationJob(event: {
  id: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const userId = event.aggregateId ?? (event.payload.userId as string);
  if (!userId) throw new Error('userId requerido');
  await calculateAndPersistWorkload(userId);
  await completarEvento(event.id);
}

export async function processNextJobs(limit = 10): Promise<{ despachados: number; fallidos: number }> {
  return despacharEventos(limit);
}

export async function recalculateAllRisk(): Promise<number> {
  const expedientes = await db.execute(sql`
    SELECT id FROM expedientes WHERE estado NOT IN ('finalizado','archivado')
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
