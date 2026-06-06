/**
 * Configuración centralizada del sitio web.
 *
 * Todas las URLs, teléfonos, correos y metadatos del bufete pasan por aquí.
 * Esto permite migrar entre dominios (Vercel preview → pinedayasociadoshn.com)
 * modificando únicamente las variables de entorno, sin tocar componentes.
 *
 * Variables de entorno (con fallback de desarrollo):
 *   NEXT_PUBLIC_SITE_URL           URL canónica del sitio (sin slash final)
 *   NEXT_PUBLIC_SITE_NAME          Nombre comercial
 *   NEXT_PUBLIC_SITE_SHORT         Nombre corto (footer, badges)
 *   NEXT_PUBLIC_SITE_TAGLINE       Lema principal
 *   NEXT_PUBLIC_SITE_DESCRIPTION   Descripción para meta tags
 *   NEXT_PUBLIC_SITE_KEYWORDS      Keywords separados por coma
 *   NEXT_PUBLIC_CONTACT_PHONE      Teléfono internacional (+504XXXXXXXX)
 *   NEXT_PUBLIC_CONTACT_WHATSAPP   WhatsApp (solo dígitos con prefijo país)
 *   NEXT_PUBLIC_CONTACT_EMAIL      Correo principal
 *   NEXT_PUBLIC_GEO_LAT            Latitud del bufete (decimal)
 *   NEXT_PUBLIC_GEO_LNG            Longitud del bufete (decimal)
 *   NEXT_PUBLIC_SOCIAL_FACEBOOK    URL Facebook
 *   NEXT_PUBLIC_SOCIAL_INSTAGRAM   URL Instagram
 *   NEXT_PUBLIC_SOCIAL_TIKTOK      URL TikTok
 *   NEXT_PUBLIC_NOINDEX            "true" bloquea indexación (default en dev)
 *   NEXT_PUBLIC_GA_ID              ID de Google Analytics 4 (opcional)
 *   NEXT_PUBLIC_CLARITY_ID         ID de Microsoft Clarity (opcional)
 */

type OpeningHours = {
  dayOfWeek: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  opens: string;
  closes: string;
};

const envNoindex = process.env.NEXT_PUBLIC_NOINDEX;

/**
 * Modo anti-indexación activo en desarrollo y hasta que se indique el
 * lanzamiento. Una sola variable controla robots, header HTTP y sitemap.
 * Para permitir indexación: NEXT_PUBLIC_NOINDEX=false (explícito).
 */
const noindexActive = envNoindex !== 'false';

export const site = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pinedayasociadoshn.com').replace(/\/+$/, ''),
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pineda y Asociados',
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT ?? 'Pineda y Asociados',
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    'Bufete multidisciplinario en Nacaome, Valle — 13 áreas del derecho',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    'Bufete multidisciplinario en Nacaome, Valle, Honduras. 13 áreas del derecho: penal, familia, laboral, civil, mercantil, tributario, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, ambiental y arbitraje. Defensa penal seria y confidencial.',
  keywords:
    (process.env.NEXT_PUBLIC_SITE_KEYWORDS ??
      'bufete multidisciplinario Nacaome, abogados Nacaome Honduras, abogado penalista Nacaome, defensa penal Honduras, abogado de familia Honduras, abogado laboral Valle, derecho civil Nacaome, abogado mercantil Honduras, abogado tributario Honduras, derecho bancario Honduras, derecho administrativo Honduras, derecho aduanero Honduras, regulación sanitaria ARSA, extranjería Honduras, propiedad intelectual Honduras, derecho ambiental Honduras, conciliación y arbitraje Honduras').split(',').map((k) => k.trim()),
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+50495363724',
  phoneDisplay: '+504 9536-3724',
  whatsapp: (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '50495363724').replace(/\D/g, ''),
  whatsappDisplay: '+504 9536-3724',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contacto@pinedayasociadoshn.com',
  address: {
    line1: 'Cuadra y media al este de Hondutel',
    line2: 'Contiguo a Clínica Dental Dra. ANDARA',
    city: 'Nacaome',
    department: 'Valle',
    country: 'Honduras',
    countryCode: 'HN',
    full: 'Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA, Nacaome, Valle, Honduras',
  },
  hours: 'Lunes a sábado: 7:00 – 20:00',
  hoursShort: 'Lun a Sáb 7:00 – 20:00',
  hoursStructured: [
    {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const,
      opens: '07:00',
      closes: '20:00',
    },
  ] satisfies OpeningHours[],
  geo: {
    latitude: process.env.NEXT_PUBLIC_GEO_LAT ? Number(process.env.NEXT_PUBLIC_GEO_LAT) : 13.5361,
    longitude: process.env.NEXT_PUBLIC_GEO_LNG ? Number(process.env.NEXT_PUBLIC_GEO_LNG) : -87.4875,
  },
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? null,
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? null,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? null,
  },
  legal: {
    jurisdiction: 'República de Honduras',
    code: 'Código Penal Decreto 130-2017',
    isProd: process.env.NODE_ENV === 'production',
  },
  /** Si true, todo el sitio emite noindex,nofollow y bloquea rastreadores. */
  noindex: noindexActive,
  /** ID GA4 (opcional). */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? null,
  /** ID Microsoft Clarity (opcional). */
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? null,
} as const;

export type SiteConfig = typeof site;

/** URL absoluta de un path interno. */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${site.url}${clean}`;
}

/** Enlace tel: con formato internacional. */
export function telHref(): string {
  return `tel:${site.phone.replace(/\s|-/g, '')}`;
}

/** Enlace wa.me con mensaje opcional prellenado. */
export function whatsappHref(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${site.whatsapp}${text}`;
}

/** Enlace mailto:. */
export function mailtoHref(subject?: string): string {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${site.email}${q}`;
}

/**
 * Schema.org LegalService listo para inyectar en JSON-LD.
 * Incluye LocalBusiness con geo y areaServed para SEO local.
 */
export function legalServiceSchema() {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['LegalService', 'LocalBusiness'],
    '@id': `${site.url}/#legal-service`,
    name: site.name,
    alternateName: site.shortName,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    description: site.description,
    image: `${site.url}/og-image.png`,
    logo: `${site.url}/logo.png`,
    priceRange: '$$',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    currenciesAccepted: 'HNL, USD',
    areaServed: [
      { '@type': 'City', name: site.address.city },
      { '@type': 'State', name: site.address.department },
      { '@type': 'Country', name: site.address.country },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    openingHoursSpecification: site.hoursStructured.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    knowsLanguage: ['es-HN', 'es-ES'],
    sameAs: [
      site.social.facebook,
      site.social.instagram,
      site.social.tiktok,
    ].filter(Boolean),
  };
  if (site.geo.latitude !== null && site.geo.longitude !== null) {
    base.geo = {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    };
  }
  return base;
}

/**
 * Schema.org Organization para la home y el bloque "El Despacho".
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.phone,
        contactType: 'customer service',
        areaServed: 'HN',
        availableLanguage: ['Spanish'],
        hoursAvailable: site.hoursStructured.map((h) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.dayOfWeek,
          opens: h.opens,
          closes: h.closes,
        })),
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
  };
}
