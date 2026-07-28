/**
 * SGIE — Enrutador de tareas IA (Fase 2).
 *
 * Determina qué estrategia usar para cada tarea de IA según el tipo de
 * documento, complejidad, configuración y disponibilidad de DeepSeek.
 * Orquesta la ejecución contra el proveedor adecuado y gestiona revisión
 * humana cuando la confianza es baja.
 *
 * Ver docs/architecture/ §13, §14.
 */
import { db } from '@/lib/db';
import { aiTaskRouting } from '@/lib/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { llamarIaDocumental, getIaConfig, isIaEnabled } from '@/lib/sgie/ia-documental';
import { clasificarDocumentoHeuristicamente } from '@/lib/sgie/motor-documental';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type AiTaskType = 'classification' | 'extraction' | 'summary' | 'verification';

export type RoutingStrategy = 'deterministic' | 'heuristic' | 'deepseek' | 'deepseek_pro' | 'human';

export interface AiRouterConfig {
  /** Estrategia por defecto para cada tipo de tarea. */
  strategyByTask: Partial<Record<AiTaskType, RoutingStrategy>>;
  /** Umbral de confianza heurística para derivar a IA (0-100). */
  heuristicConfidenceThreshold: number;
  /** Umbral de confianza IA para requerir revisión humana (0-100). */
  humanReviewThreshold: number;
  /** Modelo a usar para deepseek_pro (tareas complejas). */
  proModel: string;
  /** Version del prompt a usar. */
  versionPrompt: string;
}

export interface RoutingDecision {
  estrategia: RoutingStrategy;
  modelo: string;
  versionPrompt: string;
  requiereRevisionHumana: boolean;
  motivo: string;
}

export interface TaskContext {
  documentoId?: string;
  expedienteId?: string;
  tipoDocumento?: string;
  confianzaHeuristica?: number;
  textoExtraido?: string;
  nombreOriginal?: string;
  tipoMime?: string;
  textoLength?: number;
}

export interface TaskResult {
  ok: boolean;
  taskId?: string;
  estrategia: RoutingStrategy;
  resultado?: Record<string, unknown>;
  error?: string;
  requiereRevisionHumana: boolean;
  duracionMs: number;
}

// ─── Configuración por defecto ───────────────────────────────────────────────

const DEFAULT_CONFIG: AiRouterConfig = {
  strategyByTask: {
    classification: 'heuristic',
    extraction: 'deepseek',
    summary: 'deepseek',
    verification: 'deepseek',
  },
  heuristicConfidenceThreshold: 60,
  humanReviewThreshold: 65,
  proModel: 'deepseek-v4-flash',
  versionPrompt: 'v2.0',
};

function getConfig(): AiRouterConfig {
  const mode = process.env.DOCUMENT_AI_MODE ?? process.env.IA_DOCUMENTAL_MODE ?? '';
  const config: AiRouterConfig = { ...DEFAULT_CONFIG };

  if (mode === 'ai') {
    config.strategyByTask.classification = 'deepseek';
    config.strategyByTask.extraction = 'deepseek';
    config.strategyByTask.summary = 'deepseek';
    config.strategyByTask.verification = 'deepseek';
  } else if (mode === 'disabled') {
    config.strategyByTask.classification = 'deterministic';
    config.strategyByTask.extraction = 'deterministic';
    config.strategyByTask.summary = 'deterministic';
    config.strategyByTask.verification = 'deterministic';
  }

  if (process.env.DOCUMENT_AI_PRO_MODEL) {
    config.proModel = process.env.DOCUMENT_AI_PRO_MODEL;
  }
  if (process.env.DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD) {
    config.humanReviewThreshold = parseInt(process.env.DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD, 10);
  }
  if (process.env.DOCUMENT_AI_VERSION_PROMPT) {
    config.versionPrompt = process.env.DOCUMENT_AI_VERSION_PROMPT;
  }

  return config;
}

// ─── Estrategia por documento ────────────────────────────────────────────────

function inferComplexity(context: TaskContext): 'simple' | 'medium' | 'complex' {
  const textLength = context.textoLength ?? context.textoExtraido?.length ?? 0;
  if (textLength < 200) return 'simple';
  if (textLength < 2000) return 'medium';
  return 'complex';
}

function isSimpleDocumentType(tipo?: string): boolean {
  if (!tipo) return false;
  const simples = new Set(['identidad', 'rtn', 'comprobante', 'documento_personal']);
  return simples.has(tipo);
}

