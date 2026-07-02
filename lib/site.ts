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
 * Indexable por defecto. Solo activar anti-indexación si se asigna
 * explícitamente NEXT_PUBLIC_NOINDEX=true (staging, previews).
 * Una sola variable controla robots, header HTTP y sitemap.
 */
const noindexActive = envNoindex === 'true';

export const site = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pinedayasociadoshn.com').replace(/\/+$/, ''),
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pineda y Asociados',
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT ?? 'Pineda y Asociados',
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    'Abogados en Nacaome, Valle, Honduras',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    'Bufete en Nacaome, Valle. Defensa penal, familia, laboral, civil y mercantil. Atención directa y presupuesto por escrito. WhatsApp +504 9536-3724.',
  keywords:
    (process.env.NEXT_PUBLIC_SITE_KEYWORDS ??
      'abogados Nacaome, bufete jurídico Valle Honduras, abogado penalista Nacaome, defensa penal sur Honduras, abogados San Lorenzo, abogados Choluteca, abogados Goascorán, abogados Amapala, abogados Pespire, abogados San Marcos de Colón, abogados Marcovia, abogado de familia Valle, abogado laboral Nacaome, derecho civil sur Honduras, abogado mercantil Nacaome, consulta legal gratuita Nacaome, bufete jurídico sur Honduras, Código Penal Decreto 130-2017 y reformas vigentes').split(',').map((k) => k.trim()),
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+50495363724',
  phoneDisplay: '+504 9536-3724',
  whatsapp: (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '50495363724').replace(/\D/g, ''),
  whatsappDisplay: '+504 9536-3724',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contacto@pinedayasociadoshn.com',
  address: {
    line1: 'GGJ7+239',
    line2: 'Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA',
    city: 'Nacaome',
    department: 'Valle',
    country: 'Honduras',
    countryCode: 'HN',
    full: 'GGJ7+239, Nacaome, Valle, Honduras',
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
    latitude: process.env.NEXT_PUBLIC_GEO_LAT ? Number(process.env.NEXT_PUBLIC_GEO_LAT) : 13.5300375,
    longitude: process.env.NEXT_PUBLIC_GEO_LNG ? Number(process.env.NEXT_PUBLIC_GEO_LNG) : -87.487265625,
  },
  // TODO (datos externos): cuando el despacho aporte URLs reales y verificadas
  // de Facebook, Instagram, LinkedIn, YouTube o X (Twitter), añadirlas aquí vía
  // variables de entorno NEXT_PUBLIC_SOCIAL_*. Estas URLs alimentan el campo
  // `sameAs` de los schemas Organization/LegalService (refuerzo E-E-A-T) y el
  // bloque de redes del footer. NO inventar perfiles: `null` por defecto.
  // Facebook Pixel: solo activar si existe ID real + consentimiento de cookies.
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? 'https://www.facebook.com/profile.php?id=61590934058125',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? null,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? null,
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? 'https://x.com/Danilo_Pineda_M',
  },
  /** Google Business Profile — perfil oficial del bufete en Google Maps. */
  googleBusiness: 'https://maps.app.goo.gl/giJcUrJ7yaVHpnkCA',
  legal: {
    jurisdiction: 'República de Honduras',
    code: 'Código Penal Decreto 130-2017 y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024)',
    isProd: process.env.NODE_ENV === 'production',
  },
  /**
   * Métricas verificables del corpus legal del sitio (fuente: data/*.json).
   * Centralizadas aquí para evitar literales mágicos (635, 8) hardcodeados
   * en componentes. Si los datos canónicos cambian, se actualiza aquí.
   *   - articulosCp: data/articulos_cp.json (635 verificados)
   *   - delitosCp: data/delitos.json (483 verificados, ver §8 AGENTS.md)
   *   - pasosWizard: pasos del flujo /calculadora (constante de producto)
   */
  corpus: {
    articulosCp: 635,
    delitosCp: 483,
    pasosWizard: 8,
  },
  /** Si true, todo el sitio emite noindex,nofollow y bloquea rastreadores. */
  noindex: noindexActive,
  /** ID GA4 (opcional) — tracking frontend. */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? null,
  /** ID Microsoft Clarity (opcional). */
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? null,
  /** Código de verificación de Google Search Console (opcional). */
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? null,
  /** Clave IndexNow (opcional). */
  indexNowKey: process.env.INDEXNOW_KEY ?? null,
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
 * Áreas de conocimiento del bufete para los schemas Organization y LegalService.
 * Fuente única (DRY): se reutiliza en ambos schemas. Refuerza E-E-A-T y la
 * autoridad temática del despacho ante Google.
 */
