import { site, absoluteUrl } from '../site';
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
    publisher: {
      '@type': 'LegalService',
      '@id': `${site.url}/#legal-service`,
      name: site.name,
      logo: {
        '@type': 'ImageObject',
        url: `${site.url}/og-image.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.category}/${post.slug}`),
    },
    image: post.coverImage
      ? `${site.url}${post.coverImage}`
      : `${site.url}/og-image.webp`,
    articleBody: post.body
      ? post.body.replace(/<[^>]*>/g, '').substring(0, 5000)
      : undefined,
    inLanguage: 'es-HN',
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
