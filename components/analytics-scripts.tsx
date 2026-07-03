'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import {
  isAnalyticsExcludedPath,
  maskMeasurementId,
  debugAnalytics,
} from '@/lib/analytics';

declare global {
  interface Window {
    gtag?: (type: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
    Clarity?: unknown;
    _fbq?: unknown;
  }
}

export function AnalyticsScripts({
  gaId,
  gtmId,
  fbPixelId,
  clarityId,
}: {
  gaId: string | null;
  gtmId: string | null;
  fbPixelId: string | null;
  clarityId: string | null;
}) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const initialised = useRef(false);

  // GTM reemplaza la carga directa de gtag.js cuando está presente: el
  // contenedor gestiona GA4 y cualquier otra etiqueta desde la UI de GTM.
  const useGtm = Boolean(gtmId);
  const effectiveGaId = useGtm ? null : gaId;

  useEffect(() => {
    if (!clarityId) return;
    if (typeof window === 'undefined') return;
    // Carga vía snippet oficial (evita empaquetar el SDK npm en el bundle
    // del cliente). Defensivo: si ya se inicializó, no reinyecta.
    if (window.Clarity) return;
    try {
      /* Carga del snippet oficial de Microsoft Clarity (lazy).
         Reemplaza al paquete npm @microsoft/clarity para no inflar el bundle. */
      const w = window as typeof window & { clarityQueue?: unknown[] };
      const methodName = 'clarity';
      w[`${methodName}Queue`] = w.clarityQueue || [];
      window.Clarity = function (...args: unknown[]) {
        w.clarityQueue!.push(args);
      };
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${clarityId}`;
      const x = document.getElementsByTagName('script')[0];
      x.parentNode?.insertBefore(s, x);
    } catch {
      /* silencioso */
    }
  }, [clarityId]);

  useEffect(() => {
    if (!effectiveGaId) return;
    if (!pathname || isAnalyticsExcludedPath(pathname)) return;
    if (!window.gtag) return;

    const prev = prevPath.current;

    if (!initialised.current) {
      initialised.current = true;
      // page_view automático inicial: gtag('config', gaId) con send_page_view:false
      // ya envió el primer page_view al montar. Lo reportamos como diagnóstico.
      debugAnalytics('enabled', {
        pathname,
        gaId: maskMeasurementId(effectiveGaId),
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
  }, [effectiveGaId, pathname]);

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
      {/* Google Consent Mode v2 — default denegado hasta que el usuario
          consienta. Los scripts de GA4/FB Pixel respetan estos flags.
          GDPR/ePrivacy: necesario para tráfico europeo (/hondurenos-en-espana).
          Sin banner de consentimiento, las cookies quedan denegadas pero las
          mediciones sin cookies (modeless/analytics) siguen funcionando. */}
      {(effectiveGaId || gtmId || fbPixelId) && (
        <Script id="consent-mode-default" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',security_storage:'granted',wait_for_update:500});`}
        </Script>
      )}

      {/* Google Tag Manager (opcional). Si NEXT_PUBLIC_GTM_ID está configurado,
          GTM gestiona GA4 y el resto de etiquetas; no se carga gtag.js directo. */}
      {useGtm && gtmId && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {/* GA4 directo (gtag.js). Solo cuando NO hay GTM configurado. */}
      {effectiveGaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${effectiveGaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${effectiveGaId}',{send_page_view:false});`}
          </Script>
        </>
      )}

      {/* Facebook Pixel (opcional). Solo activar con consentimiento de cookies
          y NEXT_PUBLIC_FB_PIXEL_ID configurado. No inventar IDs. */}
      {fbPixelId && (
        <Script id="fb-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
