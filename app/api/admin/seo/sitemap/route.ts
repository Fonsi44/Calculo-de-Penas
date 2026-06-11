import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { site } from '@/lib/site';
import { blogCategories } from '@/data/blog/categories';

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts);
  const [publishedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const totalPosts = totalRow?.count ?? 0;
  const publishedPosts = publishedRow?.count ?? 0;

  const staticRoutes = [
    '/', '/despacho', '/servicios-juridicos',
    '/servicios-juridicos/derecho-de-familia',
    '/servicios-juridicos/derecho-laboral',
    '/servicios-juridicos/derecho-civil-y-notarial',
    '/servicios-juridicos/derecho-mercantil-empresarial',
    '/servicios-juridicos/derecho-bancario-y-financiero',
    '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
    '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
    '/servicios-juridicos/regulacion-sanitaria',
    '/servicios-juridicos/extranjeria-en-honduras',
    '/servicios-juridicos/propiedad-intelectual',
    '/servicios-juridicos/tributario-fiscal',
    '/servicios-juridicos/ambiental-regulatorio',
    '/servicios-juridicos/conciliacion-y-arbitraje',
    '/derecho-penal',
    '/derecho-penal/atencion-casos-penales-litigiosos',
    '/derecho-penal/mediacion-conflictos-penales-y-multas',
    '/derecho-penal/menores-justicia-juvenil',
    '/derecho-penal/proceso-penal-completo',
    '/derecho-penal/recursos-y-defensa-avanzada',
    '/derecho-penal/estrategia-penal-y-litigio',
    '/derecho-penal/ejecucion-penal-y-beneficios',
    '/hondurenos-en-espana',
    '/hondurenos-en-espana/gestion-documental-y-legalizacion',
    '/hondurenos-en-espana/actos-notariales-internacionales',
    '/hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero',
    '/preguntas-frecuentes', '/blog', '/solicitar-consulta', '/como-llegar',
    '/aviso-legal', '/politica-privacidad', '/politica-cookies', '/terminos', '/disclaimer',
  ];

  const categoryRoutes = blogCategories.map((c) => `/blog/${c.slug}`);

  const included = site.noindex
    ? []
    : [...staticRoutes, ...categoryRoutes];

  return NextResponse.json({
    url: `${site.url}/sitemap.xml`,
    noindex: site.noindex,
    totalIncluded: included.length,
    staticRoutes: staticRoutes.length,
    categories: categoryRoutes.length,
    blogPostsTotal: totalPosts,
    blogPostsPublished: publishedPosts,
    blogPostsDrafts: totalPosts - publishedPosts,
    sampleUrls: included.slice(0, 10),
    note: site.noindex
      ? 'El sitemap está VACÍO porque NEXT_PUBLIC_NOINDEX=true. Cambiar a false para activar indexación.'
      : 'Sitemap activo. Incluye todas las URLs públicas indexables.',
  });
}
