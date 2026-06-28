/**
 * SGIE — Helpers de inteligencia del expediente (Sprint 3, tarea 4).
 *
 * Funciones puras para presentar los datos IA del expediente (confianza,
 * campos extraídos, clasificación, inconsistencias) de forma legible.
 * No invoca IA ni DB: normaliza/etiqueta lo que el backend ya calcula.
 *
 * Sprint 3.
 */

export type EtiquetaConfianza = 'baja' | 'media' | 'alta' | 'muy_alta';

/** Convierte un valor 0-100 a etiqueta de confianza (coherente con motor-confianza). */
export function etiquetarConfianza(confianza: number | null | undefined): EtiquetaConfianza | null {
  if (confianza === null || confianza === undefined) return null;
  if (confianza <= 40) return 'baja';
  if (confianza <= 70) return 'media';
  if (confianza <= 90) return 'alta';
  return 'muy_alta';
}

/** Traduce la etiqueta de confianza a texto legible en español. */
export function traducirEtiquetaConfianza(etiqueta: EtiquetaConfianza | string | null | undefined): string {
  const labels: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    muy_alta: 'Muy alta',
  };
  if (!etiqueta) return '—';
  return labels[etiqueta] ?? String(etiqueta);
}

/** Clase de color (token) para una etiqueta de confianza. */
export function tonoConfianza(etiqueta: EtiquetaConfianza | string | null | undefined): string {
  switch (etiqueta) {
    case 'muy_alta': return 'bg-success/10 text-success border-success/20';
    case 'alta': return 'bg-success/10 text-success border-success/20';
    case 'media': return 'bg-warning/10 text-warning border-warning/20';
    case 'baja': return 'bg-danger/10 text-danger border-danger/20';
    default: return 'bg-surface-alt text-text-secondary border-border';
  }
}

/**
 * Estado de un campo extraído según confirmación/corrección.
 * - confirmado: el abogado lo validó.
 * - corregido: el abogado lo corrigió (valor final = corregidoValor).
 * - pendiente: sin confirmar ni corregir.
 */
export type EstadoCampoExtraido = 'confirmado' | 'corregido' | 'pendiente';

export function estadoCampoExtraido(campo: {
  confirmadoPor?: string | null;
  corregidoPor?: string | null;
}): EstadoCampoExtraido {
  if (campo.corregidoPor) return 'corregido';
  if (campo.confirmadoPor) return 'confirmado';
  return 'pendiente';
}

/** Devuelve el valor efectivo de un campo (corregido si existe, si no original). */
export function valorEfectivoCampo(campo: {
  valor?: string | null;
  corregidoValor?: string | null;
}): string | null {
  return campo.corregidoValor ?? campo.valor ?? null;
}

/**
 * Determina si un documento está bien clasificado (confianza de clasificación
 * alta o muy alta). Umbral coherente con CONFIG_DEFAULT del motor de reglas.
 */
export function estaBienClasificado(confianzaClasificacion: number | null | undefined): boolean {
  if (confianzaClasificacion === null || confianzaClasificacion === undefined) return false;
  return confianzaClasificacion >= 71;
}
