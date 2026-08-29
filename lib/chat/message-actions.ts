/**
 * Reglas de qué acciones mostrar bajo cada mensaje del asistente.
 */

import { chatConfig } from './config';
import type { ChatSessionMessage } from './browser-session';
import { hasLawyerNotebookShortcut } from './lawyer-shortcut';
import type { ChatSuggestion } from './response-meta';

export function hasWhatsappActionChip(suggestions?: ChatSuggestion[]): boolean {
  return Boolean(suggestions?.some((s) => s.action === 'whatsapp'));
}

export function isLegalRetryableMessage(message: ChatSessionMessage): boolean {
  if (message.role !== 'assistant') return false;
  if (message.legalRetryQuery?.trim()) return true;
  if (message.suggestions?.some((s) => s.action === 'retry_legal')) return true;
  return (
    message.source === 'fallback_provider_error' &&
    message.content.includes(chatConfig.notebooklm.clientNetworkErrorReply.slice(0, 24))
  );
}

export function shouldShowWhatsappDraftButton(message: ChatSessionMessage): boolean {
  if (!message.whatsappDraft?.trim()) return false;
  if (isLegalRetryableMessage(message)) return false;
  return !hasWhatsappActionChip(message.suggestions);
}

export function shouldShowCopyResponseButton(message: ChatSessionMessage): boolean {
  return message.source === 'notebooklm';
}

/** Hilo limpio para reintentar: saludo + última consulta «una pregunta:». */
export function baseMessagesForLegalRetry(
  messages: ChatSessionMessage[],
  errorAssistantIndex: number,
): ChatSessionMessage[] {
  const trimmed = messages.slice(0, errorAssistantIndex);
  let lastUserIdx = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const msg = trimmed[i];
    if (msg.role === 'user' && hasLawyerNotebookShortcut(msg.content)) {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return trimmed;

  const firstUserIdx = trimmed.findIndex(
    (m) => m.role === 'user' && hasLawyerNotebookShortcut(m.content),
  );
  if (firstUserIdx < 0) return trimmed.slice(0, lastUserIdx + 1);

  return [...trimmed.slice(0, firstUserIdx), trimmed[lastUserIdx]];
}
