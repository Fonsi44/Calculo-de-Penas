import { db } from '@/lib/db';
import { outboxEvents, type OutboxEvent } from '@/lib/schema';
import { eq, sql, count } from 'drizzle-orm';

export const OUTBOX_EVENTS = {
  CASE_CREATED: 'case.created',
  WORKFLOW_INSTANTIATED: 'workflow.instantiated',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSING_REQUESTED: 'document.processing.requested',
  DOCUMENT_PROCESSED: 'document.processed',
  DOCUMENT_REVIEW_REQUIRED: 'document.review.required',
  DOCUMENT_APPROVED: 'document.approved',
  DOCUMENT_APPROVAL_REVERTED: 'document.approval.reverted',
  REQUIREMENT_COMPLETED: 'requirement.completed',
  COMMUNICATION_REQUESTED: 'communication.requested',
  COMMUNICATION_CANCELLED: 'communication.cancelled',
  SIGNATURE_PACKAGE_CREATED: 'signature.package.created',
  SIGNATURE_PACKAGE_READY: 'signature.package.ready',
  SIGNATURE_PACKAGE_LOCKED: 'signature.package.locked',
  SIGNATURE_PACKAGE_CANCELLED: 'signature.package.cancelled',
  SIGNATURE_PACKAGE_SUPERSEDED: 'signature.package.superseded',
  SIGNATURE_ENVELOPE_CREATED: 'signature.envelope.created',
  SIGNATURE_ENVELOPE_SENT: 'signature.envelope.sent',
  SIGNATURE_ENVELOPE_COMPLETED: 'signature.envelope.completed',
  SIGNATURE_ENVELOPE_CANCELLED: 'signature.envelope.cancelled',
  SIGNATURE_ENVELOPE_DECLINED: 'signature.envelope.declined',
  SIGNATURE_ENVELOPE_EXPIRED: 'signature.envelope.expired',
  RISK_EVALUATION_REQUESTED: 'risk.evaluation.requested',
  WORKLOAD_CALCULATION_REQUESTED: 'workload.calculation.requested',
} as const;

export type OutboxEventType = (typeof OUTBOX_EVENTS)[keyof typeof OUTBOX_EVENTS];

export async function encolarEvento(input: {
  tipo: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  idempotencyKey?: string;
}): Promise<OutboxEvent> {
  // If idempotencyKey is provided, try insert with ON CONFLICT DO NOTHING
  if (input.idempotencyKey) {
    const [evento] = await db
      .insert(outboxEvents)
      .values({
        eventType: input.tipo,
        aggregateType: input.aggregateType ?? null,
        aggregateId: input.aggregateId ?? null,
        payload: input.payload,
        correlationId: input.correlationId ?? null,
        idempotencyKey: input.idempotencyKey,
      })
      .onConflictDoNothing({ target: outboxEvents.idempotencyKey })
      .returning();

    // If ON CONFLICT prevented insert, return the existing event
    if (!evento) {
      const [existing] = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) return existing;
    }
    if (!evento) throw new Error('No se pudo crear el evento de outbox (idempotent)');
    return evento;
  }

  const [evento] = await db
    .insert(outboxEvents)
    .values({
      eventType: input.tipo,
      aggregateType: input.aggregateType ?? null,
      aggregateId: input.aggregateId ?? null,
      payload: input.payload,
      correlationId: input.correlationId ?? null,
    })
    .returning();

  if (!evento) throw new Error('No se pudo crear el evento de outbox');
  return evento;
}

export async function despacharEventos(limite: number): Promise<{ despachados: number; fallidos: number }> {
  const result = await db.execute(sql`
    UPDATE "outbox_events"
    SET "status" = 'enviando', "locked_at" = NOW(), "lock_expires_at" = NOW() + INTERVAL '5 minutes', "worker_id" = 'cron'
    WHERE "id" IN (
      SELECT "id" FROM "outbox_events"
      WHERE "status" = 'pending' AND ("intentos" IS NULL OR "intentos" < "max_intentos")
      ORDER BY "creado_en" ASC
      LIMIT ${limite} FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);

  const eventos = (result.rows ?? []) as unknown as OutboxEvent[];
  let despachados = 0;
  let fallidos = 0;

  for (const evento of eventos) {
    try {
      await completarEvento(evento.id);
      despachados++;
    } catch (err) {
      await fallarEvento(evento.id, (err as Error).message);
      fallidos++;
    }
  }

  return { despachados, fallidos };
}

export async function fallarEvento(eventId: string, error: string): Promise<void> {
  await db
    .update(outboxEvents)
    .set({
      status: 'failed',
      error,
      intentos: sql`COALESCE("intentos", 0) + 1`,
      lockedAt: null,
      lockExpiresAt: null,
      workerId: null,
    })
    .where(eq(outboxEvents.id, eventId));
}

export async function completarEvento(eventId: string): Promise<void> {
  await db
    .update(outboxEvents)
    .set({
      status: 'completed',
      procesadoEn: new Date(),
      lockedAt: null,
      lockExpiresAt: null,
      workerId: null,
    })
    .where(eq(outboxEvents.id, eventId));
}

export async function recuperarEventosBloqueados(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE "outbox_events"
    SET "status" = 'pending', "locked_at" = NULL, "lock_expires_at" = NULL, "worker_id" = NULL
    WHERE "status" = 'enviando' AND "lock_expires_at" < NOW() - INTERVAL '30 minutes'
    RETURNING id
  `);
  return (result.rows ?? []).length;
}

export async function obtenerMetricasOutbox(): Promise<{
  pendientes: number;
  fallidos: number;
  completados: number;
  mas_antiguo: number | null;
}> {
  const [pendientes, fallidos, completados, masAntiguo] = await Promise.all([
    db.select({ n: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'pending')),
    db.select({ n: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'failed')),
    db.select({ n: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'completed')),
    db
      .select({ creadoEn: outboxEvents.creadoEn })
      .from(outboxEvents)
      .where(eq(outboxEvents.status, 'pending'))
      .orderBy(sql`${outboxEvents.creadoEn} ASC`)
      .limit(1),
  ]);

  const masAntiguoMs = masAntiguo[0]?.creadoEn
    ? Date.now() - new Date(masAntiguo[0].creadoEn).getTime()
    : null;

  return {
    pendientes: Number(pendientes[0]?.n ?? 0),
    fallidos: Number(fallidos[0]?.n ?? 0),
    completados: Number(completados[0]?.n ?? 0),
    mas_antiguo: masAntiguoMs !== null ? Math.floor(masAntiguoMs / 1000) : null,
  };
}
