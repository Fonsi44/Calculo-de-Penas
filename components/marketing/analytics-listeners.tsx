'use client';

/**
 * Listener global de eventos analíticos que requieren client-side.
 *
 * Montado una sola vez en el layout público. Captura:
 *  - `faq_open`: cuando el usuario expande cualquier `<details>` con
 *    `data-faq-question` (HubFaq, FAQs de landings, FAQs de home).
 *  - `internal_click`: clics en enlaces internos con `data-internal-link`.
 *  - `scroll_depth`: umbrales 25/50/75/90% (una vez por umbral por página).
 *
 * Sin dependencias adicionales: usa `dataLayer.push` (GTM) o `gtag` si están
 * disponibles; si no, simplemente no hace nada (safe no-op).
 */
import { useEffect } from 'react';
import { trackFaqOpen, trackInternalClick, trackScrollDepth } from '@/lib/analytics';

const SCROLL_THRESHOLDS = [25, 50, 75, 90];

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

    // Scroll depth: dispara una vez por umbral (25/50/75/90%). Usa rAF + pase
    // único para no saturar el main thread. Se resetea si el usuario vuelve a
    // arriba y baja de nuevo (no dispara dos veces el mismo umbral en la
    // misma carga de página salvo que recargue).
    const fired = new Set<number>();
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop;
        const height = doc.scrollHeight - doc.clientHeight;
        if (height <= 0) return;
        const pct = Math.round((scrollTop / height) * 100);
        for (const threshold of SCROLL_THRESHOLDS) {
          if (pct >= threshold && !fired.has(threshold)) {
            fired.add(threshold);
            trackScrollDepth(threshold);
          }
        }
      });
    }

    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return null;
}
