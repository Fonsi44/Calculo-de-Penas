import { NextResponse } from 'next/server';

/**
 * Endpoint mínimo de configuración pública.
 *
 * Devuelve exclusivamente la Site Key de Turnstile (clave pública, no secreta).
 * Se cachea en el CDN durante 1 hora porque la Site Key no cambia.
 *
 * NO expone secretos (TURNSTILE_SECRET_KEY, DATABASE_URL, etc.).
 */
export async function GET() {
  const turnstileSiteKey =
    process.env.TURNSTILE_SITE_KEY ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return NextResponse.json(
    { turnstileSiteKey },
    {
      status: 200,
      headers: {
        // Cache CDN durante 1h. La Site Key es pública y no cambia con frecuencia.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}

// Debe evaluarse en runtime: una respuesta estática congelaría las variables
// del entorno de Vercel en el momento del build.
export const dynamic = 'force-dynamic';
