import { site, absoluteUrl } from '../site';
import { stripHtml } from '../strip-html';
import type { Post } from '@/data/blog/types';
import { resolveArticleEditorialState } from '../editorial-signature';

const validLawyersMap: Record<string, string> = {
  'Danilo Pineda Maradiaga': `${site.url}/#danilo-pineda-maradiaga`,
  'Thania Marlene Paz': `${site.url}/#thania-marlene-paz`,
  'Emil Barahona': `${site.url}/#emil-barahona`,
};

export function blogPostSchema(post: Post) {
  // E-E-A-T: Alinamos autor visible con schema. Si es la firma, se mapea a Organization.
  // Si es un abogado humano canónico, se mapea a su respectivo nodo Person.
  const isLawyer = post.author && post.author in validLawyersMap;
  const authorSchema = isLawyer
    ? {
        '@type': 'Person',
        '@id': validLawyersMap[post.author],
        name: post.author,
      }
    : {
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        name: site.name,
      };

  // E-E-A-T: Añadimos reviewedBy si el post ha sido revisado jurídicamente por un humano canónico.
  const editorial = resolveArticleEditorialState(post);
  const reviewerSchema = editorial.signatureValid && editorial.signature
    ? {
        reviewedBy: {
          '@type': editorial.signature.type === 'lawyer' ? 'Person' : 'Organization',
          '@id': editorial.signature.type === 'lawyer'
            ? validLawyersMap[editorial.signature.name] ?? `${site.url}/#organization`
            : `${site.url}/#organization`,
          name: editorial.signature.name,
        },
      }
    : {};

  // Recuento de palabras del cuerpo (texto plano sin HTML) para Article schema.
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
    author: authorSchema,
    ...reviewerSchema,
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
