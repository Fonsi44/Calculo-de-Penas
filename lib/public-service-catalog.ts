import { areasGenerales, hubPenal } from '@/data/areas-juridicas';

type CanonicalLawyerName =
  | 'Danilo Pineda Maradiaga'
  | 'Thania Marlene Paz'
  | 'Emil Barahona';

export type PublicServiceCatalogItem = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  published: true;
  individualResponsible?: CanonicalLawyerName;
  responsibilityEvidence?: string;
  responsibleProfileHref?: string;
};

const RESPONSIBILITY: Partial<Record<string, Pick<
  PublicServiceCatalogItem,
  'individualResponsible' | 'responsibilityEvidence' | 'responsibleProfileHref'
>>> = {
  'derecho-penal': {
    individualResponsible: 'Danilo Pineda Maradiaga',
    responsibilityEvidence: 'FOUNDER_PROFILE: defensa penal como área principal',
    responsibleProfileHref: '/equipo/danilo-pineda-maradiaga',
  },
  'derecho-de-familia': {
    individualResponsible: 'Thania Marlene Paz',
    responsibilityEvidence: 'THANIA_PROFILE.specialties',
    responsibleProfileHref: '/equipo/thania-marlene-paz',
  },
  'derecho-laboral': {
    individualResponsible: 'Emil Barahona',
    responsibilityEvidence: 'EMIL_PROFILE.specialties',
    responsibleProfileHref: '/equipo/emil-barahona',
  },
  'derecho-civil-y-notarial': {
    individualResponsible: 'Thania Marlene Paz',
    responsibilityEvidence: 'THANIA_PROFILE.specialties; apoyo de Emil no implica dirección exclusiva',
    responsibleProfileHref: '/equipo/thania-marlene-paz',
  },
  'derecho-mercantil-empresarial': {
    individualResponsible: 'Thania Marlene Paz',
    responsibilityEvidence: 'THANIA_PROFILE.specialties',
    responsibleProfileHref: '/equipo/thania-marlene-paz',
  },
  'derecho-administrativo-y-servicio-civil': {
    individualResponsible: 'Thania Marlene Paz',
    responsibilityEvidence: 'THANIA_PROFILE.specialties',
    responsibleProfileHref: '/equipo/thania-marlene-paz',
  },
};

export const PUBLIC_SERVICE_CATALOG: readonly PublicServiceCatalogItem[] = [
  {
    slug: hubPenal.slug,
    name: hubPenal.titulo,
    shortDescription: hubPenal.resumen,
    href: '/derecho-penal',
    published: true,
    ...RESPONSIBILITY[hubPenal.slug],
  },
  ...areasGenerales.map((area) => ({
    slug: area.slug,
    name: area.titulo,
    shortDescription: area.resumen,
    href: `/servicios-juridicos/${area.slug}`,
    published: true as const,
    ...RESPONSIBILITY[area.slug],
  })),
] as const;

export function publicServiceOfferCatalog(origin: string) {
  return {
    '@type': 'OfferCatalog',
    name: `Servicios jurídicos — ${PUBLIC_SERVICE_CATALOG.length} áreas de práctica`,
    itemListElement: PUBLIC_SERVICE_CATALOG.map((item) => ({
      '@type': 'Offer',
      url: `${origin}${item.href}`,
      itemOffered: {
        '@type': 'Service',
        name: item.name,
        description: item.shortDescription,
        url: `${origin}${item.href}`,
      },
    })),
  };
}
