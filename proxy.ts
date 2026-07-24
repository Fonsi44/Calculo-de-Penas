import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { COOKIE_NAME, COOKIE_NAME_FALLBACK, verifyToken, validateSessionFreshness } from '@/lib/auth';
import { assertSgieAccess } from '@/lib/access-service';
import { isAdminRole } from '@/lib/roles';

/**
 * Seguridad — verificación firma JWT en edge + frescura de sesión.
 *
 * Antes este proxy decodificaba el payload sin verificar firma HS256, lo que
 * permitía teóricamente forjar un JWT con `rol: admin` para bypassear el
 * filtro de rol en edge. La defensa real estaba en cada handler (`requireAdmin`
 * / `requireAuth` que sí verifican), pero el edge era filtrable.
 *
 * Ahora usamos `verifyToken` de `lib/auth` (que corre en Node runtime — este
 * proxy no declara `runtime: 'edge'` explícito, así que Next lo ejecuta en
 * Node y puede usar `jsonwebtoken` con acceso al secret). Si en el futuro se
 * moviera a edge runtime, se deberá migrar a `jose` o degradar el proxy a
 * filtro no autoritativo (handlers server-side siguen siendo fuente de verdad).
 *
 * Además valida la frescura de la sesión (`token_version` + `active` + `bloqueado`)
 * contra la DB con caché corta, para que un cambio de contraseña o bloqueo
 * admin revoke sesiones activas sin esperar a que el cliente consulte `/me`.
 */
function roleFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.rol ?? null;
}

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/invitaciones',
  '/api/auth/me',
  // SGIE — portal de carga por enlace mágico (público por token, no indexable).
  // La validación real (token, expiración, usos, MIME, hash) la hace el handler.
  '/api/public/cargar',
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
  // Chat asistente público (rate-limit + guardrails server-side en el handler).
  '/api/chat',
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

const INTRANET_PUBLIC_PREFIXES = [
  '/intranet/activar-invitacion',
  '/intranet/restablecer-clave',
];

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

