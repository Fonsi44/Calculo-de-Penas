import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface DashboardData {
  totalCases: number;
  activeCases: number;
  pendingDocuments: number;
  pendingSignatures: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  alertsActive: number;
  autonomyLevel: number;
  casesByPriority: Array<{ priority: string; count: number }>;
  casesByState: Array<{ state: string; count: number }>;
}

export async function getDashboard(organizationId?: string, userId?: string): Promise<DashboardData> {
  const orgFilter = organizationId ? sql`AND e.organization_id=${organizationId}::uuid` : sql``;
  const userFilter = userId ? sql`AND e.responsable_id=${userId}::uuid` : sql``;

  const data = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM expedientes e WHERE e.estado NOT IN ('archivado') ${orgFilter} ${userFilter}) as total_cases,
      (SELECT count(*)::int FROM expedientes e WHERE e.estado NOT IN ('finalizado','archivado') ${orgFilter} ${userFilter}) as active_cases,
      (SELECT count(*)::int FROM documentos_expediente de JOIN expedientes e ON e.id=de.expediente_id WHERE de.estado NOT IN ('aprobado','rechazado') ${orgFilter} ${userFilter}) as pending_docs,
      (SELECT count(*)::int FROM signature_envelopes se JOIN signature_packages sp ON sp.id=se.signature_package_id WHERE se.estado_interno='sent' ${orgFilter}) as pending_signatures,
      (SELECT count(*)::int FROM tareas t JOIN expedientes e ON e.id=t.expediente_id WHERE t.estado!='completada' AND t.fecha_vencimiento < NOW() ${orgFilter} ${userFilter}) as overdue_tasks,
      (SELECT count(*)::int FROM events ev JOIN expedientes e ON e.id=ev.resource_id WHERE ev.event_type='deadline' AND ev.due_date BETWEEN NOW() AND NOW()+INTERVAL '7 days' ${orgFilter}) as upcoming_deadlines,
      (SELECT count(*)::int FROM alertas a JOIN expedientes e ON e.id=a.expediente_id WHERE a.resuelta=false ${orgFilter}) as alerts_active
  `);
  const row = (data as unknown as { rows: Array<Record<string, unknown>> }).rows?.[0] || {};

  const priorities = await db.execute(sql`
    SELECT prioridad, count(*)::int as c FROM expedientes e WHERE e.estado NOT IN ('archivado') ${orgFilter} ${userFilter} GROUP BY prioridad ORDER BY prioridad
  `);
  const states = await db.execute(sql`
    SELECT estado, count(*)::int as c FROM expedientes e WHERE e.estado NOT IN ('archivado') ${orgFilter} ${userFilter} GROUP BY estado ORDER BY estado
  `);

  return {
    totalCases: Number(row.total_cases) || 0,
    activeCases: Number(row.active_cases) || 0,
    pendingDocuments: Number(row.pending_docs) || 0,
    pendingSignatures: Number(row.pending_signatures) || 0,
    overdueTasks: Number(row.overdue_tasks) || 0,
    upcomingDeadlines: Number(row.upcoming_deadlines) || 0,
    alertsActive: Number(row.alerts_active) || 0,
    autonomyLevel: 0,
    casesByPriority: (priorities as unknown as { rows: Array<Record<string, unknown>> }).rows?.map(r => ({ priority: String(r.prioridad), count: Number(r.c) })) || [],
    casesByState: (states as unknown as { rows: Array<Record<string, unknown>> }).rows?.map(r => ({ state: String(r.estado), count: Number(r.c) })) || [],
  };
}
