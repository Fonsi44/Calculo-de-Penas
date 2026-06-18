import { site, absoluteUrl } from '../site';
import type { Post } from '@/data/blog/types';

export function blogPostSchema(post: Post) {
  // E-E-A-T: cuando el autor coincide con el nombre del bufete, no declaramos
  // un `Person` con nombre de empresa (anti-señal para Google en temas YMYL
  // como el derecho). En su lugar, autor = Organization (el propio despacho).
  // Si en el futuro se añaden autores reales con página /equipo, se podrá
  // distinguir por `post.author !== site.name` para usar `Person` con `sameAs`.
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
      ? {
          '@type': 'Organization',
          '@id': `${site.url}/#organization`,
          name: site.name,
          url: site.url,
        }
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
        url: `${site.url}/og-image.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.category}/${post.slug}`),
    },
    image: post.coverImage
      ? `${site.url}${post.coverImage}`
      : `${site.url}/og-image.png`,
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
