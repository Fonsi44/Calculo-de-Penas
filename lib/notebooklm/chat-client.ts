/**
 * Cliente HTTP para el proxy NotebookLM del chat público.
 */

import { chatConfig } from '@/lib/chat/config';
import { extractAnswerFromJson } from '@/lib/notebooklm/query-core';

export interface ChatNlmQueryOptions {
  question: string;
  conversationId?: string;
  sessionId: string;
}

export interface ChatNlmQueryResult {
  answer: string;
  conversationId?: string;
}

export class NotebookLmChatError extends Error {
  constructor(
    message: string,
    readonly code: 'not_configured' | 'timeout' | 'http_error' | 'parse_error',
  ) {
    super(message);
    this.name = 'NotebookLmChatError';
  }
}

function getProxyUrl(): string | null {
  const url = process.env.NOTEBOOKLM_PROXY_URL?.trim();
  return url || null;
}

function getProxyApiKey(): string | null {
  const key = process.env.NOTEBOOKLM_PROXY_API_KEY?.trim();
  return key || null;
}

function isNotebookLmEnabled(): boolean {
  const raw = process.env.CHAT_NOTEBOOKLM_ENABLED?.toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function getChatNlmTimeoutMs(): number {
  const raw = process.env.CHAT_NOTEBOOKLM_TIMEOUT_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : chatConfig.notebooklm.timeoutMs;
}

/** Indica si el proxy NotebookLM está configurado y habilitado. */
export function isNotebookLmChatConfigured(): boolean {
  return (
    isNotebookLmEnabled()
    && Boolean(getProxyUrl())
    && Boolean(getProxyApiKey())
  );
}

/**
 * Consulta el proxy NotebookLM para una pregunta jurídica informativa.
 */
export async function queryNotebookLmForChat(
  options: ChatNlmQueryOptions,
): Promise<ChatNlmQueryResult> {
  const proxyUrl = getProxyUrl();
  const apiKey = getProxyApiKey();

  if (!isNotebookLmEnabled() || !proxyUrl || !apiKey) {
    throw new NotebookLmChatError(
      'NotebookLM no configurado para el chat',
      'not_configured',
    );
  }

  const timeoutMs = getChatNlmTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        question: options.question,
        conversationId: options.conversationId,
        sessionId: options.sessionId,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new NotebookLmChatError(
        `Proxy NLM respondió ${res.status}`,
        'http_error',
      );
    }

    const raw: unknown = await res.json();
    const { answer, conversationId } = extractAnswerFromJson(raw);
    if (!answer.trim()) {
      throw new NotebookLmChatError('Respuesta vacía del proxy NLM', 'parse_error');
    }
    return { answer: answer.trim(), conversationId };
  } catch (err) {
    if (err instanceof NotebookLmChatError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new NotebookLmChatError('Timeout al consultar NotebookLM', 'timeout');
    }
    throw new NotebookLmChatError(
      err instanceof Error ? err.message : 'Error desconocido',
      'http_error',
    );
  } finally {
    clearTimeout(timer);
  }
}
