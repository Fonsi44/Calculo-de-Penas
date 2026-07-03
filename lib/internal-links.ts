/**
 * Grafo semántico centralizado de enlazado interno.
 *
 * Fuente única de verdad (Jul 2026) para las relaciones entre entidades del
 * sitio: servicios ↔ blog ↔ ciudades ↔ áreas de práctica. Reemplaza la
 * lógica dispersa que vivía en `servicios-juridicos/[slug]/page.tsx` (map
 * SERVICE_TO_BLOG_CATEGORY), `related-service.tsx` (CATEGORY_SERVICE_MAP),
 * `landing-local.tsx` (SERVICIO_SLUG_MAP) y `data/areas-juridicas.ts`
 * (getRelatedAreas, roto y sin usar).
 *
 * Objetivo: construir una tela de araña temática donde cada URL relevante
 * reciba autoridad y rutas múltiples de descubrimiento (clusters temáticos,
 * silos geográficos, relaciones semánticas).
 */

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIOS — catálogo canónico (13 áreas generales + penal como hub propio)
// ─────────────────────────────────────────────────────────────────────────────

export interface PracticeArea {
  slug: string;
  titulo: string;
  href: string;
}

/**
 * Las 14 áreas de práctica con su ruta canónica.
 * `derecho-penal` apunta al hub dedicado `/derecho-penal` (no a servicios).
 */
