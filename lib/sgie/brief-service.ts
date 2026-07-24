import { db } from '@/lib/db';
import { dailyBriefs, userPreferences, type DailyBriefInsert } from '@/lib/schema';
import { sql, eq, desc, and } from 'drizzle-orm';

export interface DailyBriefContent {
  summary: string;
  casesSummary: string;
  upcomingDeadlines: Array<{ caseName: string; date: string; description: string }>;
  pendingTasks: Array<{ taskTitle: string; caseName: string; dueDate: string | null }>;
  alerts: Array<{ type: string; message: string }>;
  generatedAt: string;
}

export async function generateBrief(userId: string): Promise<DailyBriefContent> {
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const pref = prefs[0] || { briefScope: 'my_cases', briefTimezone: 'Europe/Madrid' };

  const scopeCond = pref.briefScope === 'my_cases'
    ? sql`e.responsable_id = ${userId}::uuid`
    : sql`1=1`;

  const cases = await db.execute(sql`
    SELECT e.id, e.numero_interno, e.estado, e.cliente_nombre,
      (SELECT count(*)::int FROM tareas t WHERE t.expediente_id=e.id AND t.estado!='completada') as pending_tasks,
      (SELECT count(*)::int FROM events ev WHERE ev.event_type='deadline' AND ev.resource_id=e.id AND ev.due_date BETWEEN NOW() AND NOW()+INTERVAL '7 days') as upcoming_deadlines
    FROM expedientes e WHERE ${scopeCond} AND e.estado NOT IN ('finalizado','archivado')
    ORDER BY e.actualizado_en DESC NULLS LAST LIMIT 20
  `);
  const rows = (cases as unknown as { rows: Array<Record<string, unknown>> }).rows || [];

  const totalCases = rows.length;
  const totalPendingTasks = rows.reduce((s, r) => s + Number(r.pending_tasks || 0), 0);
  const totalUpcomingDeadlines = rows.reduce((s, r) => s + Number(r.upcoming_deadlines || 0), 0);

  const upcomingDeadlines: DailyBriefContent['upcomingDeadlines'] = [];
  const pendingTasks: DailyBriefContent['pendingTasks'] = [];
  const alerts: DailyBriefContent['alerts'] = [];

  for (const row of rows) {
    if (Number(row.upcoming_deadlines) > 0) {
      upcomingDeadlines.push({ caseName: String(row.numero_interno || ''), date: '', description: `${row.upcoming_deadlines} plazos próximos` });
    }
    if (Number(row.pending_tasks) > 0) {
      pendingTasks.push({ taskTitle: `${row.pending_tasks} tareas pendientes`, caseName: String(row.numero_interno || ''), dueDate: null });
    }
  }

  if (totalCases === 0) alerts.push({ type: 'info', message: 'No tienes expedientes activos.' });
  if (totalUpcomingDeadlines > 0) alerts.push({ type: 'warning', message: `${totalUpcomingDeadlines} plazos vencen esta semana.` });
  if (totalPendingTasks > 5) alerts.push({ type: 'warning', message: `Tienes ${totalPendingTasks} tareas pendientes.` });

  const content: DailyBriefContent = {
    summary: `${totalCases} expedientes activos, ${totalPendingTasks} tareas pendientes, ${totalUpcomingDeadlines} plazos próximos.`,
    casesSummary: `${totalCases} casos en seguimiento.`,
    upcomingDeadlines, pendingTasks, alerts,
    generatedAt: new Date().toISOString(),
  };

  // Store in DB
  const today = new Date().toISOString().split('T')[0];
  const insert: DailyBriefInsert = {
    userId, briefDate: today,
    content: JSON.parse(JSON.stringify(content)),
    summary: content.summary,
    generatedByIa: false,
  };
  await db.insert(dailyBriefs).values(insert).onConflictDoNothing({ target: [dailyBriefs.userId, dailyBriefs.briefDate] });

  return content;
}

export async function getBrief(userId: string, date?: string): Promise<DailyBriefContent | null> {
  const briefDate = date || new Date().toISOString().split('T')[0];
  const rows = await db.select().from(dailyBriefs)
    .where(and(eq(dailyBriefs.userId, userId), eq(dailyBriefs.briefDate, briefDate)))
    .limit(1);
  if (!rows[0]) return null;
  return rows[0].content as unknown as DailyBriefContent;
}

export async function getBriefHistory(userId: string, limit = 7) {
  return db.select().from(dailyBriefs)
    .where(eq(dailyBriefs.userId, userId))
    .orderBy(desc(dailyBriefs.briefDate))
    .limit(limit);
}

export async function upsertPreferences(userId: string, prefs: Record<string, unknown>) {
  const values: Record<string, unknown> = { userId, ...prefs };
  await db.insert(userPreferences).values(values as never)
    .onConflictDoUpdate({ target: userPreferences.userId, set: prefs as never });
}

export async function getPreferences(userId: string) {
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return rows[0] || null;
}
