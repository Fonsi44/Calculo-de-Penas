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

export const CANONICAL_SITE_ORIGIN = 'https://www.pinedayasociadoshn.com';
const CANONICAL_SITE_HOSTNAME = 'www.pinedayasociadoshn.com';
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * Normaliza y valida el origen canónico antes de que alimente metadata,
 * sitemap, robots, RSS y JSON-LD.
 *
 * La validación es deliberadamente estricta: una variable de entorno con
 * prefijos, saltos de línea, otro dominio, query o path debe detener el build
 * en vez de publicar señales SEO corruptas.
 */
export function normalizeSiteOrigin(raw: string | null | undefined): string {
  const candidate = (raw ?? CANONICAL_SITE_ORIGIN).trim();

  if (!candidate || CONTROL_CHARACTERS.test(candidate)) {
    throw new Error('NEXT_PUBLIC_SITE_URL contiene caracteres de control o está vacía.');
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL debe ser una URL absoluta válida.');
  }

  const hasUnexpectedParts =
    parsed.protocol !== 'https:' ||
    parsed.hostname !== CANONICAL_SITE_HOSTNAME ||
    parsed.port !== '' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    (parsed.pathname !== '' && parsed.pathname !== '/') ||
    parsed.search !== '' ||
    parsed.hash !== '';

  const hasUnexpectedSpelling =
    candidate !== CANONICAL_SITE_ORIGIN &&
    candidate !== `${CANONICAL_SITE_ORIGIN}/`;

  if (
    hasUnexpectedParts ||
    hasUnexpectedSpelling ||
    parsed.origin !== CANONICAL_SITE_ORIGIN
  ) {
    throw new Error(`NEXT_PUBLIC_SITE_URL debe ser exactamente ${CANONICAL_SITE_ORIGIN}.`);
  }

  return CANONICAL_SITE_ORIGIN;
}

export function resolveAnalyticsProviderConfig(
  rawGaId: string | null | undefined,
  rawGtmId: string | null | undefined,
): { gaId: string | null; gtmId: string | null } {
  const gaId = rawGaId?.trim() || null;
  const gtmId = rawGtmId?.trim() || null;

  if (gaId && gtmId) {
    throw new Error(
      'NEXT_PUBLIC_GA_ID y NEXT_PUBLIC_GTM_ID son mutuamente excluyentes; configure solo uno.',
    );
  }

  return { gaId, gtmId };
}

const analyticsProviderConfig = resolveAnalyticsProviderConfig(
  process.env.NEXT_PUBLIC_GA_ID,
  process.env.NEXT_PUBLIC_GTM_ID,
);

/**
 * Formatea un número E.164 (+50495363724) a display legible (+504 9536-3724).
 * Fuente única para phoneDisplay y whatsappDisplay → NAP coherente en todo el
 * sitio (visible, tel:, JSON-LD). Si el número no encaja en el patrón HN
 * conocido, devuelve el original sin alterar (no inventa formato).
 */
function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  // Honduras: 504 + 8 dígitos → "+504 XXXX-XXXX"
  const hn = digits.match(/^504(\d{4})(\d{4})$/);
  if (hn) return `+504 ${hn[1]}-${hn[2]}`;
  // Generic fallback con prefijo internacional y el resto agrupado en 4s.
  const intl = digits.match(/^(\d{1,3})(\d+)$/);
  if (intl) {
    const rest = intl[2].replace(/(.{4})/g, '$1 ').trim();
    return `+${intl[1]} ${rest}`;
  }
  return e164;
}

