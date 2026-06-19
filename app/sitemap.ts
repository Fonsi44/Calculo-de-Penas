import type { MetadataRoute } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { blogCategories } from '@/data/blog/categories';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  daysAgo: number;
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly', daysAgo: 0 },
  { path: '/servicios-juridicos', priority: 1.0, changeFrequency: 'weekly', daysAgo: 0 },
  { path: '/derecho-penal', priority: 1.0, changeFrequency: 'weekly', daysAgo: 0 },
  // Landings locales (SEO local): máxima intención comercial ("abogados en {ciudad}").
  { path: '/abogados-en-nacaome', priority: 0.9, changeFrequency: 'monthly', daysAgo: 0 },
  { path: '/abogados-en-choluteca', priority: 0.9, changeFrequency: 'monthly', daysAgo: 0 },
  { path: '/abogados-en-san-lorenzo', priority: 0.9, changeFrequency: 'monthly', daysAgo: 0 },
  { path: '/despacho', priority: 0.9, changeFrequency: 'monthly', daysAgo: 0 },
  { path: '/preguntas-frecuentes', priority: 0.9, changeFrequency: 'weekly', daysAgo: 1 },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly', daysAgo: 1 },
  { path: '/solicitar-consulta', priority: 0.7, changeFrequency: 'monthly', daysAgo: 2 },
  { path: '/hondurenos-en-espana', priority: 0.8, changeFrequency: 'monthly', daysAgo: 3 },
  { path: '/como-llegar', priority: 0.3, changeFrequency: 'monthly', daysAgo: 7 },
  { path: '/aviso-legal', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/politica-editorial', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/politica-privacidad', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/politica-cookies', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/terminos', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/disclaimer', priority: 0.2, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-de-familia', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-laboral', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-civil-y-notarial', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-mercantil-empresarial', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-bancario-y-financiero', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-administrativo-y-servicio-civil', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/regulacion-sanitaria', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/extranjeria-en-honduras', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/propiedad-intelectual', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/tributario-fiscal', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/ambiental-regulatorio', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/servicios-juridicos/conciliacion-y-arbitraje', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/atencion-casos-penales-litigiosos', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/mediacion-conflictos-penales-y-multas', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/menores-justicia-juvenil', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/proceso-penal-completo', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/recursos-y-defensa-avanzada', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/estrategia-penal-y-litigio', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/derecho-penal/ejecucion-penal-y-beneficios', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/hondurenos-en-espana/gestion-documental-y-legalizacion', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/hondurenos-en-espana/actos-notariales-internacionales', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
  { path: '/hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero', priority: 0.5, changeFrequency: 'monthly', daysAgo: 30 },
];

const IS_DB_REACHABLE = Boolean(
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && !process.env.DATABASE_URL.includes('localhost:5432/placeholder'),
);

// Posts con contenido thin/plantilla (ALTO riesgo en docs/blog-duplicity-report.md).
// No se excluyen del sitemap (siguen accesibles), pero bajan su `priority` a 0.3
// para que Google priorice el rastreo de URLs de mayor calidad editorial.
// Cuando se reescriban (Fase 4), quitar el slug de esta lista.
// Fuente: docs/indexacion-plan-decision.md §2 (Fase 2).
const THIN_POST_SLUGS = new Set([
  'sanciones-administrativas-como-defenderse-honduras',
  'contratos-franquicia-aspectos-legales-honduras',
  'importar-mercancias-guia-legal-aduanera-honduras',
  'pineda-asociados-bufete-multidisciplinario-honduras',
  'expropiacion-forzosa-derechos-propietario-honduras',
  'abogado-civil-choluteca',
  'impuestos-pequenas-empresas-guia-basica-honduras',
  'guarda-custodia-menores-tipos-honduras',
  'abogados-en-choluteca',
  'abogados-en-san-lorenzo',
  'visas-inversion-inversionista-rentista-pensionado-honduras',
  'usucapion-prescripcion-adquisitiva-honduras',
  'abogado-empresas-san-lorenzo',
  'abogado-familia-choluteca',
  'adopcion-requisitos-proceso-honduras',
  'facturacion-electronica-obligaciones-requisitos-sar-honduras',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras',
  'delitos-ambientales-como-denunciarlos-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'costos-honorarios-abogados-como-funcionan-honduras',
  'defensa-penal-menores-edad-honduras',
  'etapa-investigacion-proceso-penal-honduras',
  'centro-conciliacion-arbitraje-ccic-guia-honduras',
  'sobreseimiento-definitivo-provisional-diferencias-honduras',
  'abogados-en-nacaome',
  'presentar-denuncia-conadeh-honduras',
  'abogado-aduanero-san-lorenzo',
  'habilitacion-clinicas-hospitales-privados-honduras',
  'tarjetas-credito-intereses-cargos-defensa-honduras',
  'union-de-hecho-requisitos-derechos-honduras',
  'abogados-en-amapala-valle',
  'derecho-de-peticion-instituciones-honduras',
  'sar-notifica-fiscalizacion-que-hacer-honduras',
  'arraigo-social-laboral-hondurenos-espana',
  'contratacion-publica-licitaciones-empresas-honduras',
  'responsabilidad-medica-mala-praxis-honduras',
  'contratos-confidencialidad-nda-secreto-comercial-honduras',
  'tributar-espana-bienes-honduras-guia-fiscal',
  'competencia-desleal-como-denunciar-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'lavado-activos-obligaciones-cumplimiento-empresas-honduras',
  'titulos-valores-cheques-sin-fondo-honduras',
  'refugio-asilo-quien-puede-solicitarlo-honduras',
  'herencias-transfronterizas-bienes-honduras-espana',
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

  const dbPosts = IS_DB_REACHABLE ? await db
    .select({
      slug: blogPosts.slug,
      category: blogPosts.category,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      noindex: blogPosts.noindex,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), eq(blogPosts.noindex, false)))
    .orderBy(desc(blogPosts.publishedAt)) : [];

  // Mapa categoría → fecha del post más reciente (dbPosts ya viene ordenado
  // DESC por publishedAt). Si no hay posts en la categoría o la DB no está
  // disponible, usamos `now` como fallback.
  const latestPostByCategory = new Map<string, Date>();
  for (const p of dbPosts) {
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