export const PRACTICE_AREAS: PracticeArea[] = [
  { slug: 'derecho-penal', titulo: 'Derecho Penal', href: '/derecho-penal' },
  { slug: 'derecho-de-familia', titulo: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  { slug: 'derecho-laboral', titulo: 'Derecho Laboral', href: '/servicios-juridicos/derecho-laboral' },
  { slug: 'derecho-civil-y-notarial', titulo: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  { slug: 'derecho-mercantil-empresarial', titulo: 'Derecho Mercantil y Empresarial', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  { slug: 'derecho-bancario-y-financiero', titulo: 'Derecho Bancario y Financiero', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
  { slug: 'derecho-administrativo-y-servicio-civil', titulo: 'Derecho Administrativo', href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil' },
  { slug: 'derecho-aduanero-y-comercio-exterior', titulo: 'Derecho Aduanero', href: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior' },
  { slug: 'regulacion-sanitaria', titulo: 'Regulación Sanitaria', href: '/servicios-juridicos/regulacion-sanitaria' },
  { slug: 'extranjeria-en-honduras', titulo: 'Extranjería en Honduras', href: '/servicios-juridicos/extranjeria-en-honduras' },
  { slug: 'propiedad-intelectual', titulo: 'Propiedad Intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
  { slug: 'tributario-fiscal', titulo: 'Derecho Tributario y Fiscal', href: '/servicios-juridicos/tributario-fiscal' },
  { slug: 'ambiental-regulatorio', titulo: 'Derecho Ambiental Regulatorio', href: '/servicios-juridicos/ambiental-regulatorio' },
  { slug: 'conciliacion-y-arbitraje', titulo: 'Conciliación y Arbitraje', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO ↔ BLOG — puente bidireccional
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapa service slug → blog category slug.
 * Centraliza el map que antes vivía en `servicios-juridicos/[slug]/page.tsx`.
 */
export const SERVICE_TO_BLOG_CATEGORY: Record<string, string> = {
  'derecho-penal': 'derecho-penal',
  'derecho-de-familia': 'derecho-de-familia',
  'derecho-laboral': 'derecho-laboral',
  'derecho-civil-y-notarial': 'derecho-civil',
  'derecho-mercantil-empresarial': 'derecho-mercantil',
  'derecho-bancario-y-financiero': 'derecho-bancario',
  'derecho-administrativo-y-servicio-civil': 'derecho-administrativo',
  'derecho-aduanero-y-comercio-exterior': 'derecho-aduanero',
  'regulacion-sanitaria': 'regulacion-sanitaria',
  'extranjeria-en-honduras': 'extranjeria-migracion',
  'propiedad-intelectual': 'propiedad-intelectual',
  'tributario-fiscal': 'tributario',
  'ambiental-regulatorio': 'derecho-ambiental',
  'conciliacion-y-arbitraje': 'conciliacion-arbitraje',
};

/**
 * Mapa blog category slug → { name, href } del servicio asociado.
 * Centraliza el map que antes vivía en `components/blog/related-service.tsx`.
 * Incluye variantes de slug (alias) para resiliencia.
 */
export const BLOG_TO_SERVICE: Record<string, { name: string; href: string }> = {
  'derecho-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'proceso-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'defensa-penal': { name: 'Defensa Penal', href: '/derecho-penal' },
  'derecho-de-familia': { name: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  'derecho-familia': { name: 'Derecho de Familia', href: '/servicios-juridicos/derecho-de-familia' },
  'derecho-laboral': { name: 'Derecho Laboral', href: '/servicios-juridicos/derecho-laboral' },
  'derecho-civil': { name: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  'derecho-civil-y-notarial': { name: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  'derecho-notarial': { name: 'Derecho Civil y Notarial', href: '/servicios-juridicos/derecho-civil-y-notarial' },
  'derecho-mercantil': { name: 'Derecho Mercantil y Empresarial', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  'derecho-mercantil-y-empresarial': { name: 'Derecho Mercantil y Empresarial', href: '/servicios-juridicos/derecho-mercantil-empresarial' },
  'derecho-bancario': { name: 'Derecho Bancario y Financiero', href: '/servicios-juridicos/derecho-bancario-y-financiero' },
  'derecho-aduanero': { name: 'Derecho Aduanero', href: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior' },
  'derecho-administrativo': { name: 'Derecho Administrativo', href: '/servicios-juridicos/derecho-administrativo-y-servicio-civil' },
  'derecho-ambiental': { name: 'Derecho Ambiental Regulatorio', href: '/servicios-juridicos/ambiental-regulatorio' },
  'regulacion-sanitaria': { name: 'Regulación Sanitaria', href: '/servicios-juridicos/regulacion-sanitaria' },
  'extranjeria-migracion': { name: 'Extranjería en Honduras', href: '/servicios-juridicos/extranjeria-en-honduras' },
  'propiedad-intelectual': { name: 'Propiedad Intelectual', href: '/servicios-juridicos/propiedad-intelectual' },
  'conciliacion-arbitraje': { name: 'Conciliación y Arbitraje', href: '/servicios-juridicos/conciliacion-y-arbitraje' },
  'hondurenos-en-espana': { name: 'Hondureños en España', href: '/hondurenos-en-espana' },
  'tributario': { name: 'Derecho Tributario y Fiscal', href: '/servicios-juridicos/tributario-fiscal' },
  'derecho-tributario': { name: 'Derecho Tributario y Fiscal', href: '/servicios-juridicos/tributario-fiscal' },
  'tributario-fiscal': { name: 'Derecho Tributario y Fiscal', href: '/servicios-juridicos/tributario-fiscal' },
  'practica-legal': { name: 'El Despacho', href: '/despacho' },
  'derechos-ciudadanos': { name: 'Servicios Jurídicos', href: '/servicios-juridicos' },
  'noticias-legales': { name: 'Blog Jurídico', href: '/blog' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CIUDADES — R18: 10 prioritarias + 6 secundarias
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Las 10 ciudades prioritarias (R18 — AGENTS.md). Enlazadas desde footer,
 * hubs y landings especializadas.
 */
export const PRIORITY_CITY_SLUGS = [
  'nacaome',
  'choluteca',
  'san-lorenzo',
  'goascoran',
  'san-marcos-de-colon',
  'el-triunfo',
  'marcovia',
  'pespire',
  'namasigue',
  'orocuina',
] as const;

/**
 * Las 6 ciudades secundarias (no en footer por R18, se descubren vía la
 * tela de araña: service pages, blog posts, related cities).
 */
export const SECONDARY_CITY_SLUGS = [
  'amapala',
  'langue',
  'caridad',
  'alianza',
  'concepcion-de-maria',
  'san-antonio-de-flores',
] as const;

/** Todas las ciudades con landing local (16). */
export const ALL_CITY_SLUGS = [...PRIORITY_CITY_SLUGS, ...SECONDARY_CITY_SLUGS];

/** Metadatos de ciudad para renderizado de chips. */
export interface CityLink {
  slug: string;
  ciudad: string;
  departamento: string;
  href: string;
}

/** Mapa slug → {ciudad, departamento} para los chips. */
const CITY_META: Record<string, { ciudad: string; departamento: string }> = {
  nacaome: { ciudad: 'Nacaome', departamento: 'Valle' },
  choluteca: { ciudad: 'Choluteca', departamento: 'Choluteca' },
  'san-lorenzo': { ciudad: 'San Lorenzo', departamento: 'Valle' },
  goascoran: { ciudad: 'Goascorán', departamento: 'Valle' },
  'san-marcos-de-colon': { ciudad: 'San Marcos de Colón', departamento: 'Choluteca' },
  'el-triunfo': { ciudad: 'El Triunfo', departamento: 'Choluteca' },
  marcovia: { ciudad: 'Marcovia', departamento: 'Choluteca' },
  pespire: { ciudad: 'Pespire', departamento: 'Choluteca' },
  namasigue: { ciudad: 'Namasigüe', departamento: 'Choluteca' },
  orocuina: { ciudad: 'Orocuina', departamento: 'Choluteca' },
  amapala: { ciudad: 'Amapala', departamento: 'Valle' },
  langue: { ciudad: 'Langue', departamento: 'Valle' },
  caridad: { ciudad: 'Caridad', departamento: 'Valle' },
  alianza: { ciudad: 'Alianza', departamento: 'Valle' },
  'concepcion-de-maria': { ciudad: 'Concepción de María', departamento: 'Choluteca' },
  'san-antonio-de-flores': { ciudad: 'San Antonio de Flores', departamento: 'Choluteca' },
};

/** Devuelve las ciudades prioritarias (R18) como CityLink[]. */
export function getPriorityCities(limit?: number): CityLink[] {
  const slugs = limit ? PRIORITY_CITY_SLUGS.slice(0, limit) : PRIORITY_CITY_SLUGS;
  return slugs.map((slug) => {
    const meta = CITY_META[slug];
    return { slug, ciudad: meta.ciudad, departamento: meta.departamento, href: `/abogados-en-${slug}` };
  });
}

/** Devuelve todas las ciudades (16) como CityLink[]. */
export function getAllCities(): CityLink[] {
  return ALL_CITY_SLUGS.map((slug) => {
    const meta = CITY_META[slug];
    return { slug, ciudad: meta.ciudad, departamento: meta.departamento, href: `/abogados-en-${slug}` };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE CONSULTA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el slug de categoría de blog asociado a un servicio.
 * Centraliza SERVICE_TO_BLOG_CATEGORY lookup.
 */
export function getServiceBlogCategory(serviceSlug: string): string | undefined {
  return SERVICE_TO_BLOG_CATEGORY[serviceSlug];
}

/**
 * Devuelve { name, href } del servicio asociado a una categoría de blog.
 * Centraliza BLOG_TO_SERVICE lookup (con fallback a /despacho).
 */
export function getBlogService(categorySlug: string): { name: string; href: string } {
  return BLOG_TO_SERVICE[categorySlug] ?? { name: 'El Despacho', href: '/despacho' };
}

/**
 * Devuelve las N áreas de práctica relacionadas con un servicio, excluyendo
 * la propia. Basado en `areasRelacionadas` (data/areas-juridicas.ts) pero
 * resuelto contra PRACTICE_AREAS (incluye penal, a diferencia del helper
 * roto original que solo miraba areasGenerales).
 */
export function getRelatedServices(serviceSlug: string, limit = 4): PracticeArea[] {
  // Importación lazy para evitar dependencia circular con data/areas-juridicas.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { areasGenerales, hubPenal, hubMigrantes } = require('@/data/areas-juridicas') as {
    areasGenerales: Array<{ slug: string; titulo: string; areasRelacionadas: string[] }>;
    hubPenal: { slug: string; titulo: string; areasRelacionadas: string[] };
    hubMigrantes: { slug: string; titulo: string; areasRelacionadas: string[] };
  };

  // Buscar el área origen y sus areasRelacionadas.
  const allAreas = [
    ...areasGenerales,
    { slug: hubPenal.slug, titulo: hubPenal.titulo, areasRelacionadas: hubPenal.areasRelacionadas },
    { slug: hubMigrantes.slug, titulo: hubMigrantes.titulo, areasRelacionadas: hubMigrantes.areasRelacionadas },
  ];
  const source = allAreas.find((a) => a.slug === serviceSlug);
  if (!source) {
    // Fallback: si no encuentra el área, devolver las 4 primeras (penal siempre primero).
    return PRACTICE_AREAS.filter((a) => a.slug !== serviceSlug).slice(0, limit);
  }

  // Resolver cada slug relacionado contra PRACTICE_AREAS.
  const resolved: PracticeArea[] = [];
  for (const relSlug of source.areasRelacionadas) {
    const area = PRACTICE_AREAS.find((a) => a.slug === relSlug);
    if (area && area.slug !== serviceSlug) {
      resolved.push(area);
    }
    if (resolved.length >= limit) break;
  }

  // Si no hay suficientes, completar con áreas populares (no duplicadas).
  if (resolved.length < limit) {
    const existing = new Set([serviceSlug, ...resolved.map((r) => r.slug)]);
    for (const area of PRACTICE_AREAS) {
      if (resolved.length >= limit) break;
      if (!existing.has(area.slug)) {
        resolved.push(area);
        existing.add(area.slug);
      }
    }
  }

  return resolved.slice(0, limit);
}

/**
 * Devuelve las ciudades más relevantes para una página de servicio o post.
 * Por defecto devuelve las 6 prioritarias más cercanas (R18).
 * Para posts geográficos (mencionan ciudad), prioriza esa ciudad primero.
 */
export function getRelatedCitiesForContent(mentionedCitySlug?: string | null, limit = 6): CityLink[] {
  const priority = getPriorityCities();
  if (!mentionedCitySlug) {
    return priority.slice(0, limit);
  }
  // Si se menciona una ciudad, ponerla primera y rellenar con el resto.
  const mentioned = priority.find((c) => c.slug === mentionedCitySlug);
  if (mentioned) {
    const rest = priority.filter((c) => c.slug !== mentionedCitySlug);
    return [mentioned, ...rest].slice(0, limit);
  }
  // Si la ciudad mencionada es secundaria, añadirla al principio.
  const meta = CITY_META[mentionedCitySlug];
  if (meta) {
    const secondaryCity: CityLink = {
      slug: mentionedCitySlug,
      ciudad: meta.ciudad,
      departamento: meta.departamento,
      href: `/abogados-en-${mentionedCitySlug}`,
    };
    return [secondaryCity, ...priority].slice(0, limit);
  }
  return priority.slice(0, limit);
}
