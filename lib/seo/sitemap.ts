/**
 * Construcción de sitemaps segmentados.
 *
 * Sustituye al sitemap monolítico anterior. `/sitemap.xml` pasa a ser un
 * sitemap index que referencia cinco segmentos XML reales (200, no redirects):
 *
 *   - /sitemap-pages.xml     → páginas estáticas (home, despacho, hubs…)
 *   - /sitemap-services.xml  → servicios y subáreas (/servicios-juridicos/*,
 *                              /derecho-penal/*, /hondurenos-en-espana/*)
 *   - /sitemap-blog.xml      → índice del blog, categorías y artículos
 *   - /sitemap-authors.xml   → perfiles de abogados (/equipo/*)
 *   - /sitemap-local.xml     → landings locales INDEXABLES y landings
 *                              comerciales por cargo/ciudad
 *
 * La fuente de verdad de indexabilidad es `lib/seo/public-indexability.ts`
 * (consume data/seo/canonical-paths.json y
 * data/seo/local-landing-indexability.json). El blog se deriva de la DB vía
 * `lib/blog.ts`; su validación de inventario usa el manifiesto
 * `data/seo/sitemap-public-manifest.json` en lugar de un conteo rígido.
 */
import type { MetadataRoute } from 'next';
import { isUsableDatabaseUrl } from '@/lib/database-url';
import { site, absoluteUrl } from '@/lib/site';
import { getAllPosts } from '@/lib/blog';
import { blogCategories } from '@/data/blog/categories';
import {
  STATIC_ROUTES,
  getSitemapSegment,
  isPathIndexable,
} from '@/lib/seo/public-indexability';
import sitemapManifest from '@/data/seo/sitemap-public-manifest.json';
import canonicalPathsData from '@/data/seo/canonical-paths.json';

export const dynamic = 'force-dynamic';

/**
 * Fuente única de verdad para las rutas públicas ESTÁTICAS del sitio.
 * Exportadas para tests (tests/crawl-contract.test.ts). No se usan fuera del
 * módulo en runtime; la exportación es únicamente para verificar que ninguna
 * ruta privada se filtra en el sitemap estático.
 */
export const PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  daysAgo: number;
}> = STATIC_ROUTES.map((r) => ({
  path: r.path,
  priority: r.priority,
  changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
  daysAgo: r.daysAgo,
}));

/** Techo de seguridad para IndexNow. Ver data/seo/canonical-paths.json. */
export const INDEXNOW_SAFETY_CAP: number = canonicalPathsData.indexnow_safety_cap;

export function isDatabaseConfiguredAtRuntime(
  value = process.env.DATABASE_URL,
): boolean {
  return isUsableDatabaseUrl(value);
}

// Posts con contenido thin/plantilla. Depriorización, no exclusión (ver
// docs/indexacion-plan-decision.md §2). Set vacío intencional (Fase 17).
export const THIN_POST_SLUGS = new Set<string>([]);

/**
 * Paths completos de posts que son ORIGEN de redirect 301 en next.config.ts.
 * Se excluyen del sitemap para evitar declarar como indexable una URL que
 * responderá 301. Mantener sincronizado con los redirects de blog.
 */
export const REDIRECT_SOURCE_PATHS = new Set<string>([
  '/blog/derecho-laboral/despido-laboral-honduras-derechos',
  '/blog/derecho-laboral/calcular-prestaciones-laborales-honduras',
  '/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador',
  '/blog/derecho-laboral/empleador-no-paga-salario-honduras',
  '/blog/derecho-de-familia/divorcio-honduras-pasos-requisitos',
  '/blog/derecho-de-familia/divorcio-tipos-requisitos-tiempos-honduras',
  '/blog/derecho-de-familia/divorcio-express-mutuo-acuerdo-honduras',
  '/blog/derecho-de-familia/problemas-legales-familiares-honduras',
  '/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla',
  '/blog/derecho-de-familia/pension-alimenticia-calcular-reclamar-honduras',
  '/blog/derecho-de-familia/guarda-custodia-menores-tipos-honduras',
  '/blog/derecho-de-familia/violencia-intrafamiliar-denuncia-proteccion-honduras',
  '/blog/practica-legal/como-elegir-buen-abogado-guia-practica-honduras',
  '/blog/practica-legal/elegir-bufete-abogados-nacaome',
  '/blog/practica-legal/elegir-bufete-multidisciplinario-ventajas-honduras',
  '/blog/derecho-civil/herencias-honduras-fallece-familiar',
  '/blog/derecho-notarial/tramites-notariales-frecuentes-honduras',
  '/blog/derechos-ciudadanos/derechos-del-detenido-guia-constitucional-honduras',
  '/blog/derecho-mercantil/contratos-mercantiles-proteger-negocio',
  '/blog/derecho-mercantil/constitucion-empresas-honduras-pasos-legales',
  '/blog/derecho-mercantil/errores-contratos-civiles-honduras',
  '/blog/derecho-mercantil/elegir-tipo-sociedad-empresa-honduras',
  '/blog/derecho-administrativo/recurso-de-amparo-para-que-sirve-honduras',
  '/blog/derecho-administrativo/despido-empleados-publicos-procedencia-defensa-honduras',
  '/blog/derecho-bancario/ejecucion-hipotecaria-que-hacer-honduras',
  '/blog/derecho-bancario/derechos-consumidor-financiero-cnbs-honduras',
  '/blog/derecho-bancario/central-riesgos-consultar-impugnar-honduras',
  '/blog/derecho-bancario/creditos-reestructuracion-deudas-bancarias-honduras',
  '/blog/noticias-legales/actualizacion-legislativa-mensual-honduras',
  '/blog/conciliacion-arbitraje/arbitraje-cuando-conviene-como-funciona-honduras',
  '/blog/derecho-ambiental/evaluacion-impacto-ambiental-paso-a-paso-honduras',
  '/blog/hondurenos-en-espana/hondurenos-en-espana-guia-legal-completa',
  '/blog/derecho-penal/abogado-penalista-choluteca',
  '/blog/practica-legal/abogados-en-choluteca',
  '/blog/practica-legal/abogados-en-san-lorenzo',
  '/blog/practica-legal/abogados-en-pespire-choluteca',
  '/blog/practica-legal/abogados-en-marcovia-choluteca',
  '/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca',
  '/blog/practica-legal/abogados-en-amapala-valle',
]);

