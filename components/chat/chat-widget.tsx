'use client';

/**
 * Widget del chat asistente público.
 *
 * Posición: fixed bottom-4 left-4 (NO toca el FloatingContactRail, que está
 * en bottom-right). El panel abre hacia arriba/derecha.
 *
 * Accesibilidad:
 *   - Botón con aria-label, foco visible, role="button".
 *   - Panel: role="dialog", foco al input al abrir.
 *   - Cierre con Escape, scroll interno estable, estados loading/error.
 *   - Navegación por teclado en quick replies y CTAs.
 *
 * Seguridad:
 *   - No expone la API key (solo llama a /api/chat relativa).
 *   - sessionId y conversationId NLM en localStorage; mensajes en sessionStorage.
 *   - Salvaguarda: no renderiza en rutas privadas aunque se monte por error.
 *
 * Render solo en web pública: se monta en app/(public)/layout.tsx.
 *
 * Nota sobre hooks: TODOS los hooks se ejecutan antes de cualquier return
 * condicional (reglas de React). La protección principal es el montaje en
 * el layout público; el check de ruta privada es defensa en profundidad.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Bot, Send, X, MessageCircle, Phone, ArrowRight, Zap } from 'lucide-react';
import { telHref, whatsappHref } from '@/lib/site';
import { chatConfig } from '@/lib/chat/config';
import {
  advanceConsultationFlow,
  isActiveConsultationFlow,
  isConsultationFlowStart,
  startConsultationFlow,
} from '@/lib/chat/consultation-flow';
import { hasLawyerNotebookShortcut, stripLawyerNotebookShortcut } from '@/lib/chat/lawyer-shortcut';
import {
  buildLegalErrorChatSuggestions,
  buildPendingLegalWhatsappDraft,
} from '@/lib/chat/whatsapp-share';
import { fetchChatApi, ChatApiError } from '@/lib/chat/fetch-chat-api';
import { resolveLegalRetryQuery } from '@/lib/chat/legal-retry';
import {
  buildInitialQuickReplies,
  getChatPageHint,
  resolveChatPageContext,
} from '@/lib/chat/page-context';
import {
  notifyChatResponseReady,
  requestChatBrowserNotificationPermission,
} from '@/lib/chat/notify-response-ready';
import { sugerirAreaLegal } from '@/lib/chat/preconsulta';
import {
  defaultChatSessionSnapshot,
  getChatSessionStoreSnapshot,
  patchChatSessionStore,
  subscribeChatSessionStore,
  type ChatSessionMessage,
} from '@/lib/chat/browser-session';
import {
  trackChatOpened,
  trackChatClosed,
  trackChatMessageSent,
  trackChatFallbackUsed,
  trackChatWhatsAppClicked,
  trackChatContactClicked,
  trackChatServiceSuggested,
  trackChatFeedback,
} from './chat-analytics';

import { useConsentObserver } from '@/hooks/use-consent-observer';
import { useToast } from '@/components/ui/toast';
import { ChatMessageBody } from './chat-message-body';
import { ChatCopyResponseButton } from './chat-copy-response';
import { ChatCopyWhatsappButton } from './chat-copy-whatsapp';
import { ChatSuggestionChips } from './chat-suggestion-chips';
import { ChatMessageLinks } from './chat-message-links';
import { ChatFeedbackPrompt } from './chat-feedback-prompt';

type Msg = ChatSessionMessage;

const PRIVATE_PREFIXES = [
  '/intranet', '/admin', '/login', '/dashboard',
  '/panel', '/auth', '/private', '/api', '/cargar', '/preview',
];

const SESSION_KEY = 'pya_chat_sid';
const NLM_CONVERSATION_KEY = 'pya_chat_nlm_cid';
const INITIAL_MESSAGE = chatConfig.assistant.initialMessage;

/** Genera/recupera un sessionId estable en localStorage (sin conversación). */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = window.localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        (globalThis.crypto?.randomUUID?.() ??
          `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `sid-${Date.now()}`;
  }
}

function getNlmConversationId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const cid = window.localStorage.getItem(NLM_CONVERSATION_KEY);
    return cid && cid.length >= 8 ? cid : undefined;
  } catch {
    return undefined;
  }
}

function setNlmConversationId(conversationId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NLM_CONVERSATION_KEY, conversationId.slice(0, 128));
  } catch {
    // ignore
  }
}

/** Mensaje contextual para WhatsApp prellenado desde el chat. */
function whatsappContextual(topic?: string): string {
  const t = topic && topic.trim() ? topic.trim().slice(0, 120) : 'orientación';
  return `Hola, necesito orientación sobre ${t}. Vengo desde el chat de la web.`;
}

export function ChatWidget() {
  const pathname = usePathname();
  const consentOpen = useConsentObserver();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLegal, setLoadingLegal] = useState(false);
  const [hasUnreadResponse, setHasUnreadResponse] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [error, setError] = useState(false);
  const chatSession = useSyncExternalStore(
    subscribeChatSessionStore,
    () => getChatSessionStoreSnapshot(INITIAL_MESSAGE),
    () => defaultChatSessionSnapshot(INITIAL_MESSAGE),
  );
  const messages = chatSession.messages;
  const showQuickReplies = chatSession.showQuickReplies;
  const urgent = chatSession.urgent;
  const consultationFlow = chatSession.consultationFlow;
  const pageContext = resolveChatPageContext(pathname);
  const initialQuickReplies = buildInitialQuickReplies(pathname, chatConfig.assistant.quickReplies);
  const lastAssistantIndex = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1);
  // `mounted` garantiza que el primer render del cliente coincida con el del
  // server (null). Antes se usaba `typeof document === 'undefined'`, lo que
  // provocaba un mismatch de hidratación (#418): el server renderizaba null y
  // el cliente renderizaba el portal en el primer paint. useSyncExternalStore
  // es la forma canónica de leer "estamos en cliente" de forma segura para
  // hidratación (getServerSnapshot devuelve false; snapshot cliente true).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  const chatFetchAbortRef = useRef<AbortController | null>(null);
  const chatFetchGenRef = useRef(0);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const openChat = useCallback(() => {
    setHasUnreadResponse(false);
    setOpen(true);
  }, []);

  const finishClose = useCallback(() => {
    setShowFeedbackPrompt(false);
    setOpen(false);
    trackChatClosed();
  }, []);

  const close = useCallback(() => {
    const hasUserMessages = messages.some((m) => m.role === 'user');
    if (hasUserMessages && !chatSession.feedbackGiven && !showFeedbackPrompt) {
      setShowFeedbackPrompt(true);
      return;
    }
    finishClose();
  }, [messages, chatSession.feedbackGiven, showFeedbackPrompt, finishClose]);

  const submitFeedback = useCallback(
    (helpful: boolean) => {
      trackChatFeedback(helpful);
      patchChatSessionStore({ feedbackGiven: true });
      finishClose();
    },
    [finishClose],
  );

  const openWhatsappDraft = useCallback((draft: string) => {
    trackChatWhatsAppClicked();
    trackChatContactClicked('whatsapp');
    if (typeof window !== 'undefined') {
      window.open(whatsappHref(draft), '_blank', 'noopener,noreferrer');
    }
  }, []);

  const buildLegalNetworkErrorAssistant = useCallback((legalQuery: string): Msg => {
    const legalQuestion = stripLawyerNotebookShortcut(legalQuery);
    return {
      role: 'assistant',
      content: chatConfig.notebooklm.clientNetworkErrorReply,
      source: 'fallback_provider_error',
      whatsappDraft: buildPendingLegalWhatsappDraft(legalQuestion),
      legalRetryQuery: legalQuery,
      suggestions: buildLegalErrorChatSuggestions(),
    };
  }, []);

  const runChatApiRequest = useCallback(
    async (params: {
      content: string;
      baseMessages: Msg[];
      isLegalQuery: boolean;
      startedAt: number;
      gen: number;
    }) => {
      const { content, baseMessages, isLegalQuery, startedAt, gen } = params;

      chatFetchAbortRef.current?.abort();
      const controller = new AbortController();
      chatFetchAbortRef.current = controller;

      setLoading(true);
      setLoadingLegal(isLegalQuery);
      setError(false);

      const sessionId = getOrCreateSessionId();
      const conversationId = getNlmConversationId();
      const history = baseMessages
        .slice(0, -1)
        .slice(-7)
        .map((m) => ({ role: m.role, content: m.content }));

      const fetchTimeoutMs = isLegalQuery
        ? chatConfig.notebooklm.clientFetchTimeoutMs
        : 45_000;

      let requestSucceeded = false;
      try {
        const data = await fetchChatApi({
          content,
          sessionId,
          conversationId,
          history,
          pageContext,
          signal: controller.signal,
          timeoutMs: fetchTimeoutMs,
        });

        if (gen !== chatFetchGenRef.current) return;

        if (data.conversationId) {
          setNlmConversationId(data.conversationId);
        }

        if (data.urgent === true) {
          patchChatSessionStore({ urgent: true });
        }

        if (data.source?.startsWith('fallback')) {
          trackChatFallbackUsed(
            data.source === 'fallback_provider_error'
              ? 'fallback_provider_error'
              : 'fallback_no_config',
          );
        }

        const needsLegalRetry = isLegalQuery && Boolean(data.source?.startsWith('fallback'));

        patchChatSessionStore({
          messages: [
            ...baseMessages,
            {
              role: 'assistant',
              content: data.reply,
              source: data.source,
              suggestions: data.suggestions,
              links: data.links,
              whatsappDraft: data.whatsappDraft,
              legalRetryQuery: needsLegalRetry ? content : undefined,
            },
          ],
          showQuickReplies: false,
        });
        requestSucceeded = true;

        const lower = data.reply.toLowerCase();
        if (lower.includes('penal')) trackChatServiceSuggested('penal');
        else if (lower.includes('familia')) trackChatServiceSuggested('familia');
        else if (lower.includes('laboral')) trackChatServiceSuggested('laboral');
        else if (lower.includes('migrante') || lower.includes('españa'))
          trackChatServiceSuggested('migrantes');
      } catch (err) {
        if (gen !== chatFetchGenRef.current) return;

        if (err instanceof ChatApiError && err.code === 'rate_limit') {
          patchChatSessionStore({
            messages: [
              ...baseMessages,
              {
                role: 'assistant',
                content:
                  'Ha enviado muchos mensajes en poco tiempo. Espere unos minutos o contacte directamente por WhatsApp para atención inmediata.',
              },
            ],
            showQuickReplies: false,
          });
          return;
        }

        if (isLegalQuery) {
          setError(false);
          patchChatSessionStore({
            messages: [...baseMessages, buildLegalNetworkErrorAssistant(content)],
            showQuickReplies: false,
          });
          trackChatFallbackUsed('fallback_provider_error');
        } else {
          setError(true);
          patchChatSessionStore({
            messages: [
              ...baseMessages,
              { role: 'assistant', content: chatConfig.fallbackReply },
            ],
            showQuickReplies: false,
          });
          trackChatFallbackUsed('fallback_provider_error');
        }
      } finally {
        if (gen === chatFetchGenRef.current) {
          setLoading(false);
          setLoadingLegal(false);
          chatFetchAbortRef.current = null;
        }

        if (requestSucceeded) {
          const notify = notifyChatResponseReady({
            startedAt,
            question: content,
            chatOpen: openRef.current,
            onOpenChat: openChat,
          });
          if (notify.shouldMarkUnread) {
            setHasUnreadResponse(true);
          }
          if (notify.shouldShowInAppToast) {
            toast.success(
              'Respuesta lista',
              'Abra el chat para leer la respuesta del asistente.',
            );
          }
        }
      }
    },
    [pageContext, openChat, toast, buildLegalNetworkErrorAssistant],
  );

  const retryLegalQuery = useCallback(
    async (legalQuery: string, errorAssistantIndex: number) => {
      const content = legalQuery.trim();
      if (!content || !hasLawyerNotebookShortcut(content)) return;

      void requestChatBrowserNotificationPermission();

      const snapshot = getChatSessionStoreSnapshot(INITIAL_MESSAGE);
      const baseMessages = snapshot.messages.slice(0, errorAssistantIndex);
      const gen = ++chatFetchGenRef.current;
      const startedAt = Date.now();

      await runChatApiRequest({
        content,
        baseMessages,
        isLegalQuery: true,
        startedAt,
        gen,
      });
    },
    [runChatApiRequest],
  );

  const isPrivateRoute =
    !pathname ||
    PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    trackChatOpened();
  }, [open]);

  useEffect(() => {
    if (!open || chatSession.pageGreetingApplied) return;
    const hint = getChatPageHint(pathname);
    if (!hint.greeting) {
      patchChatSessionStore({ pageGreetingApplied: true });
      return;
    }
    const first = messages[0];
    if (first?.role !== 'assistant') return;
    patchChatSessionStore({
      pageGreetingApplied: true,
      messages: [{ ...first, content: `${hint.greeting}\n\n${first.content}` }],
    });
  }, [open, pathname, chatSession.pageGreetingApplied, messages]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    const hasUserMessages = messages.some((m) => m.role === 'user');
    if (el) {
      el.scrollTop = hasUserMessages ? el.scrollHeight : 0;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cierre con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFeedbackPrompt) {
          finishClose();
        } else {
          close();
        }
        openBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, showFeedbackPrompt, close, finishClose]);

  // Bloquea scroll del body en móvil mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      if (content.length > chatConfig.limits.maxMessageLength) return;

      const isLegalQuery = hasLawyerNotebookShortcut(content);
      if (isLegalQuery) {
        void requestChatBrowserNotificationPermission();
      }

      const startedAt = Date.now();
      const userMsg: Msg = { role: 'user', content };
      const withUser = [...messages, userMsg];

      patchChatSessionStore({
        messages: withUser,
        showQuickReplies: false,
      });
      setInput('');
      trackChatMessageSent();

      if (isConsultationFlowStart(content)) {
        const started = startConsultationFlow();
        patchChatSessionStore({
          messages: [
            ...withUser,
            {
              role: 'assistant',
              content: started.reply,
              source: 'rules',
              suggestions: started.suggestions,
            },
          ],
          consultationFlow: started.flow,
        });
        return;
      }

      if (isActiveConsultationFlow(consultationFlow)) {
        const result = advanceConsultationFlow(consultationFlow, content);
        patchChatSessionStore({
          messages: [
            ...withUser,
            {
              role: 'assistant',
              content: result.reply,
              source: 'rules',
              suggestions: result.suggestions,
              links: result.kind === 'continue' ? result.links : result.links,
              whatsappDraft: result.kind === 'complete' ? result.whatsappDraft : undefined,
            },
          ],
          consultationFlow: result.kind === 'complete' ? null : result.flow,
        });
        return;
      }

      // Detección de urgencia client-side (refuerzo del backend).
      const areaSugerida = sugerirAreaLegal(content);
      const AREA_TO_ANALYTICS: Record<string, 'penal' | 'familia' | 'laboral' | 'civil' | 'mercantil' | 'migrantes' | 'general'> = {
        penal: 'penal',
        familia: 'familia',
        laboral: 'laboral',
        civil: 'civil',
        mercantil: 'mercantil',
        migratorio: 'migrantes',
      };
      const analyticsArea = areaSugerida ? AREA_TO_ANALYTICS[areaSugerida] ?? 'general' : null;
      if (analyticsArea) trackChatServiceSuggested(analyticsArea);

      const gen = ++chatFetchGenRef.current;
      await runChatApiRequest({
        content,
        baseMessages: withUser,
        isLegalQuery,
        startedAt,
        gen,
      });
    },
    [loading, messages, consultationFlow, runChatApiRequest],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  // Salvaguarda anti-rutas-privadas (defensa en profundidad). La protección
  // principal es el montaje en app/(public)/layout.tsx.
  // El portal requiere `document` (solo cliente). Usamos `mounted` (no
  // `typeof document`) para que el primer render del cliente sea idéntico al
  // del server (null) y evitar el mismatch de hidratación (#418).
  if (!chatConfig.enabled || isPrivateRoute || !mounted) return null;

  // Quick replies solo al inicio; se ocultan tras el primer mensaje del usuario.

  // Portal a document.body para evitar stacking contexts complejos.
  // WRAPPER ÚNICO con position:fixed y z-index alto para mantener el chat
  // sobre el contenido durante el scroll. pointerEvents:none en el wrapper,
  // auto en los hijos (botón y panel).
  return createPortal(
    <div
      data-floating-widget
      inert={consentOpen}
      aria-hidden={consentOpen ? 'true' : undefined}
      className={`flex flex-col print:hidden fixed left-0 z-[9999] items-start gap-2 ${
        open
          ? 'max-md:inset-0 max-md:z-[10000] max-md:bg-surface max-md:items-stretch max-md:justify-stretch bottom-0 pb-0 pl-0 md:bottom-0 md:pl-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]'
          : 'safe-bottom bottom-0 pl-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
      }`}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      onClick={undefined}
      role={open ? 'presentation' : undefined}
    >
      {open && (
        <div
          id="chat-asistente-virtual"
          role="dialog"
          aria-modal="true"
          aria-label="Asistente virtual"
          className="flex flex-col min-h-0 flex-1 bg-surface text-text overflow-hidden overscroll-contain
            max-md:w-full max-md:h-dvh max-md:max-h-dvh max-md:rounded-none max-md:border-0 max-md:shadow-none
            md:rounded-lg md:border md:border-accent/30 md:shadow-xl
            md:w-[min(calc(100vw-2rem),28rem)] lg:w-[min(calc(100vw-2rem),32rem)]
            md:max-h-[min(720px,calc(100dvh-5.5rem))]"
        >
          {/* Cabecera — compacta en móvil con safe-area superior */}
          <div className="relative flex items-center justify-between gap-2 px-4 py-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-accent/20 bg-primary text-text-inverse shrink-0">
            <div
              className="absolute inset-0 pointer-events-none bg-radial-accent opacity-60"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate font-serif">
                  {chatConfig.assistant.name}
                </p>
                <p className="text-xxs text-text-inverse/70 leading-tight">
                  Pineda y Asociados
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar chat"
              className="relative min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Mensajes — lectura a pantalla completa en móvil/tablet */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 md:px-3.5 md:py-3 space-y-4 md:space-y-3 bg-page-warm"
            aria-live="polite"
            aria-label="Conversación"
          >
            {messages.map((m, i) => (
              <article
                key={i}
                className={
                  m.role === 'user'
                    ? 'w-full rounded-xl md:rounded-lg border-l-4 border-l-accent bg-surface px-4 py-3.5 md:ml-auto md:max-w-[82%] md:border-l-0 md:bg-primary md:text-text-inverse md:px-3.5 md:py-2.5 text-base leading-[1.65] md:text-sm md:leading-relaxed shadow-sm break-words'
                    : 'w-full rounded-xl md:rounded-lg bg-surface text-text px-4 py-4 md:mr-auto md:max-w-[95%] md:px-3.5 md:py-3 text-base leading-[1.65] md:text-sm md:leading-relaxed border border-border-light shadow-sm break-words'
                }
              >
                <p
                  className={
                    m.role === 'user'
                      ? 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-accent-dark md:sr-only'
                      : 'mb-2 text-xs font-semibold uppercase tracking-wide text-primary md:sr-only'
                  }
                >
                  {m.role === 'user' ? 'Su consulta' : 'Respuesta'}
                </p>
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <>
                    <ChatMessageBody content={m.content} source={m.source} />
                    {m.whatsappDraft && (
                      <ChatCopyWhatsappButton
                        text={m.whatsappDraft}
                        onOpenWhatsApp={() => {
                          trackChatWhatsAppClicked();
                          trackChatContactClicked('whatsapp');
                        }}
                      />
                    )}
                    <ChatCopyResponseButton text={m.content} />
                    {m.links && m.links.length > 0 && <ChatMessageLinks links={m.links} />}
                    {i === lastAssistantIndex && m.suggestions && m.suggestions.length > 0 && (
                      <ChatSuggestionChips
                        suggestions={m.suggestions}
                        whatsappDraft={m.whatsappDraft}
                        canRetryLegal={Boolean(resolveLegalRetryQuery(messages, i))}
                        disabled={loading}
                        onSelect={(msg) => void sendMessage(msg)}
                        onOpenWhatsApp={openWhatsappDraft}
                        onRetryLegal={() => {
                          const query = resolveLegalRetryQuery(messages, i);
                          if (query) void retryLegalQuery(query, i);
                        }}
                      />
                    )}
                  </>
                )}
                {m.role === 'assistant' && m.source === 'notebooklm' && (
                  <p className="mt-3 text-xs text-text-muted border-t border-border-light/60 pt-2 md:mt-1.5 md:text-xxs md:pt-1.5">
                    {chatConfig.assistant.notebooklmBadge}
                  </p>
                )}
              </article>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-text-secondary text-sm md:text-xs px-1 py-1">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </span>
                <span>
                  {loadingLegal
                    ? 'Consultando corpus legal (puede tardar 1–2 min). Si cambia de pestaña, le avisaremos al terminar…'
                    : 'Consultando…'}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xxs text-danger bg-danger-bg rounded-lg px-2 py-1.5 mr-auto max-w-[88%]">
                Se produjo un error. Puede reintentar o contactar directamente.
              </p>
            )}

            {/* Banner de urgencia: si el backend marca urgencia, resalta CTAs */}
            {urgent && (
              <div className="mr-auto max-w-[92%] rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-text">
                <p className="font-semibold flex items-center gap-1.5">
                  <Zap size={12} className="text-danger" aria-hidden="true" />
                  Su caso parece urgente
                </p>
                <p className="mt-0.5 text-text-secondary">
                  Le recomendamos contactar ahora por WhatsApp o teléfono para atención inmediata.
                </p>
              </div>
            )}

            {/* Quick replies: solo al inicio, ocultas tras el primer mensaje */}
            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 md:gap-1.5 md:mr-auto md:max-w-[92%]">
                {initialQuickReplies.map((qr) => {
                  const isUrgent = qr === 'Caso urgente';
                  return (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => void sendMessage(qr)}
                      className={`text-sm md:text-xs font-medium min-h-11 md:min-h-10 px-4 md:px-3 py-2.5 md:py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isUrgent
                          ? 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/15'
                          : 'border-border bg-surface-alt text-text-secondary hover:border-accent/40 hover:text-accent-dark'
                      }`}
                    >
                      {isUrgent && <Zap size={10} className="inline mr-1" aria-hidden="true" />}
                      {qr}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {showFeedbackPrompt && (
            <ChatFeedbackPrompt
              onFeedback={submitFeedback}
              onDismiss={finishClose}
            />
          )}

          {/* Contacto rápido — compacto en móvil para dejar espacio al texto */}
          <div className="flex items-center gap-2 px-4 py-2 md:px-3 border-t border-border-light bg-surface-alt/50 shrink-0">
            <a
              href={whatsappHref(whatsappContextual())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackChatWhatsAppClicked();
                trackChatContactClicked('whatsapp');
              }}
              className={`flex flex-1 md:flex-none items-center justify-center gap-1.5 text-sm md:text-xs font-semibold min-h-11 px-3 py-2 rounded-lg bg-success text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity ${urgent ? 'ring-2 ring-danger/40' : ''}`}
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
            <a
              href={telHref()}
              onClick={() => trackChatContactClicked('phone')}
              className={`flex flex-1 md:flex-none items-center justify-center gap-1.5 text-sm md:text-xs font-semibold min-h-11 px-3 py-2 rounded-lg bg-primary text-text-inverse hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity ${urgent ? 'ring-2 ring-danger/40' : ''}`}
            >
              <Phone size={16} aria-hidden="true" />
              <span>Llamar</span>
            </a>
            <a
              href="/solicitar-consulta"
              onClick={() => trackChatContactClicked('consulta')}
              className="hidden md:flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg px-2 py-1.5 min-h-11 transition-colors"
            >
              Consulta <ArrowRight size={11} aria-hidden="true" />
            </a>
          </div>

          {/* Input — área táctil amplia */}
          <form onSubmit={onSubmit} className="flex items-end gap-2 px-4 py-3 md:px-3 md:py-2.5 border-t border-border-light bg-surface shrink-0">
            <label htmlFor="chat-input" className="sr-only">
              Escriba su mensaje
            </label>
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              maxLength={chatConfig.limits.maxMessageLength}
              placeholder="Escriba su consulta jurídica…"
              autoComplete="off"
              disabled={loading}
              className="flex-1 min-w-0 min-h-12 max-h-32 resize-none rounded-lg border border-border bg-background px-3.5 py-3 text-base md:text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex-shrink-0 min-h-11 min-w-11 rounded-lg bg-accent text-primary flex items-center justify-center hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 transition-colors btn-shadow-accent"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          </form>

          {/* Disclaimer discreto */}
          <p className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 text-xs md:text-xxs leading-snug text-text-muted bg-surface text-center shrink-0">
            {chatConfig.assistant.disclaimer}
          </p>
        </div>
      )}

      {/* Botón flotante — oculto en móvil cuando el panel está abierto */}
      {!open && (
      <button
        ref={openBtnRef}
        type="button"
        onClick={openChat}
        aria-label={hasUnreadResponse ? 'Abrir asistente virtual (respuesta lista)' : 'Abrir asistente virtual'}
        aria-expanded={false}
        aria-controls="chat-asistente-virtual"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[9998] w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-primary text-text-inverse flex items-center justify-center btn-shadow-primary btn-shadow-primary-hover active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 relative"
        style={{ pointerEvents: 'auto' }}
      >
        {hasUnreadResponse && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-primary"
            aria-hidden="true"
          />
        )}
        <MessageCircle size={22} className="sm:w-5 sm:h-5" aria-hidden="true" />
        <span className="sr-only">Asistente virtual de Pineda y Asociados</span>
      </button>
      )}
    </div>,
    document.body,
  );
}
