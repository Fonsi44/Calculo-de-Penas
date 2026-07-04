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
