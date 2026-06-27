/**
 * SGIE — cola de jobs idempotente (Fase 6/7).
 *
 * Los jobs pesados (extracción de texto, clasificación, OCR, IA) NUNCA se
 * ejecutan dentro de un route handler (serverless). Se encolan aquí y los
 * procesa un cron o worker. Idempotencia por (tipo, refId, ventanaTemporal).
 *
 * Referencia: pinedayasociados.md §23.2 (procesamiento asíncrono).
 */
import { db } from '@/lib/db';
import { jobsSgie, type JobSgieTipo } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';

export interface EncolarJobInput {
  tipo: JobSgieTipo;
  refId?: string;
  payload?: Record<string, unknown>;
  ventanaTemporal?: string;
  maxIntentos?: number;
}

/**
 * Encola un job. Idempotente: si ya existe un job pendiente/en_proceso para
 * el mismo (tipo, refId, ventanaTemporal), no duplica.
 */
export async function encolarJob(input: EncolarJobInput): Promise<{ id: string; duplicado: boolean }> {
  const ventana = input.ventanaTemporal ?? new Date().toISOString().slice(0, 10); // por día por defecto

  try {
    const [job] = await db
      .insert(jobsSgie)
      .values({
        tipo: input.tipo,
        refId: input.refId ?? null,
        payload: input.payload ?? null,
        ventanaTemporal: ventana,
        maxIntentos: input.maxIntentos ?? 3,
      })
      .onConflictDoNothing({
        target: [jobsSgie.tipo, jobsSgie.refId, jobsSgie.ventanaTemporal],
      })
      .returning({ id: jobsSgie.id });

    if (job) {
      return { id: job.id, duplicado: false };
    }
    // onConflictDoNothing no devuelve fila; es un duplicado idempotente.
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
  } catch (e) {
    // Si la tabla no existe o hay error, no romper el flujo de carga.
    console.warn('[sgie/jobs] no se pudo encolar job:', (e as Error).message);
    return { id: '', duplicado: false };
  }
}

/**
 * Marca un job como en proceso (lo reclama un worker/cron).
 */
export async function reclamarJob(jobId: string): Promise<void> {
  await db
    .update(jobsSgie)
    .set({ estado: 'en_proceso', procesadoEn: new Date(), intentos: undefined })
    .where(eq(jobsSgie.id, jobId));
}

/**
 * Marca un job como completado.
 */
export async function completarJob(jobId: string): Promise<void> {
  await db
    .update(jobsSgie)
    .set({ estado: 'completado', completadoEn: new Date() })
    .where(eq(jobsSgie.id, jobId));
}

/**
 * Marca un job como fallido con error e incrementa intentos.
 */
export async function fallarJob(jobId: string, error: string): Promise<void> {
  await db
    .update(jobsSgie)
    .set({
      estado: 'fallido',
      error,
      intentos: undefined, // se incrementa vía SQL
    })
    .where(eq(jobsSgie.id, jobId));
}

/**
 * Lista jobs pendientes para procesar (usado por el cron/worker).
 */
export async function listarJobsPendientes(limite = 10) {
  return db
    .select()
    .from(jobsSgie)
    .where(eq(jobsSgie.estado, 'pendiente'))
    .limit(limite);
}
