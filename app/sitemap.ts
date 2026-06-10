import type { MetadataRoute } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { getAllPosts } from '@/lib/blog';
import { blogCategories } from '@/data/blog/categories';

/**
 * Listado de rutas públicas del sitio. Durante el modo noindex
 * (desarrollo) el sitemap se emite vacío para no entregar URL
 * alguna a los motores. Al lanzar, se enumeran todas las rutas
 * para que Google las descubra eficientemente.
 *
 * Las fechas lastModified se diferencian para ayudar a Google
 * a priorizar el rastreo: páginas que cambian con frecuencia
 * (blog) usan fechas reales, páginas estáticas usan una fecha
 * de referencia fija para evitar que Google las recorra en
 * cada rastreo sin necesidad.
 */

// Fecha de referencia para páginas estáticas que rara vez cambian.
// Actualizar cuando se modifiquen estos contenidos.
const STATIC_REF_DATE = new Date('2026-06-10');

// Fecha para páginas que sí se actualizan periódicamente.
const CONTENT_REF_DATE = new Date('2026-06-10');

const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; lastModified?: Date }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly', lastModified: CONTENT_REF_DATE },
  { path: '/despacho', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos', priority: 0.9, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-de-familia', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-laboral', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-civil-y-notarial', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-mercantil-empresarial', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-bancario-y-financiero', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-administrativo-y-servicio-civil', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/regulacion-sanitaria', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/extranjeria-en-honduras', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/propiedad-intelectual', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/tributario-fiscal', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/ambiental-regulatorio', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/servicios-juridicos/conciliacion-y-arbitraje', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal', priority: 0.9, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/atencion-casos-penales-litigiosos', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/mediacion-conflictos-penales-y-multas', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/menores-justicia-juvenil', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/proceso-penal-completo', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/recursos-y-defensa-avanzada', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/estrategia-penal-y-litigio', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/derecho-penal/ejecucion-penal-y-beneficios', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/hondurenos-en-espana', priority: 0.9, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/hondurenos-en-espana/gestion-documental-y-legalizacion', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/hondurenos-en-espana/actos-notariales-internacionales', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero', priority: 0.8, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/preguntas-frecuentes', priority: 0.7, changeFrequency: 'monthly', lastModified: CONTENT_REF_DATE },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly', lastModified: CONTENT_REF_DATE },
  { path: '/solicitar-consulta', priority: 0.95, changeFrequency: 'yearly', lastModified: CONTENT_REF_DATE },
  { path: '/como-llegar', priority: 0.6, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
  // Páginas legales: rara vez cambian, usan fecha fija.
  { path: '/aviso-legal', priority: 0.2, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
  { path: '/politica-privacidad', priority: 0.2, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
  { path: '/politica-cookies', priority: 0.2, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
  { path: '/terminos', priority: 0.2, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
  { path: '/disclaimer', priority: 0.2, changeFrequency: 'yearly', lastModified: STATIC_REF_DATE },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Modo noindex: devolvemos sitemap vacío para no entregar nada
  // a los motores. Al lanzar (NEXT_PUBLIC_NOINDEX=false) se enumera todo.
  if (site.noindex) {
    return [];
  }

  const now = new Date();

  const staticRoutes = PUBLIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: r.lastModified ?? now,
    changeFrequency: r.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: r.priority,
  }));

  const blogCategoryRoutes = blogCategories.map((c) => ({
    url: absoluteUrl(`/blog/categoria/${c.slug}`),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const blogPostRoutes = getAllPosts().map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogCategoryRoutes, ...blogPostRoutes];
}
