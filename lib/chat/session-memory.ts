/**
 * Memoria conversacional ligera a partir del historial (sin DB).
 */

import { sugerirAreaLegal, type AreaLegal } from './preconsulta';
import type { ChatHistoryTurn } from './response-meta';
import type { Intencion } from './intents';
import { detectIntencion } from './intents';

export type ChatSessionMemory = {
  /** Área inferida de turnos anteriores. */
  area: AreaLegal | null;
  /** Última intención del usuario en el hilo. */
  lastUserIntencion: Intencion | null;
  /** Si el asistente ofreció preparar consulta recientemente. */
  offeredConsultationPrep: boolean;
  /** Si el asistente ofreció WhatsApp recientemente. */
  offeredWhatsapp: boolean;
};

const CONSULTATION_OFFER = /preparar\s+(un\s+)?resumen|preparar\s+consulta|mensaje\s+para\s+whatsapp/i;
const WHATSAPP_OFFER = /whatsapp|mensaje\s+que\s+puede\s+copiar/i;
const AFFIRMATIVE = /^(s[ií]|si|ok|vale|de\s+acuerdo|por\s+favor|claro|adelante)(?:\s|[.!?,]|$)/i;

export function buildChatSessionMemory(history: ChatHistoryTurn[]): ChatSessionMemory {
  let area: AreaLegal | null = null;
  let lastUserIntencion: Intencion | null = null;
  let offeredConsultationPrep = false;
  let offeredWhatsapp = false;

  for (const turn of history) {
    if (turn.role === 'user') {
      lastUserIntencion = detectIntencion(turn.content);
      const detected = sugerirAreaLegal(turn.content);
      if (detected) area = detected;
    } else if (turn.role === 'assistant') {
      if (CONSULTATION_OFFER.test(turn.content)) offeredConsultationPrep = true;
      if (WHATSAPP_OFFER.test(turn.content)) offeredWhatsapp = true;
    }
  }

  return { area, lastUserIntencion, offeredConsultationPrep, offeredWhatsapp };
}

/** Resuelve intención con señales del hilo (afirmaciones tras una oferta). */
export function resolveIntencionWithMemory(
  message: string,
  memory: ChatSessionMemory,
): Intencion {
  const direct = detectIntencion(message);
  if (direct !== 'no_entendido') return direct;

  if (AFFIRMATIVE.test(message.trim())) {
    if (memory.offeredWhatsapp) return 'whatsapp';
    if (memory.offeredConsultationPrep) return 'preparar_consulta';
  }

  return direct;
}

/** Área combinando mensaje actual e historial. */
export function resolveAreaWithMemory(
  message: string,
  memory: ChatSessionMemory,
): AreaLegal | null {
  return sugerirAreaLegal(message) ?? memory.area;
}
