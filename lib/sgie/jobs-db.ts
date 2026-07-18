import { db } from '@/lib/db';
import { jobsSgie, jobAttempts, deadLetterJobs, type JobSgie, type JobSgieTipo } from '@/lib/schema';
import { and, eq, isNull, sql, desc, count } from 'drizzle-orm';

export interface EncolarJobInput {
  tipo: JobSgieTipo;
  refId?: string;
  payload?: Record<string, unknown>;
  ventanaTemporal?: string;
  maxIntentos?: number;
  idempotencyKey?: string;
  priority?: number;
  correlationId?: string;
}

export async function encolarJob(input: EncolarJobInput): Promise<{ id: string; duplicado: boolean }> {
  const ventana = input.ventanaTemporal ?? new Date().toISOString().slice(0, 10);

  if (input.idempotencyKey) {
    const [existente] = await db
      .select({ id: jobsSgie.id })
      .from(jobsSgie)
      .where(eq(jobsSgie.idempotencyKey, input.idempotencyKey));
    if (existente) {
      return { id: existente.id, duplicado: true };
    }
  }

  const [job] = await db
    .insert(jobsSgie)
    .values({
      tipo: input.tipo,
      refId: input.refId ?? null,
      payload: input.payload ?? null,
      ventanaTemporal: ventana,
      maxIntentos: input.maxIntentos ?? 3,
      idempotencyKey: input.idempotencyKey ?? null,
      priority: input.priority ?? 0,
      workerId: input.correlationId ?? null,
    })
    .onConflictDoNothing({
      target: [jobsSgie.tipo, jobsSgie.refId, jobsSgie.ventanaTemporal],
    })
    .returning({ id: jobsSgie.id });

  if (job) {
    return { id: job.id, duplicado: false };
  }

  const [existente] = await db
    .select({ id: jobsSgie.id })
    .from(jobsSgie)
    .where(
      and(
        eq(jobsSgie.tipo, input.tipo),
        input.refId ? eq(jobsSgie.refId, input.refId) : isNull(jobsSgie.refId),
        eq(jobsSgie.ventanaTemporal, ventana),
      ),
    );
  return { id: existente?.id ?? '', duplicado: true };
}

