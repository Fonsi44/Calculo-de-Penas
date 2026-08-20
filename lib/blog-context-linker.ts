/**
 * Auto-linker contextual para bodies de blog.
 *
 * Inserta enlaces internos en el HTML del cuerpo de los posts detectando
 * menciones de entidades (ciudades, áreas de práctica, conceptos legales)
 * según el catálogo de `lib/entity-dictionary.ts`.
 *
 * SEGURIDAD HTML:
 *   - No enlaza dentro de etiquetas existentes (<a>, <h1>-<h3>, <script>,
 *     <pre>, <code>, <button>).
 *   - Solo procesa texto entre etiquetas (text nodes del HTML serializado).
 *   - No altera atributos ni estructura del HTML existente.
 *
 * ANTI-OVER-OPTIMIZATION:
 *   - Máximo `maxTotalLinks` enlaces por post (default 5).
 *   - Máximo 1 ocurrencia por entidad (evita repetir el mismo enlace).
 *   - Anchors variados (el texto del anchor es el natural, no keyword stuffing).
 *   - Respeta el texto original: solo añade el <a href> wrapper.
 *
 * RENDIMIENTO:
 *   - Regex pura, sin dependencias externas ni DOM parser.
 *   - Ejecutado en build/ISR time (no en runtime de cliente).
 *   - Si no encuentra entidades, devuelve el HTML original sin cambios.
 */

import {
  ENTITY_CATALOG,
  resetEntityPatterns,
  type LinkableEntity,
} from '@/lib/entity-dictionary';

/**
 * Máximo total de enlaces contextuales a insertar en un post.
 * Anti-saturación: Google penaliza el exceso de enlaces internos.
 */
const MAX_TOTAL_LINKS = 5;

/**
 * Tags HTML cuyo contenido NO debe ser enlazado.
 * Incluye headings (h1-h3 son estructurales), anchors existentes, código y
 * scripts. h4-h6 sí se permiten (son menos estructurales).
 */
