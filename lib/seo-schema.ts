import { site } from './site';

export function webpageSchema(title: string, description: string, urlPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${site.url}${urlPath}#webpage`,
    url: `${site.url}${urlPath}`,
    name: title,
    description: description,
    inLanguage: 'es-HN',
    isPartOf: {
      '@id': `${site.url}/#website`,
    },
    about: {
      '@id': `${site.url}/#legal-service`,
    },
  };
}
