import { describe, expect, it } from 'vitest';
import {
  buildChatQuestionPreview,
  CHAT_SLOW_RESPONSE_MS,
  getChatResponseWaitMs,
  isSlowChatResponse,
  shouldNotifyChatResponseReady,
} from '../lib/chat/notify-response-ready';

describe('notify-response-ready', () => {
  it('detecta respuestas lentas a partir del umbral', () => {
    const started = 1_000;
    expect(isSlowChatResponse(started, started + CHAT_SLOW_RESPONSE_MS - 1)).toBe(false);
    expect(isSlowChatResponse(started, started + CHAT_SLOW_RESPONSE_MS)).toBe(true);
    expect(getChatResponseWaitMs(started, started + 5_000)).toBe(5_000);
  });

  it('no avisa si la respuesta fue rápida', () => {
    const started = Date.now() - 3_000;
    expect(
      shouldNotifyChatResponseReady({
        startedAt: started,
        question: 'una pregunta: poderes',
        chatOpen: false,
      }),
    ).toBe(false);
  });

  it('avisa si tardó y el chat está cerrado', () => {
    const started = Date.now() - CHAT_SLOW_RESPONSE_MS - 1;
    expect(
      shouldNotifyChatResponseReady({
        startedAt: started,
        question: 'una pregunta: poderes',
        chatOpen: false,
      }),
    ).toBe(true);
  });

  it('no avisa si tardó pero el chat sigue abierto y visible', () => {
    const started = Date.now() - CHAT_SLOW_RESPONSE_MS - 1;
    expect(
      shouldNotifyChatResponseReady({
        startedAt: started,
        question: 'una pregunta: poderes',
        chatOpen: true,
      }),
    ).toBe(false);
  });

  it('recorta el extracto de la pregunta sin PII extra', () => {
    const long = 'una pregunta: ' + 'x'.repeat(120);
    const preview = buildChatQuestionPreview(long, 40);
    expect(preview.length).toBeLessThanOrEqual(40);
    expect(preview.endsWith('…')).toBe(true);
  });
});
