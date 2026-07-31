'use client';

/**
 * Widget de Cloudflare Turnstile para formularios públicos.
 *
 * - Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está definida, renderiza el widget
 *   oficial cargando el script de Cloudflare al montar.
 * - Si no, notifica el estado `unconfigured` (el backend hace bypass seguro
 *   en desarrollo y fail-closed en producción).
 *
 * Estado comunicado al formulario padre:
 *  - loading:    cargando el script o renderizando el widget.
 *  - ready:      widget renderizado, esperando interacción del usuario.
 *  - verified:   el usuario completó la verificación (token disponible).
 *  - error:      fallo de carga del script o del widget (mensaje visible).
 *  - unconfigured: no hay Site Key pública configurada (modo dev local).
 *
 * El widget inyecta un input oculto `cf-turnstile-response` cuyo valor es el
 * token que el backend valida con `verifyTurnstileToken`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

export type TurnstileStatus = 'loading' | 'ready' | 'verified' | 'error' | 'unconfigured';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar Turnstile'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  onToken,
  onStatusChange,
}: {
  onToken: (token: string) => void;
  onStatusChange?: (status: TurnstileStatus) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Estado inicial derivado de la site key: sin key → unconfigured.
  const [status, setStatus] = useState<TurnstileStatus>(siteKey ? 'loading' : 'unconfigured');

  // Notificar cambios de estado al padre de forma estable.
  const notifyStatus = useCallback(
    (next: TurnstileStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            notifyStatus('verified');
            onToken(token);
          },
          'error-callback': () => {
            setFailed(true);
            notifyStatus('error');
            onToken('');
          },
          'expired-callback': () => {
            notifyStatus('ready');
            onToken('');
          },
          theme: 'light',
          size: 'normal',
        });
        if (!cancelled) notifyStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        notifyStatus('error');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // noop
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken, notifyStatus]);

  // Notificar el estado inicial al padre (unconfigured cuando no hay site key).
  // El estado derivado se calcula en useState, pero el callback del padre debe
  // enterarse. Este effect corre una sola vez tras el montaje.
  useEffect(() => {
    if (!siteKey) {
      onStatusChange?.('unconfigured');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!siteKey) {
    // Sin clave pública configurada: no hay nada que mostrar. El backend
    // hace bypass seguro (lib/captcha.ts) y aplica rate-limit.
    return null;
  }

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px]" aria-label="Verificación antispam" />
      {failed && (
        <p role="alert" className="text-xxs text-aggravation mt-1">
          No se pudo cargar la verificación antispam. Recargue la página o escríbanos directamente a
          contacto@pinedayasociadoshn.com.
        </p>
      )}
      {status === 'ready' && !failed && (
        <p className="text-xxs text-text-muted mt-1" aria-live="polite">
          Complete la verificación antispam antes de enviar.
        </p>
      )}
    </div>
  );
}
