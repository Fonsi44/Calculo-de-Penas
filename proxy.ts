import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, COOKIE_NAME_FALLBACK } from '@/lib/auth';

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/me',
];

const PUBLIC_API_EXACT = new Set<string>([
  '/api/delitos/count',
  '/api/health',
  '/api/whatsapp',
]);

const PUBLIC_PAGE_EXACT = new Set<string>([
  '/',
  '/_not-found',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/icon-192.svg',
  '/favicon.ico',
  '/terminos',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/disclaimer',
  '/despacho',
  '/contacto',
  '/solicitar-consulta',
  '/como-llegar',
  '/preguntas-frecuentes',
  '/blog',
  '/areas-juridicas',
  '/derecho-penal',
  '/migrantes-hondurenos-en-espana',
]);

const INTRANET_LOGIN_PATH = '/intranet/login';
const INTRANET_PUBLIC_EXACT = new Set<string>([
  INTRANET_LOGIN_PATH,
  '/intranet/recuperar-clave',
  '/intranet/acceso-denegado',
]);

// Paths intranet protegidos que NO están bajo /intranet/* (legacy).
// Mantener para que los enlaces internos antiguos (casos/[id] → /calculadora,
// cp/[id] → /cp, etc.) sigan funcionando sin redirigir al login.
const INTRANET_LEGACY_EXACT = new Set<string>([
  '/calculadora',
  '/casos',
  '/cp',
  '/delitos',
  '/atajos',
  '/delito-form',
]);
const INTRANET_LEGACY_PREFIXES = [
  '/casos/',
  '/cp/',
  '/delitos/',
];

const PUBLIC_PAGE_PREFIXES = [
  '/areas-juridicas',
  '/derecho-penal',
  '/migrantes-hondurenos-en-espana',
  '/blog/',
  '/_next/',
];

function isPublicPagePath(pathname: string): boolean {
  if (PUBLIC_PAGE_EXACT.has(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return false;
}

function isIntranetLegacyPath(pathname: string): boolean {
  if (INTRANET_LEGACY_EXACT.has(pathname)) return true;
  if (INTRANET_LEGACY_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return false;
}

function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function readToken(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value
    ?? request.cookies.get(COOKIE_NAME_FALLBACK)?.value;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // El redirect www → apex lo gestiona Vercel a nivel de dominio,
  // no en el proxy (causaba bucles de redirección con el edge).

  const token = readToken(request);

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) return NextResponse.next();
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Páginas de la intranet: si no hay token, ir al login de intranet.
  // Si hay token y está en el login, mandarlo al dashboard.
  if (pathname.startsWith('/intranet')) {
    if (INTRANET_PUBLIC_EXACT.has(pathname)) {
      if (pathname === INTRANET_LOGIN_PATH && token) {
        return NextResponse.redirect(new URL('/intranet/dashboard', request.url));
      }
      return NextResponse.next();
    }
    if (!token) {
      const loginUrl = new URL(INTRANET_LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Paths intranet legacy (no están bajo /intranet/*): requieren auth.
  // Los rewrites en next.config.ts exponen estas páginas también bajo
  // /intranet/*, pero mantenemos los paths viejos para enlaces internos.
  if (isIntranetLegacyPath(pathname)) {
    if (!token) {
      const loginUrl = new URL(INTRANET_LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isPublicPagePath(pathname)) {
    return NextResponse.next();
  }

  // Rutas protegidas no reconocidas: redirigir al login de intranet.
  const loginUrl = new URL(INTRANET_LOGIN_PATH, request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.svg|images/|BingSiteAuth\\.xml).*)',
  ],
};
