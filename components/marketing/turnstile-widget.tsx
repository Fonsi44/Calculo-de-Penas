'use client';

/**
 * Widget de Cloudflare Turnstile para formularios públicos.
 *
 * - Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` está definida, renderiza el widget
 *   oficial cargando el script de Cloudflare al montar.
 * - Si no, renderiza un `<noscript>` informativo (el backend hace bypass
 *   seguro en ese caso, pero avisamos al usuario de que el captcha está
 *   inactivo).
 *
 * El widget inyecta un input oculto `cf-turnstile-response` cuyo valor es el
 * token que el backend valida con `verifyTurnstileToken`.
 */
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; 'error-callback'?: () => void; theme?: 'light' | 'dark' | 'auto'; size?: 'normal' | 'compact' },
      ) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

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

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onToken,
          'error-callback': () => setFailed(true),
          theme: 'light',
          size: 'normal',
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // noop
        }
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) {
    // Sin clave pública configurada: no hay nada que mostrar. El backend
    // hace bypass seguro (lib/captcha.ts) y aplica rate-limit.
    return null;
  }

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px]" aria-label="Verificación antispam" />
      {failed && (
        <noscript>
          <p className="text-xxs text-text-muted mt-1">
            Si tiene problemas con la verificación, recargue la página o escríbanos directamente a
            contacto@pinedayasociadoshn.com.
          </p>
        </noscript>
      )}
    </div>
  );
}
