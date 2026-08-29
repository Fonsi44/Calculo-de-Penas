import { describe, expect, it } from 'vitest';
import { chatConfig } from '../lib/chat/config';
import {
  baseMessagesForLegalRetry,
  getCopyableAssistantText,
  getCopyResponseLabel,
  isLegalRetryableMessage,
  shouldShowCopyResponseButton,
  shouldShowWhatsappDraftButton,
} from '../lib/chat/message-actions';
import type { ChatSessionMessage } from '../lib/chat/browser-session';

describe('message-actions', () => {
  const userLegal: ChatSessionMessage = {
    role: 'user',
    content: 'una pregunta: divorcio en Choluteca',
  };
  const errorMsg: ChatSessionMessage = {
    role: 'assistant',
    content: chatConfig.notebooklm.clientNetworkErrorReply,
    source: 'fallback_provider_error',
    legalRetryQuery: userLegal.content,
    whatsappDraft: 'borrador',
  };
  const nlmMsg: ChatSessionMessage = {
    role: 'assistant',
    content: 'Respuesta legal extensa',
    source: 'notebooklm',
    whatsappDraft: 'borrador wa',
  };

  it('detecta mensaje reintentable', () => {
    expect(isLegalRetryableMessage(errorMsg)).toBe(true);
    expect(isLegalRetryableMessage(nlmMsg)).toBe(false);
  });

  it('oculta botones duplicados en error legal', () => {
    expect(shouldShowWhatsappDraftButton(errorMsg)).toBe(false);
    expect(shouldShowCopyResponseButton(errorMsg)).toBe(false);
  });

  it('muestra copiar y WhatsApp solo en respuesta NLM', () => {
    expect(shouldShowWhatsappDraftButton(nlmMsg)).toBe(true);
    expect(shouldShowCopyResponseButton(nlmMsg)).toBe(true);
    expect(getCopyableAssistantText(nlmMsg)).toBe(nlmMsg.content);
    expect(getCopyResponseLabel(nlmMsg)).toBe('Copiar respuesta');
  });

  it('limpia el hilo al reintentar', () => {
    const messages: ChatSessionMessage[] = [
      { role: 'assistant', content: 'Hola' },
      userLegal,
      errorMsg,
      userLegal,
      errorMsg,
    ];
    const base = baseMessagesForLegalRetry(messages, 4);
    expect(base).toHaveLength(2);
    expect(base[0].role).toBe('assistant');
    expect(base[1]).toEqual(userLegal);
  });
});
