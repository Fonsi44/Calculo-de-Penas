'use client';

/**
 * Listener global de eventos analíticos que requieren client-side.
 *
 * Montado una sola vez en el layout público. Captura:
 *  - `faq_open`: cuando el usuario expande cualquier `<details>` con
 *    `data-faq-question` (HubFaq, FAQs de landings, FAQs de home).
 *  - `internal_click`: clics en enlaces internos con `data-internal-link`.
 *
 * Sin dependencias adicionales: usa `dataLayer.push` (GTM) o `gtag` si están
 * disponibles; si no, simplemente no hace nada (safe no-op).
 */
import { useEffect } from 'react';
import { trackFaqOpen, trackInternalClick } from '@/lib/analytics';

export function AnalyticsListeners() {
  useEffect(() => {
    function onToggle(e: Event) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'DETAILS') return;
      const details = target as HTMLDetailsElement;
      if (!details.open) return; // solo dispara al abrir, no al cerrar
      const question = details.getAttribute('data-faq-question');
      const page = details.getAttribute('data-faq-page') ?? undefined;
      if (question) trackFaqOpen(question, page);
    }

    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest?.('a[data-internal-link]');
      if (!anchor) return;
      const label = anchor.getAttribute('data-internal-link') ?? anchor.getAttribute('href') ?? '';
      if (label) trackInternalClick(label);
    }

    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
