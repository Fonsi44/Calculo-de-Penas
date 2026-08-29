/**
 * Prompts para consultas jurídicas informativas vía NotebookLM en el chat público.
 */

import { LEGAL_DISCLAIMER_SHORT } from '@/lib/legal-disclaimer';

export const NLM_REPLY_MAX_CHARS = 8000;

export function buildChatLegalPrompt(userQuestion: string, urgent: boolean): string {
  const urgencyNote = urgent
    ? 'El usuario indica urgencia. Indique primero que contacte al despacho; luego puede resumir pasos clave si hay fuente.'
    : '';

  return [
    'Responde usando ÚNICAMENTE las fuentes del notebook (derecho hondureño).',
    'Entrega una guía práctica estructurada como en un manual del despacho:',
    '- Párrafo inicial con marco legal (artículos/leyes citados en las fuentes).',
    '- Secciones ### con vías o etapas (ej. Vía A consular, Vía B en Honduras).',
    '- Pasos numerados y viñetas de requisitos/documentos.',
    '- Cierre sobre qué institución consuma el trámite (RNP, CNE, consulado, etc.).',
    'No inventes normas. No URLs. No ofrezcas archivos descargables ni plantillas. No hagas preguntas al usuario (no «¿le gustaría que redactemos…?»). Termina con el cierre del trámite, sin CTA comercial.',
    urgencyNote,
    '',
    userQuestion.trim().slice(0, 800),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Anexa el descargo legal canónico si aún no está presente. */
export function appendLegalDisclaimer(answer: string): string {
  const trimmed = answer.trim();
  if (!trimmed) return LEGAL_DISCLAIMER_SHORT;
  if (trimmed.toLowerCase().includes('no sustituye')) return trimmed;
  return `${trimmed}\n\n${LEGAL_DISCLAIMER_SHORT}`;
}

/** Detecta respuestas que indican corpus insuficiente. */
export function isInsufficientAnswer(answer: string): boolean {
  const lower = answer.toLowerCase();
  return (
    lower.includes('insuficiente')
    || lower.includes('no encuentro')
    || lower.includes('no hay información')
    || lower.includes('no puedo verificar')
    || lower.includes('no consta en las fuentes')
  );
}

/** Limpia artefactos de NotebookLM sin truncar guías largas. */
export function cleanNlmAnswer(answer: string): string {
  let text = answer
    .replace(/\[(\d+)\]/g, '')
    .replace(/📊[^\n]*/g, '')
    .replace(/👉[^\n]*/g, '');

  // Ofertas de redacción / plantillas al final (NotebookLM suele añadirlas).
  text = text.replace(
    /\n\s*¿\s*te\s+gustar[ií]a\b[\s\S]*$/i,
    '',
  );
  text = text.replace(
    /\n\s*¿\s*(le\s+)?gustar[ií]a\b[^?\n]*\b(plantilla|poder|redact|elaborar)[\s\S]*$/i,
    '',
  );
  text = text.replace(
    /\n\s*¿\s*(quieres|desea)\b[^?\n]*\b(plantilla|poder|redact|elaborar)[\s\S]*$/i,
    '',
  );

  // Disclaimer embebido: el widget ya lo muestra en el pie.
  text = text.replace(
    /\n\s*contenido informativo\.?\s*no sustituye[\s\S]*$/i,
    '',
  );
  text = text.replace(/\n\s*aviso legal:[\s\S]*$/i, '');

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/** Para respuestas NLM: el disclaimer vive solo en el pie del widget. */
export function finalizeNlmAnswerForChat(answer: string): string {
  return cleanNlmAnswer(answer);
}
