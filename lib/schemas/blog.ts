import { site, absoluteUrl } from '../site';
import { stripHtml } from '../strip-html';
import type { Post } from '@/data/blog/types';

/**
 * Mapa de categoría de blog → @id del autor (Person) que firma los posts de
 * esa categoría. Refuerza E-E-A-T (YMYL jurídico): Google prioriza autores
 * Person identificados en temas sensibles, y asociar cada categoría al
 * especialista correcto incrementa la autoridad temática percibida.
 *
 * Categorías no listadas → #founder (Danilo Pineda Maradiaga, socio director
 * y firma por defecto del bufete). Los @id deben coincidir con los nodos
 * Person inyectados en app/(public)/layout.tsx.
 */
const CATEGORY_TO_AUTHOR_ID: Record<string, string> = {
  'derecho-de-familia': `${site.url}/#thania`,
  'derecho-civil': `${site.url}/#thania`,
  'derecho-mercantil': `${site.url}/#thania`,
  'derecho-administrativo': `${site.url}/#thania`,
  'propiedad-intelectual': `${site.url}/#thania`,
  'derecho-laboral': `${site.url}/#emil`,
};

export function blogPostSchema(post: Post) {
  // E-E-A-T (YMYL jurídico): cuando el autor del post coincide con el nombre
  // del bufete, atribuimos la autoría al especialista de la categoría (vía
  // el mapa CATEGORY_TO_AUTHOR_ID) en lugar de a la Organization. Google
  // prioriza autores Person identificados en temas sensibles (derecho, salud,
  // finanzas). El nodo Person referenciado se define en el layout global y
  // se vincula vía @id para alimentar el Knowledge Graph.
  // Si un post tuviera un autor real distinto (post.author !== site.name),
  // se mantiene ese Person con su nombre.
  const isOrgAuthor = !post.author || post.author === site.name;
  const authorId = CATEGORY_TO_AUTHOR_ID[post.category] ?? `${site.url}/#founder`;
  // Recuento de palabras del cuerpo (texto plano sin HTML) para Article schema.
  // Google recomienda `wordCount` en contenido YMYL; ayuda a clasificar depth.
  // stripHtml (sanitize-html) en vez de regex: maneja tags anidados y entidades.
  const plainBody = post.body ? stripHtml(post.body) : '';
  const wordCount = plainBody ? plainBody.trim().split(/\s+/).filter(Boolean).length : 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(`/blog/${post.category}/${post.slug}`)}#blogposting`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: isOrgAuthor
      ? { '@id': authorId }
      : {
          '@type': 'Person',
          name: post.author,
        },
    // Publisher = Organization (no LegalService) para que Google valide el
    // Article Rich Result. La especificación de Google requiere @type Organization
    // con logo ImageObject. @id apunta al nodo Organization del @graph global
    // inyectado en app/(public)/layout.tsx para coherencia del Knowledge Graph.
    publisher: {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      // Logo de marca (PNG transparente, 512×512). Google lo muestra en los
      // rich results de Article junto al nombre del publisher.
      logo: {
        '@type': 'ImageObject',
        url: `${site.url}/images/logo.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.category}/${post.slug}`),
    },
    image: post.coverImage
      ? `${site.url}${post.coverImage}`
      : `${site.url}/og-image.webp`,
    articleBody: plainBody.substring(0, 5000) || undefined,
    articleSection: post.category,
    ...(wordCount > 0 ? { wordCount } : {}),
    inLanguage: 'es-HN',
    // Speakable (GEO): indica a asistentes de voz y motores de respuesta IA
    // (ChatGPT, Perplexity, Google SGE) qué fragmentos del artículo son los
    // más citables. cssSelector apunta al H1, los H2/H3 del body (que ya
    // tienen IDs estables por injectHeadingIds) y el primer párrafo.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [
        'h1',
        '.article-body h2',
        '.article-body h3',
        '.article-body p:first-of-type',
      ],
    },
  };
}

export function blogCollectionSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    inLanguage: 'es-HN',
    publisher: {
      '@type': 'LegalService',
      '@id': `${site.url}/#legal-service`,
      name: site.name,
    },
  };
}
