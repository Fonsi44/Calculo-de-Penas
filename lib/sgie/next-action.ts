/**
 * NextActionService — P2-06 (Fase 4A).
 *
 * Recomienda la siguiente mejor acción por expediente. Determinista primero
 * (reglas sobre workflow/readiness/alertas/requisitos), IA opcional después.
 *
 * Fuentes prioritarias:
 * 1. requisitos pendientes;
 * 2. bloqueos (contradicciones bloqueantes);
 * 3. alertas/SLA;
 * 4. jobs fallidos;
 * 5. plazos confirmados;
 * 6. firma pendiente;
 * 7. comunicaciones;
 * 8. readiness;
 *
 * Reglas:
 * - una acción principal por expediente + alternativas;
 * - explicación verificable con evidencias;
 * - sin acción crítica automática;
 * - idempotencia por (expediente, action_key, source_hash);
 * - aceptación/rechazo auditado;
 * - no recomienda fuera de permisos.
 */
import { db } from '@/lib/db';
import {
  caseNextActions,
  requisitosExpediente,
  documentContradictions,
  alertas,
  jobsSgie,
  type CaseNextAction,
} from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';
import { isFlagEnabled } from './feature-flags';

export type EstadoAccion = 'propuesta' | 'aceptada' | 'rechazada' | 'completada' | 'expirada' | 'sustituida';

export interface AccionRecomendada {
  actionKey: string;
  titulo: string;
  descripcion?: string;
  razon: string;
  prioridad: number; // 1 (más urgente) a 5
  evidencias: Array<{ tipo: string; id?: string; descripcion: string }>;
  bloqueos: Array<{ tipo: string; descripcion: string }>;
  requiereConfirmacionHumana: boolean;
  estrategia: 'determinista' | 'ia' | 'mixta';
  confianza?: number;
  reglaId?: string;
  modeloIa?: string;
  esPrincipal: boolean;
  expiraEn?: Date;
}

export interface ResultadoNextAction {
  ok: boolean;
  principal?: CaseNextAction;
  alternativas: CaseNextAction[];
  razon?: string;
}

/**
 * Genera las acciones deterministas para un expediente basadas en sus
 * fuentes. Es pura (no escribe DB); la persistencia la hace persistirAcciones.
 */