export const site = {
  url: normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL),
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pineda y Asociados',
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT ?? 'Pineda y Asociados',
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    'Abogados en Nacaome, Valle | Pineda y Asociados',
  description:
    'Abogados colegiados en Nacaome para defensa penal, familia, asuntos laborales, civiles y mercantiles. Atención directa, consulta confidencial y presupuesto por escrito.',
  keywords:
    (process.env.NEXT_PUBLIC_SITE_KEYWORDS ??
      'abogados Nacaome, bufete jurídico Valle Honduras, abogado penalista Nacaome, defensa penal sur Honduras, abogados San Lorenzo, abogados Choluteca, abogados Goascorán, abogados Amapala, abogados Pespire, abogados San Marcos de Colón, abogados Marcovia, abogado de familia Valle, abogado laboral Nacaome, derecho civil sur Honduras, abogado mercantil Nacaome, consulta legal gratuita Nacaome, bufete jurídico sur Honduras, Código Penal Decreto 130-2017 y reformas vigentes').split(',').map((k) => k.trim()),
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+50495363724',
  /** Formato legible del teléfono. Deriva del mismo número que `phone` para
   *  garantizar NAP coherente (un solo dato). Si se cambia NEXT_PUBLIC_CONTACT_PHONE,
   *  el display sigue siendo consistente; solo se sobrescribe con env explícito. */
  phoneDisplay: process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY
    ?? formatPhoneDisplay(process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+50495363724'),
  whatsapp: (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '50495363724').replace(/\D/g, ''),
  /** WhatsApp legible. Misma lógica que phoneDisplay: deriva de `whatsapp`. */
  whatsappDisplay: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_DISPLAY
    ?? formatPhoneDisplay('+' + (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '50495363724').replace(/\D/g, '')),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contacto@pinedayasociadoshn.com',
  address: {
    line1: 'GGJ7+239',
    line2: 'Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA',
    city: 'Nacaome',
    department: 'Valle',
    country: 'Honduras',
    countryCode: 'HN',
    postalCode: '13101',
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
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? 'https://www.facebook.com/profile.php?id=61590934058125',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? null,
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? null,
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? null,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? null,
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? 'https://x.com/Danilo_Pineda_M',
  },
  /** Google Business Profile — perfil oficial del bufete en Google Maps. */
  googleBusiness: 'https://maps.app.goo.gl/xqbpe5n5ufXkH4ff6',
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
  /** ID GA4 (opcional) — tracking frontend. Si se configura GTM, GA4 se carga vía GTM en su lugar. */
  gaId: analyticsProviderConfig.gaId,
  /** ID Google Tag Manager (opcional) — si está presente, reemplaza la carga directa de gtag.js. Formato GTM-XXXXXX. */
  gtmId: analyticsProviderConfig.gtmId,
  /** ID Facebook Pixel (opcional) — solo activar con consentimiento de cookies. Sin banner de consentimiento no se recomienda activar en tráfico UE. */
  fbPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? null,
  /** ID Microsoft Clarity (opcional). */
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? null,
  /** Código de verificación de Google Search Console (opcional). */
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? null,
  /** Clave IndexNow (opcional). */
  indexNowKey: process.env.INDEXNOW_KEY ?? null,
} as const;

export type SiteConfig = typeof site;

