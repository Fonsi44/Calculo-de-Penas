'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import clarity from '@microsoft/clarity';

const EXCLUDED_PREFIXES = [
  '/intranet',
  '/preview',
  '/api',
  '/cp',
  '/calculadora',
  '/casos',
  '/delitos',
  '/atajos',
  '/_next',
  '/404',
];

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

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
    if (!pathname || isExcluded(pathname)) return;
    if (!window.gtag) return;

    const prev = prevPath.current;

    if (!initialised.current) {
      initialised.current = true;
    }

    if (prev && prev !== pathname) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    prevPath.current = pathname;
  }, [gaId, pathname]);

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
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`}
          </Script>
        </>
      )}
    </>
  );
}
