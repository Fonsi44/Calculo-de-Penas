import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractAnswerFromJson } from '../lib/notebooklm/query-core';
import {
  isNotebookLmChatConfigured,
  queryNotebookLmForChat,
  NotebookLmChatError,
} from '../lib/notebooklm/chat-client';
import { appendLegalDisclaimer } from '../lib/chat/notebooklm-prompt';

describe('notebooklm query-core — extractAnswerFromJson', () => {
  it('extrae answer y conversationId de distintos formatos', () => {
    expect(extractAnswerFromJson({ answer: 'Hola', conversation_id: 'c1' })).toEqual({
      answer: 'Hola',
      conversationId: 'c1',
    });
    expect(extractAnswerFromJson({ response: 'Resp', conversationId: 'c2' })).toEqual({
      answer: 'Resp',
      conversationId: 'c2',
    });
  });
});

describe('notebooklm-prompt — appendLegalDisclaimer', () => {
  it('añade descargo si no está presente', () => {
    const out = appendLegalDisclaimer('Texto informativo.');
    expect(out).toContain('Texto informativo.');
    expect(out.toLowerCase()).toContain('no sustituye');
  });

  it('no duplica descargo', () => {
    const withDisclaimer = appendLegalDisclaimer('Ya incluye no sustituye la asesoría.');
    expect(withDisclaimer).toBe('Ya incluye no sustituye la asesoría.');
  });
});

describe('notebooklm chat-client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.CHAT_NOTEBOOKLM_ENABLED = 'true';
    process.env.NOTEBOOKLM_PROXY_URL = 'http://localhost:8787/query';
    process.env.NOTEBOOKLM_PROXY_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('isNotebookLmChatConfigured true cuando todo está configurado', () => {
    expect(isNotebookLmChatConfigured()).toBe(true);
  });

  it('isNotebookLmChatConfigured false sin proxy', () => {
    delete process.env.NOTEBOOKLM_PROXY_URL;
    expect(isNotebookLmChatConfigured()).toBe(false);
  });

  it('queryNotebookLmForChat parsea respuesta exitosa', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: 'Respuesta legal', conversationId: 'conv-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await queryNotebookLmForChat({
      question: '¿Qué es el hurto?',
      sessionId: 'sid-12345678',
    });

    expect(result.answer).toBe('Respuesta legal');
    expect(result.conversationId).toBe('conv-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8787/query',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('queryNotebookLmForChat lanza error HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );

    await expect(
      queryNotebookLmForChat({
        question: 'test',
        sessionId: 'sid-12345678',
      }),
    ).rejects.toMatchObject({ code: 'http_error' });
  });
});
