/**
 * CalendarICS — P2-10 (Fase 4B-4).
 *
 * Generación de feeds ICS RFC 5545 para suscripción y exportación.
 * Funciones puras: no dependen de DB ni de efectos externos.
 */
import { createHash, randomBytes } from 'crypto';

function escaparIcs(texto: string): string {
  return texto
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function formatearFecha(fecha: Date, todoElDia: boolean, _zonaHoraria: string): string {
  if (todoElDia) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
  // Timed event with TZID
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

function formatearUtc(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getUTCHours()).padStart(2, '0');
  const mm = String(fecha.getUTCMinutes()).padStart(2, '0');
  const ss = String(fecha.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function mapearEstado(estado: string): string {
  const map: Record<string, string> = {
    propuesta: 'TENTATIVE',
    confirmada: 'CONFIRMED',
    cancelada: 'CANCELLED',
    completada: 'CONFIRMED',
    descartada: 'CANCELLED',
  };
  return map[estado] ?? 'TENTATIVE';
}

function plegarLinea(linea: string): string {
  // RFC 5545 line folding: max 75 octets per line (excluding CRLF).
  // Simplified folding: if line > 72 chars, fold at 72.
  if (linea.length <= 72) return linea;
  const partes: string[] = [];
  partes.push(linea.slice(0, 72));
  let resto = linea.slice(72);
  while (resto.length > 0) {
    partes.push(' ' + resto.slice(0, 71));
    resto = resto.slice(71);
  }
  return partes.join('\r\n');
}

export interface IcsEventInput {
  uid: string;
  titulo: string;
  descripcion?: string;
  inicio: Date;
  fin?: Date;
  todoElDia: boolean;
  zonaHoraria: string;
  sequence: number;
  estado: string;
  lastModified: Date;
}

/**
 * Genera un bloque VEVENT RFC 5545 válido.
 *
 * - Para eventos de día completo: DTSTART;VALUE=DATE y DTEND;VALUE=DATE.
 * - Para eventos con hora: DTSTART;TZID=zona y DTEND;TZID=zona (o DURATION si no hay fin).
 * - Incluye DTSTAMP, UID, SEQUENCE, STATUS, LAST-MODIFIED, TRANSP, SUMMARY, DESCRIPTION.
 */
export function generateIcsEvent(evento: IcsEventInput): string {
  const ahora = new Date();
  const dtstamp = formatearUtc(ahora);
  const lastMod = formatearUtc(evento.lastModified);
  const summary = escaparIcs(evento.titulo);
  const status = mapearEstado(evento.estado);

  const lineas: string[] = [];
  lineas.push('BEGIN:VEVENT');
  lineas.push(`DTSTAMP:${dtstamp}`);
  lineas.push(`UID:${evento.uid}`);
  lineas.push(`SEQUENCE:${evento.sequence}`);
  lineas.push(`STATUS:${status}`);
  lineas.push(`LAST-MODIFIED:${lastMod}`);
  lineas.push(`TRANSP:OPAQUE`);
  lineas.push(`SUMMARY:${summary}`);

  if (evento.descripcion) {
    lineas.push(`DESCRIPTION:${escaparIcs(evento.descripcion)}`);
  }

  if (evento.todoElDia) {
    const inicioDate = formatearFecha(evento.inicio, true, evento.zonaHoraria);
    lineas.push(`DTSTART;VALUE=DATE:${inicioDate}`);
    if (evento.fin) {
      const finDate = formatearFecha(evento.fin, true, evento.zonaHoraria);
      lineas.push(`DTEND;VALUE=DATE:${finDate}`);
    } else {
      // Si no hay fin, DTEND = DTSTART + 1 día.
      const nextDay = new Date(evento.inicio);
      nextDay.setDate(nextDay.getDate() + 1);
      lineas.push(`DTEND;VALUE=DATE:${formatearFecha(nextDay, true, evento.zonaHoraria)}`);
    }
  } else {
    const inicioTz = formatearFecha(evento.inicio, false, evento.zonaHoraria);
    lineas.push(`DTSTART;TZID=${evento.zonaHoraria}:${inicioTz}`);
    if (evento.fin) {
      const finTz = formatearFecha(evento.fin, false, evento.zonaHoraria);
      lineas.push(`DTEND;TZID=${evento.zonaHoraria}:${finTz}`);
    }
  }

  lineas.push('END:VEVENT');
  return lineas.map(plegarLinea).join('\r\n');
}

/**
 * Genera un feed VCALENDAR completo con los eventos proporcionados.
 */
export function generateIcsFeed(
  eventos: IcsEventInput[],
  calendarName: string,
): string {
  const lineas: string[] = [];
  lineas.push('BEGIN:VCALENDAR');
  lineas.push('VERSION:2.0');
  lineas.push('PRODID:-//Pineda y Asociados//SGIE Calendar//ES-HN');
  lineas.push(`X-WR-CALNAME:${escaparIcs(calendarName)}`);
  lineas.push('CALSCALE:GREGORIAN');

  for (const evento of eventos) {
    lineas.push(generateIcsEvent(evento));
  }

  lineas.push('END:VCALENDAR');
  return lineas.join('\r\n') + '\r\n';
}

/**
 * Genera un token de feed ICS de 32 bytes criptográficamente aleatorio.
 */
export function generateFeedToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calcula el hash SHA-256 de un token (para almacenamiento seguro).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