export function routingDecision(
  tarea: AiTaskType,
  documento: TaskContext,
  textoExtraido?: string,
): RoutingDecision {
  const config = getConfig();
  const ctx: TaskContext = { ...documento, textoExtraido, textoLength: textoExtraido?.length ?? documento.textoLength };
  const complexity = inferComplexity(ctx);

  // Prioridad 1: config explícita para este tipo de tarea
  let estrategia = config.strategyByTask[tarea] ?? 'heuristic';

  // Prioridad 2: tipo de documento simple → deterministic
  if (estrategia !== 'deterministic' && isSimpleDocumentType(ctx.tipoDocumento)) {
    estrategia = 'deterministic';
  }

  // Prioridad 3: texto muy corto → heuristic
  if (estrategia === 'deepseek' && complexity === 'simple') {
    estrategia = 'heuristic';
  }

  // Prioridad 4: complejidad alta → deepseek_pro
  if (complexity === 'complex' && (estrategia === 'deepseek' || estrategia === 'heuristic')) {
    estrategia = 'deepseek_pro';
  }

  // Prioridad 5: si IA deshabilitada, degradar
  if ((estrategia === 'deepseek' || estrategia === 'deepseek_pro') && !isIaEnabled()) {
    estrategia = getIaConfig().mode === 'disabled' ? 'deterministic' : 'heuristic';
  }

  const modelo = estrategia === 'deepseek_pro' ? config.proModel : getIaConfig().model;
  const requiereRevisionHumana =
    estrategia === 'human' ||
    (estrategia === 'deepseek' && ctx.confianzaHeuristica != null && ctx.confianzaHeuristica < config.heuristicConfidenceThreshold);

  return {
    estrategia,
    modelo,
    versionPrompt: config.versionPrompt,
    requiereRevisionHumana,
    motivo: `Tarea=${tarea}, tipoDoc=${ctx.tipoDocumento ?? 'desconocido'}, complejidad=${complexity}, estrategia=${estrategia}`,
  };
}

// ─── Ejecución por estrategia ────────────────────────────────────────────────

async function ejecutarEstrategia(
  tarea: AiTaskType,
  documento: TaskContext,
  decision: RoutingDecision,
): Promise<{ resultado: Record<string, unknown>; error?: string }> {
  const texto = documento.textoExtraido ?? '';
  const nombre = documento.nombreOriginal ?? 'documento';
  const mime = documento.tipoMime ?? 'application/octet-stream';

  switch (decision.estrategia) {
    case 'deterministic': {
      if (tarea === 'classification') {
        const hc = clasificarDocumentoHeuristicamente(nombre, mime, texto);
        return { resultado: { tipoDocumento: hc.tipoDocumento, confianza: hc.confianza, evidencias: hc.evidencias } };
      }
      // Para extracción/summary/verification, devolver datos mínimos
      return {
        resultado: {
          mensaje: 'Tarea resuelta por reglas deterministas',
          tarea,
          tipoDocumento: documento.tipoDocumento,
        },
      };
    }

    case 'heuristic': {
      if (tarea === 'classification') {
        const hc = clasificarDocumentoHeuristicamente(nombre, mime, texto);
        return { resultado: { tipoDocumento: hc.tipoDocumento, confianza: hc.confianza, evidencias: hc.evidencias } };
      }
      // heuristic para otras tareas: igual que deterministic
      return {
        resultado: {
          mensaje: 'Tarea resuelta por heurística (modo sin IA)',
          tarea,
          tipoDocumento: documento.tipoDocumento,
        },
      };
    }

    case 'deepseek':
    case 'deepseek_pro': {
      const iaResult = await llamarIaDocumental(texto, {
        nombreOriginal: nombre,
        tipoMime: mime,
        tipoHeuristico: documento.tipoDocumento,
        confianzaHeuristica: documento.confianzaHeuristica,
      });

      if (!iaResult.ok) {
        return { resultado: {}, error: iaResult.error };
      }

      const output = {
        tipoDocumento: iaResult.output.tipo_documento,
        confianzaTipo: iaResult.output.confianza_tipo,
        campos: iaResult.output.campos,
        resumen: iaResult.output.resumen_descriptivo,
        alertas: iaResult.output.alertas_sugeridas,
        proximosPasos: iaResult.output.proximos_pasos_sugeridos,
      };

      return { resultado: output as unknown as Record<string, unknown> };
    }

    case 'human': {
      return {
        resultado: { mensaje: 'Tarea requiere revisión humana', tarea },
        error: 'Derivado a revisión humana',
      };
    }

    default:
      return { resultado: {}, error: `Estrategia no soportada: ${decision.estrategia}` };
  }
}

function necesitaRevisionHumana(
  resultado: Record<string, unknown>,
  decision: RoutingDecision,
): boolean {
  if (decision.requiereRevisionHumana) return true;

  const config = getConfig();
  if (decision.estrategia === 'deepseek' || decision.estrategia === 'deepseek_pro') {
    const confianza = (resultado as { confianzaTipo?: number }).confianzaTipo ?? 0;
    return confianza < config.humanReviewThreshold;
  }

  return false;
}

// ─── Tareas (orquestador) ────────────────────────────────────────────────────

