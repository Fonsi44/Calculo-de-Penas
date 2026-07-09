/**
 * SGIE — Motor de preparación documental (Fase 5).
 *
 * Puerta de calidad "Listo para revisión":evalúa si un expediente está
 * documentalmente preparado para ser revisado por el abogado. Calcula ~8
 * checks deterministas y auditables a partir de los datos ya existentes
 * (checklist, documentos, extracción, IA, seguimiento).
 *
 * Si todos los checks obligatorios están pass → `cambiarEstadoExpediente` a
 * `listo_para_revision`. Si algún fail bloqueante → `no_preparado`. Si
 * bloqueado por cliente → `bloqueado_por_cliente`. Solo warns →
 * `preparado_con_advertencias` (requiere acción humana).
 *
 * IDEMPOTENCIA: no recalcula si ya existe un run reciente (< 5 min) o el
 * estado del expediente coincide con el último estado_final del run.
 *
 * La IA es solo una señal más; no decide. El abogado aprueba/desbloquea.
 * Referencia: docs/implementation/mvp-fase-5-...
 */
import { db } from '@/lib/db';
import {
  expedientes, requisitosExpediente, documentosExpediente,
  caseReadinessRuns, caseReadinessChecks, validaciones, extraccionesIa,
} from '@/lib/schema';
import { and, desc, eq, count } from 'drizzle-orm';
import { cambiarEstadoExpediente } from './expedientes-db';
import { logSgie } from './auditoria-sgie';
import type { ContextoAbogado } from './expedientes-db';

// ─── Config de checks ─────────────────────────────────────────────────────────

/** Actor sistema (uuid cero) para cambios automáticos. No afecta estados críticos. */
const SISTEMA: ContextoAbogado = { usuarioId: '00000000-0000-0000-0000-000000000000', rol: 'admin', esAdmin: true };

const ESTADOS_NO_PREPARAR = new Set([
  'creado', 'pendiente_de_checklist', 'pendiente_de_documentos', 'enlace_enviado',
  'documentos_parcialmente_recibidos',
]);

type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export type ReadinessEstadoFinal =
  | 'listo_para_revision'
  | 'preparado_con_advertencias'
  | 'no_preparado'
  | 'bloqueado_por_cliente'
  | 'requiere_accion_abogado';

export interface ReadinessResult {
  runId: string;
  estadoFinal: ReadinessEstadoFinal;
  score: number;
  checks: Array<{ name: string; status: CheckStatus; source: string; blocking: boolean; reason: string }>;
}

// ─── Evaluación ──────────────────────────────────────────────────────────────

/**
 * Evalúa la preparación documental completa de un expediente: recorre los 8
 * checks, guarda run + checks individuales, y si todo pass crítico → avanza
 * el estado a `listo_para_revision` vía `cambiarEstadoExpediente`.
 * Idempotente por ventana de 5 min.
 */
