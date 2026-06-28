/**
 * SGIE — Helpers de agenda (Sprint 3, tarea 1).
 *
 * Funciones puras para mapear acciones de UI a estados/auditoría de eventos
 * de agenda. No invoca DB. Coherente con `eventoAgendaEstadoEnum`.
 *
 * Sprint 3.
 */

export type EventoEstado = 'propuesta' | 'confirmada' | 'descartada' | 'completada';
export type EventoAccion = 'confirmar' | 'cancelar' | 'reprogramar' | 'completar' | 'editar';

/**
 * Estado resultante al aplicar una acción a un evento.
 * - confirmar → confirmada
 * - cancelar → descartada
 * - completar → completada
 * - reprogramar/editar → mantiene el estado actual (sólo cambia fecha/campos)
 */
export function estadoTrasAccion(accion: EventoAccion, estadoActual: EventoEstado): EventoEstado {
  switch (accion) {
    case 'confirmar': return 'confirmada';
    case 'cancelar': return 'descartada';
    case 'completar': return 'completada';
    case 'reprogramar':
    case 'editar':
      return estadoActual;
    default: return estadoActual;
  }
}

/**
 * Acción de auditoría correspondiente a una acción de UI.
 * Mapea a los valores del enum `auditoria_accion` (evento_created/updated/deleted).
 * No existen eventos dedicados para confirmar/cancelar/reprogramar en el enum;
 * se usa evento_updated con metadata explícita del cambio.
 */
export function accionAuditoriaEvento(_accion: EventoAccion): 'evento_created' | 'evento_updated' | 'evento_deleted' {
  return 'evento_updated';
}

/** ¿La acción requiere motivo o es una mera transición de estado? */
export function accionRequiereConfirmacion(accion: EventoAccion): boolean {
  return accion === 'cancelar' || accion === 'reprogramar';
}

/** Etiqueta legible de la acción para toasts/UI. */
export function etiquetaAccion(accion: EventoAccion): string {
  const labels: Record<EventoAccion, string> = {
    confirmar: 'Evento confirmado',
    cancelar: 'Evento cancelado',
    reprogramar: 'Evento reprogramado',
    completar: 'Evento completado',
    editar: 'Evento actualizado',
  };
  return labels[accion];
}
