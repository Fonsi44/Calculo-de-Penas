/**
 * Persistencia del chat en sessionStorage (misma pestaña/sesión del navegador).
 * No sustituye sessionId ni conversationId de NotebookLM (localStorage).
 */

import type { ConsultationFlowState } from './consultation-flow';
import type { ChatLink, ChatSuggestion } from './response-meta';

export type ChatSessionMessage = {
  role: 'assistant' | 'user';
  content: string;
  source?: string;
  suggestions?: ChatSuggestion[];
  links?: ChatLink[];
  whatsappDraft?: string;
};

export type ChatSessionSnapshot = {
  v: 2;
  messages: ChatSessionMessage[];
  showQuickReplies: boolean;
  urgent: boolean;
  consultationFlow: ConsultationFlowState | null;
  pageGreetingApplied: boolean;
  feedbackGiven: boolean;
};

export const CHAT_SESSION_STORAGE_KEY = 'pya_chat_session';
const MAX_STORED_MESSAGES = 80;
const MAX_CONTENT_LENGTH = 12_000;

function isRole(value: unknown): value is ChatSessionMessage['role'] {
  return value === 'assistant' || value === 'user';
}

function sanitizeSuggestion(raw: unknown): ChatSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.label !== 'string' || typeof obj.message !== 'string') {
    return null;
  }
  return {
    id: obj.id.slice(0, 64),
    label: obj.label.slice(0, 80),
    message: obj.message.slice(0, 600),
  };
}

function sanitizeLink(raw: unknown): ChatLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.label !== 'string' || typeof obj.href !== 'string') return null;
  if (!obj.href.startsWith('/')) return null;
  return { label: obj.label.slice(0, 80), href: obj.href.slice(0, 200) };
}

function sanitizeMessage(raw: unknown): ChatSessionMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!isRole(obj.role) || typeof obj.content !== 'string') return null;
  const content = obj.content.trim();
  if (!content || content.length > MAX_CONTENT_LENGTH) return null;
  const source = typeof obj.source === 'string' ? obj.source.slice(0, 64) : undefined;
  const whatsappDraft =
    typeof obj.whatsappDraft === 'string' ? obj.whatsappDraft.slice(0, 2000) : undefined;
  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions.map(sanitizeSuggestion).filter((s): s is ChatSuggestion => s !== null).slice(0, 6)
    : undefined;
  const links = Array.isArray(obj.links)
    ? obj.links.map(sanitizeLink).filter((l): l is ChatLink => l !== null).slice(0, 4)
    : undefined;
  return { role: obj.role, content, source, suggestions, links, whatsappDraft };
}

function sanitizeFlow(raw: unknown): ConsultationFlowState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const step = obj.step;
  if (step !== 1 && step !== 2 && step !== 3) return null;
  return {
    step,
    area: typeof obj.area === 'string' ? obj.area.slice(0, 120) : undefined,
    location: typeof obj.location === 'string' ? obj.location.slice(0, 120) : undefined,
  };
}

function migrateV1(raw: Record<string, unknown>): ChatSessionSnapshot | null {
  if (raw.v !== 1 || !Array.isArray(raw.messages)) return null;
  const messages = raw.messages
    .map(sanitizeMessage)
    .filter((m): m is ChatSessionMessage => m !== null)
    .slice(-MAX_STORED_MESSAGES);
  if (messages.length === 0) return null;
  return {
    v: 2,
    messages,
    showQuickReplies: raw.showQuickReplies === true,
    urgent: raw.urgent === true,
    consultationFlow: null,
    pageGreetingApplied: false,
    feedbackGiven: false,
  };
}

/** Valida y normaliza un snapshot leído de sessionStorage. */
export function parseChatSessionSnapshot(raw: unknown): ChatSessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.v === 1) return migrateV1(obj);
  if (obj.v !== 2 || !Array.isArray(obj.messages)) return null;

  const messages = obj.messages
    .map(sanitizeMessage)
    .filter((m): m is ChatSessionMessage => m !== null)
    .slice(-MAX_STORED_MESSAGES);

  if (messages.length === 0) return null;

  return {
    v: 2,
    messages,
    showQuickReplies: obj.showQuickReplies === true,
    urgent: obj.urgent === true,
    consultationFlow: sanitizeFlow(obj.consultationFlow),
    pageGreetingApplied: obj.pageGreetingApplied === true,
    feedbackGiven: obj.feedbackGiven === true,
  };
}

export function createChatSessionSnapshot(
  messages: ChatSessionMessage[],
  showQuickReplies: boolean,
  urgent: boolean,
  consultationFlow: ConsultationFlowState | null = null,
  pageGreetingApplied = false,
  feedbackGiven = false,
): ChatSessionSnapshot {
  return {
    v: 2,
    messages: messages.slice(-MAX_STORED_MESSAGES),
    showQuickReplies,
    urgent,
    consultationFlow,
    pageGreetingApplied,
    feedbackGiven,
  };
}

export function loadChatSessionSnapshot(storage?: Storage | null): ChatSessionSnapshot | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return parseChatSessionSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveChatSessionSnapshot(
  snapshot: ChatSessionSnapshot,
  storage?: Storage | null,
): void {
  if (!storage) return;
  try {
    storage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // QuotaExceeded o modo privado: ignorar sin romper el chat.
  }
}

export function clearChatSessionSnapshot(storage?: Storage | null): void {
  if (!storage) return;
  try {
    storage.removeItem(CHAT_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function defaultChatSessionSnapshot(
  initialMessage: string,
): ChatSessionSnapshot {
  return createChatSessionSnapshot(
    [{ role: 'assistant', content: initialMessage }],
    true,
    false,
    null,
    false,
    false,
  );
}

type ChatSessionListener = () => void;

let chatSessionMemory: ChatSessionSnapshot | null = null;
const chatSessionListeners = new Set<ChatSessionListener>();

function notifyChatSessionListeners(): void {
  for (const listener of chatSessionListeners) {
    listener();
  }
}

export function resetChatSessionStoreForTests(): void {
  chatSessionMemory = null;
}

/** Snapshot canónico para useSyncExternalStore (cliente lee sessionStorage una vez). */
export function getChatSessionStoreSnapshot(
  initialMessage: string,
  storage?: Storage | null,
): ChatSessionSnapshot {
  if (chatSessionMemory) return chatSessionMemory;
  const saved = loadChatSessionSnapshot(storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null));
  chatSessionMemory = saved ?? defaultChatSessionSnapshot(initialMessage);
  return chatSessionMemory;
}

export function patchChatSessionStore(
  patch: Partial<ChatSessionSnapshot>,
  storage?: Storage | null,
): ChatSessionSnapshot {
  const current = chatSessionMemory ?? defaultChatSessionSnapshot('');
  chatSessionMemory = createChatSessionSnapshot(
    patch.messages ?? current.messages,
    patch.showQuickReplies ?? current.showQuickReplies,
    patch.urgent ?? current.urgent,
    patch.consultationFlow !== undefined ? patch.consultationFlow : current.consultationFlow,
    patch.pageGreetingApplied ?? current.pageGreetingApplied,
    patch.feedbackGiven ?? current.feedbackGiven,
  );
  saveChatSessionSnapshot(chatSessionMemory, storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null));
  notifyChatSessionListeners();
  return chatSessionMemory;
}

export function subscribeChatSessionStore(listener: ChatSessionListener): () => void {
  chatSessionListeners.add(listener);
  return () => {
    chatSessionListeners.delete(listener);
  };
}
