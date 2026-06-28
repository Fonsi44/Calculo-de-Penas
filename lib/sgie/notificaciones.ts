/**
 * SGIE — Normalización de notificaciones in-app (Sprint 2, tarea 5).
 *
 * Las notificaciones del SGIE son DERIVADAS (virtuales): se calculan a partir
 * del estado actual de tareas, alertas, documentos, agenda y enlaces, sin
 * persistir una tabla de notificaciones. Esta utilidad transforma esos datos
 * crudos en un payload uniforme y ligero para el centro de notificaciones.
 *
 * Función pura (sin DB) → testeable.
 */

export type TipoNotificacion =
  | 'tarea_vencida'
  | 'alerta_critica'
  | 'documento_pendiente'
  | 'evento_proximo'
  | 'enlace_expirando';

export type SeveridadNotificacion = 'info' | 'warning' | 'danger';

export interface NotificacionItem {
  /** id estable por tipo+recurso (para dedupe en cliente). */
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  subtitulo: string | null;
  severidad: SeveridadNotificacion;
  href: string;
  /** ISO de la fecha relevante (vencimiento, evento, creación). */
  fecha: string | null;
}

/** Mapa severidad → tono visual (coherente con design tokens). */
export const SEVERIDAD_TONO: Record<SeveridadNotificacion, string> = {
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** Orden de prioridad de las notificaciones en el centro (mayor = más arriba). */
const PRIORIDAD: Record<TipoNotificacion, number> = {
  alerta_critica: 100,
  tarea_vencida: 90,
  documento_pendiente: 70,
  evento_proximo: 60,
  enlace_expirando: 50,
};

export interface TareaVencidaInput {
  id: string;
  titulo: string;
  fechaVencimiento: string | null;
}

export interface AlertaCriticaInput {
  id: string;
  titulo: string;
  mensaje: string | null;
}

export interface DocPendienteInput {
  id: string;
  nombreOriginal: string;
  expedienteId: string;
}

export interface EventoProximoInput {
  id: string;
  titulo: string;
  fecha: string;
}

export interface EnlaceExpirandoInput {
  id: string;
  expiraEn: string;
}

/**
 * Construye el array de notificaciones a partir de las entradas crudas y las
 * ordena por prioridad (críticas primero). Deduplica por id.
 */
export function normalizarNotificaciones(input: {
  tareasVencidas?: TareaVencidaInput[];
  alertasCriticas?: AlertaCriticaInput[];
  documentosPendientes?: DocPendienteInput[];
  eventosProximos?: EventoProximoInput[];
  enlacesExpirando?: EnlaceExpirandoInput[];
}): NotificacionItem[] {
  const items: NotificacionItem[] = [];
  const vistos = new Set<string>();

  const push = (n: NotificacionItem) => {
    if (vistos.has(n.id)) return;
    vistos.add(n.id);
    items.push(n);
  };

  for (const t of input.tareasVencidas ?? []) {
    push({
      id: `tarea_vencida:${t.id}`,
      tipo: 'tarea_vencida',
      titulo: `Tarea vencida: ${t.titulo}`,
      subtitulo: t.fechaVencimiento ? `Vencía ${formatFechaCorta(t.fechaVencimiento)}` : null,
      severidad: 'danger',
      href: '/intranet/sgie/tareas',
      fecha: t.fechaVencimiento,
    });
  }

  for (const a of input.alertasCriticas ?? []) {
    push({
      id: `alerta_critica:${a.id}`,
      tipo: 'alerta_critica',
      titulo: a.titulo,
      subtitulo: a.mensaje,
      severidad: 'danger',
      href: '/intranet/sgie/alertas',
      fecha: null,
    });
  }

  for (const d of input.documentosPendientes ?? []) {
    push({
      id: `documento_pendiente:${d.id}`,
      tipo: 'documento_pendiente',
      titulo: `Documento pendiente: ${d.nombreOriginal}`,
      subtitulo: null,
      severidad: 'warning',
      href: `/intranet/sgie/expedientes/${d.expedienteId}`,
      fecha: null,
    });
  }

  for (const e of input.eventosProximos ?? []) {
    push({
      id: `evento_proximo:${e.id}`,
      tipo: 'evento_proximo',
      titulo: `Próximo evento: ${e.titulo}`,
      subtitulo: formatFechaCorta(e.fecha),
      severidad: 'info',
      href: '/intranet/sgie/agenda',
      fecha: e.fecha,
    });
  }

  for (const en of input.enlacesExpirando ?? []) {
    push({
      id: `enlace_expirando:${en.id}`,
      tipo: 'enlace_expirando',
      titulo: 'Enlace de carga próximo a expirar',
      subtitulo: `Expira ${formatFechaCorta(en.expiraEn)}`,
      severidad: 'warning',
      href: '/intranet/sgie/documentos',
      fecha: en.expiraEn,
    });
  }

  // Ordenar por prioridad descendente.
  items.sort((a, b) => PRIORIDAD[b.tipo] - PRIORIDAD[a.tipo]);
  return items;
}

function formatFechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}
