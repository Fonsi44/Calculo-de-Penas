import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  caseId?: string;
  actionUrl?: string;
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];

  // Overdue tasks
  const overdueTasks = await db.execute(sql`
    SELECT count(*)::int as c FROM tareas WHERE asignada_a=${userId}::uuid AND estado!='completada' AND fecha_vencimiento < NOW()
  `);
  const overdueCount = Number((overdueTasks as unknown as { rows: Array<Record<string, unknown>> }).rows?.[0]?.c || 0);
  if (overdueCount > 0) {
    recs.push({ type: 'task', title: 'Tareas vencidas', description: `${overdueCount} tareas requieren atención inmediata.`, priority: 'alta', actionUrl: '/intranet/sgie/tareas' });
  }

  // Upcoming deadlines
  const deadlines = await db.execute(sql`
    SELECT count(*)::int as c FROM events WHERE event_type='deadline' AND resource_id IN (SELECT id FROM expedientes WHERE responsable_id=${userId}::uuid) AND due_date BETWEEN NOW() AND NOW()+INTERVAL '3 days'
  `);
  const deadlineCount = Number((deadlines as unknown as { rows: Array<Record<string, unknown>> }).rows?.[0]?.c || 0);
  if (deadlineCount > 0) {
    recs.push({ type: 'deadline', title: 'Plazos próximos', description: `${deadlineCount} plazos vencen en los próximos 3 días.`, priority: 'alta', actionUrl: '/intranet/sgie/agenda' });
  }

  // Unread notifications
  recs.push({ type: 'info', title: 'Revisión diaria', description: 'Revisa tus expedientes y actualiza la información pendiente.', priority: 'media' });

  return recs;
}
