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
export const THIN_POST_SLUGS = new Set([
  'sanciones-administrativas-como-defenderse-honduras',
  'contratos-franquicia-aspectos',
  'importar-mercancias-guia-aduanera',
  'pineda-asociados-bufete-multidisciplinario-honduras',
  'expropiacion-forzosa-derechos-propietario-honduras',
  'abogado-civil-choluteca',
  'impuestos-pequenas-empresas-guia-basica-honduras',
  'guarda-custodia-menores-tipos-honduras',
  'abogados-en-choluteca',
  'abogados-en-san-lorenzo',
  'visas-inversion-rentista-pensionado',
  'usucapion-prescripcion-adquisitiva-honduras',
  'abogado-empresas-san-lorenzo',
  'abogado-familia-choluteca',
  'adopcion-requisitos-proceso-honduras',
  'facturacion-electronica-requisitos-sar',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras',
  'delitos-ambientales-como-denunciarlos-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'costos-honorarios-abogados-como-funcionan-honduras',
  'defensa-penal-menores-edad-honduras',
  'etapa-investigacion-proceso-penal-honduras',
  'centro-conciliacion-arbitraje-ccic',
  'sobreseimiento-definitivo-provisional',
  'abogados-en-nacaome',
  'presentar-denuncia-conadeh-honduras',
  'abogado-aduanero-san-lorenzo',
  'habilitacion-clinicas-hospitales',
  'tarjetas-credito-intereses-cargos-defensa-honduras',
  'union-de-hecho-requisitos-derechos-honduras',
  'abogados-en-amapala-valle',
  'derecho-de-peticion-instituciones-honduras',
  'sar-notifica-fiscalizacion-que-hacer-honduras',
  'arraigo-social-laboral-hondurenos-espana',
  'contratacion-publica-licitaciones',
  'responsabilidad-medica-mala-praxis-honduras',
  'contratos-confidencialidad-nda-secreto-comercial-honduras',
  'tributar-espana-bienes-guia',
  'competencia-desleal-como-denunciar-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'lavado-activos-obligaciones',
  'titulos-valores-cheques-sin-fondo-honduras',
  'refugio-asilo-solicitarlo',
  'herencias-transfronterizas-bienes',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'como-obtener-rtn-personas-empresas-honduras',
  'libertad-expresion-redes-sociales-honduras',
  'constituir-empresa-guia-paso-a-paso-honduras',
  'prescripcion-deudas-plazos-honduras',
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

  const categoryRoutes = blogCategories.map((c) => ({
    url: absoluteUrl(`/blog/${c.slug}`),
    lastModified: latestPostByCategory.get(c.slug) ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const blogPostRoutes = dbPosts.map((p) => ({
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