/** Valida si una cadena es una URL absoluta válida. */
export function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Filtra un array para quedarse solo con URLs válidas reales (evita nulos y placeholders). */
export function validUrlsOnly(urls: (string | null | undefined)[]): string[] {
  return urls.filter(isValidUrl);
}

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
    // Sin @context aquí: el wrapper @graph de app/(public)/layout.tsx lo aporta
    // una sola vez. Duplicar @context en cada nodo del @graph es un error de
    // validación Schema.org (causa raíz del CSV structured-data de Ahrefs).
    '@type': ['LegalService', 'LocalBusiness'],
    '@id': `${site.url}/#legal-service`,
    name: site.name,
    legalName: site.name,
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
      { '@type': 'City', name: 'San Marcos de Colón' },
      { '@type': 'City', name: 'El Triunfo' },
      { '@type': 'City', name: 'Marcovia' },
      { '@type': 'City', name: 'Pespire' },
      { '@type': 'City', name: 'Namasigüe' },
      { '@type': 'City', name: 'Orocuina' },
      { '@type': 'City', name: 'Langue' },
      { '@type': 'City', name: 'Amapala' },
      { '@type': 'AdministrativeArea', name: site.address.department },
      { '@type': 'Country', name: site.address.country },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 10 },
    openingHoursSpecification: site.hoursStructured.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    knowsLanguage: ['es-HN', 'es-ES'],
    knowsAbout: KNOWS_ABOUT,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.phone,
        contactType: 'customer service',
        areaServed: ['HN'],
        availableLanguage: ['es-HN', 'es-ES'],
        hoursAvailable: site.hoursStructured.map((h) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.dayOfWeek,
          opens: h.opens,
          closes: h.closes,
        })),
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios jurídicos en Nacaome, Valle — 14 áreas de práctica',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Defensa Penal', description: 'Defensa técnica en procesos penales conforme al Código Penal Decreto 130-2017 de Honduras y reformas. Asistencia a detenidos, audiencias, juicio oral y recursos.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho de Familia', description: 'Divorcios, pensión alimenticia, custodia de menores, régimen de visitas y adopciones ante los juzgados de familia.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Laboral', description: 'Despidos injustificados, reclamación de prestaciones, liquidaciones, acoso laboral y asesoría a trabajadores y empleadores.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Civil y Notarial', description: 'Contratos, compraventas, herencias, testamentos, poderes notariales y trámites registrales.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Mercantil y Empresarial', description: 'Constitución de sociedades, contratos comerciales, fusiones, gobierno corporativo y litigio mercantil.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Bancario y Financiero', description: 'Defensa del usuario financiero, reestructuras, ejecución de garantías y cumplimiento CNBS.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Administrativo y Servicio Civil', description: 'Contencioso-administrativo, sanciones regulatorias, despido de servidores públicos y licitaciones.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Aduanero y Comercio Exterior', description: 'Clasificación arancelaria, importación, exportación, ZOLI y defensa ante el SAR.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Regulación Sanitaria', description: 'Registro sanitario ante ARSA, Buenas Prácticas, defensa en sanciones y mala praxis médica.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Extranjería en Honduras', description: 'Visas, residencia temporal y permanente, naturalización y defensa ante el INM.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Propiedad Intelectual', description: 'Registro de marcas, patentes, derechos de autor, licencias y defensa frente a infracciones.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Tributario y Fiscal', description: 'Liquidación de ISR e ISV, fiscalización del SAR, precios de transferencia y contencioso tributario.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Derecho Ambiental Regulatorio', description: 'Licencias ambientales, evaluación de impacto, permisos y defensa ante MiAmbiente.' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Conciliación y Arbitraje', description: 'Resolución extrajudicial de conflictos, mediación y arbitraje institucional.' } },
      ],
    },
    employee: [
      { '@id': `${site.url}/#danilo-pineda-maradiaga` },
      { '@id': `${site.url}/#thania` },
      { '@id': `${site.url}/#emil` },
    ],
    ...(validUrlsOnly([
      site.social.facebook,
      site.social.instagram,
      site.social.linkedin,
      site.social.youtube,
      site.social.tiktok,
      site.social.x,
      site.googleBusiness,
    ]).length > 0
      ? {
          sameAs: validUrlsOnly([
            site.social.facebook,
            site.social.instagram,
            site.social.linkedin,
            site.social.youtube,
            site.social.tiktok,
            site.social.x,
            site.googleBusiness,
          ]),
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
    // @context lo aporta el wrapper @graph en app/(public)/layout.tsx.
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
    // @context lo aporta el wrapper @graph en app/(public)/layout.tsx.
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
    // Año de fundación confirmado directamente por el titular del sitio
    // durante la implementación del 2026-07-25.
    foundingDate: '2010',
    // slogan: frase corta sin duplicar la marca (name ya la incluye).
    slogan: 'Abogados en Nacaome, Valle',
    knowsAbout: KNOWS_ABOUT,
    // sameAs: perfiles externos oficiales y verificados del despacho.
    // Refuerza E-E-A-T y permite a Google/Microsoft/Knowledge Graph enlazar
    // identidades. Solo URLs reales (Facebook, X, GBP). El propio dominio NO
    // es un perfil externo y por eso no aparece aquí.
    sameAs: validUrlsOnly([
      site.social.facebook,
      site.social.instagram,
      site.social.linkedin,
      site.social.youtube,
      site.social.tiktok,
      site.social.x,
      site.googleBusiness
    ]),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.phone,
        contactType: 'customer service',
        areaServed: 'HN',
        // Coherente con LegalService.knowsLanguage: no usar el genérico 'Spanish'
        // sino los BCP-47 específicos. Los LLMs usan este campo para identificar
        // la lengua del servicio y geo-localizar respuestas.
        availableLanguage: ['es-HN', 'es-ES'],
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
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    // Socios fundadores confirmados directamente por el titular del sitio.
    founder: [
      { '@id': `${site.url}/#danilo-pineda-maradiaga` },
      { '@id': `${site.url}/#thania` },
    ],
  };
}

/**
 * Datos del fundador y socio director del bufete.
 *
 * Identidad pública verificable: el handle de X (Danilo_Pineda_M) y la firma
 * «Pineda y Asociados» confirman a Danilo Pineda Maradiaga como socio director.
 * Claims profesionales publicados de forma prudente:
 *   - «Abogado colegiado en Honduras»
 *   - socio fundador y director
 *   - «defensa penal como área principal» (/despacho)
 *   - «asistencia a detenidos, audiencias iniciales, preliminares, de
 *      sobreseimiento, juicio oral y recursos de casación» (/despacho)
 *   - «departamento de Valle y zonas circunvecinas» (/despacho)
 */
