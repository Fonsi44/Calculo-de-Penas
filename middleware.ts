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
]);

const PUBLIC_PAGE_EXACT = new Set<string>(['/login', '/_not-found', '/terminos', '/privacidad']);

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
  const token = readToken(request);

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) return NextResponse.next();
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PAGE_EXACT.has(pathname)) {
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.svg|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
};
