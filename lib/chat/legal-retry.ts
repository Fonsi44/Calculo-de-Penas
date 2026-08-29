/**
 * Resuelve la consulta legal a reenviar al pulsar «Reintentar consulta».
 */

import type { ChatSessionMessage } from './browser-session';
import { hasLawyerNotebookShortcut } from './lawyer-shortcut';

export function resolveLegalRetryQuery(
  messages: ChatSessionMessage[],
  assistantIndex: number,
): string | null {
  const assistant = messages[assistantIndex];
  if (!assistant || assistant.role !== 'assistant') return null;

  if (assistant.legalRetryQuery?.trim()) {
    return assistant.legalRetryQuery.trim();
  }

  for (let j = assistantIndex - 1; j >= 0; j--) {
    const prior = messages[j];
    if (prior.role === 'user' && hasLawyerNotebookShortcut(prior.content)) {
      return prior.content.trim();
    }
  }

  const legacy = assistant.suggestions?.find(
    (s) => s.id === 'retry-legal' && s.message.trim().length > 0,
  );
  return legacy?.message.trim() ?? null;
}
