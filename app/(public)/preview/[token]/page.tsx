import { notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import type { Metadata } from 'next';

const PREVIEW_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production-min-32-chars-AAAAA';

interface PreviewPayload {
  type: string;
  title: string;
  body: string;
  category: string;
  slug: string;
  description: string;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Vista previa',
};

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let payload: PreviewPayload;
  try {
    payload = jwt.verify(token, PREVIEW_SECRET) as PreviewPayload;
    if (payload.type !== 'preview') throw new Error();
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de preview */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-900 text-xs font-bold text-center py-2 px-4">
        ⚡ VISTA PREVIA — Este contenido no está publicado. Comparte esta URL solo con quien deba revisarlo.
        Expira en 1 hora.
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
          dangerouslySetInnerHTML={{ __html: payload.body }}
        />
      </article>
    </div>
  );
}
