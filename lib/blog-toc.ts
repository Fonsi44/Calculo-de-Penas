/**
 * Asignación server-side de IDs estables a los headings (H2/H3) del cuerpo de
 * un post de blog, y extracción de la tabla de contenidos.
 *
 * Problema SEO/GEO: antes los IDs se asignaban en useEffect (client-only) en
 * components/blog/blog-toc.tsx, por lo que el HTML servidor NO contenía los
 * anchors (#section-1). Esto implica:
 *   - Los crawlers no veían el TOC ni los fragment anchors.
 *   - Google/Bing no podían ofrecer "jump to section" en SERP.
 *   - Los LLMs no extraían la estructura del documento.
 *
 * Solución: esta función pura (sin React, sin efectos) inyecta `id="..."`
 * en cada <h2>/<h3> del HTML del body en el servidor. El componente BlogTOC
 * ahora recibe los headings ya calculados en vez de leer el DOM.
 *
 * Los IDs son estables y reproducibles: se derivan del slug del título (sin
 * acentos ni caracteres especiales) con un sufijo numérico para evitar
 * colisiones. Esto garantiza anchors persistentes entre re-renders.
 */

export interface TocHeading {
  /** Nivel del heading: 2 para <h2>, 3 para <h3>. */
  level: 2 | 3;
  /** ID asignado al heading (estable, reproducible). */
  id: string;
  /** Texto visible del heading (sin HTML). */
  text: string;
}

const ID_MAX_LENGTH = 50;

/**
 * Convierte un texto en un slug HTML-safe estable: minúsculas, sin acentos,
 * espacios → guiones, solo alfanuméricos y guiones.
 */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Quita marcas diacríticas (acentos, diéresis).
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, ID_MAX_LENGTH)
    .replace(/^-|-$/g, '');
}

/**
 * Inyecta IDs estables en los <h2>/<h3> del HTML del cuerpo del post.
 *
 * Si un heading ya tiene `id`, se respeta. Si no, se asigna uno derivado de
 * su texto. Los sufijos numéricos (`-2`, `-3`) evitan colisiones cuando dos
 * headings producen el mismo slug.
 *
 * Devuelve el HTML modificado Y la lista de headings (para renderizar el TOC
 * en el servidor sin tener que releer el DOM).
 */
export function injectHeadingIds(html: string): { html: string; headings: TocHeading[] } {
  const headings: TocHeading[] = [];
  const usedIds = new Set<string>();

  const result = html.replace(
    /<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag: string, attrs: string, inner: string) => {
      const level = (tag.toLowerCase() === 'h2' ? 2 : 3) as 2 | 3;
      const text = inner.replace(/<[^>]*>/g, '').trim();

      // ¿Ya tiene id? Respétalo y úsalo en el TOC.
      const existingIdMatch = /\bid=["']([^"']+)["']/i.exec(attrs);
      let id: string;
      if (existingIdMatch) {
        id = existingIdMatch[1];
        headings.push({ level, id, text });
        usedIds.add(id);
        return match;
      }

      const base = slugifyHeading(text) || `seccion-${headings.length + 1}`;
      id = base;
      let counter = 2;
      while (usedIds.has(id)) {
        id = `${base}-${counter}`;
        counter += 1;
      }
      usedIds.add(id);
      headings.push({ level, id, text });
      // Reinserta el tag con el id añadido.
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    },
  );

  return { html: result, headings };
}

/**
 * Filtra los headings para mostrar en el TOC: solo H2 (los H3 quedan como
 * sub-items opcionales). El TOC solo se muestra si hay ≥2 H2.
 */
export function tocEntries(headings: TocHeading[]): TocHeading[] {
  return headings.filter((h) => h.level === 2);
}