export const FOUNDER_PROFILE = {
  name: 'Danilo Pineda Maradiaga',
  jobTitle: 'Abogado penalista · Socio director',
  /** Slug canónico de la página de perfil (plan maestro §4): /equipo/danilo-pineda-maradiaga. */
  slug: 'danilo-pineda-maradiaga',
  /** Retrato principal (Foto1) — home + /despacho + schema Person.image. */
  image: '/images/equipo/danilo-pineda-maradiaga.webp',
  /** Retrato alternativo (Foto2) — /derecho-penal + sidebar /solicitar-consulta. */
  imageAlt: '/images/equipo/danilo-pineda-maradiaga-alt.webp',
  /** Retrato penal (Foto3) — /derecho-penal sección adicional. */
  imagePenal: '/images/equipo/danilo-pineda-maradiaga-penal.webp',
  imageAltText: 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)',
  description:
    'Abogado penalista y socio director de Pineda y Asociados. Atiende asuntos penales desde las primeras diligencias, audiencias y medidas cautelares hasta los recursos y la ejecución penal en el departamento de Valle y zonas circunvecinas.',
  city: 'Nacaome',
  department: 'Valle',
  cah: process.env.NEXT_PUBLIC_CAH_DANILO || null,
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_DANILO || null,
  directorio: process.env.NEXT_PUBLIC_DIRECTORIO_DANILO || null,
} as const;

/**
 * Schema.org Person para el fundador y socio director (Danilo Pineda Maradiaga).
 *
 * Refuerza E-E-A-T (Experience, Expertise, Authoritativeness,
 * Trustworthiness) para temas YMYL jurídicos: Google exige autor
 * identificable en derecho. Se vincula desde Organization.founder,
 * LegalService.employee y BlogPosting.author (vía @id) para alimentar el
 * Knowledge Graph y posibilitar el panel de conocimiento de la entidad.
 */
export function founderSchema() {
  return {
    // @context lo aporta el wrapper @graph en app/(public)/layout.tsx.
    '@type': 'Person',
    '@id': `${site.url}/#danilo-pineda-maradiaga`,
    name: FOUNDER_PROFILE.name,
    honorificPrefix: 'Abogado',
    // knowsLanguage: coherente con LegalService y Organization.
    // Permite a los LLMs identificar el idioma del especialista.
    knowsLanguage: ['es-HN', 'es-ES'],
    image: `${site.url}${FOUNDER_PROFILE.image}`,
    jobTitle: FOUNDER_PROFILE.jobTitle,
    description: FOUNDER_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    ...(FOUNDER_PROFILE.cah
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'license',
            name: `Abogado colegiado en Honduras (CAH: ${FOUNDER_PROFILE.cah})`,
          },
        }
      : {}),
    // alumniOf: formación académica del fundador. Solo se publica si se aporta
    // vía NEXT_PUBLIC_ALUMNI_DANILO el nombre exacto y verificable de la
    // universidad (R4 — no inventar datos profesionales). "Universidad de
    // Honduras" NO es denominación oficial de ninguna universidad hondureña
    // (la pública es UNAH; existen varias privadas con nombres propios), por lo
    // que NO se publica por defecto hasta que el despacho confirme el dato.
    ...(process.env.NEXT_PUBLIC_ALUMNI_DANILO
      ? { alumniOf: { '@type': 'CollegeOrUniversity', name: process.env.NEXT_PUBLIC_ALUMNI_DANILO } }
      : {}),
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
    // sameAs: solo perfiles públicos verificables de Danilo. El handle de X
    // es claramente personal (Danilo_Pineda_M). Se añade googleBusiness
    // (perfil del bufete en Google Maps que lo representa como abogado).
    // NO se inventan perfiles (R4). Cuando se verifique LinkedIn
    // personal, añadirlo vía variables de entorno.
    sameAs: validUrlsOnly([site.social.x, site.googleBusiness, FOUNDER_PROFILE.linkedin, FOUNDER_PROFILE.directorio]),
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
 * Condición de socia fundadora confirmada por el titular del sitio.
 */
