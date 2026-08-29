import { describe, expect, it } from 'vitest';
import { resolveLegalRetryQuery } from '../lib/chat/legal-retry';
import type { ChatSessionMessage } from '../lib/chat/browser-session';

describe('legal-retry', () => {
  const messages: ChatSessionMessage[] = [
    { role: 'assistant', content: 'Hola' },
    { role: 'user', content: 'una pregunta: ¿Cómo me divorcio en Honduras?' },
    {
      role: 'assistant',
      content: 'Error de red',
      legalRetryQuery: 'una pregunta: ¿Cómo me divorcio en Honduras?',
      suggestions: [{ id: 'retry-legal', label: 'Reintentar', message: '', action: 'retry_legal' }],
    },
  ];

  it('lee legalRetryQuery del mensaje de error', () => {
    expect(resolveLegalRetryQuery(messages, 2)).toBe('una pregunta: ¿Cómo me divorcio en Honduras?');
  });

  it('resuelve desde el mensaje de usuario anterior si falta legalRetryQuery', () => {
    const legacy: ChatSessionMessage[] = [
      messages[0],
      messages[1],
      {
        role: 'assistant',
        content: 'Error',
        suggestions: [
          {
            id: 'retry-legal',
            label: 'Reintentar',
            message: 'una pregunta: divorcio',
            action: 'retry_legal',
          },
        ],
      },
    ];
    expect(resolveLegalRetryQuery(legacy, 2)).toBe('una pregunta: ¿Cómo me divorcio en Honduras?');
  });
});
