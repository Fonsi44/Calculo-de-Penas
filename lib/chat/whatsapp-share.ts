/**
 * Borradores de WhatsApp para compartir consultas y respuestas del asistente.
 * Incluye respuestas NotebookLM (orientación preliminar, no dictamen).
 */

import { sugerirAreaLegal } from './preconsulta';
import type { ChatSuggestion } from './response-meta';

/** Límite práctico para wa.me (URL ~2 KB). */
const WHATSAPP_BODY_MAX = 1800;

export function stripMarkdownLight(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncateTail(text: string, max: number): string {
  if (text.length <= max) return text;
  if (max <= 1) return '…';
  return `${text.slice(0, max - 1)}…`;
}

function areaHumana(area: ReturnType<typeof sugerirAreaLegal>): string | null {
  if (!area || area === 'general') return null;
  const labels: Record<string, string> = {
    penal: 'derecho penal',
    familia: 'derecho de familia',
    laboral: 'derecho laboral',
    civil: 'derecho civil',
    mercantil: 'derecho mercantil',
    migratorio: 'derecho migratorio',
    administrativo: 'derecho administrativo',
    tributario: 'derecho tributario',
    bancario: 'derecho bancario',
    propiedad_intelectual: 'propiedad intelectual',
    ambiental: 'derecho ambiental',
    conciliacion_arbitraje: 'conciliación y arbitraje',
  };
  return labels[area] ?? area;
}

/** Borrador para enviar al despacho una respuesta del corpus legal (NLM). */
export function buildNlmWhatsappDraft(params: { question: string; answer: string }): string {
  const question = params.question.trim();
  const area = areaHumana(sugerirAreaLegal(question));
  const answerPlain = stripMarkdownLight(params.answer);

  const intro = 'Hola, consulté el asistente jurídico de Pineda y Asociados en la web.\n\n';
  const queryBlock = area
    ? `Mi consulta (${area}): ${question}\n\n`
    : `Mi consulta: ${question}\n\n`;
  const answerHeader =
    'Orientación preliminar del asistente (no sustituye consulta con abogado):\n';
  const closing = '\n\nSolicito evaluación inicial confidencial de mi caso. Gracias.';

  const fixedLen = intro.length + queryBlock.length + answerHeader.length + closing.length;
  const maxAnswer = Math.max(120, WHATSAPP_BODY_MAX - fixedLen);
  const answerPart = truncateTail(answerPlain, maxAnswer);

  return truncateTail(intro + queryBlock + answerHeader + answerPart + closing, WHATSAPP_BODY_MAX);
}

/** Borrador cuando la consulta legal no llegó al navegador (timeout/red). */
export function buildPendingLegalWhatsappDraft(question: string): string {
  const q = question.trim();
  const area = areaHumana(sugerirAreaLegal(q));
  const areaPart = area ? ` sobre ${area}` : '';

  return truncateTail(
    `Hola, necesito orientación${areaPart}.\n\n` +
      `Consulta: ${q}\n\n` +
      'La consulté en el asistente de la web pero no pude obtener la respuesta completa. ' +
      'Solicito evaluación inicial confidencial. Gracias.',
    WHATSAPP_BODY_MAX,
  );
}

export function buildNlmChatSuggestions(): ChatSuggestion[] {
  return [
    { id: 'nlm-wa', label: 'Enviar por WhatsApp', message: '', action: 'whatsapp' },
    { id: 'nlm-prep', label: 'Preparar consulta', message: 'Preparar consulta' },
  ];
}

export function buildLegalErrorChatSuggestions(): ChatSuggestion[] {
  return [
    { id: 'retry-legal', label: 'Reintentar consulta', message: '', action: 'retry_legal' },
    { id: 'wa-legal', label: 'Enviar por WhatsApp', message: '', action: 'whatsapp' },
  ];
}
