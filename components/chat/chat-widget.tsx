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
 *   - sessionId en localStorage (no conversación completa).
 *   - Salvaguarda: no renderiza en rutas privadas aunque se monte por error.
 *
 * Render solo en web pública: se monta en app/(public)/layout.tsx.
 *
 * Nota sobre hooks: TODOS los hooks se ejecutan antes de cualquier return
 * condicional (reglas de React). La protección principal es el montaje en
 * el layout público; el check de ruta privada es defensa en profundidad.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Send, Loader2, X, MessageCircle, Phone, ArrowRight } from 'lucide-react';
import { telHref, whatsappHref } from '@/lib/site';
import { chatConfig } from '@/lib/chat/config';
import {
  trackChatOpened,
  trackChatClosed,
  trackChatMessageSent,
  trackChatFallbackUsed,
  trackChatWhatsAppClicked,
  trackChatContactClicked,
  trackChatServiceSuggested,
} from './chat-analytics';

type Msg = { role: 'assistant' | 'user'; content: string };

const PRIVATE_PREFIXES = [
  '/intranet', '/admin', '/login', '/dashboard',
  '/panel', '/auth', '/private', '/api', '/cargar', '/preview',
];

const SESSION_KEY = 'pya_chat_sid';

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

/** Mensaje contextual para WhatsApp prellenado desde el chat. */
function whatsappContextual(topic?: string): string {
  const t = topic && topic.trim() ? topic.trim().slice(0, 120) : 'orientación';
  return `Hola, necesito orientación sobre ${t}. Vengo desde el chat de la web.`;
}

