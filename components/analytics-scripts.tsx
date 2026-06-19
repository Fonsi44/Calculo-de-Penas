'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * Monta los scripts de analítica (GA4 + Microsoft Clarity) SOLO en rutas
 * públicas. Excluye la intranet y las vistas previas para evitar que el
 * tráfico interno del personal del bufete contamine las métricas de marketing.
 *
 * Antes (app/layout.tsx) los `<Script>` se inyectaban en TODAS las rutas,
 * incluyendo `/intranet/admin/*` (que aparecía entre las top pages de GA4).
 * Este componente centraliza el filtrado por pathname.
 *
 * Rutas excluidas (no se carga analítica):
 *   - `/intranet/*`      → panel interno privado (contaminación por personal)
 *   - `/preview/*`       → vistas previas de contenido (no son visitas reales)
 *   - `/api/*`           → endpoints (sin HTML real)
 *
 * El loader de GA4 usa `strategy="lazyOnload"` para no bloquear el render
 * ni penalizar Core Web Vitals. Clarity idem.
 */
const EXCLUDED_PREFIXES = ['/intranet', '/preview', '/api'];

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function AnalyticsScripts({
  gaId,
  clarityId,
}: {
  gaId: string | null;
  clarityId: string | null;
}) {
  const pathname = usePathname();

  // Sin pathname (SSR sin router) o ruta excluida → no cargar analítica.
  if (!pathname || isExcluded(pathname)) {
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
          <Script id="ga4" strategy="lazyOnload">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
          </Script>
        </>
      )}
      {clarityId && (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, 'clarity', 'script', '${clarityId}');`}
        </Script>
      )}
    </>
  );
}
