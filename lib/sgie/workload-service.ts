import { db } from '@/lib/db';
import { workloadSnapshots, type WorkloadSnapshot, type WorkloadSnapshotInsert } from '@/lib/schema';
import { sql, eq, desc, and } from 'drizzle-orm';

export interface WorkloadResult {
  activeCases: number;
  criticalCases: number;
  openTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  pendingDocuments: number;
  weightedLoad: number;
  capacity: number;
  utilization: number;
  suggestedReassignments: string[];
}

export async function calculateWorkload(userId: string): Promise<WorkloadResult> {
  const data = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM expedientes WHERE responsable_id=${userId}::uuid AND estado NOT IN ('cerrado','archivado')) as active_cases,
      (SELECT count(*)::int FROM expedientes WHERE responsable_id=${userId}::uuid AND estado IN ('urgente','critical')) as critical_cases,
      (SELECT count(*)::int FROM tareas WHERE asignado_a=${userId}::uuid AND estado != 'completada') as open_tasks,
      (SELECT count(*)::int FROM tareas WHERE asignado_a=${userId}::uuid AND estado != 'completada' AND fecha_vencimiento < NOW()) as overdue_tasks,
      (SELECT count(*)::int FROM events WHERE event_type='deadline' AND resource_id IN (SELECT id FROM expedientes WHERE responsable_id=${userId}::uuid) AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as upcoming_deadlines,
      (SELECT count(*)::int FROM documentos_expediente de JOIN expedientes e ON e.id=de.expediente_id WHERE e.responsable_id=${userId}::uuid AND de.estado NOT IN ('aprobado','rechazado')) as pending_documents
  `);
  const row = (data as unknown as { rows: Record<string, unknown>[] }).rows?.[0] || {};
  const activeCases = Number(row.active_cases) || 0;
  const criticalCases = Number(row.critical_cases) || 0;
  const openTasks = Number(row.open_tasks) || 0;
  const overdueTasks = Number(row.overdue_tasks) || 0;
  const upcomingDeadlines = Number(row.upcoming_deadlines) || 0;
  const pendingDocuments = Number(row.pending_documents) || 0;

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

  return {
    activeCases, criticalCases, openTasks, overdueTasks,
    upcomingDeadlines, pendingDocuments, weightedLoad,
    capacity, utilization, suggestedReassignments,
  };
}

export async function calculateAndPersistWorkload(userId: string): Promise<WorkloadResult> {
  const result = await calculateWorkload(userId);

  const insert: WorkloadSnapshotInsert = {
    userId,
    activeCases: result.activeCases,
    criticalCases: result.criticalCases,
    openTasks: result.openTasks,
    overdueTasks: result.overdueTasks,
    upcomingDeadlines: result.upcomingDeadlines,
    pendingDocuments: result.pendingDocuments,
    weightedLoad: result.weightedLoad,
    capacity: result.capacity,
    utilization: result.utilization,
    suggestedReassignments: JSON.parse(JSON.stringify(result.suggestedReassignments)),
  };
  await db.insert(workloadSnapshots).values(insert);

  return result;
}

export async function getLatestWorkload(userId: string): Promise<WorkloadSnapshot | null> {
  const rows = await db
    .select()
    .from(workloadSnapshots)
    .where(eq(workloadSnapshots.userId, userId))
    .orderBy(desc(workloadSnapshots.calculatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOverloadedUsers(utilizationThreshold = 100, limit = 20): Promise<WorkloadSnapshot[]> {
  const rows = await db
    .select()
    .from(workloadSnapshots)
    .where(sql`${workloadSnapshots.utilization} >= ${utilizationThreshold}`)
    .orderBy(desc(workloadSnapshots.utilization))
    .limit(limit);
  return rows;
}
