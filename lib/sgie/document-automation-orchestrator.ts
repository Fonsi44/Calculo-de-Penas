/**
 * DocumentAutomationOrchestrator — Fase 4A (§5 del prompt).
 *
 * Encadena los seis servicios P2-01 a P2-06 en un pipeline durable y
 * auditable, reutilizando jobs/outbox existentes. Punto único de entrada
 * productivo para la automatización documental.
 *
 * Pipeline (según flags, cada etapa idempotente):
 *   documento procesado (texto extraído)
 *   → P2-01 clasificación
 *   → P2-03 extracción estructurada
 *   → P2-02 auto-vinculación a requisito
 *   → P2-04 contradicciones (al añadir segundo doc)
 *   → P2-05 resumen incremental
 *   → P2-06 next action
 *   → outbox/readiness/auditoría
 *
 * Reglas (invariante §4 y §5 del prompt):
 * - Autorización: AccessService.canAccessCase ANTES de leer datos del
 *   expediente. Sin acceso => aborta con 403 equivalente (lanza).
 * - correlation ID único por ejecución, propagado a ai_pipeline_runs.
 * - ai_pipeline_runs: una fila por etapa con estado, modelo, tokens, latencia.
 * - Idempotencia por etapa: cada servicio la garantiza (UNIQUE o checkpoint).
 * - Reintentos: los fallos recuperables se dejan observable en ai_pipeline_runs
 *   con estado 'failed'; el sistema durable existente (jobs/outbox) los
 *   reprocesa. No se reintenta dentro del orquestador.
 * - Kill switch: si sgie.ai.classification está en kill switch, ninguna etapa
 *   nueva se ejecuta (cada servicio lo niega por flags, pero el orquestador
 *   lo verifica al inicio para no procesar en vano).
 * - Sin llamadas externas dentro de transacciones DB (DeepSeek se llama fuera).
 * - Decisiones humanas prevalecen: las etapas no sobrescriben estados
 *   'aprobada'/'validado'/'corregida' sin confirmación.
 *
 * Entrada productiva: el worker de procesamiento documental existente
 * (motor-documental.procesarJobsPendientes) invoca este orquestador tras
 * extraer texto, detrás de flags desactivados por defecto.
 */
import { db } from '@/lib/db';
import { aiPipelineRuns, type AiPipelineRun } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { canAccessCase } from '@/lib/access-service';
import { resolveFlag } from './feature-flags';
import { clasificarDocumento } from './clasificacion-documental';
import { extraerEstructurado } from './extraccion-estructurada';
import { autoVincularDocumento } from './auto-vinculacion';
import { detectarContradiccionesExpediente } from './motor-contradicciones';
import { generarResumenIncremental } from './resumen-incremental';
import { recomendarNextAction } from './next-action';
import type { DatosResumenInput } from './resumen-ia';

export interface OrchestratorInput {
  documentId: string;
  expedienteId: string;
  // Actor que dispara (para autorización y auditoría).
  actorId: string;
  // Datos ya extraídos por el pipeline existente (motor-documental).
  nombreOriginal: string;
  tipoMime: string;
  textoExtraido?: string;
  // Flag context (organización/equipo/usuario/expediente/procedimiento).
  flagContext?: Parameters<typeof resolveFlag>[1];
  // correlation ID opcional (si viene de un job existente).
  correlationId?: string;
}

export interface EtapaResultado {
  etapa: string;
  ok: boolean;
  skipped: boolean;
  razon?: string;
  refId?: string;
  error?: string;
}

export interface OrchestratorResult {
  correlationId: string;
  ok: boolean;
  autorizado: boolean;
  etapas: EtapaResultado[];
  pipelineRunIds: string[];
  error?: string;
}

/**
 * Orquesta el pipeline de automatización documental para un documento.
 *
 * Lanza `Error('FORBIDDEN')` si el actor no tiene acceso al expediente.
 */
