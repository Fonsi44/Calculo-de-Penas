/**
 * SGIE — Configuración del motor de seguimiento documental (Fase 2).
 *
 * Umbrales y slugs de plantillas para recordatorios al cliente, aviso de
 * bloqueo y correcciones. Esta configuración es INTERNA (sin UI Admin todavía);
 * cuando exista la UI, estos valores se moverán a una tabla de configuración
 * versionada. Mientras tanto, ajustar aquí y documentar el cambio.
 *
 * IMPORTANTE: SGIE NO calcula plazos legales. Estos días son umbrales
 * OPERATIVOS de seguimiento documental sobre fechas internas (alta del
 * expediente / último recordatorio), no plazos judiciales.
 *
 * Referencia: docs/implementation/mvp-fase-2-seguimiento-documental.md
 */

/** Días desde la solicitud/último recordatorio hasta el primer recordatorio. */
export const DIAS_PRIMER_RECUERDO = 3;

/** Días desde la solicitud/último recordatorio hasta el segundo recordatorio. */
export const DIAS_SEGUNDO_RECUERDO = 7;

/** Días desde la solicitud hasta el bloqueo por falta de respuesta. */
export const DIAS_BLOQUEO = 14;

/** Número máximo de recordatorios automáticos antes de bloquear. */
export const MAX_RECORDATORIOS = 2;

/** Slugs de plantillas de email (registrados en `correos_enviados.plantilla_slug`). */
export const SLUGS_PLANTILLAS_SEGUIMIENTO = {
  solicitudDocumental: 'solicitud_documental',
  primerRecordatorio: 'primer_recordatorio',
  segundoRecordatorio: 'segundo_recordatorio',
  avisoBloqueo: 'aviso_bloqueo',
  confirmacionRecepcion: 'confirmacion_recepcion',
  solicitudCorreccion: 'solicitud_correccion',
} as const;

/**
 * Devuelve la acción que toca para un expediente según los días transcurridos
 * desde una fecha de referencia (solicitud o último recordatorio) y el número
 * de recordatorios ya enviados. Función pura (sin DB) — testeable.
 *
 * Retorna:
 *  - 'ninguna'        → todavía no toca ningún recordatorio.
 *  - 'primer'         → toca primer recordatorio.
 *  - 'segundo'        → toca segundo recordatorio.
 *  - 'aviso_bloqueo'  → toca aviso de bloqueo inminente.
 *  - 'bloquear'       → superado el umbral de bloqueo.
 */
export function accionSegunDias(
  diasTranscurridos: number,
  recordatoriosEnviados: number,
): 'ninguna' | 'primer' | 'segundo' | 'aviso_bloqueo' | 'bloquear' {
  if (diasTranscurridos >= DIAS_BLOQUEO) return 'bloquear';
  if (diasTranscurridos >= DIAS_SEGUNDO_RECUERDO && recordatoriosEnviados < 2) return 'segundo';
  // Aviso de bloqueo: entre segundo recordatorio y bloqueo, si ya hay 2 enviados.
  if (diasTranscurridos >= DIAS_SEGUNDO_RECUERDO && recordatoriosEnviados >= 2) return 'aviso_bloqueo';
  if (diasTranscurridos >= DIAS_PRIMER_RECUERDO && recordatoriosEnviados < 1) return 'primer';
  return 'ninguna';
}
