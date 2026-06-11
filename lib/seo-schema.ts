import { site } from './site';

interface BreadcrumbItem {
  name: string;
  item: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${site.url}/#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.item}`,
    })),
  };
}

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
