import { site, absoluteUrl } from '../site';
import type { Post } from '@/data/blog/types';

export function blogPostSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(`/blog/${post.slug}`)}#blogposting`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'LegalService',
      '@id': `${site.url}/#legal-service`,
      name: site.name,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}`),
    },
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
