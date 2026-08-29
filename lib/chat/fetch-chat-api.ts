/**
 * Petición HTTP al endpoint /api/chat (cliente).
 */

import { chatConfig } from './config';
import type { ChatPageContext } from './page-context';
import type { ChatHistoryTurn, ChatLink, ChatSuggestion } from './response-meta';

export type ChatApiResponse = {
  reply: string;
  source?: string;
  urgent?: boolean;
  conversationId?: string;
  suggestions?: ChatSuggestion[];
  links?: ChatLink[];
  whatsappDraft?: string;
};

export class ChatApiError extends Error {
  constructor(
    readonly code: 'rate_limit' | 'http_error' | 'network',
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ChatApiError';
  }
}

export async function fetchChatApi(params: {
  content: string;
  sessionId: string;
  conversationId?: string;
  history: ChatHistoryTurn[];
  pageContext: ChatPageContext;
  signal: AbortSignal;
  timeoutMs: number;
}): Promise<ChatApiResponse> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (params.signal.aborted) {
    controller.abort();
  } else {
    params.signal.addEventListener('abort', onAbort, { once: true });
  }

  const fetchTimer = window.setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.content,
        sessionId: params.sessionId,
        history: params.history,
        conversationId: params.conversationId,
        pageContext: params.pageContext,
      }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      throw new ChatApiError('rate_limit');
    }
    if (!res.ok) {
      throw new ChatApiError('http_error', `HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      reply?: string;
      source?: string;
      urgent?: boolean;
      conversationId?: string;
      suggestions?: ChatSuggestion[];
      links?: ChatLink[];
      whatsappDraft?: string;
    };

    return {
      reply: data.reply?.trim() || chatConfig.fallbackReply,
      source: data.source,
      urgent: data.urgent,
      conversationId: data.conversationId,
      suggestions: data.suggestions,
      links: data.links,
      whatsappDraft: data.whatsappDraft,
    };
  } catch (err) {
    if (err instanceof ChatApiError) throw err;
    throw new ChatApiError('network');
  } finally {
    window.clearTimeout(fetchTimer);
    params.signal.removeEventListener('abort', onAbort);
  }
}
