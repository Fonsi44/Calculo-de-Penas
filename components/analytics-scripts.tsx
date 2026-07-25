'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import {
  isAnalyticsExcludedPath,
  debugAnalytics,
  isValidGaMeasurementId,
  isValidGtmId,
  trackEvent
} from '@/lib/analytics';
import { getConsentSnapshot, parseConsentSnapshot, subscribeConsent } from '@/lib/cookie-consent';

type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    gtag?: (type: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    clarity?: ClarityFunction;
    _fbq?: unknown;
  }
}

const GTAG_DEFER_TIMEOUT_MS = 5000;
const GTAG_INTERACTION_EVENTS = ['mousemove', 'scroll', 'click', 'keydown', 'touchstart'] as const;

export function AnalyticsScripts({
  gaId,
  gtmId,
  fbPixelId,
  clarityId,
  analyticsEnabled,
}: {
  gaId: string | null;
  gtmId: string | null;
  fbPixelId: string | null;
  clarityId: string | null;
  analyticsEnabled: boolean;
}) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const initialised = useRef(false);
  const consentSnapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const consent = useMemo(() => parseConsentSnapshot(consentSnapshot), [consentSnapshot]);

  const analyticsGranted = consent?.analytics === true;
  const validGtmId = analyticsEnabled && analyticsGranted && isValidGtmId(gtmId) ? gtmId : null;
  const validGaId = analyticsEnabled && analyticsGranted && isValidGaMeasurementId(gaId) ? gaId : null;
  const useGtm = Boolean(validGtmId);
  const effectiveGaId = useGtm ? null : validGaId;

  // SEO CTA click tracker
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;
      const el = target.closest('[data-event-name]');
      if (!el) return;
      const eventName = el.getAttribute('data-event-name');
      if (eventName) {
        trackEvent(eventName, {
          cta_location: el.getAttribute('data-cta-location') || 'unknown',
          destination_url: el.getAttribute('href') || 'unknown',
          source_url: window.location.pathname,
          cta_topic: el.getAttribute('data-cta-topic') || 'general',
        });
        debugAnalytics(`event: ${eventName}`, {
          destination: el.getAttribute('href'),
        });
      }
    }
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Clarity lazy load
  useEffect(() => {
    if (!analyticsEnabled || !analyticsGranted || !clarityId) return;
    if (typeof window === 'undefined') return;
    if (window.clarity) return;
    try {
      const clarity = function (...args: unknown[]) {
        clarity.q = clarity.q || [];
        clarity.q.push(args);
      } as ClarityFunction;
      window.clarity = clarity;
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${clarityId}`;
      const x = document.getElementsByTagName('script')[0];
      x.parentNode?.insertBefore(s, x);
    } catch { /* silencioso */ }
  }, [analyticsEnabled, analyticsGranted, clarityId]);

  // Deferred gtag.js external script load (interaction + adaptive timeout)
  useEffect(() => {
    if (!effectiveGaId) return;
    if (!pathname || isAnalyticsExcludedPath(pathname)) return;
    if (typeof document === 'undefined') return;

    const src = `https://www.googletagmanager.com/gtag/js?id=${effectiveGaId}`;
    let fired = false;

    const isMobile = typeof navigator !== 'undefined' && (
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
    const conn = (typeof navigator !== 'undefined' && 'connection' in navigator)
      ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType
      : undefined;
    const isSlowConnection = conn === 'slow-2g' || conn === '2g';
    const adaptiveTimeout = isSlowConnection ? 2000 : isMobile ? 3000 : GTAG_DEFER_TIMEOUT_MS;

    function inject() {
      if (fired) return;
      fired = true;
      if (timer) window.clearTimeout(timer);
      for (const ev of GTAG_INTERACTION_EVENTS) {
        window.removeEventListener(ev, inject, true);
      }
      if (document.querySelector(`script[src="${src}"]`)) return;
      const s = document.createElement('script');
      s.async = true;
      s.src = src;
      document.head.appendChild(s);
    }

    const timer = window.setTimeout(inject, adaptiveTimeout);

    for (const ev of GTAG_INTERACTION_EVENTS) {
      window.addEventListener(ev, inject, { once: true, passive: true, capture: true });
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      for (const ev of GTAG_INTERACTION_EVENTS) {
        window.removeEventListener(ev, inject, true);
      }
    };
  }, [effectiveGaId, pathname]);

  // Estrategia ÚNICA de page_view:
  //   - send_page_view: false en el config (no se envía page_view automático)
  //   - Primera carga: se envía page_view manual desde el efecto
  //   - Navegación SPA: se envía page_view manual con el pathname anterior como referrer
  //   - Re-render con misma ruta: cero eventos
  //   - El título se captura después de requestAnimationFrame para esperar a metadata
  function sendPageView(pagePath: string, referrer: string) {
    const w = window;
    if (!w.gtag) return;
    w.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: w.location.href,
      page_title: document.title,
      page_referrer: referrer,
    });
  }

  useEffect(() => {
    if (!effectiveGaId) return;
    if (!pathname || isAnalyticsExcludedPath(pathname)) return;

    const prev = prevPath.current;

    if (!initialised.current) {
      initialised.current = true;
      // Primera carga: page_view manual con document.referrer (origen externo real)
      // El efecto se ejecuta tras el commit de React, cuando document.title ya está actualizado
      sendPageView(pathname, document.referrer);
      debugAnalytics('page_view (first)', {
        pathname,
        referrer: document.referrer,
        title: document.title,
      });
    } else if (prev && prev !== pathname) {
      // Navegación SPA: page_view manual con la ruta anterior como referrer
      sendPageView(pathname, prev);
      debugAnalytics('page_view (spa)', {
        pathname,
        from: prev,
        title: document.title,
      });
    }

    prevPath.current = pathname;
  }, [effectiveGaId, pathname]);

  // Ruta excluida: no se monta nada
  if (!pathname || isAnalyticsExcludedPath(pathname)) {
    debugAnalytics('skipped', {
      pathname: pathname ?? '(empty)',
      reason: 'excluded-path',
    });
    return null;
  }

  return (
    <>
      {/* Google Consent Mode v2 — default denegado */}
      {analyticsEnabled && (gaId || gtmId || fbPixelId) && (
        <Script id="consent-mode-default" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',security_storage:'granted',wait_for_update:500});`}
        </Script>
      )}

      {/* Google Tag Manager */}
      {useGtm && validGtmId && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${validGtmId}');`}
        </Script>
      )}

      {/* GA4 directo — send_page_view: false para control manual completo */}
      {effectiveGaId && (
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config','${effectiveGaId}',{send_page_view:false});`}
        </Script>
      )}
    </>
  );
}