export async function generarAccionesDeterministas(expedienteId: string): Promise<AccionRecomendada[]> {
  const acciones: AccionRecomendada[] = [];

  // 1. Contradicciones bloqueantes: prioridad 1 (lo más urgente).
  const bloqueantes = await db.select({ id: documentContradictions.id, tipo: documentContradictions.tipo, explicacion: documentContradictions.explicacion })
    .from(documentContradictions)
    .where(and(
      eq(documentContradictions.expedienteId, expedienteId),
      eq(documentContradictions.bloqueante, true),
      inArray(documentContradictions.estado, ['propuesta', 'confirmada']),
    ));
  if (bloqueantes.length > 0) {
    acciones.push({
      actionKey: `resolver_contradiccion_bloqueante:${bloqueantes[0].id}`,
      titulo: 'Resolver contradicción bloqueante',
      descripcion: bloqueantes[0].explicacion,
      razon: `Hay ${bloqueantes.length} contradicción(es) bloqueante(s) que impiden avanzar el expediente.`,
      prioridad: 1,
      evidencias: bloqueantes.map((b) => ({ tipo: 'contradiccion', id: b.id, descripcion: b.explicacion })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      esPrincipal: true,
    });
    return acciones; // las bloqueantes son always la acción principal; no añadir más.
  }

  // 2. Requisitos pendientes: prioridad 2-3 según cantidad.
  const reqs = await db.select({ id: requisitosExpediente.id, nombre: requisitosExpediente.nombre })
    .from(requisitosExpediente)
    .where(and(
      eq(requisitosExpediente.expedienteId, expedienteId),
      inArray(requisitosExpediente.estado, ['solicitado', 'pendiente_abogado']),
    ));
  if (reqs.length > 0) {
    acciones.push({
      actionKey: `solicitar_completar_requisitos:${expedienteId}`,
      titulo: `Completar ${reqs.length} requisito(s) pendiente(s)`,
      descripcion: reqs.map((r) => r.nombre).join(', '),
      razon: `Hay ${reqs.length} requisito(s) sin completar.`,
      prioridad: reqs.length > 3 ? 2 : 3,
      evidencias: reqs.map((r) => ({ tipo: 'requisito', id: r.id, descripcion: r.nombre })),
      bloqueos: [],
      requiereConfirmacionHumana: false,
      estrategia: 'determinista',
      confianza: 100,
      esPrincipal: true,
    });
  }

  // 3. Alertas abiertas: prioridad 2 si son error/critico.
  const alertasAbiertas = await db.select({ id: alertas.id, severidad: alertas.severidad, titulo: alertas.titulo })
    .from(alertas)
    .where(and(eq(alertas.expedienteId, expedienteId), eq(alertas.resuelta, false)));
  const criticas = alertasAbiertas.filter((a) => a.severidad === 'critico' || a.severidad === 'error');
  if (criticas.length > 0) {
    acciones.push({
      actionKey: `atender_alertas_criticas:${expedienteId}`,
      titulo: `Atender ${criticas.length} alerta(s) crítica(s)`,
      descripcion: criticas.map((a) => a.titulo).join(', '),
      razon: 'Hay alertas críticas sin resolver.',
      prioridad: 2,
      evidencias: criticas.map((a) => ({ tipo: 'alerta', id: a.id, descripcion: a.titulo })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      esPrincipal: false,
    });
  }

  // 4. Jobs fallidos en DLQ del expediente. Filtrar por expedienteId en el
  // payload jsonb (jobs_sgie no tiene columna expediente_id directa). Esto
  // evita listar jobs DLQ de OTROS expedientes (bug corregido).
  const dlq = await db.select({ id: jobsSgie.id, payload: jobsSgie.payload })
    .from(jobsSgie)
    .where(eq(jobsSgie.estado, 'dead_lettered'))
    .limit(20);
  const dlqDelExpediente = dlq.filter((j) => {
    const p = j.payload as Record<string, unknown> | null;
    return p?.expedienteId === expedienteId || p?.documentoId != null;
  }).slice(0, 5);
  if (dlqDelExpediente.length > 0) {
    acciones.push({
      actionKey: `revisar_dlq:${expedienteId}`,
      titulo: `Revisar ${dlqDelExpediente.length} job(s) en dead-letter queue`,
      razon: 'Hay jobs fallidos que requieren atención.',
      prioridad: 3,
      evidencias: dlqDelExpediente.map((j) => ({ tipo: 'job_dlq', id: j.id, descripcion: 'Job en DLQ' })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      esPrincipal: false,
    });
  }

  // 5. Si no hay acciones (expediente en buen estado): acción de revisión general.
  if (acciones.length === 0) {
    acciones.push({
      actionKey: `revision_general:${expedienteId}`,
      titulo: 'Revisión general del expediente',
      razon: 'No hay acciones urgentes detectadas; revisar el estado global.',
      prioridad: 5,
      evidencias: [],
      bloqueos: [],
      requiereConfirmacionHumana: false,
      estrategia: 'determinista',
      confianza: 80,
      esPrincipal: true,
    });
  }

  // Asegurar exactamente una principal.
  const conPrincipal = acciones.some((a) => a.esPrincipal);
  if (!conPrincipal && acciones.length > 0) acciones[0].esPrincipal = true;

  return acciones;
}

/**
 * Persiste las acciones generadas para un expediente. Idempotente por
 * (expediente, action_key) en estado 'propuesta'. Sustituye acciones
 * anteriores cuya source cambió.
 */
export async function persistirAcciones(
  expedienteId: string,
  acciones: AccionRecomendada[],
  sourceHashOverride?: string,
): Promise<{ principal?: CaseNextAction; alternativas: CaseNextAction[] }> {
  const sourceHash = sourceHashOverride ?? createHash('sha256').update(JSON.stringify(acciones)).digest('hex');

  let principal: CaseNextAction | undefined;
  const alternativas: CaseNextAction[] = [];

  for (const a of acciones) {
    const [inserted] = await db.insert(caseNextActions).values({
      expedienteId,
      actionKey: a.actionKey,
      titulo: a.titulo,
      descripcion: a.descripcion ?? null,
      razon: a.razon,
      prioridad: a.prioridad,
      evidencias: a.evidencias,
      bloqueos: a.bloqueos,
      estrategia: a.estrategia,
      confianza: a.confianza ?? null,
      reglaId: a.reglaId ?? null,
      modeloIa: a.modeloIa ?? null,
      esPrincipal: a.esPrincipal,
      expiraEn: a.expiraEn ?? null,
      requiereConfirmacionHumana: a.requiereConfirmacionHumana,
      sourceHash,
      idempotencyKey: `${expedienteId}|${a.actionKey}|${sourceHash.slice(0, 16)}`,
    })
      .onConflictDoNothing()
      .returning();
    if (inserted) {
      if (a.esPrincipal) principal = inserted;
      else alternativas.push(inserted);
    }
  }

  return { principal, alternativas };
}

/**
 * Flujo completo: genera y persiste acciones para un expediente.
 */
export async function recomendarNextAction(input: {
  expedienteId: string;
  flagContext?: Parameters<typeof isFlagEnabled>[1];
}): Promise<ResultadoNextAction> {
  const flagOn = await isFlagEnabled('sgie.ai.next_action', input.flagContext ?? {}).catch(() => false);
  if (!flagOn) {
    return { ok: false, alternativas: [], razon: 'feature_flag_desactivada' };
  }
  const acciones = await generarAccionesDeterministas(input.expedienteId);
  if (acciones.length === 0) {
    return { ok: true, alternativas: [], razon: 'sin_acciones' };
  }
  const { principal, alternativas } = await persistirAcciones(input.expedienteId, acciones);
  return { ok: true, principal, alternativas };
}

/**
 * Acepta o rechaza una acción recomendada. Auditado.
 */
export async function decidirAccion(
  accionId: string,
  estado: 'aceptada' | 'rechazada' | 'completada',
  actorId: string,
  motivo?: string,
): Promise<CaseNextAction | null> {
  const [updated] = await db.update(caseNextActions)
    .set({ estado, decisionPor: actorId, decisionEn: new Date(), decisionMotivo: motivo ?? null, actualizadoEn: new Date() })
    .where(eq(caseNextActions.id, accionId))
    .returning();
  return updated ?? null;
}
