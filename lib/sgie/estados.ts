/**
 * SGIE — Traducción de estados internos a presentación legible.
 *
 * ÚNICAMENTE presentación: no muta valores persistidos en DB. Los enums
 * canónicos viven en `lib/schema.ts` (expedienteEstadoEnum, documentoEstadoEnum,
 * alertaSeveridadEnum, tareaPrioridadEnum, etc.).
 *
 * Convenio: snake_case → frase capitalizada en español humano.
 * Ej.: `pendiente_validacion_abogado` → `Pendiente de validación`.
 *
 * Referencia: Sprint 0 (auditoría SGIE, tarea 5).
 */

/**
 * Catálogo de traducción de estados de expediente.
 * Claves = valores del enum `expediente_estado` (lib/schema.ts).
 */
const ESTADO_EXPEDIENTE_LABELS: Record<string, string> = {
  creado: 'Creado',
  pendiente_de_checklist: 'Pendiente de checklist',
  pendiente_de_documentos: 'Pendiente de documentos',
  enlace_enviado: 'Enlace enviado',
  documentos_parcialmente_recibidos: 'Documentos parcialmente recibidos',
  documentos_completos: 'Documentos completos',
  analisis_pendiente: 'Análisis pendiente',
  analisis_completado: 'Análisis completado',
  inconsistencias_detectadas: 'Inconsistencias detectadas',
  pendiente_validacion_abogado: 'Pendiente de validación',
  validado: 'Validado',
  pendiente_de_firma: 'Pendiente de firma',
  en_tramite: 'En trámite',
  en_seguimiento: 'En seguimiento',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
  bloqueado_por_cliente: 'Bloqueado por cliente',
  listo_para_revision: 'Listo para revisión',
  devuelto_por_abogado: 'Devuelto por abogado',
};

/**
 * Catálogo de traducción de estados de documento (enum `documento_estado`).
 */
const ESTADO_DOCUMENTO_LABELS: Record<string, string> = {
  solicitado: 'Solicitado',
  subido: 'Subido',
  clasificando: 'Clasificando',
  clasificado: 'Clasificado',
  texto_extraido: 'Texto extraído',
  ocr_pendiente: 'OCR pendiente',
  ilegible: 'Ilegible',
  duplicado: 'Duplicado',
  incorrecto: 'Incorrecto',
  vencido: 'Vencido',
  ia_procesada: 'Procesado por IA',
  pendiente_abogado: 'Pendiente del abogado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/**
 * Catálogo de traducción de severidad de alerta (enum `alerta_severidad`).
 */
const SEVERIDAD_LABELS: Record<string, string> = {
  info: 'Informativa',
  advertencia: 'Advertencia',
  error: 'Error',
  critico: 'Crítica',
};

/**
 * Catálogo de traducción de prioridad (enum `tarea_prioridad` / `expediente_prioridad`).
 */
const PRIORIDAD_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

/**
 * Catálogo de traducción de estado de tarea (enum `tarea_estado`).
 */
const ESTADO_TAREA_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

/**
 * Catálogo de traducción de estado de evento de agenda (enum `evento_agenda_estado`).
 */
const ESTADO_AGENDA_LABELS: Record<string, string> = {
  propuesta: 'Propuesta',
  confirmada: 'Confirmada',
  descartada: 'Descartada',
  completada: 'Completada',
};

/**
 * Catálogo de traducción de estado de correo (enum `correo_estado`).
 */
const ESTADO_CORREO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  fallido: 'Fallido',
  reintentando: 'Reintentando',
};

/**
 * Capitaliza la primera letra de cada palabra de una frase, preservando
 * conectores (de, del, la, el, y, en) en minúscula salvo inicio.
 * Función auxiliar para el fallback de estados desconocidos.
 */
function capitalizarFrase(s: string): string {
  const conectores = new Set(['de', 'del', 'la', 'el', 'las', 'los', 'y', 'en', 'a', 'para']);
  const palabras = s.split(/\s+/).filter(Boolean);
  return palabras
    .map((p, i) => {
      const lower = p.toLowerCase();
      if (i !== 0 && conectores.has(lower)) return lower;
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Traduce un estado de expediente a etiqueta legible.
 * Fallback robusto: si el estado no está en el catálogo, lo deriva del snake_case
 * capitalizando palabras (mejor que mostrar el enum crudo).
 */
export function traducirEstadoExpediente(estado: string | null | undefined): string {
  if (!estado) return '—';
  return ESTADO_EXPEDIENTE_LABELS[estado] ?? capitalizarFrase(estado.replace(/_/g, ' '));
}

/**
 * Traduce un estado de documento a etiqueta legible.
 */
export function traducirEstadoDocumento(estado: string | null | undefined): string {
  if (!estado) return '—';
  return ESTADO_DOCUMENTO_LABELS[estado] ?? capitalizarFrase(estado.replace(/_/g, ' '));
}

/**
 * Traduce una severidad de alerta a etiqueta legible.
 */
export function traducirSeveridad(severidad: string | null | undefined): string {
  if (!severidad) return '—';
  return SEVERIDAD_LABELS[severidad] ?? capitalizarFrase(severidad.replace(/_/g, ' '));
}

/**
 * Traduce una prioridad a etiqueta legible.
 */
export function traducirPrioridad(prioridad: string | null | undefined): string {
  if (!prioridad) return '—';
  return PRIORIDAD_LABELS[prioridad] ?? capitalizarFrase(prioridad.replace(/_/g, ' '));
}

/**
 * Traduce un estado de tarea a etiqueta legible.
 */
export function traducirEstadoTarea(estado: string | null | undefined): string {
  if (!estado) return '—';
  return ESTADO_TAREA_LABELS[estado] ?? capitalizarFrase(estado.replace(/_/g, ' '));
}

/**
 * Traduce un estado de evento de agenda a etiqueta legible.
 */
export function traducirEstadoAgenda(estado: string | null | undefined): string {
  if (!estado) return '—';
  return ESTADO_AGENDA_LABELS[estado] ?? capitalizarFrase(estado.replace(/_/g, ' '));
}

/**
 * Traduce un estado de correo a etiqueta legible.
 */
export function traducirEstadoCorreo(estado: string | null | undefined): string {
  if (!estado) return '—';
  return ESTADO_CORREO_LABELS[estado] ?? capitalizarFrase(estado.replace(/_/g, ' '));
}
