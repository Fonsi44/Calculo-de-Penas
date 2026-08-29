import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Proxy público — correlation ID + clasificación de rutas.
 *
 * Tras la eliminación de intranet/SGIE/auth, ya no hay sesión JWT.
 * Cada handler API mantiene su propia validación (CRON_SECRET, firma webhook, etc.).
 */

const PUBLIC_API_EXACT = new Set<string>([
  '/api/delitos/count',
  '/api/health',
  '/api/health/readiness',
  '/api/whatsapp',
  '/api/indexnow-key',
  '/api/contacto',
  '/api/consulta',
  '/api/subscribe',
  '/api/descargar',
  '/api/og',
  '/api/chat',
  '/api/clasificaciones',
  '/api/remisiones-normativas',
  '/api/public-config',
]);

const PUBLIC_API_PREFIXES = [
  '/api/delitos',
  '/api/cp',
  '/api/health',
];

const WEBHOOK_AUTH_API_PREFIXES = [
  '/api/email/inbound',
];

const CRON_AUTH_API_EXACT = new Set<string>([
  '/api/revalidate',
]);

const CRON_AUTH_API_PREFIXES = [
  '/api/legal',
];

const PUBLIC_PAGE_EXACT = new Set<string>([
  '/',
  '/_not-found',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/terminos',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/disclaimer',
  '/politica-editorial',
  '/despacho',
  '/solicitar-consulta',
  '/como-llegar',
  '/preguntas-frecuentes',
  '/blog',
  '/servicios-juridicos',
  '/derecho-penal',
  '/hondurenos-en-espana',
]);

const OBSOLETE_PUBLIC_PREFIXES = [
  '/areas-juridicas',
  '/migrantes-hondurenos-en-espana',
  '/hodurenos-en-espana',
  '/intranet',
  '/admin',
  '/cargar',
  '/preview',
];

const PUBLIC_PAGE_PREFIXES = [
  '/servicios-juridicos',
  '/derecho-penal',
  '/hondurenos-en-espana',
  '/blog/',
  '/abogados-en-',
  '/_next/',
];

export function isPublicPagePath(pathname: string): boolean {
  if (PUBLIC_PAGE_EXACT.has(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return false;
}

/** Rutas API que el proxy deja pasar (handler valida por su cuenta). */
export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p + '/') || pathname === p)) return true;
  if (WEBHOOK_AUTH_API_PREFIXES.some(p => pathname.startsWith(p + '/') || pathname === p)) return true;
  if (CRON_AUTH_API_EXACT.has(pathname)) return true;
  if (CRON_AUTH_API_PREFIXES.some(p => pathname.startsWith(p + '/') || pathname === p)) return true;
  return false;
}

/** Compatibilidad de tests: ya no hay APIs de sesión JWT. */
export function isSessionApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false;
  return !isPublicApiPath(pathname);
}

function withCorrelationId(response: NextResponse, correlationId: string): NextResponse {
  response.headers.set('x-correlation-id', correlationId);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const correlationId = request.headers.get('x-correlation-id') || randomUUID();

  if (pathname.startsWith('/api/')) {
    // APIs conocidas: pasar al handler.
    // APIs desconocidas: también pasar (Next.js devolverá 404).
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  if (isPublicPagePath(pathname)) {
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  if (OBSOLETE_PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  return withCorrelationId(NextResponse.next(), correlationId);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|images/|BingSiteAuth\\.xml|.*\\.txt).*)',
  ],
};
