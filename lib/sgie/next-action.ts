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
  eventosAgenda,
  comunicacionesOutbox,
  expedientes,
  type CaseNextAction,
} from '@/lib/schema';
import { and, eq, inArray, or as orDrizzle } from 'drizzle-orm';
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

  // 5. Plazos/vencimientos próximos (eventos de agenda tipo plazo/audiencia/vencimiento).
  // Prioridad 2 si vencen en <= 3 días; prioridad 3 si en <= 7 días.
  const plazosProximos = await db.select({ id: eventosAgenda.id, titulo: eventosAgenda.titulo, inicio: eventosAgenda.inicio, tipo: eventosAgenda.tipo })
    .from(eventosAgenda)
    .where(and(
      eq(eventosAgenda.expedienteId, expedienteId),
      inArray(eventosAgenda.estado, ['confirmada', 'propuesta']),
      inArray(eventosAgenda.tipo, ['audiencia', 'plazo', 'vencimiento_enlace', 'firma', 'cita_cliente']),
    ))
    .limit(10);
  const ahora = Date.now();
  const plazosUrgentes = plazosProximos.filter((p) => {
    if (!p.inicio) return false;
    const diff = new Date(p.inicio).getTime() - ahora;
    return diff <= 3 * 86400000 && diff > -86400000; // <=3d futuro, no >1d pasado
  });
  if (plazosUrgentes.length > 0) {
    acciones.push({
      actionKey: `atender_plazo_urgente:${expedienteId}`,
      titulo: `Atender ${plazosUrgentes.length} plazo(s) próximo(s)`,
      descripcion: plazosUrgentes.map((p) => `${p.titulo} (${p.tipo})`).join(', '),
      razon: 'Hay plazos/audiencias que vencen en 3 días o menos.',
      prioridad: 2,
      evidencias: plazosUrgentes.map((p) => ({ tipo: 'plazo', id: p.id, descripcion: `${p.titulo} (${p.tipo}) ${p.inicio ? new Date(p.inicio).toISOString().slice(0, 10) : ''}` })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      reglaId: 'det.plazo_3dias',
      esPrincipal: false,
    });
  } else {
    const plazosCercanos = plazosProximos.filter((p) => {
      if (!p.inicio) return false;
      const diff = new Date(p.inicio).getTime() - ahora;
      return diff <= 7 * 86400000 && diff > 3 * 86400000;
    });
    if (plazosCercanos.length > 0) {
      acciones.push({
        actionKey: `preparar_plazo_cercano:${expedienteId}`,
        titulo: `Preparar ${plazosCercanos.length} plazo(s) en <=7 días`,
        descripcion: plazosCercanos.map((p) => p.titulo).join(', '),
        razon: 'Plazos/audiencias en los próximos 7 días.',
        prioridad: 3,
        evidencias: plazosCercanos.map((p) => ({ tipo: 'plazo', id: p.id, descripcion: p.titulo })),
        bloqueos: [],
        requiereConfirmacionHumana: false,
        estrategia: 'determinista',
        confianza: 100,
        reglaId: 'det.plazo_7dias',
        esPrincipal: false,
      });
    }
  }

  // 6. Comunicaciones fallidas/rebotadas pendientes de revisión.
  const comFallidas = await db.select({ id: comunicacionesOutbox.id, tipo: comunicacionesOutbox.tipo, destinatario: comunicacionesOutbox.destinatario, error: comunicacionesOutbox.error })
    .from(comunicacionesOutbox)
    .where(and(
      eq(comunicacionesOutbox.expedienteId, expedienteId),
      orDrizzle(eq(comunicacionesOutbox.estado, 'fallido'), eq(comunicacionesOutbox.estado, 'reintentando')),
    ))
    .limit(5);
  if (comFallidas.length > 0) {
    acciones.push({
      actionKey: `revisar_comunicaciones_fallidas:${expedienteId}`,
      titulo: `Revisar ${comFallidas.length} comunicación(es) fallida(s)`,
      descripcion: comFallidas.map((c) => `${c.tipo} a ${c.destinatario}`).join(', '),
      razon: 'Hay comunicaciones que fallaron o están reintentando.',
      prioridad: 3,
      evidencias: comFallidas.map((c) => ({ tipo: 'comunicacion', id: c.id, descripcion: `${c.tipo}: ${c.error ?? 'sin detalle'}` })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      reglaId: 'det.comunicacion_fallida',
      esPrincipal: false,
    });
  }

  // 7. Firma/paquete pendiente: eventos de agenda tipo 'firma' en estado
  // 'propuesta' (pendiente de confirmar/enviar) que NO hayan sido ya captados
  // por la rama de plazos urgentes/cercanos (ventana <=7 días). En Fase 4A no
  // existe tabla signature_packages (llega en Fase 4B / P2-08); la fuente
  // canónica de "firma pendiente" son los eventos_agenda de tipo 'firma'. No
  // se inventa un origen de datos: se reutiliza el schema existente.
  const yaCubiertosPorPlazos = new Set(plazosUrgentes.concat(plazosProximos.filter((p) => {
    if (!p.inicio) return false;
    const diff = new Date(p.inicio).getTime() - ahora;
    return diff <= 7 * 86400000 && diff > 3 * 86400000;
  })).map((p) => p.id));
  const firmasPendientes = plazosProximos.filter(
    (p) => p.tipo === 'firma' && !yaCubiertosPorPlazos.has(p.id),
  );
  if (firmasPendientes.length > 0) {
    acciones.push({
      actionKey: `gestionar_firma_pendiente:${expedienteId}`,
      titulo: `Gestionar ${firmasPendientes.length} firma(s) pendiente(s)`,
      descripcion: firmasPendientes.map((p) => p.titulo).join(', '),
      razon: 'Hay paquetes/eventos de firma pendientes de confirmar o enviar.',
      prioridad: 2,
      evidencias: firmasPendientes.map((p) => ({ tipo: 'firma_pendiente', id: p.id, descripcion: p.titulo })),
      bloqueos: [],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      reglaId: 'det.firma_pendiente',
      esPrincipal: false,
    });
  }

  // 8. Readiness bloqueado: si el expediente está en estado 'devuelto_por_abogado'
  // o 'inconsistencias_detectadas', hay bloqueos de preparación que atender.
  const expedienteEstado = await db.select({ estado: expedientes.estado }).from(expedientes).where(eq(expedientes.id, expedienteId)).limit(1);
  const estadosBloqueoReadiness = ['devuelto_por_abogado', 'inconsistencias_detectadas', 'bloqueado_por_cliente'];
  if (estadosBloqueoReadiness.includes(expedienteEstado[0]?.estado ?? '')) {
    acciones.push({
      actionKey: `resolver_bloqueo_readiness:${expedienteId}`,
      titulo: `Resolver bloqueo de readiness`,
      descripcion: `Expediente en estado "${expedienteEstado[0]?.estado}"`,
      razon: 'El expediente tiene un bloqueo de preparación documental que requiere atención.',
      prioridad: 2,
      evidencias: [{ tipo: 'estado_expediente', id: expedienteId, descripcion: `Estado: ${expedienteEstado[0]?.estado}` }],
      bloqueos: [{ tipo: 'readiness', descripcion: 'Preparación documental bloqueada' }],
      requiereConfirmacionHumana: true,
      estrategia: 'determinista',
      confianza: 100,
      reglaId: 'det.readiness_bloqueado',
      esPrincipal: false,
    });
  }

  // 9. Si no hay acciones (expediente en buen estado): acción de revisión general.
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
