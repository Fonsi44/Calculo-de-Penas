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
