import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { consumePreviewToken } from '@/lib/preview-db';
import {
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
} from '@/lib/blog-html-sanitizer';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Vista previa',
};

/**
 * Vista previa de contenido — Phase 2.
 *
 * El token es opaco (no JWT), almacenado server-side en `preview_tokens`.
 * Requiere autenticación para acceder. El HTML se sanitiza con allowlist
 * estricta antes de renderizar (defensa en profundidad: ya se sanitizó al
 * crear el token, pero se re-sanitiza al servir).
 *
 * Cabeceras:
 * - Cache-Control: no-store (nunca cachear previews)
 * - X-Robots-Tag: noindex, nofollow
 */
export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Require authentication. If not logged in, redirect to intranet login.
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  // Build a minimal Request-like object for cookie extraction
  const reqLike = new Request('http://localhost', { headers: { cookie: cookieHeader || '' } });
  const sessionToken = getTokenFromCookies(reqLike);
  if (!sessionToken || !verifyToken(sessionToken)) {
    redirect('/intranet/login');
  }

  // Look up and consume the opaque preview token. Single-use (compare-and-set).
  const payload = await consumePreviewToken(token);
  if (!payload) {
    notFound();
  }

  // Defense in depth: re-sanitize HTML before serving.
  const safeSource = sanitizeBlogSourceHtml(payload.body);
  const safeBody = sanitizeBlogRenderedHtml(safeSource.html).html;

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-900 text-xs font-bold text-center py-2 px-4">
        ⚡ VISTA PREVIA — Este contenido no está publicado. Comparte esta URL solo con quien deba revisarlo.
        Expira en 1 hora. Este token es de un solo uso.
      </div>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
            {payload.category} · Vista previa
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl text-gray-900 leading-tight">
            {payload.title}
          </h1>
          {payload.description && (
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">
              {payload.description}
            </p>
          )}
        </header>

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />
      </article>
    </div>
  );
}