export const KNOWS_ABOUT = [
  'Derecho Penal',
  'Derecho de Familia',
  'Derecho Laboral',
  'Derecho Civil y Notarial',
  'Derecho Mercantil y Empresarial',
  'Derecho Tributario y Fiscal',
  'Derecho Bancario y Financiero',
  'Derecho Administrativo y Servicio Civil',
  'Derecho Aduanero',
  'Regulación Sanitaria',
  'Extranjería y Migración',
  'Propiedad Intelectual',
  'Derecho Ambiental Regulatorio',
  'Conciliación y Arbitraje',
  'Código Penal Decreto 130-2017 de Honduras y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024)',
];

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
    // email: se omite del JSON-LD por política anti-scraping. El contacto se
    // ofrece vía ContactPoint (teléfono/WhatsApp) y el formulario /solicitar-consulta.
    // Si en el futuro se quiere exponer, descomentar: email: site.email,
    description: site.description,
    image: `${site.url}/og-image.webp`,
    // Logo oficial del bufete (PNG transparente, 741×728 ~cuadrado, sin fondo)
    logo: `${site.url}/images/logo.png`,
    priceRange: '$$',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    currenciesAccepted: 'HNL, USD',
    areaServed: [
      { '@type': 'City', name: 'Nacaome' },
      { '@type': 'City', name: 'San Lorenzo' },
      { '@type': 'City', name: 'Choluteca' },
      { '@type': 'City', name: 'Goascorán' },
      { '@type': 'City', name: 'Amapala' },
      { '@type': 'City', name: 'Pespire' },
      { '@type': 'City', name: 'San Marcos de Colón' },
      { '@type': 'City', name: 'Marcovia' },
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
    serviceType:
      'Bufete jurídico — defensa penal, familia, laboral, civil, mercantil, tributario, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, ambiental y conciliación/arbitraje',
    knowsAbout: KNOWS_ABOUT,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios jurídicos en Nacaome, Valle',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Defensa Penal', description: 'Defensa técnica en procesos penales conforme al Código Penal Decreto 130-2017 de Honduras y reformas. Asistencia a detenidos, audiencias, juicio oral y recursos.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho de Familia', description: 'Divorcios, pensión alimenticia, custodia de menores, régimen de visitas y adopciones ante los juzgados de familia.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Laboral', description: 'Despidos injustificados, reclamación de prestaciones, liquidaciones, acoso laboral y asesoría a trabajadores y empleadores.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Civil y Notarial', description: 'Contratos, compraventas, herencias, testamentos, poderes notariales y trámites registrales.' } },
      ],
    },
    employee: [
      { '@id': `${site.url}/#founder` },
      { '@id': `${site.url}/#thania` },
      { '@id': `${site.url}/#emil` },
    ],
    ...(site.social.facebook || site.social.instagram || site.social.tiktok || site.social.x || site.googleBusiness
      ? {
          sameAs: [
            site.social.facebook,
            site.social.instagram,
            site.social.tiktok,
            site.social.x,
            site.googleBusiness,
          ].filter(Boolean),
        }
      : {}),
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
 * Schema.org WebSite para búsqueda y navegación.
 *
 * `publisher` apunta a Organization (convención estándar de Schema.org y la
 * que usa Google para el Knowledge Graph). Antes apuntaba a LegalService, lo
 * cual es válido pero inusual y dificultaba la vinculación entidad→sitio.
 */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'es-HN',
    publisher: { '@id': `${site.url}/#organization` },
  };
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
    // Logo oficial (PNG transparente, ≥112px para Google Rich Results)
    logo: `${site.url}/images/logo.png`,
    // Imagen para Knowledge Graph de Google. Reutilizamos og-image.webp (1200x630)
    // como imagen representativa del sitio.
    image: `${site.url}/og-image.webp`,
    // foundingDate: "~2010" refleja "más de 15 años de ejercicio profesional"
    // declarado en la home (auditoría 2026). Reemplazar por año exacto si se conoce.
    foundingDate: '2010',
    // slogan: frase corta sin duplicar la marca (name ya la incluye).
    slogan: 'Abogados en Nacaome, Valle',
    knowsAbout: KNOWS_ABOUT,
    // sameAs: OMITIDO. Solo debe contener perfiles externos oficiales y
    // verificados (Facebook, LinkedIn, GBP, etc.). El propio dominio NO es un
    // perfil externo. Cuando el despacho aporte URLs reales, añadirlas aquí
    // vía site.social.* (que alimenta también LegalService.sameAs).
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
    // founder: array de @id — Danilo y Thania son socios fundadores.
    // `founder` acepta Person o Person[] según Schema.org; usamos array para
    // reflejar la codirección fundacional del bufete.
    founder: [
      { '@id': `${site.url}/#founder` },
      { '@id': `${site.url}/#thania` },
    ],
  };
}

