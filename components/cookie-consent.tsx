'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  CONSENT_MAX_AGE_DAYS,
  ConsentChoice,
  getConsentSnapshot,
  parseConsentSnapshot,
  persistConsent,
  readConsent,
  subscribeConsent,
  updateGoogleConsent,
} from '@/lib/cookie-consent';

/** En tests el banner aparece al instante; en producción se retrasa para no tapar el LCP. */
export const CONSENT_REVEAL_DELAY_MS =
  process.env.NODE_ENV === 'test' || process.env.VITEST ? 0 : 2500;

export function CookieConsent() {
  const [reopened, setReopened] = useState(false);
  const [configure, setConfigure] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(CONSENT_REVEAL_DELAY_MS === 0);
  const dialogRef = useRef<HTMLElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const snapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const consent = useMemo(() => parseConsentSnapshot(snapshot), [snapshot]);
  const needsDecision = !consent || reopened;
  const isModal = configure || reopened;
  const isOpen = needsDecision && (delayElapsed || reopened);

  useEffect(() => {
    if (consent) updateGoogleConsent(consent);

    const reopen = () => {
      const saved = readConsent();
      setAnalytics(saved?.analytics ?? false);
      setFunctionality(saved?.functionality ?? false);
      setConfigure(true);
      setReopened(true);
    };
    window.addEventListener('pineda:open-consent', reopen);
    return () => window.removeEventListener('pineda:open-consent', reopen);
  }, [consent]);

  useEffect(() => {
    if (consent || delayElapsed) return;
    const timer = window.setTimeout(() => setDelayElapsed(true), CONSENT_REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [consent, delayElapsed]);

  useEffect(() => {
    if (!isOpen || !isModal) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.dataset.consentDialogOpen = 'true';
    document.querySelectorAll('[data-floating-widget]').forEach((el) => {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });

    const frame = window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && reopened) {
        event.preventDefault();
        setReopened(false);
        setConfigure(false);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
         dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      delete document.body.dataset.consentDialogOpen;
      document.querySelectorAll('[data-floating-widget]').forEach((el) => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
      previousFocus?.focus();
    };
  }, [isOpen, isModal, reopened]);

  function save(choice: ConsentChoice) {
    const previous = readConsent();
    persistConsent(choice);
    setAnalytics(choice.analytics);
    setFunctionality(choice.functionality);
    setReopened(false);
    setConfigure(false);
    // Al revocar, una recarga retira scripts de terceros ya descargados.
    if (previous?.analytics && !choice.analytics) window.location.reload();
  }

  if (!isOpen) return null;

  const actions = (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        ref={initialFocusRef}
        type="button"
        onClick={() => save({ analytics: true, functionality: true })}
        className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Aceptar opcionales
      </button>
      <button
        type="button"
        onClick={() => save({ analytics: false, functionality: false })}
        className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Rechazar opcionales
      </button>
      {configure ? (
        <button
          type="button"
          onClick={() => save({ analytics, functionality })}
          className="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Guardar preferencias
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfigure(true)}
          className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Configurar
        </button>
      )}
    </div>
  );

  const copy = (
    <>
      <h2 id="cookie-consent-title" className="pr-14 text-base font-bold text-primary md:text-lg">
        Preferencias de privacidad
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        Las cookies analíticas son opcionales. No usamos almacenamiento publicitario. Puede cambiar su elección en el pie de página. La decisión caduca en {CONSENT_MAX_AGE_DAYS} días.{' '}
        <Link href="/politica-cookies" rel="nofollow" className="underline">Política de cookies</Link>.
      </p>
      {configure && (
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Configurar consentimiento</legend>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-1" />
            <span><strong>Necesarias</strong><span className="block text-sm text-text-muted">Seguridad y funcionamiento básico. Siempre activas.</span></span>
          </label>
          <label className="flex items-start gap-3">
            <input aria-label="Cookies analíticas" type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
            <span><strong>Analítica</strong><span className="block text-sm text-text-muted">GA4 y Microsoft Clarity para medir uso y mejorar el sitio.</span></span>
          </label>
          <label className="flex items-start gap-3">
            <input aria-label="Cookies funcionales" type="checkbox" checked={functionality} onChange={(e) => setFunctionality(e.target.checked)} className="mt-1" />
            <span><strong>Funcionalidad opcional</strong><span className="block text-sm text-text-muted">Preferencias no esenciales. Actualmente no activa publicidad.</span></span>
          </label>
        </fieldset>
      )}
      {actions}
    </>
  );

  if (!isModal) {
    return (
      <aside
        role="region"
        aria-labelledby="cookie-consent-title"
        className="pointer-events-none fixed inset-x-0 bottom-16 z-[10000] px-3 md:bottom-3 print:hidden"
      >
        <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-lg border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-md">
          {copy}
        </div>
      </aside>
    );
  }

  return (
    <div
      data-cookie-consent-overlay
      className="fixed inset-0 z-[10000] flex items-end justify-center overflow-y-auto overscroll-contain bg-black/10 p-3 pb-[4.75rem] md:items-end md:pb-3"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-5 shadow-xl md:max-h-[calc(100dvh-1.5rem)]"
      >
        {reopened && (
          <button
            type="button"
            onClick={() => {
              setReopened(false);
              setConfigure(false);
            }}
            className="absolute top-3 right-3 min-h-11 min-w-11 rounded-md px-2 py-1 text-xs font-semibold text-text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Cerrar preferencias de privacidad"
          >
            Cerrar
          </button>
        )}
        {copy}
      </section>
    </div>
  );
}

export function CookiePreferencesButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('pineda:open-consent'))} className="text-xs text-text-inverse/70 hover:text-accent transition-colors py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Preferencias de cookies</button>;
}