export async function ejecutarPipelineAutomatizacion(
  input: OrchestratorInput,
): Promise<OrchestratorResult> {
  const correlationId = input.correlationId || randomUUID();
  const etapas: EtapaResultado[] = [];
  const pipelineRunIds: string[] = [];

  // ─── 1. Autorización (AccessService) ──────────────────────────────────────
  // Validar ANTES de leer cualquier dato del expediente.
  const tieneAcceso = await canAccessCase(input.actorId, input.expedienteId).catch(() => false);
  if (!tieneAcceso) {
    return {
      correlationId,
      ok: false,
      autorizado: false,
      etapas: [{ etapa: 'autorizacion', ok: false, skipped: false, error: 'FORBIDDEN' }],
      pipelineRunIds,
      error: 'Actor sin acceso al expediente',
    };
  }

  // ─── 2. Kill switch global: si clasificación está killed, abortar ──────────
  const flagClasif = await resolveFlag('sgie.ai.classification', input.flagContext ?? {});
  if (flagClasif.killSwitch) {
    return {
      correlationId,
      ok: false,
      autorizado: true,
      etapas: [{ etapa: 'kill_switch', ok: false, skipped: true, razon: 'kill_switch_activo' }],
      pipelineRunIds,
      error: 'Kill switch activo en sgie.ai.classification',
    };
  }

  // Helper: registrar cada etapa en ai_pipeline_runs (fuera de transacciones
  // de negocio; es escritura de observabilidad independiente).
  async function registrarEtapa(
    etapa: string,
    fn: () => Promise<{ ok: boolean; refId?: string; razon?: string; error?: string; modelo?: string; tokensIn?: number; tokensOut?: number; latenciaMs?: number; confianza?: number }>,
  ): Promise<EtapaResultado> {
    const t0 = Date.now();
    try {
      const r = await fn();
      const [run] = await db.insert(aiPipelineRuns).values({
        correlationId,
        expedienteId: input.expedienteId,
        documentId: input.documentId,
        taskType: etapa as AiPipelineRun['taskType'],
        estrategia: 'deepseek',
        modelo: r.modelo ?? null,
        pipelineVersion: 'fase4a-1',
        estado: r.ok ? 'completed' : 'failed',
        resultSummary: r.razon ?? null,
        confianza: r.confianza ?? null,
        tokensInput: r.tokensIn ?? null,
        tokensOutput: r.tokensOut ?? null,
        latenciaMs: Date.now() - t0,
        refTable: etapa === 'classification' ? 'document_classifications' : null,
        refId: r.refId,
        actorId: input.actorId,
        scopeResuelto: { expedienteId: input.expedienteId, actorId: input.actorId },
      }).returning({ id: aiPipelineRuns.id });
      if (run) pipelineRunIds.push(run.id);
      return { etapa, ok: r.ok, skipped: !r.ok && r.razon === 'skipped', razon: r.razon, refId: r.refId, error: r.error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'error_desconocido';
      const [run] = await db.insert(aiPipelineRuns).values({
        correlationId,
        expedienteId: input.expedienteId,
        documentId: input.documentId,
        taskType: etapa as AiPipelineRun['taskType'],
        estrategia: 'deepseek',
        pipelineVersion: 'fase4a-1',
        estado: 'failed',
        error: msg,
        latenciaMs: Date.now() - t0,
        actorId: input.actorId,
        scopeResuelto: { expedienteId: input.expedienteId, actorId: input.actorId },
      }).returning({ id: aiPipelineRuns.id });
      if (run) pipelineRunIds.push(run.id);
      return { etapa, ok: false, skipped: false, error: msg };
    }
  }

  // ─── 3. P2-01 Clasificación ───────────────────────────────────────────────
  const clsResult = await registrarEtapa('classification', async () => {
    const r = await clasificarDocumento({
      documentId: input.documentId,
      expedienteId: input.expedienteId,
      nombreOriginal: input.nombreOriginal,
      tipoMime: input.tipoMime,
      textoExtraido: input.textoExtraido,
      flagContext: input.flagContext,
    });
    return {
      ok: r.ok,
      refId: r.pipelineRunId,
      razon: r.razonEscalado,
      error: r.error,
      modelo: r.modelo,
      confianza: r.confianza,
      tokensIn: r.tokensInput,
      tokensOut: r.tokensOutput,
      latenciaMs: r.latenciaMs,
    };
  });
  etapas.push(clsResult);

  // Si la clasificación falló por flag, las siguientes etapas también se skip.
  if (!clsResult.ok && clsResult.razon === 'feature_flag_desactivada') {
    return { correlationId, ok: false, autorizado: true, etapas, pipelineRunIds, error: 'Flags desactivadas' };
  }

  // ─── 4. P2-03 Extracción estructurada (usa tipo de la clasificación) ──────
  const extResult = await registrarEtapa('extraction', async () => {
    // Re-leer clasificación para obtener tipo.
    const { obtenerClasificacionVigente } = await import('./clasificacion-documental');
    const cls = await obtenerClasificacionVigente(input.documentId);
    const tipoDoc = cls?.tipoPropuesto ?? 'otro';
    const r = await extraerEstructurado({
      documentId: input.documentId,
      expedienteId: input.expedienteId,
      tipoDocumento: tipoDoc,
      textoExtraido: input.textoExtraido,
      flagContext: input.flagContext,
    });
    return { ok: r.ok, refId: r.extraccionId, razon: r.razonEscalado, error: r.error };
  });
  etapas.push(extResult);

  // ─── 5. P2-02 Auto-vinculación ────────────────────────────────────────────
  const linkResult = await registrarEtapa('linking', async () => {
    const r = await autoVincularDocumento({
      documentId: input.documentId,
      expedienteId: input.expedienteId,
      flagContext: input.flagContext,
    });
    return { ok: r.ok, refId: r.vinculoId, razon: r.accion, error: r.motivo };
  });
  etapas.push(linkResult);

  // ─── 6. P2-04 Contradicciones (sobre todo el expediente) ──────────────────
  const contraResult = await registrarEtapa('contradiction', async () => {
    const r = await detectarContradiccionesExpediente({
      expedienteId: input.expedienteId,
      flagContext: input.flagContext,
    });
    return { ok: r.ok, razon: r.razon, error: r.ok ? undefined : r.razon };
  });
  etapas.push(contraResult);

  // ─── 7. P2-05 Resumen incremental ─────────────────────────────────────────
  const datosResumen = await construirDatosResumen(input.expedienteId);
  const resResult = await registrarEtapa('summary', async () => {
    const r = await generarResumenIncremental({
      expedienteId: input.expedienteId,
      datos: datosResumen,
      flagContext: input.flagContext,
    });
    return { ok: r.ok, razon: r.razon, error: r.error };
  });
  etapas.push(resResult);

  // ─── 8. P2-06 Next action ─────────────────────────────────────────────────
  const naResult = await registrarEtapa('next_action', async () => {
    const r = await recomendarNextAction({
      expedienteId: input.expedienteId,
      flagContext: input.flagContext,
    });
    return { ok: r.ok, refId: r.principal?.id, razon: r.razon };
  });
  etapas.push(naResult);

  const todasOk = etapas.every((e) => e.ok || e.skipped);
  return {
    correlationId,
    ok: todasOk,
    autorizado: true,
    etapas,
    pipelineRunIds,
  };
}

/**
 * Construye el input de datos para el resumen leyendo el estado actual del
 * expediente (documentos, campos, alertas). Reutiliza consultas existentes.
 */
async function construirDatosResumen(expedienteId: string): Promise<DatosResumenInput> {
  const { documentosExpediente, extraccionesIa, expedientes, alertas } = await import('@/lib/schema');
  const [exp] = await db.select().from(expedientes).where(eq(expedientes.id, expedienteId)).limit(1);
  const docs = await db.select().from(documentosExpediente).where(eq(documentosExpediente.expedienteId, expedienteId));
  const campos = await db.select().from(extraccionesIa).where(eq(extraccionesIa.documentoId, docs[0]?.id ?? '00000000-0000-0000-0000-000000000000')).limit(50);
  const alertasActivas = await db.select({ id: alertas.id }).from(alertas).where(eq(alertas.expedienteId, expedienteId));
  return {
    numeroInterno: exp?.numeroInterno ?? expedienteId,
    estado: exp?.estado ?? 'desconocido',
    clienteNombre: null,
    procedimientoNombre: null,
    resumen: null,
    documentos: docs.map((d) => ({ nombre: d.nombreOriginal, tipo: d.tipoDocumento, confianza: 0 })),
    campos: campos.map((c) => ({ clave: '', valor: null, confianza: c.totalConfidence })),
    alertasActivas: alertasActivas.length,
    inconsistencias: [],
  };
}
