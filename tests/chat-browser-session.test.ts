import { describe, expect, it, beforeEach } from 'vitest';
import {
  CHAT_SESSION_STORAGE_KEY,
  clearChatSessionSnapshot,
  createChatSessionSnapshot,
  getChatSessionStoreSnapshot,
  loadChatSessionSnapshot,
  parseChatSessionSnapshot,
  patchChatSessionStore,
  resetChatSessionStoreForTests,
  saveChatSessionSnapshot,
} from '../lib/chat/browser-session';

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('chat browser session', () => {
  beforeEach(() => {
    resetChatSessionStoreForTests();
  });

  it('parsea snapshots válidos', () => {
    const parsed = parseChatSessionSnapshot({
      v: 1,
      messages: [
        { role: 'assistant', content: 'Hola' },
        { role: 'user', content: 'Consulta', source: 'site' },
      ],
      showQuickReplies: false,
      urgent: true,
    });
    expect(parsed?.messages).toHaveLength(2);
    expect(parsed?.showQuickReplies).toBe(false);
    expect(parsed?.urgent).toBe(true);
  });

  it('rechaza snapshots inválidos o vacíos', () => {
    expect(parseChatSessionSnapshot(null)).toBeNull();
    expect(parseChatSessionSnapshot({ v: 2, messages: [] })).toBeNull();
    expect(
      parseChatSessionSnapshot({
        v: 1,
        messages: [{ role: 'bot', content: 'x' }],
      }),
    ).toBeNull();
  });

  it('guarda y recupera en sessionStorage simulado', () => {
    const storage = mockStorage();
    const snapshot = createChatSessionSnapshot(
      [{ role: 'user', content: '¿Horario?' }],
      false,
      false,
    );
    saveChatSessionSnapshot(snapshot, storage);
    expect(storage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeTruthy();
    expect(loadChatSessionSnapshot(storage)?.messages[0]?.content).toBe('¿Horario?');
    clearChatSessionSnapshot(storage);
    expect(loadChatSessionSnapshot(storage)).toBeNull();
  });

  it('sincroniza el store en memoria con sessionStorage', () => {
    const storage = mockStorage();
    resetChatSessionStoreForTests();
    getChatSessionStoreSnapshot('Hola', storage);
    patchChatSessionStore(
      {
        messages: [
          { role: 'assistant', content: 'Hola' },
          { role: 'user', content: 'Consulta' },
        ],
        showQuickReplies: false,
      },
      storage,
    );
    expect(getChatSessionStoreSnapshot('Hola', storage).messages).toHaveLength(2);
    expect(loadChatSessionSnapshot(storage)?.showQuickReplies).toBe(false);
  });
});
