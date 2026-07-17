'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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

  const snapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const consent = useMemo(() => parseConsentSnapshot(snapshot), [snapshot]);

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

  if (consent && !reopened) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-lg border border-border bg-surface p-5 shadow-xl"
    >
      <h2 id="cookie-consent-title" className="text-lg font-bold text-primary">Preferencias de privacidad</h2>
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
        <button type="button" onClick={() => save({ analytics: true, functionality: true })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Aceptar opcionales</button>
        <button type="button" onClick={() => save({ analytics: false, functionality: false })} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">Rechazar opcionales</button>
        {configure ? (
          <button type="button" onClick={() => save({ analytics, functionality })} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary">Guardar preferencias</button>
        ) : (
          <button type="button" onClick={() => setConfigure(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-primary underline">Configurar</button>
        )}
      </div>
    </section>
  );
}

export function CookiePreferencesButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('pineda:open-consent'))} className="text-xs text-text-inverse/70 hover:text-accent transition-colors py-1">Preferencias de cookies</button>;
}
