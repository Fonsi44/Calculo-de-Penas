'use client';

/**
 * Error boundary global (5xx y runtime errors en rutas públicas).
 *
 * Next.js App Router NO permite exportar `metadata` desde un Client Component
 * (los error boundaries deben ser `'use client'`). Para garantizar noindex,
 * inyectamos `<meta name="robots" content="noindex,nofollow">` en el `<head>`
 * vía la API `next/script`-style con `key` para que React lo mueva al head.
 *
 * El soporte de React 19 para metadata inyectada en componentes cliente permite
 * que esta etiqueta acabe en el `<head>` renderizado.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { site } from '@/lib/site';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error.digest, error.message);
  }, [error]);

  return (
    <main className="min-h-[60vh] grid place-items-center px-6 py-16 text-center">
      {/* noindex inyectado al head: Next.js renderiza meta con name/key en head
          aunque provenga de un Client Component error boundary. */}
      <meta name="robots" content="noindex, nofollow" />
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">
          Error temporal
        </p>
        <h1 className="mt-2 font-serif text-3xl text-primary">Algo salió mal</h1>
        <p className="mt-4 text-text-secondary leading-relaxed">
          No se pudo cargar la página. Inténtelo de nuevo en unos instantes.
          Si el problema persiste, escríbanos a{' '}
          <a
            href={`mailto:${site.email}`}
            className="text-accent-dark underline underline-offset-2"
          >
            {site.email}
          </a>{' '}
          o por WhatsApp{' '}
          <a
            href={`https://wa.me/${site.whatsapp}`}
            className="text-accent-dark underline underline-offset-2"
          >
            {site.phoneDisplay}
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:border-accent hover:text-accent-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