/**
 * Datos del fundador y socio director del bufete.
 *
 * Identidad pública verificable: el handle de X (Danilo_Pineda_M) y la firma
 * «Pineda y Asociados» confirman a Danilo Pineda Maradiaga como socio director.
 * Claims verificables ya presentes en el sitio (R4 — no inventar):
 *   - «más de 15 años de ejercicio profesional» (/despacho)
 *   - «Abogado colegiado en Honduras» (/despacho)
 *   - «defensa penal como pilar histórico» (/despacho)
 *   - «asistencia a detenidos, audiencias iniciales, preliminares, de
 *      sobreseimiento, juicio oral y recursos de casación» (/despacho)
 *   - «departamento de Valle y zonas circunvecinas» (/despacho)
 */
export const FOUNDER_PROFILE = {
  name: 'Danilo Pineda Maradiaga',
  jobTitle: 'Abogado penalista · Socio director',
  /** Retrato principal (Foto1) — home + /despacho + schema Person.image. */
  image: '/images/equipo/danilo-pineda-maradiaga.webp',
  /** Retrato alternativo (Foto2) — /derecho-penal + sidebar /solicitar-consulta. */
  imageAlt: '/images/equipo/danilo-pineda-maradiaga-alt.webp',
  /** Retrato penal (Foto3) — /derecho-penal sección adicional. */
  imagePenal: '/images/equipo/danilo-pineda-maradiaga-penal.webp',
  imageAltText: 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)',
  description:
    'Abogado penalista en el sur de Honduras con más de 15 años de ejercicio profesional. Colegiado en Honduras. Defensa penal como pilar histórico del bufete: asistencia a detenidos, audiencias iniciales, preliminares, de sobreseimiento, juicio oral y recursos de casación en el departamento de Valle y zonas circunvecinas.',
  city: 'Nacaome',
  department: 'Valle',
} as const;

/**
 * Schema.org Person para el fundador (Danilo Pineda Maradiaga).
 *
 * Refuerza E-E-A-T (Experience, Expertise, Authoritativeness,
 * Trustworthiness) para temas YMYL jurídicos: Google exige autor
 * identificable en derecho. Se vincula desde Organization.founder,
 * LegalService.employee y BlogPosting.author (vía @id) para alimentar el
 * Knowledge Graph y posibilitar el panel de conocimiento de la entidad.
 */
export function founderSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#founder`,
    name: FOUNDER_PROFILE.name,
    image: `${site.url}${FOUNDER_PROFILE.image}`,
    jobTitle: FOUNDER_PROFILE.jobTitle,
    description: FOUNDER_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    knowsAbout: [
      'Derecho Penal',
      'Derecho Procesal Penal',
      'Derecho de Familia',
      'Derecho Laboral',
      'Derecho Civil y Notarial',
      'Derecho Mercantil y Empresarial',
      'Código Penal Decreto 130-2017 de Honduras y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024)',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    areaServed: [
      { '@type': 'City', name: 'Nacaome' },
      { '@type': 'City', name: 'San Lorenzo' },
      { '@type': 'City', name: 'Choluteca' },
      { '@type': 'City', name: 'Goascorán' },
      { '@type': 'City', name: 'Amapala' },
      { '@type': 'City', name: 'Pespire' },
      { '@type': 'City', name: 'San Marcos de Colón' },
      { '@type': 'City', name: 'Marcovia' },
      { '@type': 'State', name: site.address.department },
    ],
    // sameAs: solo perfiles públicos verificables de Danilo. El handle de X
    // es claramente personal (Danilo_Pineda_M). Se añade googleBusiness
    // (perfil del bufete en Google Maps que lo representa como abogado).
    // NO se inventan perfiles (R4). Cuando se verifique Facebook/LinkedIn
    // personal, añadirlos aquí vía site.social.*.
    sameAs: [site.social.x, site.googleBusiness].filter(Boolean),
  };
}

