/**
 * Avisos cuando una respuesta del chat tarda (p. ej. consultas al corpus legal).
 * Sin PII: solo un extracto corto de la pregunta.
 */

export const CHAT_SLOW_RESPONSE_MS = 12_000;

export type ChatResponseReadyContext = {
  startedAt: number;
  question: string;
  chatOpen: boolean;
  onOpenChat?: () => void;
};

export function getChatResponseWaitMs(startedAt: number, now = Date.now()): number {
  return Math.max(0, now - startedAt);
}

export function isSlowChatResponse(startedAt: number, now = Date.now()): boolean {
  return getChatResponseWaitMs(startedAt, now) >= CHAT_SLOW_RESPONSE_MS;
}

export function shouldNotifyChatResponseReady(ctx: ChatResponseReadyContext, now = Date.now()): boolean {
  if (!isSlowChatResponse(ctx.startedAt, now)) return false;
  if (!ctx.chatOpen) return true;
  if (typeof document === 'undefined') return false;
  return document.hidden;
}

export function buildChatQuestionPreview(question: string, max = 72): string {
  const oneLine = question.replace(/\s+/g, ' ').trim();
  if (!oneLine) return 'Su consulta';
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export type BrowserNotificationSupport = 'granted' | 'denied' | 'default' | 'unsupported';

export function getBrowserNotificationSupport(): BrowserNotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Pide permiso en el gesto del usuario (enviar mensaje). Solo para consultas lentas. */
export async function requestChatBrowserNotificationPermission(): Promise<BrowserNotificationSupport> {
  const support = getBrowserNotificationSupport();
  if (support !== 'default') return support;
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return getBrowserNotificationSupport();
  }
}

export function showChatBrowserNotification(
  questionPreview: string,
  onOpenChat?: () => void,
): boolean {
  if (getBrowserNotificationSupport() !== 'granted') return false;
  try {
    const notification = new Notification('Respuesta del asistente lista', {
      body: questionPreview,
      tag: 'pya-chat-response-ready',
    });
    notification.onclick = () => {
      window.focus();
      onOpenChat?.();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

const TITLE_RESTORE_DELAY_MS = 6_000;

export function flashDocumentTitleWhileHidden(notice = '¡Respuesta lista!'): () => void {
  if (typeof document === 'undefined' || !document.hidden) return () => {};
  const original = document.title;
  document.title = `${notice} · ${original}`;
  const restore = () => {
    if (document.title.startsWith(notice)) {
      document.title = original;
    }
  };
  const onVisible = () => {
    restore();
    document.removeEventListener('visibilitychange', onVisible);
  };
  document.addEventListener('visibilitychange', onVisible);
  const timer = window.setTimeout(restore, TITLE_RESTORE_DELAY_MS);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
    restore();
  };
}

export function notifyChatResponseReady(ctx: ChatResponseReadyContext): {
  usedBrowserNotification: boolean;
  shouldShowInAppToast: boolean;
  shouldMarkUnread: boolean;
} {
  if (!shouldNotifyChatResponseReady(ctx)) {
    return {
      usedBrowserNotification: false,
      shouldShowInAppToast: false,
      shouldMarkUnread: false,
    };
  }

  const preview = buildChatQuestionPreview(ctx.question);
  const usedBrowserNotification =
    typeof document !== 'undefined' && document.hidden
      ? showChatBrowserNotification(preview, ctx.onOpenChat)
      : false;

  if (typeof document !== 'undefined' && document.hidden) {
    flashDocumentTitleWhileHidden();
  }

  const shouldShowInAppToast = !ctx.chatOpen;
  const shouldMarkUnread = !ctx.chatOpen;

  return { usedBrowserNotification, shouldShowInAppToast, shouldMarkUnread };
}
