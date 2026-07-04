/**
 * Base de conocimiento del chat asistente.
 *
 * FUENTE ÚNICA: se deriva de datos públicos ya aprobados del proyecto
 * (data/areas-juridicas.ts y lib/site.ts). NO inventa servicios, ni penas,
 * ni datos legales. El modelo responde prioritariamente desde este texto.
 *
 * Si una información no está aquí, el asistente debe decirlo claramente y
 * derivar al despacho (regla del system prompt).
 *
 * NO incluir aquí: datos de intranet, credenciales, endpoints, configuración
 * técnica, ni nada que no sea público y comercial.
 */

import { areasGenerales, hubPenal, hubMigrantes } from '@/data/areas-juridicas';
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

/** Construye el texto plano de la base de conocimiento inyectada al modelo. */
export function buildKnowledgeBase(): string {
  const serviciosGenerales = areasGenerales
    .map((a) => `- ${a.titulo}: ${a.resumen}`)
    .join('\n');

  const gruposPenal = hubPenal.grupos
    .map((g) => `- ${g.titulo}: ${g.resumen}`)
    .join('\n');

  const subareasMigrantes = hubMigrantes.subareas
    .map((g) => `- ${g.titulo}: ${g.resumen}`)
    .join('\n');

  return `BASE DE CONOCIMIENTO APROBADA — Pineda y Asociados

IDENTIDAD:
- Bufete jurídico en Nacaome, Valle, Honduras (zona sur).
- Dirección: ${site.address.full}.
- Horario: ${site.hours}.
- Teléfono: ${site.phoneDisplay} (${site.phone}).
- WhatsApp: ${site.whatsappDisplay}.
- Email: ${site.email}.
- Sitio web: ${site.url}.

SERVICIOS JURÍDICOS GENERALES:
${serviciosGenerales}

DERECHO PENAL — GRUPOS ESPECIALIZADOS:
${gruposPenal}

HONDUREÑOS EN ESPAÑA:
${subareasMigrantes}

CANALES DE CONTACTO OFICIALES:
- WhatsApp: https://wa.me/${site.whatsapp}
- Teléfono: tel:${site.phone.replace(/\s|-/g, '')}
- Solicitar consulta: ${site.url}/solicitar-consulta
- Contacto: ${site.url}/contacto

PÁGINAS PÚBLICAS PARA DERIVAR AL USUARIO:
- Servicios jurídicos: /servicios-juridicos
- Derecho penal: /derecho-penal
- Hondureños en España: /hondurenos-en-espana
- El despacho: /despacho
- FAQ: /preguntas-frecuentes
- Blog: /blog

LÍMITES DE ACTUACIÓN:
- No se ofrecen asesoramientos jurídicos definitivos por chat.
- No se calculan penas concretas ni se diseña estrategia procesal cerrada.
- No se prometen resultados.
- Ante urgencias (detención, audiencia, citación, allanamiento, violencia,
  amenazas, accidentes, menores en riesgo), se deriva de inmediato a
  WhatsApp o teléfono.`;
}