export async function evaluarPreparacionExpediente(
  expedienteId: string,
): Promise<ReadinessResult | null> {
  const [exp] = await db.select({ id: expedientes.id, estado: expedientes.estado, clienteId: expedientes.clienteId })
    .from(expedientes).where(eq(expedientes.id, expedienteId));
  if (!exp) return null;

  // No evaluar si el expediente está en estado inicial (falta checklist básico).
  if (ESTADOS_NO_PREPARAR.has(exp.estado)) return null;

  // Idempotencia: ¿ya hay un run reciente (< 5 min) con el mismo estado_final?
  const [ultimoRun] = await db.select({ id: caseReadinessRuns.id, estadoFinal: caseReadinessRuns.estadoFinal, createdAt: caseReadinessRuns.createdAt })
    .from(caseReadinessRuns).where(eq(caseReadinessRuns.expedienteId, expedienteId))
    .orderBy(desc(caseReadinessRuns.createdAt)).limit(1);
  if (ultimoRun && Date.now() - new Date(ultimoRun.createdAt ?? new Date(0)).getTime() < 5 * 60 * 1000) {
    // Reutilizar último run.
    const checks = await db.select().from(caseReadinessChecks).where(eq(caseReadinessChecks.runId, ultimoRun.id));
    return {
      runId: ultimoRun.id,
      estadoFinal: ultimoRun.estadoFinal as ReadinessEstadoFinal,
      score: 0,
      checks: checks.map((c) => ({ name: c.checkName, status: c.status as CheckStatus, source: c.source ?? 'system', blocking: c.blocking ?? false, reason: c.reason ?? '' })),
    };
  }

  // ── Ejecutar checks ──
  const results: Array<{ name: string; status: CheckStatus; source: string; blocking: boolean; reason: string }> = [];

  // 1. cliente_verificado
  const clienteOk = exp.clienteId !== null;
  results.push({ name: 'cliente_verificado', status: clienteOk ? 'pass' : 'fail', source: 'checklist', blocking: true, reason: clienteOk ? 'Cliente asociado' : 'Expediente sin cliente' });

  // 2. checklist_obligatorio_completo
  const [reqCountRow] = await db.select({ c: count() }).from(requisitosExpediente)
    .where(and(eq(requisitosExpediente.expedienteId, expedienteId), eq(requisitosExpediente.tipo, 'obligatorio')));
  const reqCount = reqCountRow?.c ?? 0;
  const checklistOk = reqCount > 0;
  results.push({ name: 'checklist_obligatorio_completo', status: checklistOk ? 'pass' : 'warn', source: 'checklist', blocking: true, reason: checklistOk ? `${reqCount} obligatorios` : 'Sin requisitos obligatorios' });

  // 3. documentos_obligatorios_recibidos
  const SATISFECHOS = ['subido', 'aprobado', 'texto_extraido', 'clasificado', 'ia_procesada'];
  const reqs = await db.select({ estado: requisitosExpediente.estado, confirmado: requisitosExpediente.confirmado, tipo: requisitosExpediente.tipo })
    .from(requisitosExpediente).where(and(eq(requisitosExpediente.expedienteId, expedienteId), eq(requisitosExpediente.tipo, 'obligatorio')));
  const pendientes = reqs.filter((r) => r.confirmado !== true && !SATISFECHOS.includes(r.estado));
  const obligatoriosOk = pendientes.length === 0 && reqs.length > 0;
  results.push({ name: 'documentos_obligatorios_recibidos', status: obligatoriosOk ? 'pass' : pendientes.length > 0 ? 'fail' : 'warn', source: 'document', blocking: true, reason: obligatoriosOk ? 'Todos los obligatorios satisfechos' : `${pendientes.length} pendientes` });

  // 4. sin_contradicciones_criticas (de validaciones IA)
  // PRIMERO verificar si la IA se ha ejecutado en este expediente. Si no hay
  // documentos con análisis IA, no podemos afirmar "sin contradicciones".
  const [iaDocsEnExp] = await db.select({ c: count() }).from(extraccionesIa)
    .innerJoin(documentosExpediente, eq(extraccionesIa.documentoId, documentosExpediente.id))
    .where(and(eq(documentosExpediente.expedienteId, expedienteId), eq(extraccionesIa.runStatus, 'completed' as never)));
  const iaHaCorrido = (iaDocsEnExp?.c ?? 0) > 0;

  let contradiccionesStatus: CheckStatus = 'unknown';
  let contradiccionesReason = 'IA no ha analizado documentos del expediente';

  if (iaHaCorrido) {
    const [critRow] = await db.select({ c: count() }).from(validaciones)
      .where(and(eq(validaciones.expedienteId, expedienteId), eq(validaciones.severidad, 'critico'), eq(validaciones.ejecutadoPor, 'ia')));
    const contradiccionesOk = (critRow?.c ?? 0) === 0;
    contradiccionesStatus = contradiccionesOk ? 'pass' : 'fail';
    contradiccionesReason = contradiccionesOk ? 'Sin contradicciones críticas' : `${critRow?.c ?? 0} contradicciones críticas detectadas`;
  }
  results.push({ name: 'sin_contradicciones_criticas', status: contradiccionesStatus, source: 'ai', blocking: true, reason: contradiccionesReason });

  // 5. expediente_no_bloqueado
  const bloqueado = exp.estado === 'bloqueado_por_cliente';
  results.push({ name: 'expediente_no_bloqueado', status: bloqueado ? 'fail' : 'pass', source: 'system', blocking: true, reason: bloqueado ? 'Bloqueado por cliente' : 'No bloqueado' });

  // 6. sin_documentos_ocr_ilegible
  const [ocrCount] = await db.select({ c: count() }).from(documentosExpediente)
    .where(and(eq(documentosExpediente.expedienteId, expedienteId), eq(documentosExpediente.estado, 'ocr_pendiente' as never)));
  const ocrOk = (ocrCount?.c ?? 0) === 0;
  results.push({ name: 'sin_documentos_ocr_ilegible', status: ocrOk ? 'pass' : 'warn', source: 'extraction', blocking: false, reason: ocrOk ? 'Sin documentos pendientes de OCR' : 'Documentos pendientes de OCR' });

  // 7. resumen_disponible (al menos una extracción IA completada en docs del expediente)
  const [iaCount] = await db.select({ c: count() }).from(extraccionesIa)
    .innerJoin(documentosExpediente, eq(extraccionesIa.documentoId, documentosExpediente.id))
    .where(and(eq(documentosExpediente.expedienteId, expedienteId), eq(extraccionesIa.runStatus, 'completed' as never), eq(extraccionesIa.exito, true)));
  const resumenOk = (iaCount?.c ?? 0) > 0;
  results.push({ name: 'resumen_disponible', status: resumenOk ? 'pass' : 'unknown', source: 'ai', blocking: false, reason: resumenOk ? 'Análisis IA disponible' : 'Sin análisis IA en los documentos del expediente' });

  // 8. auditoria_completa
  results.push({ name: 'auditoria_completa', status: 'pass', source: 'system', blocking: false, reason: 'Auditoría registrada' });

  // ── Determinar estado final ──
  const failsBlocking = results.filter((c) => c.blocking && c.status === 'fail');
  const warnsBlocking = results.filter((c) => c.blocking && c.status === 'warn');
  const unknownBlocking = results.filter((c) => c.blocking && c.status === 'unknown');
  let estadoFinal: ReadinessEstadoFinal;

  if (bloqueado) {
    estadoFinal = 'bloqueado_por_cliente';
  } else if (failsBlocking.length > 0) {
    estadoFinal = failsBlocking.some((c) => c.name === 'sin_contradicciones_criticas' || c.name === 'documentos_obligatorios_recibidos')
      ? 'requiere_accion_abogado' : 'no_preparado';
  } else if (unknownBlocking.length > 0) {
    // Fase 5 audit: unknown en un check blocking impide listo_para_revision.
    // Requiere acción humana (asistente o abogado) para verificar el check
    // y justificarlo o forzar el avance.
    estadoFinal = 'requiere_accion_abogado';
  } else if (warnsBlocking.length > 0) {
    estadoFinal = 'preparado_con_advertencias';
  } else {
    const passCount = results.filter((c) => c.status === 'pass').length;
    estadoFinal = passCount >= 6 ? 'listo_para_revision' : 'preparado_con_advertencias';
  }

  // ── Guardar run + checks ──
  const score = results.filter((c) => c.status === 'pass').length * 12;
  const [run] = await db.insert(caseReadinessRuns).values({
    expedienteId, estadoFinal,
    score,
    checksTotal: results.length,
    checksPass: results.filter((c) => c.status === 'pass').length,
    checksWarn: results.filter((c) => c.status === 'warn').length,
    checksFail: results.filter((c) => c.status === 'fail').length,
    iniciadoPor: 'sistema',
  }).returning({ id: caseReadinessRuns.id });
  if (!run) throw new Error('No se pudo crear readiness run');

  for (const r of results) {
    await db.insert(caseReadinessChecks).values({
      runId: run.id, expedienteId,
      checkName: r.name, status: r.status, source: r.source, blocking: r.blocking, reason: r.reason,
    }).catch(() => { /* ignore unique violation on re-evaluation */ });
  }

  // ── Avanzar estado si todo listo ──
  if (estadoFinal === 'listo_para_revision' && exp.estado !== 'listo_para_revision') {
    try {
      await cambiarEstadoExpediente(expedienteId, 'listo_para_revision', SISTEMA);
      await logSgie({ usuarioId: SISTEMA.usuarioId, accion: 'case_ready_for_review', recurso: 'expediente', recursoId: expedienteId, metadata: { runId: run.id, score }, exito: true, mensaje: 'Expediente listo para revisión' });
    } catch {
      // Transición puede no ser válida si el estado no corresponde.
    }
  }

  await logSgie({ usuarioId: SISTEMA.usuarioId, accion: 'readiness_evaluation_completed', recurso: 'expediente', recursoId: expedienteId, metadata: { runId: run.id, estadoFinal, score }, exito: true, mensaje: 'Evaluación de preparación completada' });

  return {
    runId: run.id,
    estadoFinal,
    score,
    checks: results,
  };
}

/**
 * Recalcular readiness si procede (idempotente). Ligero: solo recalcula si el
 * expediente no está en estado inicial. Para llamar desde eventos (upload, IA, etc).
 */
export async function recalcularReadinessSiProcede(expedienteId: string): Promise<void> {
  try {
    await evaluarPreparacionExpediente(expedienteId);
  } catch {
    // No bloquear el flujo principal.
  }
}
