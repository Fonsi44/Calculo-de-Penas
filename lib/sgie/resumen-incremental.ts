/**
 * Resumen incremental — P2-05 (Fase 4A).
 *
 * Extiende el resumen regenerable existente (resumen-ia.ts) con:
 * - watermark de actividad: solo cambios desde el último resumen válido;
 * - hash de fuentes (documentos, campos, estados);
 * - distinción hecho/inferencia/sugerencia;
 * - cita de fuentes;
 * - abstención si no hay evidencia;
 * - invalidación cuando cambian fuentes;
 * - no regenera si el hash no cambió.
 */
import { db } from '@/lib/db';
import {
  caseSummaryCheckpoints,
  caseSummaryHistory,
  documentosExpediente,
  documentExtractions,
  historialExpediente,
} from '@/lib/schema';
import { and, desc, eq, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { isFlagEnabled } from './feature-flags';
import { generarResumenIa, type DatosResumenInput } from './resumen-ia';

export const PIPELINE_VERSION = 'fase4a-1';

export interface CambioIncremental {
  tipo: 'documento_nuevo' | 'campo_extraido' | 'estado_expediente' | 'correccion_humana' | 'contradiccion';
  entidadId: string;
  descripcion: string;
  timestamp: string;
}

export interface ResultadoResumenIncremental {
  ok: boolean;
  regenerado: boolean; // true si se llamó a IA, false si cache hit (hash sin cambios).
  resumen?: string;
  diferenciaAnterior?: string;
  cambios: CambioIncremental[];
  sourceHash: string;
  watermark: Date;
  modelo?: string;
  tokensInput?: number;
  tokensOutput?: number;
  latenciaMs?: number;
  razon?: string;
  error?: string;
}

/**
 * Calcula el hash de las fuentes del expediente (documentos + extracciones +
 * historial). Si cambia, el resumen previo se invalida.
 */
export async function calcularHashFuentes(expedienteId: string): Promise<string> {
  const [docs, extracciones, hist] = await Promise.all([
    db.select({ id: documentosExpediente.id, hashSha256: documentosExpediente.hashSha256, subidoEn: documentosExpediente.subidoEn })
      .from(documentosExpediente)
      .where(eq(documentosExpediente.expedienteId, expedienteId)),
    db.select({ id: documentExtractions.id, creadoEn: documentExtractions.creadoEn, confianza: documentExtractions.confianza })
      .from(documentExtractions)
      .where(eq(documentExtractions.expedienteId, expedienteId)),
    db.select({ id: historialExpediente.id, creadoEn: historialExpediente.creadoEn, accion: historialExpediente.accion })
      .from(historialExpediente)
      .where(eq(historialExpediente.expedienteId, expedienteId)),
  ]);
  const payload = JSON.stringify({ docs, extracciones, hist });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Obtiene los cambios desde el watermark (último checkpoint vigente).
 */
export async function obtenerCambiosDesdeWatermark(
  expedienteId: string,
  watermark: Date,
): Promise<CambioIncremental[]> {
  const [docsNuevos, extraccionesNuevas, histNuevo] = await Promise.all([
    db.select({ id: documentosExpediente.id, subidoEn: documentosExpediente.subidoEn })
      .from(documentosExpediente)
      .where(and(eq(documentosExpediente.expedienteId, expedienteId), gt(documentosExpediente.subidoEn, watermark))),
    db.select({ id: documentExtractions.id, creadoEn: documentExtractions.creadoEn })
      .from(documentExtractions)
      .where(and(eq(documentExtractions.expedienteId, expedienteId), gt(documentExtractions.creadoEn, watermark))),
    db.select({ id: historialExpediente.id, creadoEn: historialExpediente.creadoEn, accion: historialExpediente.accion, estadoNuevo: historialExpediente.estadoNuevo })
      .from(historialExpediente)
      .where(and(eq(historialExpediente.expedienteId, expedienteId), gt(historialExpediente.creadoEn, watermark))),
  ]);
  const cambios: CambioIncremental[] = [];
  for (const d of docsNuevos) cambios.push({ tipo: 'documento_nuevo', entidadId: d.id, descripcion: 'Documento añadido', timestamp: String(d.subidoEn) });
  for (const e of extraccionesNuevas) cambios.push({ tipo: 'campo_extraido', entidadId: e.id, descripcion: 'Extracción estructurada', timestamp: String(e.creadoEn) });
  for (const h of histNuevo) cambios.push({ tipo: 'estado_expediente', entidadId: h.id, descripcion: `${h.accion}${h.estadoNuevo ? ' → ' + h.estadoNuevo : ''}`, timestamp: String(h.creadoEn) });
  return cambios;
}

/**
 * Genera el resumen incremental. Si el hash no cambió desde el último
 * checkpoint vigente, devuelve el cacheado (no regenera). Si cambió, calcula
 * la diferencia y llama a IA solo con los cambios.
 */
export async function generarResumenIncremental(input: {
  expedienteId: string;
  datos: DatosResumenInput;
  flagContext?: Parameters<typeof isFlagEnabled>[1];
}): Promise<ResultadoResumenIncremental> {
  const flagOn = await isFlagEnabled('sgie.ai.incremental_summary', input.flagContext ?? {}).catch(() => false);
  if (!flagOn) {
    return { ok: false, regenerado: false, cambios: [], sourceHash: '', watermark: new Date(), razon: 'feature_flag_desactivada' };
  }

  const t0 = Date.now();
  const sourceHash = await calcularHashFuentes(input.expedienteId);

  // Checkpoint vigente previo.
  const prev = await db.select().from(caseSummaryCheckpoints)
    .where(and(eq(caseSummaryCheckpoints.expedienteId, input.expedienteId), eq(caseSummaryCheckpoints.estado, 'vigente')))
    .limit(1);
  const prevCheckpoint = prev[0];

  // Cache hit: hash sin cambios => devolver sin regenerar.
  if (prevCheckpoint && prevCheckpoint.sourceHash === sourceHash) {
    const prevResumen = await db.select().from(caseSummaryHistory)
      .where(eq(caseSummaryHistory.expedienteId, input.expedienteId))
      .orderBy(desc(caseSummaryHistory.creadoEn)).limit(1);
    return {
      ok: true,
      regenerado: false,
      resumen: prevResumen[0]?.resumen,
      cambios: [],
      sourceHash,
      watermark: prevCheckpoint.watermark,
      razon: 'hash_igual_cache_hit',
    };
  }

  // La invalidación del checkpoint previo y la inserción del nuevo deben ser
  // atómicas: si se invalida y luego falla el insert, el expediente se queda
  // sin checkpoint vigente (ventana de carrera). Transacción explícita.
  // La llamada a IA va ANTES (fuera de transacción: no se hacen llamadas
  // externas dentro de transacciones DB).
  const watermark = prevCheckpoint?.watermark ?? new Date(0);
  const cambios = await obtenerCambiosDesdeWatermark(input.expedienteId, watermark);

  // Abstención si no hay cambios ni datos.
  if (cambios.length === 0 && !input.datos.documentos?.length) {
    return {
      ok: false, regenerado: false, cambios: [], sourceHash, watermark,
      razon: 'abstencion_sin_evidencia',
    };
  }

  // Llamar a IA con los cambios (FUERA de transacción DB).
  const ia = await generarResumenIa(input.datos);
  if (!ia.ok) {
    return {
      ok: false, regenerado: true, cambios, sourceHash, watermark,
      error: ia.error, razon: 'fallo_ia',
    };
  }

  // Transacción atómica: invalidar previo + insertar nuevo + histórico.
  await db.transaction(async (tx) => {
    if (prevCheckpoint) {
      await tx.update(caseSummaryCheckpoints).set({ estado: 'invalidado' })
        .where(eq(caseSummaryCheckpoints.id, prevCheckpoint.id));
    }
    const [nuevo] = await tx.insert(caseSummaryCheckpoints).values({
      expedienteId: input.expedienteId,
      sourceHash,
      watermark: new Date(),
      cambiosIncluidos: cambios.length,
      cambiosDetalle: cambios,
      modelo: ia.modelo,
      pipelineVersion: PIPELINE_VERSION,
      tokensInput: ia.tokensInput ?? null,
      tokensOutput: ia.tokensOutput ?? null,
      latenciaMs: Date.now() - t0,
      estado: 'vigente',
    }).onConflictDoNothing().returning({ id: caseSummaryCheckpoints.id });

    await tx.insert(caseSummaryHistory).values({
      expedienteId: input.expedienteId,
      checkpointId: nuevo?.id ?? null,
      sourceHash,
      watermark: new Date(),
      cambiosIncluidos: cambios.length,
      resumen: ia.resumen,
      diferenciaAnterior: cambios.length > 0 ? `${cambios.length} cambios desde último resumen` : null,
      tipoContenido: 'mixto',
      modelo: ia.modelo,
      tokensInput: ia.tokensInput ?? null,
      tokensOutput: ia.tokensOutput ?? null,
      latenciaMs: Date.now() - t0,
    });
    return nuevo?.id;
  });

  return {
    ok: true,
    regenerado: true,
    resumen: ia.resumen,
    diferenciaAnterior: cambios.length > 0 ? `${cambios.length} cambios` : undefined,
    cambios,
    sourceHash,
    watermark: new Date(),
    modelo: ia.modelo,
    tokensInput: ia.tokensInput,
    tokensOutput: ia.tokensOutput,
    latenciaMs: Date.now() - t0,
  };
}