export const THANIA_PROFILE = {
  name: 'Thania Marlene Paz',
  jobTitle: 'Abogada · Socia fundadora',
  /** Slug canónico de la página de perfil (plan maestro §4): /equipo/thania-marlene-paz. */
  slug: 'thania-marlene-paz',
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
  cah: process.env.NEXT_PUBLIC_CAH_THANIA || null,
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_THANIA || null,
  directorio: process.env.NEXT_PUBLIC_DIRECTORIO_THANIA || null,
} as const;

/**
 * Schema.org Person para Thania Marlene Paz (socia fundadora).
 *
 * Se vincula desde Organization.founder, LegalService.employee y
 * BlogPosting.author (categorías de familia, civil,
 * mercantil, administrativo, propiedad intelectual) vía @id.
 */
export function thaniaSchema() {
  return {
    // @context lo aporta el wrapper @graph en app/(public)/layout.tsx.
    '@type': 'Person',
    '@id': `${site.url}/#thania`,
    name: THANIA_PROFILE.name,
    honorificPrefix: 'Abogada',
    // knowsLanguage: coherente con LegalService y Organization.
    knowsLanguage: ['es-HN', 'es-ES'],
    image: `${site.url}${THANIA_PROFILE.image}`,
    jobTitle: THANIA_PROFILE.jobTitle,
    description: THANIA_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    ...(THANIA_PROFILE.cah
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'license',
            name: `Abogada colegiada en Honduras (CAH: ${THANIA_PROFILE.cah})`,
          },
        }
      : {}),
    knowsAbout: THANIA_PROFILE.specialties,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    ...(validUrlsOnly([THANIA_PROFILE.linkedin, THANIA_PROFILE.directorio]).length > 0
      ? { sameAs: validUrlsOnly([THANIA_PROFILE.linkedin, THANIA_PROFILE.directorio]) }
      : {}),
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
  /** Slug canónico de la página de perfil (plan maestro §4): /equipo/emil-barahona. */
  slug: 'emil-barahona',
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
  cah: process.env.NEXT_PUBLIC_CAH_EMIL || null,
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_EMIL || null,
  directorio: process.env.NEXT_PUBLIC_DIRECTORIO_EMIL || null,
} as const;

/**
 * Schema.org Person para Emil Barahona (socio del bufete).
 *
 * Se vincula desde LegalService.employee y BlogPosting.author (categorías
 * laboral) vía @id. No aparece en Organization.founder (no es fundador).
 */
export function emilSchema() {
  return {
    // @context lo aporta el wrapper @graph en app/(public)/layout.tsx.
    '@type': 'Person',
    '@id': `${site.url}/#emil`,
    name: EMIL_PROFILE.name,
    honorificPrefix: 'Abogado',
    // knowsLanguage: coherente con LegalService y Organization.
    knowsLanguage: ['es-HN', 'es-ES'],
    image: `${site.url}${EMIL_PROFILE.image}`,
    jobTitle: EMIL_PROFILE.jobTitle,
    description: EMIL_PROFILE.description,
    worksFor: { '@id': `${site.url}/#organization` },
    ...(EMIL_PROFILE.cah
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'license',
            name: `Abogado colegiado en Honduras (CAH: ${EMIL_PROFILE.cah})`,
          },
        }
      : {}),
    knowsAbout: EMIL_PROFILE.specialties,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.department,
      addressCountry: site.address.countryCode,
    },
    ...(validUrlsOnly([EMIL_PROFILE.linkedin, EMIL_PROFILE.directorio]).length > 0
      ? { sameAs: validUrlsOnly([EMIL_PROFILE.linkedin, EMIL_PROFILE.directorio]) }
      : {}),
  };
}

/**
 * Registro canónico de los perfiles públicos del equipo (plan maestro §4).
 *
 * SLUG: nombre estable en la URL pública (`/equipo/[slug]`). No reutiliza
 * los anchors cortos del `/despacho` (`thania`, `emil`): el plan exige slugs
 * legibles con el nombre completo o apellido completo. La correspondencia
 * con el `@id` del nodo `Person` del @graph global se expone vía `personId`,
 * para que el `ProfilePage.mainEntity` enlace siempre al mismo `Person`.
 *
 * IDEMPOTENCIA: ninguna de estas rutas requiere datos productivos para
 * construirse (todo viene de `lib/site.ts`). Esto cumple R4: no se inventan
 * credenciales, CAH, universidad, casos ganados ni años de colegiación.
 */