export function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: chatConfig.assistant.initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  const isPrivateRoute =
    !pathname ||
    PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // sessionId se genera/recupera de localStorage perezosamente en el primer
  // envío. No se guarda en estado (no afecta al render) para evitar el
  // patrón "setState in effect" y mantenerlo fuera del ciclo de render.

  useEffect(() => {
    if (open) {
      // Al abrir, scroll al inicio (saludo). El scrollRef apunta al contenedor
      // de mensajes; scrollTo(0,0) = mostrar el primer mensaje (el saludo).
      const el = scrollRef.current;
      if (el) el.scrollTop = 0;
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      trackChatOpened();
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cierre con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        openBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      if (content.length > chatConfig.limits.maxMessageLength) return;

      const sessionId = getOrCreateSessionId();
      const userMsg: Msg = { role: 'user', content };
      const history = messages
        .slice(-7, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setError(false);
      trackChatMessageSent();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, sessionId, history }),
        });

        if (res.status === 429) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                'Ha enviado muchos mensajes en poco tiempo. Espere unos minutos o contacte directamente por WhatsApp para atención inmediata.',
            },
          ]);
          return;
        }
        if (!res.ok) {
          throw new Error('chat_error');
        }

        const data = (await res.json()) as { reply?: string; source?: string };
        const reply = data.reply?.trim() || chatConfig.fallbackReply;

        if (data.source && data.source.startsWith('fallback')) {
          trackChatFallbackUsed(
            data.source === 'fallback_provider_error'
              ? 'fallback_provider_error'
              : 'fallback_no_config',
          );
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

        // Heurística simple para evento service_suggested (categoría fija).
        const lower = reply.toLowerCase();
        if (lower.includes('penal')) trackChatServiceSuggested('penal');
        else if (lower.includes('familia')) trackChatServiceSuggested('familia');
        else if (lower.includes('laboral')) trackChatServiceSuggested('laboral');
        else if (lower.includes('migrante') || lower.includes('españa'))
          trackChatServiceSuggested('migrantes');
      } catch {
        setError(true);
        setMessages((prev) => [...prev, { role: 'assistant', content: chatConfig.fallbackReply }]);
        trackChatFallbackUsed('fallback_provider_error');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      if (text === 'Quiero hablar por WhatsApp') {
        trackChatWhatsAppClicked();
        window.open(whatsappHref(whatsappContextual()), '_blank', 'noopener,noreferrer');
        return;
      }
      if (text === 'Ver servicios jurídicos') {
        router.push('/servicios-juridicos');
        return;
      }
      void sendMessage(text);
    },
    [router, sendMessage],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const close = () => {
    setOpen(false);
    trackChatClosed();
  };

  // Salvaguarda anti-rutas-privadas (defensa en profundidad). La protección
  // principal es el montaje en app/(public)/layout.tsx.
  // El portal requiere `document` (solo cliente); en SSR no se renderiza.
  if (!chatConfig.enabled || isPrivateRoute || typeof document === 'undefined') return null;

  // Flujo conversacional natural: al abrir SOLO se muestra el saludo inicial.
  // Las sugerencias aparecen tras el primer mensaje del usuario, no antes.
  const showSuggestions = messages.some((m) => m.role === 'user');

  // Portal a document.body para evitar stacking contexts complejos.
  // WRAPPER ÚNICO con position:fixed — tanto el botón como el panel
  // viven dentro del mismo contenedor fixed, eliminando cualquier
  // ambigüedad de layout que Chrome tenga con múltiples fixed.
  return createPortal(
    <div
      className="z-30 print:hidden safe-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0 0 1rem 1rem',
        pointerEvents: 'none',
      }}
    >
      {/* Panel del chat — ancho fluido con clamp, altura segura con min() */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Asistente virtual"
          className="flex flex-col rounded-lg border border-accent/30 bg-surface text-text shadow-xl"
          style={{
            pointerEvents: 'auto',
            width: 'calc(100vw - 1.5rem)',
            maxWidth: 'clamp(16rem, 25vw, 20rem)',
            maxHeight: 'min(480px, calc(100dvh - 6rem))',
          }}
        >
          {/* Cabecera compacta */}
          <div className="flex items-center justify-between gap-1.5 px-1.5 py-1 border-b border-accent/20 bg-primary text-text-inverse rounded-t-lg">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bot size={11} className="flex-shrink-0 text-accent" aria-hidden="true" />
              <p className="text-xs font-semibold leading-tight truncate">
                {chatConfig.assistant.name}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar chat"
              className="p-0.5 rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </div>

          {/* Mensajes (scroll interno) */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-1.5 py-1 space-y-1 bg-background"
            aria-live="polite"
            aria-label="Conversación"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-md bg-primary text-text-inverse px-1.5 py-0.5 text-xs'
                    : 'mr-auto max-w-[92%] rounded-md bg-muted text-text px-1.5 py-0.5 text-xs'
                }
              >
                {m.content}
              </div>
            ))}

            {/* Sugerencias contextuales: SOLO tras el primer mensaje del
                usuario (no al abrir). Flujo más natural: saludo → usuario
                escribe → aparecen sugerencias útiles. */}
            {showSuggestions && !loading && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {chatConfig.assistant.quickReplies.slice(0, 4).map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => handleQuickReply(qr)}
                    className="text-left text-xxs px-1.5 py-0.5 rounded border border-accent/30 bg-surface hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="mr-auto flex items-center gap-2 text-text-secondary text-xs px-1">
                <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                <span>Escribiendo…</span>
              </div>
            )}

            {error && (
              <p className="text-xxs text-warning px-1">
                Se produjo un error. Puede reintentar o contactar directamente.
              </p>
            )}
          </div>

          {/* CTAs compactos — botones pequeños con padding generoso */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 border-t border-accent/20 bg-muted/50">
            <a
              href={whatsappHref(whatsappContextual())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackChatWhatsAppClicked();
                trackChatContactClicked('whatsapp');
              }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded bg-success text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <MessageCircle size={8} aria-hidden="true" /> WhatsApp
            </a>
            <a
              href={telHref()}
              onClick={() => trackChatContactClicked('phone')}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded bg-primary text-text-inverse hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Phone size={8} aria-hidden="true" /> Llamar
            </a>
            <a
              href="/solicitar-consulta"
              onClick={() => trackChatContactClicked('consulta')}
              className="ml-auto flex items-center gap-0.5 text-xxs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 py-0.5"
            >
              Consulta <ArrowRight size={8} aria-hidden="true" />
            </a>
          </div>

          {/* Input compacto */}
          <form onSubmit={onSubmit} className="flex items-center gap-1.5 px-1.5 py-1 border-t border-accent/20">
            <label htmlFor="chat-input" className="sr-only">
              Escriba su mensaje
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={chatConfig.limits.maxMessageLength}
              placeholder="Escriba su mensaje…"
              autoComplete="off"
              disabled={loading}
              className="flex-1 min-w-0 rounded border border-accent/30 bg-background px-1 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex-shrink-0 w-5 h-5 rounded bg-accent text-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Send size={10} aria-hidden="true" />
            </button>
          </form>

          {/* Disclaimer en tamaño reducido pero legible */}
          <p className="px-1.5 pb-1 text-[9px] leading-tight text-text-secondary">
            {chatConfig.assistant.disclaimer}
          </p>
        </div>
      )}

      {/* Botón flotante: abajo-izquierda, dentro del mismo wrapper fixed.
          pointerEvents auto para que sea clickeable (el wrapper tiene none). */}
      <button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-primary text-text-inverse flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        style={{ pointerEvents: 'auto' }}
      >
        {open ? <X size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}
        {!open && <span className="sr-only">Asistente virtual de Pineda y Asociados</span>}
      </button>
    </div>,
    document.body,
  );
}
