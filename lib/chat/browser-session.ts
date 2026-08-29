/**
 * Persistencia del chat en sessionStorage (misma pestaña/sesión del navegador).
 * No sustituye sessionId ni conversationId de NotebookLM (localStorage).
 */

export type ChatSessionMessage = {
  role: 'assistant' | 'user';
  content: string;
  source?: string;
};

export type ChatSessionSnapshot = {
  v: 1;
  messages: ChatSessionMessage[];
  showQuickReplies: boolean;
  urgent: boolean;
};

export const CHAT_SESSION_STORAGE_KEY = 'pya_chat_session';
const MAX_STORED_MESSAGES = 80;
const MAX_CONTENT_LENGTH = 12_000;

function isRole(value: unknown): value is ChatSessionMessage['role'] {
  return value === 'assistant' || value === 'user';
}

function sanitizeMessage(raw: unknown): ChatSessionMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!isRole(obj.role) || typeof obj.content !== 'string') return null;
  const content = obj.content.trim();
  if (!content || content.length > MAX_CONTENT_LENGTH) return null;
  const source = typeof obj.source === 'string' ? obj.source.slice(0, 64) : undefined;
  return { role: obj.role, content, source };
}

/** Valida y normaliza un snapshot leído de sessionStorage. */
export function parseChatSessionSnapshot(raw: unknown): ChatSessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.v !== 1 || !Array.isArray(obj.messages)) return null;

  const messages = obj.messages
    .map(sanitizeMessage)
    .filter((m): m is ChatSessionMessage => m !== null)
    .slice(-MAX_STORED_MESSAGES);

  if (messages.length === 0) return null;

  return {
    v: 1,
    messages,
    showQuickReplies: obj.showQuickReplies === true,
    urgent: obj.urgent === true,
  };
}

export function createChatSessionSnapshot(
  messages: ChatSessionMessage[],
  showQuickReplies: boolean,
  urgent: boolean,
): ChatSessionSnapshot {
  return {
    v: 1,
    messages: messages.slice(-MAX_STORED_MESSAGES),
    showQuickReplies,
    urgent,
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
