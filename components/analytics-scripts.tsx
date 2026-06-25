'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import clarity from '@microsoft/clarity';
import {
  isAnalyticsExcludedPath,
  maskMeasurementId,
  debugAnalytics,
} from '@/lib/analytics';

declare global {
  interface Window {
    gtag?: (type: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

export function AnalyticsScripts({
  gaId,
  clarityId,
}: {
  gaId: string | null;
  clarityId: string | null;
}) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (!clarityId) return;
    try {
      clarity.init(clarityId);
    } catch {
      /* silencioso */
    }
  }, [clarityId]);

  useEffect(() => {
    if (!gaId) return;
    if (!pathname || isAnalyticsExcludedPath(pathname)) return;
    if (!window.gtag) return;

    const prev = prevPath.current;

    if (!initialised.current) {
      initialised.current = true;
      // page_view automático inicial: gtag('config', gaId) con send_page_view:false
      // ya envió el primer page_view al montar. Lo reportamos como diagnóstico.
      debugAnalytics('enabled', {
        pathname,
        gaId: maskMeasurementId(gaId),
        pageView: 'auto (config)',
      });
    }

    if (prev && prev !== pathname) {
      // Navegación SPA: page_view manual con pathname + page_location.
      // page_location se toma de window.location.href (URL ya normalizada por
      // el navegador); nunca se construye a mano para evitar malformaciones.
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
      debugAnalytics('page_view (manual)', {
        pathname,
        from: prev,
      });
    }

    prevPath.current = pathname;
  }, [gaId, pathname]);

  // Ruta excluida: no se monta ningún script de GA4/GTM y no se disparan hits.
  // El log de diagnóstico se emite aquí (lado render) para que sea visible aun
  // cuando window.gtag no existiera.
  if (!pathname || isAnalyticsExcludedPath(pathname)) {
    debugAnalytics('skipped', {
      pathname: pathname ?? '(empty)',
      reason: 'excluded-path',
    });
    return null;
  }

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`}
          </Script>
        </>
      )}
    </>
  );
}
