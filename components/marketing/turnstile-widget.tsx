'use client';

/**
 * Widget de Cloudflare Turnstile para formularios públicos.
 *
 * Obtiene la Site Key pública en tiempo de ejecución:
 *  - Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está embebida en el bundle (dev
 *    local con la variable definida en el entorno), la usa directamente.
 *  - Si no (producción / Preview Vercel donde NEXT_PUBLIC_* no se inlinea
 *    siempre en el build), consulta GET /api/public-config al montar. La
 *    respuesta se cachea 1h en CDN y no contiene secretos.
 *
 * Estado comunicado al formulario padre:
 *  - loading:    cargando o esperando la Site Key.
 *  - ready:      widget renderizado, esperando interacción del usuario.
 *  - verified:   el usuario completó la verificación (token disponible).
 *  - error:      fallo de carga de script/Site Key o del widget.
 *  - unconfigured: no hay Site Key disponible (backend con bypass seguro).
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
  // La Site Key puede estar embebida en el bundle (dev local) o necesitar
  // obtenerse en runtime (Preview/Prod Vercel).
  const embeddedKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [siteKey, setSiteKey] = useState<string | null>(embeddedKey || null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Estado inicial: loading si hay site key o esperamos obtenerla; unconfigured solo si embeddedKey es ''
  const [status, setStatus] = useState<TurnstileStatus>(
    embeddedKey === '' ? 'unconfigured' : 'loading',
  );

  // Notificar cambios de estado al padre de forma estable.
  const notifyStatus = useCallback(
    (next: TurnstileStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  // Obtener la Site Key en runtime si no está en el bundle.
  useEffect(() => {
    if (siteKey) return;
    let cancelled = false;
    fetch('/api/public-config')
      .then((r) => r.json())
      .then((data: { turnstileSiteKey?: string }) => {
        if (cancelled) return;
        if (data.turnstileSiteKey) {
          setSiteKey(data.turnstileSiteKey);
          notifyStatus('loading');
        } else {
          setFailed(true);
          notifyStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          notifyStatus('error');
        }
      });
    return () => { cancelled = true; };
  }, [siteKey, notifyStatus]);

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

  // Notificar estado unconfigured solo cuando sabemos que no hay key.
  useEffect(() => {
    if (embeddedKey === '') {
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
