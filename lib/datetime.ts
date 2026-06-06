/**
 * Helpers de fecha/hora con zona horaria de Honduras.
 *
 * Honduras usa CST (UTC-6) todo el año, sin horario de verano. Esta es la
 * zona oficial del bufete y la que debe mostrarse a las personas usuarias,
 * independientemente de la zona horaria del navegador o del servidor
 * (Vercel corre en UTC por defecto).
 *
 * Uso típico:
 *   import { HONDURAS_TZ, formatHondurasDateTime, getHondurasClock } from '@/lib/datetime';
 *   formatHondurasDateTime(new Date(), { dateStyle: 'long' });
 *   const { hour, dayOfWeek, minutesOfDay } = getHondurasClock(new Date());
 */

/** Zona horaria IANA de Honduras (CST, UTC-6, sin DST). */
export const HONDURAS_TZ = 'America/Tegucigalpa';

/** Locale es-HN (español de Honduras) usado por defecto en los formatters. */
export const ES_HN = 'es-HN';

type IntlDateTimeOptions = Intl.DateTimeFormatOptions;

/**
 * Devuelve un objeto de opciones de Intl con la zona horaria de Honduras
 * aplicada, fusionando con las opciones del llamador sin sobreescribirla.
 */
export function withHondurasTZ(options?: IntlDateTimeOptions): IntlDateTimeOptions {
  return { timeZone: HONDURAS_TZ, ...options };
}

/**
 * Formatea una fecha/hora en zona horaria de Honduras y locale es-HN.
 * Acepta cualquier opción de Intl.DateTimeFormat (dateStyle, timeStyle,
 * weekday, day, month, year, hour, minute, second, hour12, etc.).
 *
 * @example
 *   formatHondurasDateTime(d, { dateStyle: 'long', timeStyle: 'short' })
 *   // → "15 de junio de 2026, 14:30"
 */
export function formatHondurasDateTime(
  date: string | Date,
  options?: IntlDateTimeOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(ES_HN, withHondurasTZ(options));
}

/**
 * Formatea solo la parte de fecha (sin hora) en zona horaria de Honduras.
 */
export function formatHondurasDate(
  date: string | Date,
  options?: IntlDateTimeOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(ES_HN, withHondurasTZ(options));
}

/**
 * Formatea solo la parte de hora (sin fecha) en zona horaria de Honduras.
 */
export function formatHondurasTime(
  date: string | Date,
  options?: IntlDateTimeOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(ES_HN, withHondurasTZ(options));
}

export interface HondurasClock {
  /** Hora 0-23 en Honduras. */
  hour: number;
  /** Minuto 0-59 en Honduras. */
  minute: number;
  /** Día de la semana 0=Domingo ... 6=Sábado en Honduras. */
  dayOfWeek: number;
  /** Minutos transcurridos desde 00:00 en Honduras (0-1439). */
  minutesOfDay: number;
}

/**
 * Devuelve la hora local de Honduras para una fecha dada.
 * Útil para cálculos de horario de oficina (abierto/cerrado) que deben
 * ejecutarse en la hora del bufete, no en la hora del navegador.
 */
export function getHondurasClock(date: Date): HondurasClock {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: HONDURAS_TZ,
    hour12: false,
    hourCycle: 'h23',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? '';

  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const weekdayStr = get('weekday');
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? 0;
  return {
    hour,
    minute,
    dayOfWeek,
    minutesOfDay: hour * 60 + minute,
  };
}
