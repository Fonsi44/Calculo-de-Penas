/**
 * Fuente única de verdad de indexabilidad pública.
 *
 * Determina, para cada URL pública del sitio, si es indexable y a qué canal
 * pertenece (metadata, sitemap, IndexNow, llms.txt). Unifica decisiones que
 * antes vivían dispersas en `app/sitemap.ts`, `scripts/generate-llms-txt.mjs`
 * y `scripts/submit-indexnow.mjs`, de modo que ninguna de ellas puede
 * contradecirse.
 *
 * Fuentes consumidas:
 *   - `data/seo/canonical-paths.json`        → catálogo de rutas estáticas.
 *   - `data/seo/local-landing-indexability.json` → clasificación de landings locales.
 *
 * Tipos de decisión (Plan Maestro §12.2):
 *   - KEEP_SECONDARY_OPERATIONAL: indexable, rol operativo (Nacaome).
 *   - KEEP_AND_IMPROVE: indexable.
 *   - NOINDEX_UNTIL_UNIQUE: `noindex, follow` hasta que tenga valor único.
 */
import canonicalPathsData from '@/data/seo/canonical-paths.json';
import localLandingIndexability from '@/data/seo/local-landing-indexability.json';

export type LandingDecision =
  | 'KEEP_SECONDARY_OPERATIONAL'
  | 'KEEP_AND_IMPROVE'
  | 'NOINDEX_UNTIL_UNIQUE';

export interface StaticRoute {
  path: string;
  priority: number;
  changeFrequency: string;
  daysAgo: number;
}

export interface IndexableEntry {
  path: string;
  /** Segmento de sitemap al que pertenece. */
  segment: SitemapSegment;
  indexable: boolean;
  decision?: LandingDecision;
  reason: string;
}

export type SitemapSegment = 'pages' | 'services' | 'blog' | 'authors' | 'local';

/** Clasificación canónica de landings locales (slug → decisión). */
export const LANDING_DECISIONS: Record<string, LandingDecision> = (() => {
  const decisions: Record<string, LandingDecision> = {};
  for (const slug of localLandingIndexability.indexable) {
    decisions[slug] = slug === 'nacaome'
      ? 'KEEP_SECONDARY_OPERATIONAL'
      : 'KEEP_AND_IMPROVE';
  }
  for (const slug of localLandingIndexability.noindex_until_unique) {
    decisions[slug] = 'NOINDEX_UNTIL_UNIQUE';
  }
  return decisions;
})();

/** Slugs de landings locales NO indexables hasta que tengan contenido único. */
export const NOINDEX_LANDING_SLUGS: ReadonlySet<string> = new Set(
  localLandingIndexability.noindex_until_unique,
);

/** Paths públicos (con prefijo `/abogados-en-`) de las landings noindex. */
export const NOINDEX_LANDING_PATHS: ReadonlySet<string> = new Set(
  [...NOINDEX_LANDING_SLUGS].map((slug) => `/abogados-en-${slug}`),
);

/** Slugs de landings locales indexables. */
export const INDEXABLE_LANDING_SLUGS: ReadonlySet<string> = new Set(
  localLandingIndexability.indexable,
);

export function getLandingDecision(slug: string): LandingDecision | undefined {
  return LANDING_DECISIONS[slug];
}

export function isLandingNoindex(slug: string): boolean {
  return NOINDEX_LANDING_SLUGS.has(slug);
}

/** Catálogo estático completo (mismo origen que el sitemap). */
export const STATIC_ROUTES: readonly StaticRoute[] = (
  canonicalPathsData.static_routes as Array<{
    path: string;
    priority: number;
    change_frequency: string;
    days_ago: number;
  }>
).map((r) => ({
  path: r.path,
  priority: r.priority,
  changeFrequency: r.change_frequency,
  daysAgo: r.days_ago,
}));

/** Paths estáticos indexables según la clasificación de landings. */
export const INDEXABLE_STATIC_PATHS: readonly string[] = STATIC_ROUTES
  .filter((r) => {
    if (!r.path.startsWith('/abogados-en-')) return true;
    const slug = r.path.replace('/abogados-en-', '');
    return !isLandingNoindex(slug);
  })
  .map((r) => r.path);

/**
 * Clasifica un path público en el segmento de sitemap al que pertenece.
 * Convención estable del repositorio (Plan Maestro §19.2).
 */
export function getSitemapSegment(path: string): SitemapSegment {
  if (path === '/') return 'pages';
  if (path.startsWith('/equipo/')) return 'authors';
  if (path.startsWith('/abogados-en-') || path.startsWith('/abogado-')) {
    return 'local';
  }
  if (
    path === '/servicios-juridicos'
    || path.startsWith('/servicios-juridicos/')
    || path === '/derecho-penal'
    || path.startsWith('/derecho-penal/')
    || path === '/hondurenos-en-espana'
    || path.startsWith('/hondurenos-en-espana/')
  ) {
    return 'services';
  }
  if (path === '/blog' || path.startsWith('/blog/')) return 'blog';
  return 'pages';
}

/** Indica si un path público debe aparecer en sitemap/IndexNow/llms.txt. */
export function isPathIndexable(path: string): boolean {
  if (path.startsWith('/abogados-en-')) {
    const slug = path.replace('/abogados-en-', '');
    if (isLandingNoindex(slug)) return false;
  }
  return true;
}

/**
 * Inventario tipado de URLs estáticas con su segmento y decisión.
 * Consumido por tests de crawl y por el gate `seo:public-contract`.
 */
export function publicStaticIndexability(): IndexableEntry[] {
  return STATIC_ROUTES.map((r) => {
    const slug = r.path.startsWith('/abogados-en-')
      ? r.path.replace('/abogados-en-', '')
      : undefined;
    const decision = slug ? LANDING_DECISIONS[slug] : undefined;
    const indexable = isPathIndexable(r.path);
    return {
      path: r.path,
      segment: getSitemapSegment(r.path),
      indexable,
      decision,
      reason: decision === 'NOINDEX_UNTIL_UNIQUE'
        ? 'landing local sin valor único demostrable'
        : 'ruta pública indexable',
    };
  });
}
