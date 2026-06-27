import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, COOKIE_NAME_FALLBACK } from '@/lib/auth';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

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
  '/api/indexnow-key',
  '/api/contacto',
  '/api/consulta',
  '/api/subscribe',
  '/api/descargar',
  '/api/og',
  '/api/oauth/callback',
]);

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

const INTRANET_LOGIN_PATH = '/intranet/login';
const INTRANET_PUBLIC_EXACT = new Set<string>([
  INTRANET_LOGIN_PATH,
  '/intranet/recuperar-clave',
  '/intranet/acceso-denegado',
]);

// Rutas públicas obsoletas que deben devolver 404 en lugar de redirigir al login.
const OBSOLETE_PUBLIC_PREFIXES = [
  '/areas-juridicas',
  '/migrantes-hondurenos-en-espana',
  '/hodurenos-en-espana',
];

const PUBLIC_PAGE_PREFIXES = [
  '/servicios-juridicos',
  '/derecho-penal',
  '/hondurenos-en-espana',
  '/blog/',
  '/abogados-en-', // Landings locales de SEO (/abogados-en-nacaome, etc.)
  '/_next/',
];

// Exportadas para poder testear la clasificación de rutas (tests/seo-protection.test.ts).
export function isPublicPagePath(pathname: string): boolean {
  if (PUBLIC_PAGE_EXACT.has(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return false;
}

export function isPublicApiPath(pathname: string): boolean {
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
    // Rutas admin API: verificar rol admin desde el token JWT.
    if (pathname.startsWith('/api/admin')) {
      const payload = decodeJwtPayload(token);
      if (!payload || payload.rol !== 'admin') {
        return NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // Páginas de la intranet: si no hay token, ir al login de intranet.
  // Si hay token y está en el login, mandarlo a su zona según rol:
  // admin → /intranet/admin; abogado → /intranet/sgie.
  if (pathname.startsWith('/intranet')) {
    if (INTRANET_PUBLIC_EXACT.has(pathname)) {
      if (pathname === INTRANET_LOGIN_PATH && token) {
        const loginPayload = decodeJwtPayload(token);
        const destino = loginPayload?.rol === 'admin' ? '/intranet/admin' : '/intranet/sgie';
        return NextResponse.redirect(new URL(destino, request.url));
      }
      return NextResponse.next();
    }
    if (!token) {
      const loginUrl = new URL(INTRANET_LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Redirigir admin users de rutas intranet legacy a sus versiones admin
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.rol === 'admin') {
        const adminRedirects: Record<string, string> = {
          '/intranet/calculadora': '/intranet/admin/calculadora',
          '/intranet/casos': '/intranet/admin/casos',
          '/intranet/cp': '/intranet/admin/cp',
          '/intranet/delitos': '/intranet/admin/delitos',
        };
        const adminRedirect = adminRedirects[pathname];
        if (adminRedirect) {
          return NextResponse.redirect(new URL(adminRedirect, request.url));
        }
        // También redirigir rutas legacy con ID bajo /intranet/
        if (pathname.startsWith('/intranet/casos/') && !pathname.startsWith('/intranet/admin/')) {
          return NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url));
        }
        if (pathname.startsWith('/intranet/cp/') && !pathname.startsWith('/intranet/admin/')) {
          return NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url));
        }
        if (pathname.startsWith('/intranet/delitos/') && !pathname.startsWith('/intranet/admin/')) {
          return NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url));
        }
      }
    }
    // Rutas admin: verificar rol admin desde el token JWT.
    if (pathname.startsWith('/intranet/admin')) {
      const payload = decodeJwtPayload(token);
      if (!payload || payload.rol !== 'admin') {
        return NextResponse.redirect(new URL(INTRANET_LOGIN_PATH, request.url));
      }
    }
    return NextResponse.next();
  }

  if (isPublicPagePath(pathname)) {
    return NextResponse.next();
  }

  // Rutas públicas obsoletas: 404 en lugar de redirigir al login.
  if (OBSOLETE_PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Rutas no reconocidas: pasar a Next.js para que devuelva 404 (not-found.tsx).
  // Esto evita que crawlers y usuarios vean un redirect 307 en lugar del 404 real.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|images/|BingSiteAuth\\.xml|.*\\.txt).*)',
  ],
};