export async function ejecutarTarea(
  documentoId: string,
  tarea: AiTaskType,
  context?: Partial<TaskContext>,
): Promise<TaskResult> {
  const t0 = Date.now();

  // Construir contexto
  const ctx: TaskContext = {
    documentoId,
    ...context,
  };

  // Decidir estrategia
  const decision = routingDecision(tarea, ctx, ctx.textoExtraido);

  // Crear registro de routing
  const [routing] = await db
    .insert(aiTaskRouting)
    .values({
      documentoId,
      taskType: tarea,
      proveedorAsignado: decision.estrategia,
      modelo: decision.modelo,
      estado: 'pending',
      payload: { estrategia: decision.estrategia, versionPrompt: decision.versionPrompt, contexto: ctx },
    })
    .returning();

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: 'ai_task_routed',
    recurso: 'documento_expediente',
    recursoId: documentoId,
    metadata: { taskId: routing.id, taskType: tarea, estrategia: decision.estrategia, modelo: decision.modelo },
  });

  // Actualizar estado a en_proceso
  await db.update(aiTaskRouting).set({ estado: 'en_proceso' }).where(eq(aiTaskRouting.id, routing.id));

  // Ejecutar
  const { resultado, error } = await ejecutarEstrategia(tarea, ctx, decision);
  const requiereRevision = necesitaRevisionHumana(resultado, decision);
  const errorStr = error || (requiereRevision ? 'Confianza baja — requiere revisión humana' : undefined);

  // Guardar resultado
  await db
    .update(aiTaskRouting)
    .set({
      estado: error && !requiereRevision ? 'failed' : 'completed',
      resultado: { ...resultado, requiereRevisionHumana: requiereRevision } as Record<string, unknown>,
      completadoEn: new Date(),
      error: errorStr ?? null,
    })
    .where(eq(aiTaskRouting.id, routing.id));

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: 'ai_task_completed',
    recurso: 'documento_expediente',
    recursoId: documentoId,
    metadata: {
      taskId: routing.id,
      taskType: tarea,
      estrategia: decision.estrategia,
      requiereRevisionHumana: requiereRevision,
      error: error ?? null,
    },
  });

  return {
    ok: !error || requiereRevision,
    taskId: routing.id,
    estrategia: decision.estrategia,
    resultado,
    error: errorStr,
    requiereRevisionHumana: requiereRevision,
    duracionMs: Date.now() - t0,
  };
}

// ─── Revisión humana ─────────────────────────────────────────────────────────

export async function revisarTarea(
  taskId: string,
  decision: 'approved' | 'rejected' | 'corrected',
  revisorId: string,
  comentario?: string,
  correcciones?: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const [task] = await db.select().from(aiTaskRouting).where(eq(aiTaskRouting.id, taskId));
  if (!task) return { ok: false };
  if (task.estado !== 'completed') return { ok: false };

  await db
    .update(aiTaskRouting)
    .set({
      estado: decision === 'approved' ? 'completed' : 'failed',
      revisadoPor: revisorId,
      revisadoEn: new Date(),
      resultado: {
        ...(task.resultado as Record<string, unknown> ?? {}),
        revision: { decision, comentario, correcciones, revisadoEn: new Date().toISOString() },
      } as Record<string, unknown>,
    })
    .where(eq(aiTaskRouting.id, taskId));

  await logSgie({
    usuarioId: revisorId,
    accion: 'ai_task_reviewed',
    recurso: 'ai_task_routing',
    recursoId: taskId,
    metadata: { decision, taskType: task.taskType, documentoId: task.documentoId },
  });

  return { ok: true };
}

// ─── Consulta de tareas pendientes ──────────────────────────────────────────

export async function obtenerTareasPendientesRevision(
  limite: number = 20,
): Promise<Array<{
  id: string;
  documentoId: string | null;
  taskType: string;
  proveedorAsignado: string | null;
  modelo: string | null;
  resultado: Record<string, unknown> | null;
  completadoEn: Date | null;
}>> {
  const rows = await db
    .select({
      id: aiTaskRouting.id,
      documentoId: aiTaskRouting.documentoId,
      taskType: aiTaskRouting.taskType,
      proveedorAsignado: aiTaskRouting.proveedorAsignado,
      modelo: aiTaskRouting.modelo,
      resultado: aiTaskRouting.resultado,
      completadoEn: aiTaskRouting.completadoEn,
    })
    .from(aiTaskRouting)
    .where(
      and(
        eq(aiTaskRouting.estado, 'completed'),
        isNull(aiTaskRouting.revisadoPor),
      ),
    )
    .orderBy(desc(aiTaskRouting.completadoEn))
    .limit(limite);

  return rows.map((r) => ({
    ...r,
    resultado: r.resultado as Record<string, unknown> | null,
  }));
}