const PROTECTED_TAGS = ['a', 'h1', 'h2', 'h3', 'script', 'pre', 'code', 'button', 'style'];
const ALREADY_ROOTED_OR_EXTERNAL = /^(?:\/|#|\?|[a-z][a-z0-9+.-]*:)/i;

/**
 * Convierte hrefs relativos almacenados en cuerpos editoriales a rutas desde
 * la raíz. Un `href="solicitar-consulta"` dentro de `/blog/categoria/post`
 * apuntaría, por semántica HTML, a una URL inexistente bajo esa carpeta.
 *
 * No modifica enlaces absolutos, protocolos especiales, anchors, queries ni
 * rutas que ya empiezan por `/`.
 */
export function normalizeBlogInternalLinks(html: string): string {
  return html.replace(
    /(<a\b[^>]*\bhref\s*=\s*)(["'])([^"']*)\2/gi,
    (full, prefix: string, quote: string, rawHref: string) => {
      const href = rawHref.trim();
      if (
        !href ||
        ALREADY_ROOTED_OR_EXTERNAL.test(href) ||
        href.startsWith('./') ||
        href.startsWith('../')
      ) {
        return full;
      }

      return `${prefix}${quote}/${href}${quote}`;
    },
  );
}

const INTERNAL_HREF_PATTERN =
  /<a\b[^>]*\bhref\s*=\s*(["'])(\/[^"']*)\1/gi;

/**
 * Extrae destinos internos absolutos desde HTML editorial.
 *
 * Acepta comillas simples o dobles y conserva fragmentos/queries. No cuenta
 * protocolos externos, mailto, tel ni hrefs relativos sin normalizar.
 */
export function extractBlogInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;

  INTERNAL_HREF_PATTERN.lastIndex = 0;
  while ((match = INTERNAL_HREF_PATTERN.exec(html)) !== null) {
    if (!match[2].startsWith('//')) {
      hrefs.push(match[2]);
    }
  }

  return hrefs;
}

/**
 * Tokeniza el HTML separando texto de etiquetas, de forma que solo se
 * procesan los text nodes (contenido entre tags).
 *
 * Estrategia: split por patrón de etiqueta HTML completo (<...>).
 * Los tokens pares son texto; los impares son etiquetas.
 */
function tokenizeHtml(html: string): string[] {
  // Captura etiquetas completas (incluyendo self-closing y con atributos).
  return html.split(/(<[^>]+>)/g);
}

/**
 * Determina si un token de texto está dentro de una etiqueta protegida.
 * Requiere el contexto del stack de tags abiertas.
 */
function isInsideProtectedTag(tagStack: string[]): boolean {
  return tagStack.some((tag) => PROTECTED_TAGS.includes(tag));
}

/**
 * Extrae el nombre del tag de un token de etiqueta HTML.
 * Maneja tags de apertura, cierre y self-closing.
 */
function parseTagName(tagToken: string): { name: string; isClosing: boolean; isSelfClosing: boolean } {
  // <tag ...>, </tag>, <tag .../>, <tag>
  const match = tagToken.match(/^<\/?\s*([a-zA-Z0-9]+)/);
  if (!match) return { name: '', isClosing: false, isSelfClosing: false };
  const name = match[1].toLowerCase();
  const isClosing = tagToken.startsWith('</');
  const isSelfClosing = /\/>\s*$/.test(tagToken) || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(name);
  return { name, isClosing, isSelfClosing };
}

/**
 * Reemplaza la PRIMERA ocurrencia de una entidad en un texto, envolviéndola
 * en un <a href>. Respeta case (reemplaza el texto encontrado tal cual).
 */
function linkFirstOccurrence(text: string, entity: LinkableEntity): { result: string; linked: boolean } {
  resetEntityPatterns();
  const match = entity.pattern.exec(text);
  if (!match) {
    return { result: text, linked: false };
  }
  const matchedText = match[0];
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + matchedText.length);
  // El anchor usa el texto matched original (preserva mayúsculas/tildes).
  const anchor = `<a href="${entity.href}" class="context-link" data-internal-link="${entity.href}">${matchedText}</a>`;
  return { result: before + anchor + after, linked: true };
}

export interface ContextLinkOptions {
  /** Máximo total de enlaces a insertar (default 5). */
  maxTotalLinks?: number;
  /** Slugs de ciudades a priorizar (si el post es geográfico). */
  prioritizeCities?: string[];
  /** Excluir una entidad específica por href (evita self-link en posts de servicio). */
  excludeHrefs?: string[];
}

/**
 * Inyecta enlaces contextuales en el HTML de un post de blog.
 *
 * @param html - HTML del body del post (string serializado).
 * @param options - Configuración de límites y prioridades.
 * @returns HTML con enlaces contextuales insertados (o el original si no aplica).
 */
export function injectContextLinks(html: string, options?: ContextLinkOptions): string {
  const maxLinks = options?.maxTotalLinks ?? MAX_TOTAL_LINKS;
  const excludeHrefs = new Set(options?.excludeHrefs ?? []);

  // Filtrar el catálogo: excluir hrefs prohibidos y aplicar prioridades.
  let catalog = ENTITY_CATALOG.filter((e) => !excludeHrefs.has(e.href));

  // Si hay ciudades prioritarias (post geográfico), reordenar para que esas
  // ciudades aparezcan primero en el catálogo.
  if (options?.prioritizeCities?.length) {
    const prioritySet = new Set(options.prioritizeCities.map((s) => `/abogados-en-${s}`));
    catalog = [
      ...catalog.filter((e) => prioritySet.has(e.href)),
      ...catalog.filter((e) => !prioritySet.has(e.href)),
    ];
  }

  // Tokenizar el HTML.
  const tokens = tokenizeHtml(html);
  const tagStack: string[] = [];
  let linksInserted = 0;
  const usedHrefs = new Set<string>();

  for (let i = 0; i < tokens.length && linksInserted < maxLinks; i++) {
    const token = tokens[i];

    // Si es una etiqueta, actualizar el stack y continuar.
    if (token.startsWith('<')) {
      const { name, isClosing, isSelfClosing } = parseTagName(token);
      if (name && !isSelfClosing) {
        if (isClosing) {
          // Pop del tag que cierra.
          const idx = tagStack.lastIndexOf(name);
          if (idx >= 0) tagStack.splice(idx, 1);
        } else {
          // Push del tag que abre.
          tagStack.push(name);
        }
      }
      continue;
    }

    // Es un text node. Si está dentro de un tag protegido, no enlazar.
    if (isInsideProtectedTag(tagStack)) continue;

    // Un enlace por pasada; el nodo se re-tokeniza para proteger el <a>
    // y permitir otras entidades en el texto restante del mismo párrafo.
    for (const entity of catalog) {
      if (linksInserted >= maxLinks) break;
      if (usedHrefs.has(entity.href)) continue;

      const { result, linked } = linkFirstOccurrence(token, entity);
      if (linked) {
        // Re-tokenizar el nodo para que el <a> recién insertado quede
        // protegido y no se anide otra entidad (p. ej. ciudad dentro de
        // «penalista en Choluteca»).
        const nested = tokenizeHtml(result);
        tokens.splice(i, 1, ...nested);
        usedHrefs.add(entity.href);
        linksInserted++;
        i -= 1;
        break;
      }
    }
  }

  return tokens.join('');
}

export interface BlogBodyLinkAnalysis {
  /** HTML tras normalizar hrefs editoriales relativos. */
  normalizedHtml: string;
  /** HTML que recibe finalmente el render tras el autoenlazado. */
  effectiveHtml: string;
  /** Enlaces persistidos en el body, después de normalizar sus rutas. */
  persistedHrefs: string[];
  /** Enlaces efectivos del body, incluidos los contextuales. */
  effectiveHrefs: string[];
  /** Destinos añadidos por el autoenlazado contextual. */
  contextualHrefs: string[];
}

/**
 * Reproduce la transformación de enlaces aplicada por la página de artículo.
 * Permite que los auditores midan la salida efectiva y no solo el HTML crudo
 * almacenado en la base de datos.
 */
export function analyzeBlogBodyLinks(
  html: string,
  options?: ContextLinkOptions,
): BlogBodyLinkAnalysis {
  const normalizedHtml = normalizeBlogInternalLinks(html);
  const persistedHrefs = extractBlogInternalHrefs(normalizedHtml);
  const effectiveHtml = injectContextLinks(normalizedHtml, options);
  const effectiveHrefs = extractBlogInternalHrefs(effectiveHtml);

  const persistedCounts = new Map<string, number>();
  for (const href of persistedHrefs) {
    persistedCounts.set(href, (persistedCounts.get(href) ?? 0) + 1);
  }

  const contextualHrefs = effectiveHrefs.filter((href) => {
    const remaining = persistedCounts.get(href) ?? 0;
    if (remaining === 0) return true;
    persistedCounts.set(href, remaining - 1);
    return false;
  });

  return {
    normalizedHtml,
    effectiveHtml,
    persistedHrefs,
    effectiveHrefs,
    contextualHrefs,
  };
}

/**
 * Detecta qué ciudades se mencionan en un texto (para priorizarlas en
 * bloques de "ciudades relacionadas" al final del post).
 *
 * @param text - Texto plano del post (sin HTML).
 * @returns Array de slugs de ciudades detectadas.
 */
export function detectMentionedCities(text: string): string[] {
  const found: string[] = [];
  resetEntityPatterns();
  for (const entity of ENTITY_CATALOG) {
    // Solo entidades de ciudad (href que empieza con /abogados-en-).
    if (!entity.href.startsWith('/abogados-en-')) continue;
    entity.pattern.lastIndex = 0;
    if (entity.pattern.test(text)) {
      found.push(entity.href.replace('/abogados-en-', ''));
    }
  }
  return found;
}

/**
 * Tipo re-exportado para uso en componentes que necesitan el catálogo.
 */
export type { LinkableEntity };
