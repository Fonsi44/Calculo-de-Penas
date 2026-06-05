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
]);

const PUBLIC_PAGE_EXACT = new Set<string>([
  '/',
  '/login',
  '/_not-found',
  '/terminos',
  '/privacidad',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/disclaimer',
  '/despacho',
  '/contacto',
  '/solicitar-consulta',
  '/como-llegar',
  '/preguntas-frecuentes',
  '/derecho-penal-hondureno',
  '/proceso-penal',
  '/blog',
]);

const PUBLIC_PAGE_PREFIXES = [
  '/areas-de-practica',
  '/blog/',
  '/_next/',
];

function isPublicPagePath(pathname: string): boolean {
  if (PUBLIC_PAGE_EXACT.has(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some(p => pathname.startsWith(p))) return true;
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // El redirect www → apex lo gestiona Vercel a nivel de dominio,
  // no en el middleware (causaba bucles de redirección con el edge).

  const token = readToken(request);

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) return NextResponse.next();
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isPublicPagePath(pathname)) {
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.svg).*)',
  ],
};