export interface LawyerProfileMeta {
  slug: string;
  personId: string;
  name: string;
  jobTitle: string;
  /** SEO title absoluto (sin sufijo de marca). Plan maestro §4.2. */
  metaTitle: string;
  /** Meta description (plan maestro §4.2). */
  metaDescription: string;
  /** H1 visible (plan maestro §4.2). */
  h1: string;
  /** Texto profesional canónico (plan §2.1). */
  description: string;
  /** Áreas verificadas. */
  areas: readonly string[];
  /** Path de imagen relativo (puede no existir todavía). */
  image: string;
  imageAlt: string;
}

export const LAWYER_PROFILES: readonly LawyerProfileMeta[] = [
  {
    slug: 'danilo-pineda-maradiaga',
    personId: `${site.url}/#danilo-pineda-maradiaga`,
    name: FOUNDER_PROFILE.name,
    jobTitle: FOUNDER_PROFILE.jobTitle,
    metaTitle: 'Danilo Pineda Maradiaga | Abogado Penalista en Honduras',
    metaDescription:
      'Perfil de Danilo Pineda Maradiaga, abogado penalista y socio director. Defensa penal en Nacaome y la zona sur de Honduras.',
    h1: 'Danilo Pineda Maradiaga, abogado penalista',
    description:
      'Danilo Pineda Maradiaga es abogado penalista, socio director de Pineda y Asociados y abogado colegiado en Honduras. Su práctica se concentra en la defensa penal, la asistencia desde las primeras diligencias, las audiencias, los recursos y la ejecución de la pena. Atiende asuntos en Nacaome y en la zona sur de Honduras con un enfoque técnico, prudente y basado en el análisis individual de cada expediente.',
    areas: [
      'Derecho penal',
      'Proceso penal',
      'Defensa de personas detenidas, investigadas o acusadas',
      'Ejecución penal',
      'Recursos penales',
    ],
    image: FOUNDER_PROFILE.image,
    imageAlt: FOUNDER_PROFILE.imageAltText,
  },
  {
    slug: 'thania-marlene-paz',
    personId: `${site.url}/#thania`,
    name: THANIA_PROFILE.name,
    jobTitle: THANIA_PROFILE.jobTitle,
    metaTitle: 'Thania Marlene Paz | Abogada de Familia, Civil y Mercantil',
    metaDescription:
      'Perfil de Thania Marlene Paz, socia fundadora y abogada colegiada en Honduras. Derecho de familia, administrativo, civil, notarial y mercantil.',
    h1: 'Thania Marlene Paz, abogada de familia, civil y mercantil',
    description:
      'Thania Marlene Paz es abogada, socia fundadora de Pineda y Asociados y abogada colegiada en Honduras. Su práctica comprende derecho de familia, derecho administrativo, asuntos civiles y notariales y asesoría mercantil. Interviene en procedimientos que requieren coordinación documental, negociación, prevención de riesgos y representación ante autoridades administrativas o judiciales.',
    areas: [
      'Derecho de familia',
      'Derecho administrativo',
      'Derecho civil y notarial',
      'Derecho mercantil y empresarial',
    ],
    image: THANIA_PROFILE.image,
    imageAlt: THANIA_PROFILE.imageAltText,
  },
  {
    slug: 'emil-barahona',
    personId: `${site.url}/#emil`,
    name: EMIL_PROFILE.name,
    jobTitle: EMIL_PROFILE.jobTitle,
    metaTitle: 'Emil Barahona | Abogado Laboral, Civil y Penal',
    metaDescription:
      'Perfil de Emil Barahona, socio de Pineda y Asociados y abogado colegiado en Honduras. Derecho laboral, civil, notarial y apoyo en materia penal.',
    h1: 'Emil Barahona, abogado laboral, civil y penal',
    description:
      'Emil Barahona es abogado, socio de Pineda y Asociados y abogado colegiado en Honduras. Su práctica se centra en derecho laboral, asuntos civiles y notariales y apoyo en materia penal. Asesora a trabajadores, particulares y empresas mediante el análisis de documentos, la preparación de reclamaciones y la representación en procedimientos de negociación o litigio.',
    areas: [
      'Derecho laboral',
      'Derecho civil y notarial',
      'Apoyo en derecho penal',
    ],
    image: EMIL_PROFILE.image,
    imageAlt: EMIL_PROFILE.imageAltText,
  },
] as const;

/** Resuelve un profile por slug, o undefined si no existe (R4: no inventa). */
export function getLawyerProfileBySlug(slug: string): LawyerProfileMeta | undefined {
  return LAWYER_PROFILES.find((p) => p.slug === slug);
}