export async function reclamarJobs(workerId: string, limite: number): Promise<JobSgie[]> {
  const result = await db.execute(sql`
    UPDATE "jobs_sgie"
    SET "estado" = 'en_proceso', "locked_at" = NOW(), "lock_expires_at" = NOW() + INTERVAL '5 minutes', "worker_id" = ${workerId}
    WHERE "id" IN (
      SELECT "id" FROM "jobs_sgie"
      WHERE "estado" = 'pendiente' AND ("next_run_at" IS NULL OR "next_run_at" <= NOW())
      ORDER BY "priority" DESC, "creado_en" ASC
      LIMIT ${limite} FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return (result.rows ?? []) as unknown as JobSgie[];
}

export async function completarJob(jobId: string, _correlationId?: string): Promise<void> {
  await db
    .update(jobsSgie)
    .set({
      estado: 'completado',
      completadoEn: new Date(),
      lockedAt: null,
      lockExpiresAt: null,
      workerId: null,
    })
    .where(eq(jobsSgie.id, jobId));
}

export async function fallarJob(jobId: string, error: string, errorCode?: string, correlationId?: string): Promise<void> {
  const [job] = await db
    .select({ intentos: jobsSgie.intentos, maxIntentos: jobsSgie.maxIntentos })
    .from(jobsSgie)
    .where(eq(jobsSgie.id, jobId));

  if (!job) return;

  const intentosActuales = (job.intentos ?? 0) + 1;
  const maxIntentos = job.maxIntentos ?? 3;

  if (intentosActuales >= maxIntentos) {
    await moverADeadLetter(jobId, error, errorCode, correlationId);
    return;
  }

  const baseDelayMs = 60_000;
  const maxDelayMs = 86_400_000;
  const delay = Math.min(Math.pow(2, intentosActuales) * baseDelayMs, maxDelayMs);
  const jitter = Math.random() * 0.3 * delay;
  const nextRun = new Date(Date.now() + delay + jitter);

  await db
    .update(jobsSgie)
    .set({
      estado: 'pendiente',
      error,
      errorCode: errorCode ?? null,
      intentos: intentosActuales,
      nextRunAt: nextRun,
      lockedAt: null,
      lockExpiresAt: null,
      workerId: null,
    })
    .where(eq(jobsSgie.id, jobId));
}

export async function reintentarJob(jobId: string, _correlationId?: string): Promise<void> {
  await db
    .update(jobsSgie)
    .set({
      estado: 'pendiente',
      error: null,
      errorCode: null,
      intentos: 0,
      nextRunAt: new Date(),
      lockedAt: null,
      lockExpiresAt: null,
      workerId: null,
    })
    .where(eq(jobsSgie.id, jobId));
}

export async function recuperarLocksAbandonados(expirationMinutes: number): Promise<number> {
  const result = await db.execute(sql`
    UPDATE "jobs_sgie"
    SET "estado" = 'pendiente', "locked_at" = NULL, "lock_expires_at" = NULL, "worker_id" = NULL
    WHERE "estado" = 'en_proceso' AND "lock_expires_at" < NOW() - INTERVAL '1 minute' * ${expirationMinutes}
    RETURNING id
  `);
  return (result.rows ?? []).length;
}

export async function listarJobsPendientes(limite = 10): Promise<JobSgie[]> {
  return db
    .select()
    .from(jobsSgie)
    .where(
      and(
        eq(jobsSgie.estado, 'pendiente'),
        sql`(${jobsSgie.nextRunAt} IS NULL OR ${jobsSgie.nextRunAt} <= NOW())`,
      ),
    )
    .orderBy(desc(jobsSgie.priority), sql`${jobsSgie.creadoEn} ASC`)
    .limit(limite);
}

export async function obtenerMetricas(): Promise<{
  pendientes: number;
  en_proceso: number;
  fallidos: number;
  completados: number;
  dead_letter: number;
  mas_antiguo_minutos: number | null;
}> {
  const [pendientes, en_proceso, fallidos, completados, dead_letter, masAntiguo] = await Promise.all([
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'pendiente')),
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'en_proceso')),
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'fallido')),
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'completado')),
    db.select({ n: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'dead_lettered')),
    db
      .select({ creadoEn: jobsSgie.creadoEn })
      .from(jobsSgie)
      .where(eq(jobsSgie.estado, 'pendiente'))
      .orderBy(sql`${jobsSgie.creadoEn} ASC`)
      .limit(1),
  ]);

  const masAntiguoMs = masAntiguo[0]?.creadoEn
    ? Date.now() - new Date(masAntiguo[0].creadoEn).getTime()
    : null;

  return {
    pendientes: Number(pendientes[0]?.n ?? 0),
    en_proceso: Number(en_proceso[0]?.n ?? 0),
    fallidos: Number(fallidos[0]?.n ?? 0),
    completados: Number(completados[0]?.n ?? 0),
    dead_letter: Number(dead_letter[0]?.n ?? 0),
    mas_antiguo_minutos: masAntiguoMs !== null ? Math.floor(masAntiguoMs / 60_000) : null,
  };
}

export async function registrarIntento(
  jobId: string,
  attemptNumber: number,
  error?: string,
  errorCode?: string,
  correlationId?: string,
): Promise<void> {
  await db.insert(jobAttempts).values({
    jobId,
    numeroIntento: attemptNumber,
    estado: error ? 'failed' : 'completed',
    error: error ?? null,
    errorCode: errorCode ?? null,
    correlationId: correlationId ?? null,
    completadoEn: error ? undefined : new Date(),
  });
}

export async function moverADeadLetter(
  jobId: string,
  error: string,
  errorCode?: string,
  correlationId?: string,
): Promise<void> {
  const [job] = await db
    .select({
      tipo: jobsSgie.tipo,
      refId: jobsSgie.refId,
      payload: jobsSgie.payload,
      intentos: jobsSgie.intentos,
    })
    .from(jobsSgie)
    .where(eq(jobsSgie.id, jobId));

  if (!job) return;

  await db.transaction(async (tx) => {
    await tx.insert(deadLetterJobs).values({
      jobId,
      tipo: job.tipo,
      refId: job.refId ?? null,
      payload: job.payload ?? null,
      motivo: error,
      errorFinal: error,
      errorCode: errorCode ?? null,
      intentosTotales: (job.intentos ?? 0) + 1,
      correlationId: correlationId ?? null,
    });

    await tx.update(jobsSgie)
      .set({
        estado: 'dead_lettered',
        error,
        errorCode: errorCode ?? null,
        lockedAt: null,
        lockExpiresAt: null,
        workerId: null,
      })
      .where(eq(jobsSgie.id, jobId));
  });
}
