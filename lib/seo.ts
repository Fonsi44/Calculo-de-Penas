/**
 * Helper central de metadata para páginas públicas.
 *
 * Normaliza titles (≤60 chars) y descriptions (≤155 chars) y evita la
 * repetición manual del bloque `openGraph`/`twitter`/`robots` en cada
 * `page.tsx`. El canonical se pasa como **path relativo** (`/servicios-juridicos`)
 * y se resuelve a absoluto vía `metadataBase` definido en el layout raíz.
 *
 * Convención de robots: `index,follow` + `max-image-preview:large` por defecto.
 * Pasar `noindex: true` para páginas no indexables (legales, filtros, errores).
 */
import type { Metadata } from 'next';
import { site } from './site';
import { stripHtml } from './strip-html';

const TWITTER_HANDLE = '@Danilo_Pineda_M';
export const META_TITLE_MAX = 60;
const BRAND_SUFFIX = /\s*[\|\-–—]\s*Pineda y Asociados\s*$/i;
const BRAND_TAIL = /\s+Pineda y Asociados\s*$/i;
const DANGLING_TITLE_WORDS = new Set([
  'y', 'o', 'e', 'u', 'ni', 'de', 'del', 'a', 'al', 'en', 'ante', 'la', 'el',
  'las', 'los', 'un', 'una', 'unos', 'unas', 'con', 'sin', 'por', 'para',
  'sobre', 'tras', 'desde', 'hasta', 'como', 'que', 'se', 'su', 'sus',
]);

function removeDanglingTitleEnding(value: string): string {
  let result = value.replace(/\s*[\|\-–—:;,]\s*$/, '').trim();

  for (let i = 0; i < 3; i++) {
    const words = result.split(/\s+/).filter(Boolean);
    if (words.length <= 1) break;
    const last = words.at(-1)?.toLocaleLowerCase('es') ?? '';
    if (!DANGLING_TITLE_WORDS.has(last)) break;
    result = words.slice(0, -1).join(' ');
  }

  return result;
}

function truncateTitleAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return removeDanglingTitleEnding(value);
  const cut = value.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const truncated = lastSpace >= Math.floor(maxLength * 0.6)
    ? cut.slice(0, lastSpace)
    : value.slice(0, maxLength);
  return removeDanglingTitleEnding(truncated);
}

/**
 * Construye el title final de un artículo sin duplicar la marca, sin palabras
 * colgantes y sin exceder el objetivo de presentación en SERP.
 *
 * La marca solo se añade cuando cabe completa. Si no cabe, se conserva la
 * consulta principal: Google ya recibe `siteName` por metadata y JSON-LD.
 */
export function buildBlogMetaTitle(
  rawTitle: string,
  brand = site.name,
  maxLength = META_TITLE_MAX,
): string {
  let baseTitle = rawTitle.replace(/\s*\.\.\.$/g, '').trim();

  for (let i = 0; i < 2; i++) {
    const previous = baseTitle;
    baseTitle = baseTitle
      .replace(BRAND_SUFFIX, '')
      .replace(BRAND_TAIL, '')
      .trim();
    if (baseTitle === previous) break;
  }

  baseTitle = truncateTitleAtWord(baseTitle, maxLength);
  const brandedTitle = `${baseTitle} | ${brand}`;
  return brandedTitle.length <= maxLength ? brandedTitle : baseTitle;
}

export interface BuildMetadataInput {
  /** Título absoluto (sin sufijo de marca). Máx ~60 chars. */
  title: string;
  /** Meta description. Máx ~155 chars. */
  description: string;
  /** Path canónico relativo desde la raíz, p.ej. `/servicios-juridicos`. */
  canonicalPath: string;
  /** Keywords SEO (Google las ignora pero algunos crawlers las usan). */
  keywords?: string[];
  /** Path o URL absoluta de la imagen OG. Default: `/og-image.webp`. */
  ogImage?: string;
  /** Alt de la imagen OG. Default: nombre del sitio. */
  ogImageAlt?: string;
  /** Tipo OG. `article` activa publishedTime/modifiedTime/authors. */
  ogType?: 'website' | 'article' | 'profile';
  /** Si true, aplica noindex,nofollow. */
  noindex?: boolean;
  /** Para `article`: fecha ISO de publicación. */
  publishedTime?: string;
  /** Para `article`: fecha ISO de modificación. */
  modifiedTime?: string;
  /** Para `article`: lista de autores. */
  authors?: string[];
}

