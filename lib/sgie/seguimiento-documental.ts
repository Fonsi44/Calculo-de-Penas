/**
 * SGIE — Núcleo de seguimiento documental (Fase 2).
 *
 * Convierte la Fase 1 (magic links + upload seguro) en un flujo documental
 * gestionado: cálculo de estado documental, marca de no_aplica, vinculación
 * de documentos a requisitos en la subida, rechazo manual que reabre el
 * requisito, y desbloqueo de expediente.
 *
 * SIN IA ni OCR: el seguimiento es operacional, no analiza contenido.
 *
 * Referencia: docs/implementation/mvp-fase-2-seguimiento-documental.md
 */
import { db } from '@/lib/db';
import { requisitosExpediente, expedientes, documentosExpediente } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { ContextoAbogado } from './expedientes-db';
import {
  verificarAccesoExpediente,
} from './expedientes-db';
import { rechazarDocumento } from './documentos-db';
import { logSgie } from './auditoria-sgie';
import { recalcularReadinessSiProcede } from './readiness';

/** Requisito en bruto para el cálculo de estado documental (función pura). */
export interface RequisitoParaEstado {
  tipo: string; // 'obligatorio' | 'opcional' | 'condicional'
  estado: string; // requisito_estado
  confirmado: boolean | null;
  noAplica?: boolean; // metadata.noAplica
}

/** Resultado del cálculo de estado documental. */
export type EstadoDocumental = 'documentos_completos' | 'documentos_parcialmente_recibidos' | 'pendiente_de_documentos';

/**
 * Calcula el estado documental de un expediente a partir de sus requisitos.
 * FUNCIÓN PURA (sin DB) — testeable aisladamente.
 *
 * Reglas:
 *  - Un obligatorio se considera "satisfecho" si está recibido/subido/aprobado
 *    o marcado como no_aplica (confirmado con metadata.noAplica).
 *  - Si TODOS los obligatorios están satisfechos → documentos_completos.
 *  - Si ALGÚN obligatorio está satisfecho pero no todos → documentos_parcialmente_recibidos.
 *  - Si NINGÚN obligatorio está satisfecho (o no hay obligatorios) → pendiente_de_documentos.
 */
export function calcularEstadoDocumental(requisitos: RequisitoParaEstado[]): EstadoDocumental {
  const obligatorios = requisitos.filter((r) => r.tipo === 'obligatorio');
  if (obligatorios.length === 0) return 'pendiente_de_documentos';

  const SATISFECHOS = new Set(['subido', 'aprobado', 'texto_extraido', 'clasificado', 'ia_procesada']);
  let satisfechos = 0;
  for (const r of obligatorios) {
    const satisfecho = SATISFECHOS.has(r.estado) || r.noAplica === true;
    if (satisfecho) satisfechos++;
  }

  if (satisfechos === obligatorios.length) return 'documentos_completos';
  if (satisfechos > 0) return 'documentos_parcialmente_recibidos';
  return 'pendiente_de_documentos';
}

/**
 * Marca un requisito como NO APLICA. Como decidimos no añadir el estado al
 * enum, se representa con `confirmado: true` + `metadata.noAplica: true`,
 * lo que lo excluye del cómputo de obligatorios pendientes.
 *
 * Requiere acceso al expediente del requisito.
 */
export async function marcarRequisitoNoAplica(
  requisitoId: string,
  ctx: ContextoAbogado,
): Promise<{ ok: boolean } | null> {
  const [req] = await db
    .select({ id: requisitosExpediente.id, expedienteId: requisitosExpediente.expedienteId })
    .from(requisitosExpediente)
    .where(eq(requisitosExpediente.id, requisitoId));
  if (!req) return null;

  const tieneAcceso = await verificarAccesoExpediente(req.expedienteId, ctx);
  if (!tieneAcceso) return null;

  await db
    .update(requisitosExpediente)
    .set({ confirmado: true, actualizadoEn: new Date(), estado: 'aprobado' })
    .where(eq(requisitosExpediente.id, requisitoId));

  await logSgie({
    usuarioId: ctx.usuarioId,
    accion: 'documento_updated',
    recurso: 'requisito_expediente',
    recursoId: requisitoId,
    metadata: { expedienteId: req.expedienteId, noAplica: true },
    exito: true,
    mensaje: 'Requisito marcado como no aplica',
  });

  return { ok: true };
}

/**
 * Vincula un documento recién subido a su requisito: actualiza el estado del
 * requisito a 'subido' y recalcula el estado documental del expediente.
 * Llamado por el endpoint de upload cuando el documento trae requisitoExpedienteId.
 *
 * No usa IA/OCR: solo marca el requisito como recibido operacionalmente.
 */
export async function vincularDocumentoARequisitoOnUpload(params: {
  expedienteId: string;
  requisitoExpedienteId: string;
}): Promise<EstadoDocumental | null> {
  await db
    .update(requisitosExpediente)
    .set({ estado: 'subido', actualizadoEn: new Date() })
    .where(eq(requisitosExpediente.id, params.requisitoExpedienteId));

  // Recalcular estado documental del expediente.
  // Recalcular estado documental del expediente.
  const estado = await recalcularYAvanzarEstadoDocumental(params.expedienteId);

  // Fase 5 — recalcular readiness tras recibir un documento.
  recalcularReadinessSiProcede(params.expedienteId).catch(() => {});

  return estado;
}

/**
 * Recalcula el estado documental del expediente a partir de sus requisitos y,
 * si procede, avanza el estado del expediente (parcial → completo). No
 * fuerza transiciones críticas.
 */