/** Valida el inventario de artículos contra el manifiesto versionado. */
function assertArticleInventory(posts: { slug: string; category: string }[]): void {
  const manifest = sitemapManifest.blog;
  const allowedWithdrawn = new Set(manifest.allowed_withdrawn);
  if (posts.length < manifest.min_indexable) {
    throw new Error(
      `[sitemap] Inventario público por debajo del piso del manifiesto: `
      + `${posts.length}/${manifest.min_indexable}. Si es una retirada jurídica `
      + `autorizada, declárela en data/seo/sitemap-public-manifest.json `
      + `(allowed_withdrawn) y ajuste min_indexable.`,
    );
  }
  for (const slug of allowedWithdrawn) {
    const stillPresent = posts.some(
      (p) => `${p.category}/${p.slug}` === slug,
    );
    if (stillPresent) {
      console.warn(`[sitemap] ${slug} figura en allowed_withdrawn pero sigue publicado.`);
    }
  }
}

/** Carga los posts publicados e indexables (excluye redirects y canonical a otra URL). */
async function loadIndexablePosts(): Promise<Awaited<ReturnType<typeof getAllPosts>>> {
  if (!isDatabaseConfiguredAtRuntime()) {
    throw new Error('[sitemap] Fuente pública completa no disponible en runtime.');
  }
  const dbPostsRaw = (await getAllPosts()).filter((post) => !post.noindex);
  const dbPosts = dbPostsRaw
    .filter((p) => {
      const c = p.canonicalUrl;
      if (!c) return true;
      const isSelfPost = c === `/blog/${p.category}/${p.slug}`;
      return isSelfPost;
    })
    // Excepción temporal autorizada: la firma institucional histórica permite
    // indexar. No se modifica la autoría del blog (docs/seo/decisions/...).
    .filter((p) => p.editoriallyIndexable);

  assertArticleInventory(dbPosts);

  return dbPosts.filter(
    (p) => !REDIRECT_SOURCE_PATHS.has(`/blog/${p.category}/${p.slug}`),
  );
}

/** Rutas estáticas indexables agrupadas por segmento. */
function staticRoutesBySegment(segment: 'pages' | 'services' | 'authors' | 'local') {
  return STATIC_ROUTES
    .filter((r) => isPathIndexable(r.path))
    .filter((r) => getSitemapSegment(r.path) === segment)
    .map((r) => ({
      url: absoluteUrl(r.path),
      changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: r.priority,
    }));
}

/** Mapa categoría → fecha del post más reciente (lastmod real del hub). */
async function latestPostByCategory(): Promise<Map<string, Date>> {
  const posts = await getAllPosts();
  const map = new Map<string, Date>();
  for (const p of posts) {
    if (!map.has(p.category)) {
      map.set(
        p.category,
        p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
      );
    }
  }
  return map;
}

// ────────────────────────────────────────────────────────────────────────────
// Segmentos
// ────────────────────────────────────────────────────────────────────────────

export async function buildPagesSitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutesBySegment('pages');
}

export async function buildServicesSitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutesBySegment('services');
}

export async function buildAuthorsSitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutesBySegment('authors');
}

export async function buildLocalSitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutesBySegment('local');
}

export async function buildBlogSitemap(): Promise<MetadataRoute.Sitemap> {
  if (site.noindex) return [];
  const [blogPosts, latest] = await Promise.all([
    loadIndexablePosts(),
    latestPostByCategory(),
  ]);

  const HIGH_PRIORITY_CATEGORIES = new Set([
    'derecho-penal',
    'derecho-de-familia',
    'derecho-laboral',
  ]);

  const categoryRoutes = blogCategories.map((c) => ({
    url: absoluteUrl(`/blog/${c.slug}`),
    lastModified: latest.get(c.slug),
    changeFrequency: 'weekly' as const,
    priority: HIGH_PRIORITY_CATEGORIES.has(c.slug) ? 0.7 : 0.5,
  }));

  const blogPostRoutes = blogPosts.map((p) => ({
    url: absoluteUrl(`/blog/${p.category}/${p.slug}`),
    lastModified: p.updatedAt
      ? new Date(p.updatedAt)
      : new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: THIN_POST_SLUGS.has(p.slug) ? 0.3 : 0.8,
  }));

  return [
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly' as const, priority: 0.6 },
    ...categoryRoutes,
    ...blogPostRoutes,
  ];
}

/** Sitemap index: referencia los cinco segmentos. */
export function buildSitemapIndex(): Array<{ url: string }> {
  return [
    `${site.url}/sitemap-pages.xml`,
    `${site.url}/sitemap-services.xml`,
    `${site.url}/sitemap-blog.xml`,
    `${site.url}/sitemap-authors.xml`,
    `${site.url}/sitemap-local.xml`,
  ].map((url) => ({ url }));
}