/**
 * Construye un objeto `Metadata` consistente para una página pública.
 * No incluye `metadataBase` (lo aporta el layout raíz).
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    canonicalPath,
    keywords,
    ogImage = '/og-image.webp',
    ogImageAlt = site.name,
    ogType = 'website',
    noindex = false,
    publishedTime,
    modifiedTime,
    authors,
  } = input;

  const url = `${site.url}${canonicalPath}`;
  const imgUrl = ogImage.startsWith('http') ? ogImage : `${site.url}${ogImage}`;

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: ogType,
      locale: 'es_HN',
      url,
      title,
      description,
      siteName: site.name,
      images: [{ url: imgUrl, width: 1200, height: 630, alt: ogImageAlt }],
      ...(ogType === 'article'
        ? { publishedTime, modifiedTime, authors }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title,
      description,
      images: [imgUrl],
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

/**
 * Longitud objetivo de una meta description (rango óptimo para SERP).
 * Google muestra ~155 chars en desktop y ~120 en móvil; apuntamos al rango
 * 120–155 para que la descripción no se trunque ni quede demasiado corta.
 */
export const META_DESC_MIN = 120;
export const META_DESC_MAX = 155;

/**
 * Construye una meta description limpia a partir de HTML o texto enriquecido.
 *
 * Sustituye al patrón bug `${descripcion.substring(0, N)} Consulta confidencial...`
 * que (a) dejaba HTML crudo (`<strong>`, `<a href>`) cuando no se sanitizaba,
 * (b) truncaba palabras a mitad ("...operaciones en Ho Consulta confidencial..."),
 * y (c) añadía un CTA fijo "Consulta confidencial" que es un claim comercial
 * no verificado como política global.
 *
 * Comportamiento:
 *  - Sanitiza HTML vía `stripHtml` (decode entidades, sin tags, espacios norm.).
 *  - Recorta al rango 120–155 chars en límite de palabra (sin cortar palabras).
 *  - Si el texto es más corto que 120 chars, lo devuelve tal cual (sin relleno).
 *  - Texto plano, sin HTML, sin entidades rotas, sin CTA fijo.
 *
 * Uso en `servicios-juridicos/[slug]`, `derecho-penal/[slug]`,
 * `hondurenos-en-espana/[slug]` (donde `area.descripcion` contiene HTML).
 */
export function buildServiceMetaDescription(html: string): string {
  const plain = stripHtml(html);
  if (plain.length <= META_DESC_MAX) return plain;
  // Recorta en el último espacio dentro del límite para no cortar palabras.
  const cut = plain.slice(0, META_DESC_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  // Si no hay espacio o queda muy corto, usa el corte duro (mejor que palabra rota).
  const truncated = lastSpace > META_DESC_MIN ? cut.slice(0, lastSpace) : cut;
  return truncated.trim();
}

/**
 * Elige la mejor descripción disponible para un artículo y la mantiene dentro
 * del rango recomendado. Algunas filas antiguas de la DB tienen una
 * `metaDescription` demasiado corta o larga, mientras que su resumen editorial
 * (`description`) ya contiene una alternativa completa y específica.
 *
 * No persiste ni inventa contenido: prioriza la meta explícita cuando cumple,
 * usa el resumen existente como respaldo y recorta solo en límite de palabra.
 */
export function buildBlogMetaDescription(
  metaDescription?: string,
  description?: string,
): string {
  const candidates = [metaDescription, description]
    .map((value) => stripHtml(value ?? ''))
    .filter(Boolean);

  const inRange = candidates.find(
    (value) => value.length >= META_DESC_MIN && value.length <= META_DESC_MAX,
  );
  const selected = inRange
    ?? candidates.find((value) => value.length >= META_DESC_MIN)
    ?? candidates[0]
    ?? '';

  return buildServiceMetaDescription(selected);
}
