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

export function CookieConsent() {
  const [reopened, setReopened] = useState(false);
  const [configure, setConfigure] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const snapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const consent = useMemo(() => parseConsentSnapshot(snapshot), [snapshot]);
  const isOpen = !consent || reopened;

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
    if (!isOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const floatingWidgets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-floating-widget]'),
    );
    const previousWidgetState = floatingWidgets.map((widget) => ({
      widget,
      inert: widget.hasAttribute('inert'),
      ariaHidden: widget.getAttribute('aria-hidden'),
    }));

    document.body.dataset.consentDialogOpen = 'true';
    for (const widget of floatingWidgets) {
      widget.setAttribute('inert', '');
      widget.setAttribute('aria-hidden', 'true');
    }

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
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

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
      for (const { widget, inert, ariaHidden } of previousWidgetState) {
        if (!inert) widget.removeAttribute('inert');
        if (ariaHidden === null) widget.removeAttribute('aria-hidden');
        else widget.setAttribute('aria-hidden', ariaHidden);
      }
      previousFocus?.focus();
    };
  }, [isOpen, reopened]);

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

  return (
    <div
      data-cookie-consent-overlay
      className="fixed inset-0 z-[10000] flex items-end justify-center overflow-y-auto bg-black/20 p-3"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
      >
        {reopened && (
          <button
            type="button"
            onClick={() => {
              setReopened(false);
              setConfigure(false);
            }}
            className="absolute top-3 right-3 rounded-md px-2 py-1 text-xs font-semibold text-text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Cerrar preferencias de privacidad"
          >
            Cerrar
          </button>
        )}
        <h2 id="cookie-consent-title" className="pr-14 text-lg font-bold text-primary">Preferencias de privacidad</h2>
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

        <div className="mt-5 flex flex-wrap gap-2">
          <button ref={initialFocusRef} type="button" onClick={() => save({ analytics: true, functionality: true })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Aceptar opcionales</button>
          <button type="button" onClick={() => save({ analytics: false, functionality: false })} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">Rechazar opcionales</button>
          {configure ? (
            <button type="button" onClick={() => save({ analytics, functionality })} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary">Guardar preferencias</button>
          ) : (
            <button type="button" onClick={() => setConfigure(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-primary underline">Configurar</button>
          )}
        </div>
      </section>
    </div>
  );
}

export function CookiePreferencesButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('pineda:open-consent'))} className="text-xs text-text-inverse/70 hover:text-accent transition-colors py-1">Preferencias de cookies</button>;
}
