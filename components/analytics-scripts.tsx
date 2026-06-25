'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import clarity from '@microsoft/clarity';

/**
 * Monta los scripts de analítica (GA4 + Microsoft Clarity) SOLO en rutas
 * públicas. Excluye la intranet y las vistas previas para evitar que el
 * tráfico interno del personal del bufete contamine las métricas de marketing.
 *
 * Clarity se inicializa vía `@microsoft/clarity` (npm) en lugar del snippet
 * embebido, lo que proporciona tipos TypeScript y la capacidad de trackear
 * eventos personalizados, identificar usuarios y etiquetar sesiones.
 *
 * Rutas excluidas (no se carga analítica):
 *   - `/intranet/*`      → panel interno privado (contaminación por personal)
 *   - `/preview/*`       → vistas previas de contenido (no son visitas reales)
 *   - `/api/*`           → endpoints (sin HTML real)
 *   - `/cp`, `/calculadora`, `/casos`, `/delitos`, `/atajos`
 *                       → rutas internas legacy (privadas, no comerciales).
 *                         Refuerzo R6 (AGENTS.md): nunca trackear en intranet.
 *                         Auditoría SEO 2026-06-25 detectó GA4 midiendo 1
 *                         sesión orgánica en /cp (fuga de tracking pública
 *                         en ruta interna). Cerrado aquí con robustez futura:
 *                         cualquier nueva ruta privada añadida al proxy debe
 *                         también añadirse aquí.
 *
 * GA4 usa `strategy="lazyOnload"` para no penalizar Core Web Vitals.
 * Clarity se init desde useEffect (lazy).
 */
const EXCLUDED_PREFIXES = [
  '/intranet',
  '/preview',
  '/api',
  // Rutas internas/privadas (proxy.ts exige auth o son legacy). NO trackear
  // en GA4/Clarity: solo el tráfico público comercial debe alimentar métricas.
  '/cp',
  '/calculadora',
  '/casos',
  '/delitos',
  '/atajos',
];

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

  // Inicializar Clarity vía npm package (solo cliente, lazy).
  useEffect(() => {
    if (!clarityId) return;
    try {
      clarity.init(clarityId);
    } catch {
      // Silenciar error para no romper la app si Clarity falla.
    }
  }, [clarityId]);

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
    </>
  );
}