/**
 * Datos de Thania Marlene Paz — socia fundadora del bufete.
 *
 * Especialidades verificables (aportadas por el despacho, R4 — no inventar):
 *   - Derecho Administrativo y Servicio Civil
 *   - Derecho de Familia
 *   - Derecho Civil y Notarial
 *   - Derecho Mercantil y Empresarial
 * Condición: socia fundadora (codirección fundacional junto a Danilo).
 */
export const THANIA_PROFILE = {
  name: 'Thania Marlene Paz',
  jobTitle: 'Abogada · Socia fundadora',
  image: '/images/equipo/thania-marlene-paz.webp',
  imageAltText: 'Thania Marlene Paz, abogada socia fundadora de Pineda y Asociados en Nacaome, Valle (Honduras)',
  description:
    'Abogada socia fundadora de Pineda y Asociados. Especializada en derecho administrativo, familia, civil y notarial, y mercantil y empresarial. Atiende casos en Nacaome, Valle y la zona sur de Honduras.',
  specialties: [
    'Derecho Administrativo y Servicio Civil',
    'Derecho de Familia',
    'Derecho Civil y Notarial',
    'Derecho Mercantil y Empresarial',
  ],
  city: 'Nacaome',
  department: 'Valle',
} as const;

/**
 * Schema.org Person para Thania Marlene Paz (socia fundadora).
 *
 * Se vincula desde Organization.founder (array junto a #founder),
 * LegalService.employee y BlogPosting.author (categorías de familia, civil,
 * mercantil, administrativo, propiedad intelectual) vía @id.
 */
export function thaniaSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#thania`,
    name: THANIA_PROFILE.name,
    image: `${site.url}${THANIA_PROFILE.image}`,
    jobTitle: THANIA_PROFILE.jobTitle,
    description: THANIA_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    knowsAbout: THANIA_PROFILE.specialties,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    areaServed: [
      { '@type': 'City', name: 'Nacaome' },
      { '@type': 'City', name: 'San Lorenzo' },
      { '@type': 'City', name: 'Choluteca' },
      { '@type': 'City', name: 'Goascorán' },
      { '@type': 'City', name: 'Amapala' },
      { '@type': 'City', name: 'Pespire' },
      { '@type': 'City', name: 'San Marcos de Colón' },
      { '@type': 'City', name: 'Marcovia' },
      { '@type': 'State', name: site.address.department },
    ],
  };
}

/**
 * Datos de Emil Barahona — socio del bufete.
 *
 * Especialidades verificables (aportadas por el despacho, R4 — no inventar):
 *   - Derecho Laboral
 *   - Derecho Penal
 *   - Derecho Civil y Notarial
 * Condición: socio del bufete (no fundador).
 */
export const EMIL_PROFILE = {
  name: 'Emil Barahona',
  jobTitle: 'Abogado · Socio del bufete',
  image: '/images/equipo/emil-barahona.webp',
  imageAltText: 'Emil Barahona, abogado socio de Pineda y Asociados en Nacaome, Valle (Honduras)',
  description:
    'Abogado socio de Pineda y Asociados. Especializado en derecho laboral, penal, y civil y notarial. Atiende casos en Nacaome, Valle y la zona sur de Honduras.',
  specialties: [
    'Derecho Laboral',
    'Derecho Penal',
    'Derecho Civil y Notarial',
  ],
  city: 'Nacaome',
  department: 'Valle',
} as const;

/**
 * Schema.org Person para Emil Barahona (socio del bufete).
 *
 * Se vincula desde LegalService.employee y BlogPosting.author (categorías
 * laboral) vía @id. No aparece en Organization.founder (no es fundador).
 */
export function emilSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#emil`,
    name: EMIL_PROFILE.name,
    image: `${site.url}${EMIL_PROFILE.image}`,
    jobTitle: EMIL_PROFILE.jobTitle,
    description: EMIL_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    knowsAbout: EMIL_PROFILE.specialties,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    areaServed: [
      { '@type': 'City', name: 'Nacaome' },
      { '@type': 'City', name: 'San Lorenzo' },
      { '@type': 'City', name: 'Choluteca' },
      { '@type': 'City', name: 'Goascorán' },
      { '@type': 'City', name: 'Amapala' },
      { '@type': 'City', name: 'Pespire' },
      { '@type': 'City', name: 'San Marcos de Colón' },
      { '@type': 'City', name: 'Marcovia' },
      { '@type': 'State', name: site.address.department },
    ],
  };
}