function withCorrelationId(response: NextResponse, correlationId: string): NextResponse {
  response.headers.set('x-correlation-id', correlationId);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Correlation ID para trazabilidad en logs y respuesta al cliente.
  // Si el cliente ya envía x-correlation-id, se reutiliza; si no, se genera.
  const correlationId = request.headers.get('x-correlation-id') || randomUUID();

  // El redirect www → apex lo gestiona Vercel a nivel de dominio,
  // no en el proxy (causaba bucles de redirección con el edge).

  const token = readToken(request);

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) return withCorrelationId(NextResponse.next(), correlationId);
    if (!token) {
      return withCorrelationId(NextResponse.json({ error: 'No autorizado' }, { status: 401 }), correlationId);
    }
    const payload = verifyToken(token);
    if (!payload) {
      return withCorrelationId(NextResponse.json({ error: 'No autorizado' }, { status: 401 }), correlationId);
    }
    // Frescura: revoca sesiones cuyo token_version/bloqueo/active hayan cambiado.
    try {
      await validateSessionFreshness(payload.userId, payload.tokenVersion);
    } catch {
      return withCorrelationId(NextResponse.json({ error: 'No autorizado' }, { status: 401 }), correlationId);
    }
    // Rutas admin API: verificar rol admin desde el token JWT.
    if (pathname.startsWith('/api/admin')) {
      if (!isAdminRole(payload.rol)) {
        return withCorrelationId(NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 }), correlationId);
      }
    }
    // SGIE API: requiere rol abogado o admin (defensa en profundidad; el handler
    // vuelve a validar con requireAbogado + scope por abogado).
    if (pathname.startsWith('/api/sgie')) {
      if (!isAdminRole(payload.rol) && payload.rol !== 'abogado' && payload.rol !== 'supervisor') {
        return withCorrelationId(NextResponse.json({ error: 'Acceso denegado: se requiere rol abogado o admin' }, { status: 403 }), correlationId);
      }
      try {
        await assertSgieAccess(payload.userId);
      } catch {
        return withCorrelationId(NextResponse.json({ error: 'Acceso SGIE deshabilitado' }, { status: 403 }), correlationId);
      }
    }
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  // Páginas de la intranet: si no hay token, ir al login de intranet.
  // Si hay token y está en el login, mandarlo a su zona según rol:
  // admin → /intranet/admin; abogado → /intranet/sgie.
  if (pathname.startsWith('/intranet')) {
    if (
      INTRANET_PUBLIC_EXACT.has(pathname)
      || INTRANET_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(`${prefix}/`))
    ) {
	  if (pathname === INTRANET_LOGIN_PATH && token) {
        const rol = roleFromToken(token);
        const destino = isAdminRole(rol) ? '/intranet/admin' : '/intranet/sgie';
        return withCorrelationId(NextResponse.redirect(new URL(destino, request.url)), correlationId);
      }
      return withCorrelationId(NextResponse.next(), correlationId);
    }
    if (!token) {
      const loginUrl = new URL(INTRANET_LOGIN_PATH, request.url);
      return withCorrelationId(NextResponse.redirect(loginUrl), correlationId);
    }
    // Validar sesión (firma + frescura). Una sesión revocada (token_version,
    // bloqueo o desactivación) redirige al login en lugar de cargar la intranet.
    const payload = verifyToken(token);
    if (!payload) {
      return withCorrelationId(NextResponse.redirect(new URL(INTRANET_LOGIN_PATH, request.url)), correlationId);
    }
    try {
      await validateSessionFreshness(payload.userId, payload.tokenVersion);
    } catch {
      return withCorrelationId(NextResponse.redirect(new URL(INTRANET_LOGIN_PATH, request.url)), correlationId);
    }
    const rol = payload.rol;
    if (pathname.startsWith('/intranet/sgie')) {
      try {
        await assertSgieAccess(payload.userId);
      } catch {
        return withCorrelationId(NextResponse.redirect(new URL('/intranet/acceso-denegado', request.url)), correlationId);
      }
    }
    // Redirigir admin users de rutas intranet legacy a sus versiones admin
    if (isAdminRole(rol)) {
      const adminRedirects: Record<string, string> = {
        '/intranet/calculadora': '/intranet/admin/calculadora',
        '/intranet/casos': '/intranet/admin/casos',
        '/intranet/cp': '/intranet/admin/cp',
        '/intranet/delitos': '/intranet/admin/delitos',
      };
      const adminRedirect = adminRedirects[pathname];
      if (adminRedirect) {
        return withCorrelationId(NextResponse.redirect(new URL(adminRedirect, request.url)), correlationId);
      }
      // También redirigir rutas legacy con ID bajo /intranet/
      if (pathname.startsWith('/intranet/casos/') && !pathname.startsWith('/intranet/admin/')) {
        return withCorrelationId(NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url)), correlationId);
      }
      if (pathname.startsWith('/intranet/cp/') && !pathname.startsWith('/intranet/admin/')) {
        return withCorrelationId(NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url)), correlationId);
      }
      if (pathname.startsWith('/intranet/delitos/') && !pathname.startsWith('/intranet/admin/')) {
        return withCorrelationId(NextResponse.redirect(new URL(pathname.replace('/intranet/', '/intranet/admin/'), request.url)), correlationId);
      }
    }
    // Rutas admin: verificar rol admin desde el token JWT.
    if (pathname.startsWith('/intranet/admin')) {
      if (!isAdminRole(rol)) {
        return withCorrelationId(NextResponse.redirect(new URL(INTRANET_LOGIN_PATH, request.url)), correlationId);
      }
    }
    // SGIE — aislamiento por rol. Un usuario NO admin que intente acceder a
    // herramientas internas legacy (calculadora, casos, cp, delitos, agravantes,
    // delito-form) o a cualquier ruta intranet no autorizada para abogados,
    // se redirige a su cockpit SGIE. El admin conserva acceso a todo.
    // Referencia: pinedayasociados.md §6.1, §22.1.
    {
      const esAdmin = isAdminRole(rol);
      if (!esAdmin) {
        const RUTAS_SGIE_PERMITIDAS = pathname.startsWith('/intranet/sgie');
        const RUTA_TRANSITO = pathname === '/intranet/dashboard';
        if (!RUTAS_SGIE_PERMITIDAS && !RUTA_TRANSITO) {
          return withCorrelationId(NextResponse.redirect(new URL('/intranet/sgie', request.url)), correlationId);
        }
      }
    }
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  if (isPublicPagePath(pathname)) {
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  // Rutas públicas obsoletas: 404 en lugar de redirigir al login.
  if (OBSOLETE_PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return withCorrelationId(NextResponse.next(), correlationId);
  }

  // Rutas no reconocidas: pasar a Next.js para que devuelva 404 (not-found.tsx).
  // Esto evita que crawlers y usuarios vean un redirect 307 en lugar del 404 real.
  return withCorrelationId(NextResponse.next(), correlationId);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|images/|BingSiteAuth\\.xml|.*\\.txt).*)',
  ],
};
