/**
 * Helpers de JSON-LD para páginas de área, FAQ y blog.
 *
 * Toda la información se construye a partir de `lib/site.ts` para mantener
 * una sola fuente de verdad (URL canónica, nombre, geo, contacto).
 *
 * Los objetos se inyectan vía <Script type="application/ld+json"> en cada
 * página; este módulo no renderiza nada por sí mismo.
 */

import { site, absoluteUrl } from '../site';
import type { FaqItem } from '../../data/areas-juridicas';

/* -------------------------------------------------------------------------- */
/* Service — Schema.org Service para una página de área                        */
/* -------------------------------------------------------------------------- */

export type ServiceSchemaInput = {
  slug: string;
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string[];
  keywords?: string[];
  url: string;
};

export function serviceSchema(input: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${input.url}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: {
      '@type': 'LegalService',
      '@id': `${site.url}/#legal-service`,
      name: site.name,
      url: site.url,
      telephone: site.phone,
    },
    areaServed: (input.areaServed ?? ['Nacaome', 'San Lorenzo', 'Choluteca', 'Tegucigalpa', 'San Pedro Sula', 'Valle', 'Honduras']).map((name) => ({
      '@type': 'Place',
      name,
    })),
    keywords: input.keywords?.join(', '),
    url: input.url,
    inLanguage: 'es-HN',
  };
}

/* -------------------------------------------------------------------------- */
/* FAQPage — Schema.org FAQPage con pregunta/respuesta                          */
/* -------------------------------------------------------------------------- */

export function faqPageSchema(faqs: FaqItem[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.respuesta,
      },
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* BreadcrumbList — Schema.org para migas de pan                                */
/* -------------------------------------------------------------------------- */

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function breadcrumbsSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* ItemList — para grids de servicios (home y hubs)                             */
/* -------------------------------------------------------------------------- */

export function itemListSchema(name: string, items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Combined helper — emite Service + FAQPage + BreadcrumbList en un array       */
/* -------------------------------------------------------------------------- */

export function areaSchemas(args: {
  service: ServiceSchemaInput;
  faqs?: FaqItem[];
  breadcrumbs: BreadcrumbItem[];
  url: string;
}) {
  const schemas: Record<string, unknown>[] = [serviceSchema(args.service)];
  if (args.faqs && args.faqs.length > 0) {
    schemas.push(faqPageSchema(args.faqs, args.url));
  }
  schemas.push(breadcrumbsSchema(args.breadcrumbs));
  return schemas;
}

/* -------------------------------------------------------------------------- */
/* Convenience wrappers                                                        */
/* -------------------------------------------------------------------------- */

export function areaHref(slug: string) {
  return absoluteUrl(`/servicios-juridicos/${slug}`);
}

export function penalHubHref() {
  return absoluteUrl('/derecho-penal');
}

export function migrantesHubHref() {
  return absoluteUrl('/hondurenos-en-espana');
}
