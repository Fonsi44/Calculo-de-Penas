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

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Bot, Send, X, MessageCircle, Phone, ArrowRight, Zap } from 'lucide-react';
import { telHref, whatsappHref } from '@/lib/site';
import { chatConfig } from '@/lib/chat/config';
import { sugerirAreaLegal } from '@/lib/chat/preconsulta';
import {
  trackChatOpened,
  trackChatClosed,
  trackChatMessageSent,
  trackChatFallbackUsed,
  trackChatWhatsAppClicked,
  trackChatContactClicked,
  trackChatServiceSuggested,
} from './chat-analytics';

import { useConsentObserver } from '@/hooks/use-consent-observer';

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
  const consentOpen = useConsentObserver();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: chatConfig.assistant.initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Marca de urgencia: cuando el backend o el mensaje del usuario indican
  // urgencia, se resaltan los CTAs de WhatsApp/teléfono en el widget.
  const [urgent, setUrgent] = useState(false);
  // Muestra las quick replies iniciales mientras no haya mensajes del usuario.
  const [showQuickReplies, setShowQuickReplies] = useState(true);
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
      setShowQuickReplies(false);
      trackChatMessageSent();

      // Detección de urgencia client-side (refuerzo del backend).
      const areaSugerida = sugerirAreaLegal(content);
      // Mapea el enum AreaLegal (más amplio) al subset que acepta analytics.
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

        const data = (await res.json()) as { reply?: string; source?: string; urgent?: boolean };
        const reply = data.reply?.trim() || chatConfig.fallbackReply;

        // Marca urgencia si el backend lo señala (resalta CTAs de contacto).
        if (data.urgent === true) setUrgent(true);

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
      className="hidden md:flex print:hidden safe-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 9999,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0 0 1rem 1rem',
        pointerEvents: 'none',
      }}
    >
      {/* Panel del chat — premium, elegante, proporcional.
          Usa los mismos tokens de diseño que el resto de la web
          (card-premium, shadows, accent, radius-lg). */}
      {open && (
        <div
          id="chat-asistente-virtual"
          role="dialog"
          aria-modal="false"
          aria-label="Asistente virtual"
          className="flex flex-col rounded-lg border border-accent/30 bg-surface text-text overflow-hidden shadow-xl"
          style={{
            pointerEvents: 'auto',
            width: 'calc(100vw - 2rem)',
            maxWidth: 'clamp(22rem, 38vw, 32rem)',
            maxHeight: 'min(640px, calc(100dvh - 4rem))',
          }}
        >
          {/* Cabecera — gradiente navy con acento dorado */}
          <div className="relative flex items-center justify-between gap-2 px-4 py-2.5 border-b border-accent/20 bg-primary text-text-inverse">
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

          {/* Mensajes (scroll interno) — fondo cálido sutil */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-page-warm"
            aria-live="polite"
            aria-label="Conversación"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[82%] rounded-lg bg-primary text-text-inverse px-3.5 py-2 text-sm leading-relaxed shadow-sm break-words overflow-hidden'
                    : 'mr-auto max-w-[88%] rounded-lg bg-surface text-text px-3.5 py-2 text-sm leading-relaxed border border-border-light shadow-sm break-words overflow-hidden'
                }
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto flex items-center gap-2 text-text-secondary text-xs px-2 py-1">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </span>
                <span>Escribiendo…</span>
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
              <div className="flex flex-wrap gap-1.5 mr-auto max-w-[92%]">
                {chatConfig.assistant.quickReplies.map((qr) => {
                  const isUrgent = qr === 'Caso urgente';
                  return (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => void sendMessage(qr)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
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

          {/* Barra de contacto rápida */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border-light bg-surface-alt/50">
            <a
              href={whatsappHref(whatsappContextual())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackChatWhatsAppClicked();
                trackChatContactClicked('whatsapp');
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-success text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity ${urgent ? 'ring-2 ring-danger/40 animate-pulse' : ''}`}
            >
              <MessageCircle size={12} aria-hidden="true" /> WhatsApp
            </a>
            <a
              href={telHref()}
              onClick={() => trackChatContactClicked('phone')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-text-inverse hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity ${urgent ? 'ring-2 ring-danger/40 animate-pulse' : ''}`}
            >
              <Phone size={12} aria-hidden="true" /> Llamar
            </a>
            <a
              href="/solicitar-consulta"
              onClick={() => trackChatContactClicked('consulta')}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg px-2 py-1.5 transition-colors"
            >
              Consulta <ArrowRight size={11} aria-hidden="true" />
            </a>
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-border-light bg-surface">
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
              className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 transition-colors"
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
          <p className="px-3 pb-2 pt-0.5 text-xxs leading-tight text-text-muted bg-surface text-center">
            {chatConfig.assistant.disclaimer}
          </p>
        </div>
      )}

      {/* Botón flotante. Sin animación de atención: el movimiento continuo distrae. */}
      <button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
        aria-expanded={open}
        aria-controls="chat-asistente-virtual"
        className="relative w-12 h-12 rounded-full bg-primary text-text-inverse flex items-center justify-center btn-shadow-primary btn-shadow-primary-hover hover:-translate-y-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        style={{
          pointerEvents: 'auto',
        }}
      >
        <span className="relative">
          {open ? <X size={20} aria-hidden="true" /> : <MessageCircle size={20} aria-hidden="true" />}
        </span>
        {!open && <span className="sr-only">Asistente virtual de Pineda y Asociados</span>}
      </button>
    </div>,
    document.body,
  );
}
