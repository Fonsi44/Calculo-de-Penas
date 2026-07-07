/**
 * Base de conocimiento del chat asistente — allowlist de enlaces públicos.
 *
 * Este módulo conserva la allowlist de rutas públicas que el asistente puede
 * sugerir y la función de validación `isAllowedPublicLink`. Es la ÚNICA
 * lista de URLs autorizadas: cualquier otra ruta (intranet, admin, login,
 * api, dashboard, auth, archivos técnicos) se rechaza.
 *
 * HISTÓRICO: antes contenía `buildKnowledgeBase()` (texto inyectado al
 * system prompt de DeepSeek) y `buildRAGContext()` (contexto vectorial para
 * el LLM). Ambos se eliminaron al suprimir DeepSeek del chat público (Jul 2026).
 * El motor de reglas local no necesita ni system prompt ni RAG.
 *
 * FUENTE: los slugs provienen de rutas reales de app/(public)/.
 */

import { site } from '@/lib/site';

/**
 * Allowlist de enlaces públicos que el asistente puede citar o sugerir.
 * Es la ÚNICA lista de URLs autorizadas: cualquier otra ruta (intranet,
 * admin, login, api, dashboard, auth, archivos técnicos) se rechaza.
 * Los slugs provienen de rutas reales de app/(public)/.
 */
export const PUBLIC_LINKS_ALLOWLIST = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  '/hondurenos-en-espana',
  '/despacho',
  '/preguntas-frecuentes',
  '/blog',
  '/contacto',
  '/solicitar-consulta',
  '/como-llegar',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/terminos',
  '/politica-editorial',
  '/disclaimer',
  '/guia-legal-abogados-honduras',
] as const;

/** Verifica que un path o URL solo apunte a rutas públicas permitidas.
 *  Acepta paths relativos ("/servicios-juridicos") y absolutos del propio
 *  dominio. Rechaza cualquier ruta privada, de API, o externa no autorizada. */
export function isAllowedPublicLink(href: string): boolean {
  if (!href || typeof href !== 'string') return false;
  let path = href.trim();

  // Tel / mailto / wa.me son canales oficiales, permitidos.
  if (/^(tel:|mailto:|https:\/\/wa\.me\/)/i.test(path)) return true;

  // URLs absolutas del propio dominio: extraer el path.
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      if (u.origin !== site.url) return false; // dominio externo no autorizado
      path = u.pathname;
    } catch {
      return false;
    }
  }

  if (!path.startsWith('/')) return false;

  // Rechazo explícito de rutas privadas / técnicas aunque estén "dentro" del dominio.
  const forbidden = [
    '/intranet', '/admin', '/login', '/dashboard', '/panel',
    '/auth', '/private', '/api', '/cargar', '/preview',
  ];
  if (forbidden.some((p) => path === p || path.startsWith(p + '/'))) return false;

  // Coincidencia exacta o prefijo de subruta (p. ej. /blog/...).
  return PUBLIC_LINKS_ALLOWLIST.some(
    (allowed) => path === allowed || path.startsWith(allowed + '/'),
  );
}
