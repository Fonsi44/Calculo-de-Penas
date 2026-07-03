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
    areaServed: (input.areaServed ?? ['Nacaome', 'San Lorenzo', 'Choluteca', 'Goascorán', 'San Marcos de Colón', 'El Triunfo', 'Marcovia', 'Pespire', 'Namasigüe', 'Orocuina']).map((name) => ({
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

/**
 * Convierte texto con HTML a texto plano, apto para `acceptedAnswer.text`
 * en FAQPage. Google exige texto plano (sin tags) en ese campo; si se pasa
 * HTML crudo, el rich result de FAQ se rechaza. Decodifica las entidades
 * HTML más comunes (&amp; &lt; &gt; &quot; &#39; &nbsp;) y colapsa espacios.
 */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function faqPageSchema(faqs: FaqItem[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: toPlainText(f.pregunta),
      acceptedAnswer: {
        '@type': 'Answer',
        text: toPlainText(f.respuesta),
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
/* Combined helper — emite Service + FAQPage en un array                       */
/* -------------------------------------------------------------------------- */
//
// NOTA SEO (Jun 2026): el BreadcrumbList ya NO se emite desde este helper.
// Antes se duplicaba: el componente <Breadcrumbs> (components/marketing/
// breadcrumbs.tsx) inyecta su propio BreadcrumbList en todas las páginas que
// lo usan (derecho-penal, derecho-penal/[slug], hondurenos-en-espana y su
// [slug]), y este helper añadía OTRO idéntico → "Duplicate structured data"
// en auditorías SEO. Ahora el BreadcrumbList tiene una sola fuente de verdad:
// el componente <Breadcrumbs>. Las páginas que antes no lo renderizaban
// (servicios-juridicos/[slug]) ahora también lo hacen. El parámetro
// `breadcrumbs` se conserva en la firma solo para no romper callers existentes,
// pero se ignora deliberadamente.
//
export function areaSchemas(args: {
  service: ServiceSchemaInput;
  faqs?: FaqItem[];
  /** @deprecated El BreadcrumbList lo emite ahora el componente <Breadcrumbs>. */
  breadcrumbs?: BreadcrumbItem[];
  url: string;
}) {
  const schemas: Record<string, unknown>[] = [serviceSchema(args.service)];
  if (args.faqs && args.faqs.length > 0) {
    schemas.push(faqPageSchema(args.faqs, args.url));
  }
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
