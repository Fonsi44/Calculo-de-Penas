import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { encolarEvento, OUTBOX_EVENTS, completarEvento } from '@/lib/sgie/outbox';
import { generateBrief } from '@/lib/sgie/brief-service';

export async function requestDailyBrief(userId: string) {
  await encolarEvento({
    tipo: OUTBOX_EVENTS.DAILY_BRIEF_GENERATION_REQUESTED,
    aggregateType: 'usuario', aggregateId: userId,
    payload: { userId },
    idempotencyKey: `brief:${userId}:${new Date().toISOString().split('T')[0]}`,
  });
}

export async function generateAllDailyBriefs(): Promise<number> {
  const users = await db.execute(sql`SELECT id FROM usuarios WHERE activo=true`);
  const rows = (users as unknown as { rows: Array<{ id: string }> }).rows ?? [];
  for (const row of rows) {
    await requestDailyBrief(row.id);
  }
  return rows.length;
}

export async function processDailyBriefJob(event: { id: string; payload: Record<string, unknown> }) {
  const userId = event.payload.userId as string;
  if (!userId) throw new Error('userId requerido');
  await generateBrief(userId);
  await completarEvento(event.id);
}