export async function recalcularYAvanzarEstadoDocumental(
  expedienteId: string,
): Promise<EstadoDocumental> {
  const reqs = await db
    .select({
      tipo: requisitosExpediente.tipo,
      estado: requisitosExpediente.estado,
      confirmado: requisitosExpediente.confirmado,
    })
    .from(requisitosExpediente)
    .where(eq(requisitosExpediente.expedienteId, expedienteId));

  const estadoDoc = calcularEstadoDocumental(reqs);

  // Avance automático del estado del expediente si procede (transiciones no
  // críticas, ejecutadas por el sistema en el contexto del responsable).
  const [exp] = await db
    .select({ estado: expedientes.estado })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (exp) {
    const actual = exp.estado;
    if (estadoDoc === 'documentos_completos' && (actual === 'enlace_enviado' || actual === 'documentos_parcialmente_recibidos' || actual === 'pendiente_de_documentos')) {
      // Avanzar a documentos_completos vía update directo (estado no crítico).
      await db.update(expedientes).set({ estado: 'documentos_completos', actualizadoEn: new Date() }).where(eq(expedientes.id, expedienteId));
    } else if (estadoDoc === 'documentos_parcialmente_recibidos' && (actual === 'enlace_enviado' || actual === 'pendiente_de_documentos')) {
      await db.update(expedientes).set({ estado: 'documentos_parcialmente_recibidos', actualizadoEn: new Date() }).where(eq(expedientes.id, expedienteId));
    }
  }
  return estadoDoc;
}

/**
 * Rechaza manualmente un documento: usa `rechazarDocumento` (estado 'rechazado',
 * motivo, usuario, fecha) y REABRE el requisito asociado volviéndolo a
 * 'solicitado' para que el cliente lo reenvíe. Audita el rechazo.
 *
 * No usa IA/OCR: el rechazo es una decisión humana explícita.
 */
export async function rechazarDocumentoManual(params: {
  documentoId: string;
  motivo: string;
  ctx: ContextoAbogado;
}): Promise<{ ok: boolean } | null> {
  const { documentoId, motivo, ctx } = params;

  const [doc] = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      requisitoExpedienteId: documentosExpediente.requisitoExpedienteId,
    })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId));
  if (!doc) return null;

  const tieneAcceso = await verificarAccesoExpediente(doc.expedienteId, ctx);
  if (!tieneAcceso) return null;

  await rechazarDocumento(documentoId, ctx.usuarioId, motivo);

  // Reabrir el requisito asociado (si lo hay) para que el cliente lo reenvíe.
  if (doc.requisitoExpedienteId) {
    await db
      .update(requisitosExpediente)
      .set({ estado: 'solicitado', actualizadoEn: new Date() })
      .where(eq(requisitosExpediente.id, doc.requisitoExpedienteId));
  }

  await logSgie({
    usuarioId: ctx.usuarioId,
    accion: 'documento_updated',
    recurso: 'documento_expediente',
    recursoId: documentoId,
    metadata: { expedienteId: doc.expedienteId, requisitoExpedienteId: doc.requisitoExpedienteId, rechazoManual: true, motivo },
    exito: true,
    mensaje: 'Documento rechazado manualmente; requisito reabierto',
  });

  return { ok: true };
}

/**
 * Desbloquea un expediente que estaba en 'bloqueado_por_cliente': lo devuelve
 * a 'pendiente_de_documentos' para reanudar el flujo documental. Audita.
 */
export async function desbloquearExpediente(
  expedienteId: string,
  ctx: ContextoAbogado,
): Promise<{ ok: boolean } | null> {
  const tieneAcceso = await verificarAccesoExpediente(expedienteId, ctx);
  if (!tieneAcceso) return null;

  const [exp] = await db
    .select({ estado: expedientes.estado })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp) return null;
  if (exp.estado !== 'bloqueado_por_cliente') return { ok: false };

  // Transición directa (no crítica): bloqueado → pendiente_de_documentos.
  await db
    .update(expedientes)
    .set({ estado: 'pendiente_de_documentos', actualizadoEn: new Date() })
    .where(eq(expedientes.id, expedienteId));

  await logSgie({
    usuarioId: ctx.usuarioId,
    accion: 'case_unblocked',
    recurso: 'expediente',
    recursoId: expedienteId,
    metadata: { estadoAnterior: 'bloqueado_por_cliente', estadoNuevo: 'pendiente_de_documentos' },
    exito: true,
    mensaje: 'Expediente desbloqueado',
  });

  return { ok: true };
}

/**
 * Bloquea un expediente por falta de respuesta del cliente. Ejecutado por el
 * motor de recordatorios (job) cuando se supera el umbral. Audita y crea
 * tarea/alerta interna si el modelo lo permite (escalado al responsable).
 */
export async function bloquearExpedientePorCliente(
  expedienteId: string,
  actorId: string,
): Promise<{ ok: boolean }> {
  await db
    .update(expedientes)
    .set({ estado: 'bloqueado_por_cliente', actualizadoEn: new Date() })
    .where(and(eq(expedientes.id, expedienteId), isNull(expedientes.cerradoEn)));

  await logSgie({
    usuarioId: actorId,
    accion: 'case_blocked_by_client',
    recurso: 'expediente',
    recursoId: expedienteId,
    metadata: { motivo: 'falta de respuesta del cliente tras ciclo de recordatorios' },
    exito: true,
    mensaje: 'Expediente bloqueado por cliente',
  });

  return { ok: true };
}
