/**
 * RiskService — Fase 5A. Evaluación explicable de riesgo de plazos y carga.
 */
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function evaluateRisk(expedienteId: string): Promise<{
  riskLevel: string; score: number; reasons: string[];
  blockingFactors: string[]; confidence: number;
}> {
  // Deterministic calculation from verified data
  const data = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM documentos_expediente WHERE expediente_id=${expedienteId}::uuid AND estado NOT IN ('aprobado','rechazado')) as pending_docs,
      (SELECT count(*)::int FROM events WHERE event_type='deadline' AND resource_id=${expedienteId} AND due_date < NOW()) as overdue_deadlines
  `);
  const row = (data as unknown as { rows: Record<string, unknown>[] }).rows?.[0] || {};
  const pendingDocs = Number(row.pending_docs) || 0;
  const overdueDeadlines = Number(row.overdue_deadlines) || 0;

  const score = Math.min(pendingDocs * 10 + overdueDeadlines * 25, 100);
  const reasons: string[] = [];
  if (pendingDocs > 0) reasons.push(`${pendingDocs} documentos pendientes`);
  if (overdueDeadlines > 0) reasons.push(`${overdueDeadlines} plazos vencidos`);
  const riskLevel = overdueDeadlines > 0 ? 'high' : pendingDocs > 3 ? 'medium' : 'low';

  return { riskLevel, score, reasons, blockingFactors: [], confidence: 95 };
}
