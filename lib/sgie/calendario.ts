/**
 * SGIE — utilidades de calendario para la vista de Agenda (Sprint 2, tarea 3).
 *
 * Funciones puras (sin dependencias, sin DOM) para construir la rejilla de un
 * mes o de una semana. Testeables sin DB. Usan fechas nativas (sin librería).
 *
 * Convenio: semana con lunes como primer día (estándar ISO 8601 / es-HN).
 */

/** Devuelve una fecha normalizada a medianoche local (sin hora). */
export function aMedianoche(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** ¿Mismo día/mes/año? */
export function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** ¿La fecha `d` está dentro del rango [desde, hasta] inclusive? */
export function enRango(d: Date, desde: Date, hasta: Date): boolean {
  const t = aMedianoche(d).getTime();
  return t >= aMedianoche(desde).getTime() && t <= aMedianoche(hasta).getTime();
}

/** Índice del día de la semana con lunes=0 ... domingo=6 (ISO). */
export function indiceDiaISO(d: Date): number {
  // getDay(): domingo=0 ... sábado=6. Convertimos a lunes=0.
  return (d.getDay() + 6) % 7;
}

export interface DiaCalendario {
  fecha: Date;
  /** true si pertenece al mes mostrado (no a los padding de inicio/fin). */
  enMes: boolean;
  /** true si es hoy. */
  esHoy: boolean;
}

/**
 * Construye la rejilla de un mes (6 semanas × 7 días = 42 celdas) empezando
 * en lunes. Incluye días de padding del mes anterior y siguiente para llenar
 * la rejilla completa. Es el layout estándar de un calendario mensual.
 */
export function rejillaMes(anio: number, mes: number): DiaCalendario[] {
  // mes: 0-11.
  const hoy = aMedianoche(new Date());
  const primero = new Date(anio, mes, 1);
  const offset = indiceDiaISO(primero); // cuántos días del mes anterior padding.
  const inicio = new Date(anio, mes, 1 - offset);

  const dias: DiaCalendario[] = [];
  for (let i = 0; i < 42; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    dias.push({
      fecha,
      enMes: fecha.getMonth() === mes,
      esHoy: esMismoDia(fecha, hoy),
    });
  }
  return dias;
}

/**
 * Construye la rejilla de una semana (7 días) empezando en lunes, que contiene
 * la fecha `referencia`.
 */
export function rejillaSemana(referencia: Date): DiaCalendario[] {
  const hoy = aMedianoche(new Date());
  const base = aMedianoche(referencia);
  const offset = indiceDiaISO(base);
  const lunes = new Date(base);
  lunes.setDate(base.getDate() - offset);

  const dias: DiaCalendario[] = [];
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    dias.push({ fecha, enMes: true, esHoy: esMismoDia(fecha, hoy) });
  }
  return dias;
}

/** Nombres largos de los meses en español. */
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Cabeceras cortas de los días (lunes a domingo). */
export const DIAS_ES_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Formatea un rango de fechas para la cabecera de la vista semanal.
 * Ej.: "9 – 15 Jun 2026" o "29 May – 4 Jun 2026".
 */
export function formatRangoSemana(dias: DiaCalendario[]): string {
  if (dias.length === 0) return '';
  const p = dias[0].fecha;
  const u = dias[dias.length - 1].fecha;
  const mp = MESES_ES[p.getMonth()].slice(0, 3);
  const mu = MESES_ES[u.getMonth()].slice(0, 3);
  if (p.getMonth() === u.getMonth()) {
    return `${p.getDate()} – ${u.getDate()} ${mp} ${u.getFullYear()}`;
  }
  return `${p.getDate()} ${mp} – ${u.getDate()} ${mu} ${u.getFullYear()}`;
}
