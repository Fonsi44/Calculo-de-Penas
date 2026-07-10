import type { MetadataRoute } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { blogCategories } from '@/data/blog/categories';
import canonicalPathsData from '@/data/seo/canonical-paths.json';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Fuente única de verdad para las rutas públicas ESTÁTICAS del sitio.
 *
 * El catálogo vive en `data/seo/canonical-paths.json` desde Jun 2026
 * (auditoría SEO 2026-06-23). Antes estaba duplicado en este archivo y en
 * `scripts/submit-indexnow.mjs`, lo que permitía desincronías que fueron la
 * causa raíz del bug histórico de IndexNow (~9.466 URLs enviadas a Bing
 * el 7-11/06/2026 con 0 crawled / 0 indexed). Ahora ambos consumen el mismo
 * JSON y existe un techo `indexnow_safety_cap` que aborta envíos masivos.
 *
 * Exportadas para tests (tests/seo-protection.test.ts). No se usan fuera del
 * módulo en runtime; la exportación es únicamente para verificar que ninguna
 * ruta privada se filtra en el sitemap estático.
 */
export const PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  daysAgo: number;
}> = (canonicalPathsData.static_routes as Array<{
  path: string;
  priority: number;
  change_frequency: string;
  days_ago: number;
}>).map((r) => ({
  path: r.path,
  priority: r.priority,
  changeFrequency: r.change_frequency as MetadataRoute.Sitemap[number]['changeFrequency'],
  daysAgo: r.days_ago,
}));

/**
 * Techo de seguridad para IndexNow: el script de envío aborta si el número
 * final de URLs a enviar supera `canonicalPathsData.indexnow_safety_cap`
 * (212 por defecto = 202 sitemap observado + 10 de margen). Configurable en
 * `data/seo/canonical-paths.json`. Véase §R8 AGENTS.md.
 */
export const INDEXNOW_SAFETY_CAP: number = canonicalPathsData.indexnow_safety_cap;

const IS_DB_REACHABLE = Boolean(
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && !process.env.DATABASE_URL.includes('localhost:5432/placeholder'),
);

// Posts con contenido thin/plantilla (ALTO riesgo en docs/blog-duplicity-report.md).
// No se excluyen del sitemap (siguen accesibles), pero bajan su `priority` a 0.3
// para que Google priorice el rastreo de URLs de mayor calidad editorial.
// Cuando se reescriban (Fase 4), quitar el slug de esta lista.
// Fuente: docs/indexacion-plan-decision.md §2 (Fase 2).
export const THIN_POST_SLUGS = new Set<string>([
  // 2026-07-03 — Fase 17: todos los 48 thin posts publicados fueron expandidos
  // y verificados por blog:verify-fix. El único que quedaba (guarda-custodia)
  // es draft (no publicado), no aparece en sitemap. Set vacío intencional.
]);

/**
 * Paths completos de posts que son ORIGEN de redirect 301 en next.config.ts.
 * Se excluyen del sitemap para evitar la contradicción: si una URL va a
 * responder 301, no debe declararse como indexable en el sitemap (Google la
 * rastrearía, recibiría el redirect, y la marcaría "Pendiente" sin indexar).
 *
 * Mantener sincronizado con los redirects de blog en next.config.ts.
 * Fuente: validación Fase 2 (Jul 2026).
 */
const REDIRECT_SOURCE_PATHS = new Set<string>([
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
  // Post consolidado en landing propia /abogado-penalista-choluteca (redirect 301
  // en next.config.ts:284). Si sigue publicado en DB, el sitemap lo listaría y
  // serviría un 308. Auditoría Ahrefs 2026-07-10: 1 enlace "Sitemap URL → 308".
  '/blog/derecho-penal/abogado-penalista-choluteca',
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (site.noindex) {
    return [];
  }

  const now = new Date();

  const staticRoutes = PUBLIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: daysAgo(r.daysAgo),
    changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: r.priority,
  }));

  const dbPostsRaw = IS_DB_REACHABLE ? await db
    .select({
      slug: blogPosts.slug,
      category: blogPosts.category,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      noindex: blogPosts.noindex,
      canonicalUrl: blogPosts.canonicalUrl,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), eq(blogPosts.noindex, false)))
    .orderBy(desc(blogPosts.publishedAt)) : [];

  // Posts con canonical apuntando a otra URL del propio dominio (p. ej. posts
  // `abogados-en-{ciudad}` canonicalizados hacia las landings locales).
  // No se incluyen como URLs independientes en el sitemap: su URL canónica ya
  // está declarada (la landing). Así evitamos enviar a Google URLs que él
  // consolidaría igualmente y reducimos ruido/duplicidad en el sitemap.
  // Ver docs/indexacion-plan-decision.md §7 (Fase 1).
  const dbPosts = dbPostsRaw.filter((p) => {
    const c = p.canonicalUrl;
    if (!c) return true; // sin override → queda
    // Si el canonical apunta a otra URL del propio sitio (path absoluto o
    // URL completa del mismo host) y NO es la propia ruta del post, se excluye.
    const isSelfPost = c === `/blog/${p.category}/${p.slug}`;
    return isSelfPost;
  });

  // Mapa categoría → fecha del post más reciente. Se usa dbPostsRaw (TODOS los
  // posts publicados/no-noindex, incluyendo los canonicalizados) para que el
  // lastmod de la categoría refleje la actividad real del hub.
  const latestPostByCategory = new Map<string, Date>();
  for (const p of dbPostsRaw) {
    if (!latestPostByCategory.has(p.category)) {
      latestPostByCategory.set(
        p.category,
        p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
      );
    }
  }

  // Categorías de blog con mayor valor comercial y volumen de posts reciben
  // mayor prioridad de rastreo. Las YMYL jurídicas principales (penal,
  // familia, laboral) son las que generan impresiones/clics según GSC.
  const HIGH_PRIORITY_CATEGORIES = new Set([
    'derecho-penal',
    'derecho-de-familia',
    'derecho-laboral',
  ]);

  const categoryRoutes = blogCategories.map((c) => ({
    url: absoluteUrl(`/blog/${c.slug}`),
    lastModified: latestPostByCategory.get(c.slug) ?? now,
    changeFrequency: 'weekly' as const,
    priority: HIGH_PRIORITY_CATEGORIES.has(c.slug) ? 0.7 : 0.5,
  }));

  const blogPostRoutes = dbPosts
    // Excluir posts cuyo path completo es origen de un redirect 301 en
    // next.config.ts. Si una URL va a redirigir, no debe estar en el sitemap:
    // Google la rastrea, recibe 301, y la marca "Pendiente" innecesariamente.
    // Esta lista se mantiene sincronizada con los redirects de blog del config.
    // Fuente: validación Fase 2 (Jul 2026) — coherencia sitemap↔redirects.
    .filter((p) => !REDIRECT_SOURCE_PATHS.has(`/blog/${p.category}/${p.slug}`))
    .map((p) => ({
      url: absoluteUrl(`/blog/${p.category}/${p.slug}`),
      lastModified: p.updatedAt
        ? new Date(p.updatedAt)
        : new Date(p.publishedAt),
      changeFrequency: 'monthly' as const,
      // Posts thin/plantilla (THIN_POST_SLUGS) bajan a 0.3 para que Google
      // priorice el rastreo de URLs de mayor calidad. Cuando se reescriban,
      // quitar el slug de la lista y volverá a 0.8 automáticamente.
      priority: THIN_POST_SLUGS.has(p.slug) ? 0.3 : 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...blogPostRoutes];
}
