import { site, absoluteUrl } from '../site';
import type { Post } from '@/data/blog/types';

export function blogPostSchema(post: Post) {
  // E-E-A-T (YMYL jurídico): cuando el autor del post coincide con el nombre
  // del bufete, atribuimos la autoría al fundador y socio director (Danilo
  // Pineda Maradiaga, @id #founder) en lugar de a la Organization. Google
  // prioriza autores Person identificados en temas sensibles (derecho, salud,
  // finanzas). El nodo Person #founder se define en el layout global y se
  // vincula vía @id para alimentar el Knowledge Graph.
  // Si un post tuviera un autor real distinto (post.author !== site.name),
  // se mantiene ese Person con su nombre.
  const isOrgAuthor = !post.author || post.author === site.name;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(`/blog/${post.category}/${post.slug}`)}#blogposting`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: isOrgAuthor
      ? { '@id': `${site.url}/#founder` }
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
