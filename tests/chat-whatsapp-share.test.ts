import { describe, expect, it } from 'vitest';
import {
  buildLegalErrorChatSuggestions,
  buildNlmWhatsappDraft,
  buildPendingLegalWhatsappDraft,
  stripMarkdownLight,
} from '../lib/chat/whatsapp-share';

describe('whatsapp-share — borradores NLM', () => {
  it('incluye consulta y respuesta en el borrador', () => {
    const draft = buildNlmWhatsappDraft({
      question: '¿Cómo me divorcio en Honduras?',
      answer: 'El divorcio puede tramitarse por **mutuo acuerdo** o contencioso.',
    });
    expect(draft).toMatch(/divorcio/i);
    expect(draft).toMatch(/mutuo acuerdo/i);
    expect(draft).not.toContain('**');
    expect(draft).toMatch(/evaluación inicial confidencial/i);
  });

  it('genera borrador pendiente si falla la red', () => {
    const draft = buildPendingLegalWhatsappDraft('¿Cómo me divorcio en Honduras?');
    expect(draft).toMatch(/divorcio/i);
    expect(draft).toMatch(/no pude obtener la respuesta completa/i);
  });

  it('chip de reintento usa acción dedicada', () => {
    const chips = buildLegalErrorChatSuggestions();
    const retry = chips.find((c) => c.action === 'retry_legal');
    expect(retry?.message).toBe('');
    expect(retry?.label).toMatch(/Reintentar/i);
  });

  it('elimina markdown ligero', () => {
    expect(stripMarkdownLight('**Hola** y `código`')).toBe('Hola y código');
  });
});
