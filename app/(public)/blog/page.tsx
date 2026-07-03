import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { Container } from '@/components/marketing/section';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { RssButton } from '@/components/marketing/rss-button';
import { NewsletterSection } from '@/components/blog/newsletter-section';
import { BlogHero } from '@/components/blog/blog-hero';
import { FeaturedPosts } from '@/components/blog/featured-posts';
import { BlogExplorer } from '@/components/blog/blog-explorer';
import { BlogSidebar } from '@/components/blog/blog-sidebar';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import { Card } from '@/components/ui/card';
import {
  getAllPosts,
  getPostsByPage,
  getTotalPages,
} from '@/lib/blog';
import {
  toCardData,
  deriveFeaturedPosts,
  deriveCategoryCounts,
  derivePopularPosts,
  deriveRecentPosts,
  deriveArchiveMonths,
  deriveAllTags,
  filterByMonth,
} from '@/lib/blog-hub';
import { blogCategories } from '@/data/blog/categories';
import { TOP_ORGANIC_GUIDE_LINKS } from '@/data/seo/high-intent-guides';

export const revalidate = 3600;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatMonthLabel(value: string): string {
  const [y, m] = value.split('-');
  return `${MESES[parseInt(m, 10) - 1]} ${y}`;
}

const ITEMS_PER_PAGE = 12;

type Props = { searchParams?: Promise<{ tag?: string; page?: string; month?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params?.page ?? '1', 10) || 1;
  const tagFilter = params?.tag;
  const monthFilter = params?.month;
  const hasFilter = !!(tagFilter || monthFilter);
  const isPaginated = page > 1;
  // Páginas paginadas (page>1 sin filtros): canonical a page 1 y noindex.
  // Páginas con filtros (tag/month): canonical autocontenido y noindex.
  const canonicalPath = hasFilter
    ? `/blog${tagFilter ? `?tag=${encodeURIComponent(tagFilter)}` : ''}${monthFilter ? `${tagFilter ? '&' : '?'}month=${monthFilter}` : ''}`
    : '/blog';
  return {
    // Absolute para controlar la longitud total del title (SEO).
    title: { absolute: `Blog Jurídico de Abogados en Honduras${isPaginated ? ` (Página ${page})` : ''}` },
    description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.${isPaginated ? ` Página ${page}.` : ''}`,
    alternates: { canonical: canonicalPath },
    keywords: ['blog jurídico Honduras', 'artículos legales Honduras', 'derecho penal blog', 'abogados Honduras blog', 'derecho familia artículos', 'noticias legales Honduras', 'guías legales Honduras'],
    // ?tag= y ?month= no indexables (filtros no canónicos).
    // Páginas paginadas (page>1): noindex para consolidar autoridad en page 1.
    robots: hasFilter || isPaginated
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    twitter: {
      card: 'summary_large_image',
      title: `Blog Jurídico - Articulos de Abogados en Honduras${page > 1 ? ` (Pagina ${page})` : ''}`,
      description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
      images: [`${site.url}/og-image.png`],
    },
    openGraph: {
      title: `Blog Juridico de Abogados en Honduras${page > 1 ? ` - Pagina ${page}` : ''}`,
      description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
      url: `${site.url}/blog`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/blog.webp`, width: 1200, height: 630, alt: `${site.name} - Blog Juridico` }],
    },
  };
}

export default async function BlogHubPage(props: Props) {
  const searchParams = await props.searchParams;
  const tagFilter = searchParams?.tag;
  const monthFilter = searchParams?.month;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;
  const hasFilter = !!(tagFilter || monthFilter);

  // Una sola consulta DB (getAllPosts). El resto se deriva en memoria.
  const allPosts = await getAllPosts();

  // Filtro por etiqueta (?tag=, server-side, noindex) — deriva en memoria.
  const tagFiltered = tagFilter
    ? allPosts.filter((p) => (p.tags ?? []).includes(tagFilter))
    : allPosts;

  // Filtro por mes (?month=YYYY-MM, server-side, noindex).
  const monthFiltered = monthFilter
    ? filterByMonth(tagFiltered, monthFilter)
    : tagFiltered;

  // Destacados: solo en página 1 sin filtros.
  const showFeatured = !hasFilter && page === 1;
  const featured = showFeatured ? deriveFeaturedPosts(allPosts, 4) : [];
  const featuredSlugs = new Set(featured.map((f) => f.slug));

  // Listado paginado (vista servidor). En página 1 sin filtros, se excluyen
  // los destacados del grid para no duplicarlos con la sección magazine.
  const gridSource = showFeatured
    ? monthFiltered.filter((p) => !featuredSlugs.has(p.slug))
    : monthFiltered;
  const totalPages = getTotalPages(gridSource, ITEMS_PER_PAGE);
  const pagePosts = getPostsByPage(gridSource, page, ITEMS_PER_PAGE);

  // Derivaciones para el sidebar y la navegación (una sola pasada).
  const categoryCounts = deriveCategoryCounts(allPosts);
  const popular = derivePopularPosts(allPosts, 5).map(toCardData);
  const recent = deriveRecentPosts(allPosts, 5).map(toCardData);
  const archive = deriveArchiveMonths(allPosts, 8);
  const tags = deriveAllTags(allPosts);

  // Payload ligero (sin body) para el explorador cliente.
  // Se limita a 80 entradas para evitar serializar el corpus completo en HTML.
  const explorerPosts = monthFiltered.slice(0, 80).map(toCardData);
  const explorerPagePosts = pagePosts.map(toCardData);

  const buildPageUrl = (p: number) => {
    const base = '/blog';
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (tagFilter) params.set('tag', tagFilter);
    if (monthFilter) params.set('month', monthFilter);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <>
      {/* rel prev/next solo en vista paginada sin filtros (indexable). */}
      {!hasFilter && page > 1 && <link rel="prev" href={site.url + buildPageUrl(page - 1)} />}
      {!hasFilter && page < totalPages && <link rel="next" href={site.url + buildPageUrl(page + 1)} />}

      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Blog Jurídico' },
      ]} />

      <BlogHero
        title="Blog Jurídico de Abogados en Honduras"
        subtitle="Artículos, análisis y guías escritos por nuestro equipo. Información clara y práctica sobre el sistema legal hondureño."
        postCount={allPosts.length}
        categoryCount={categoryCounts.length}
      />

      <section className="py-6 md:py-8 border-b border-border/30">
        <Container size="lg">
          <div className="grid lg:grid-cols-[1fr_auto] gap-5 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">
                Mas buscado en Google
              </p>
              <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight">
                Guías con demanda orgánica real y siguiente paso claro
              </h2>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-2xl">
                Estas consultas ya generan impresiones en Google y suelen preceder una consulta jurídica. Si necesita ayuda directa, puede pasar de la guía al servicio correspondiente sin salir del recorrido principal.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/servicios-juridicos" className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-alt text-primary hover:text-accent-dark transition-colors">
                Ver servicios jurídicos
              </Link>
              <Link href="/solicitar-consulta#formulario" className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-alt text-primary hover:text-accent-dark transition-colors">
                Solicitar consulta
              </Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {TOP_ORGANIC_GUIDE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group block focus-visible:outline-none">
                <Card padding="md" className="h-full group-hover:border-accent/30 group-hover:shadow-md transition-all">
                  <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {showFeatured && featured.length > 0 && (
        <FeaturedPosts posts={featured.map(toCardData)} />
      )}

      {/* ── Contenido principal: cuadrícula + sidebar ── */}
      <section id="articulos" className="py-10 md:py-14">
        <Container size="lg">
          <div className="grid lg:grid-cols-[1fr_20rem] gap-8 lg:gap-10">
            {/* Columna principal */}
            <div className="min-w-0 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary">
                  {tagFilter ? 'Artículos etiquetados' : monthFilter ? `Archivo: ${formatMonthLabel(monthFilter)}` : page > 1 ? 'Todos los artículos' : 'Todos los artículos'}
                  {totalPages > 1 && !hasFilter && (
                    <span className="text-text-muted font-normal text-sm ml-2">— Página {page} de {totalPages}</span>
                  )}
                </h2>
                <RssButton />
              </div>

              <BlogExplorer
                posts={explorerPosts}
                categories={categoryCounts}
                pagePosts={explorerPagePosts}
                page={page}
                totalPages={totalPages}
                activeTag={tagFilter ?? null}
                itemsPerPage={ITEMS_PER_PAGE}
              />

              <p className="text-sm text-text-muted pt-2 border-t border-border/30">
                ¿Tiene dudas legales?{' '}
                <Link
                  href="/preguntas-frecuentes"
                  className="font-semibold text-accent-dark hover:text-primary transition-colors"
                >
                  Consulte nuestras preguntas frecuentes →
                </Link>
              </p>
            </div>

            {/* Sidebar */}
            <BlogSidebar
              categories={categoryCounts}
              popular={popular}
              recent={recent}
              archive={archive}
              tags={tags}
            />
          </div>
        </Container>
      </section>

      {/* Índice de categorías — enlaces SSR estáticos (no JS).
          CAUSA RAÍZ indexación (Jul 2026): el explorador de categorías
          usaba solo onClick (JS), Googlebot no descubría las 20 categorías
          sin render. Este bloque HTML garantiza descubrimiento + autoridad
          interna directa desde /blog hacia todas las categorías. */}
      <section className="py-8 md:py-10 bg-background" aria-label="Categorías del blog">
        <Container>
          <h2 className="font-serif font-bold text-xl md:text-2xl text-primary mb-2">
            Explore el blog por categoría
          </h2>
          <p className="text-sm text-text-secondary mb-5 max-w-2xl">
            Guías y análisis jurídicos organizados por área del derecho para Honduras.
          </p>
          <div className="flex flex-wrap gap-2">
            {blogCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/${c.slug}`}
                className="focus-ring inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium bg-surface border border-border-light text-text-secondary hover:border-accent/40 hover:text-primary transition-colors"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <NewsletterSection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogCollectionSchema(
              `Blog Jurídico | ${site.name}`,
              'Artículos, análisis y guías sobre derecho en Honduras.',
              `${site.url}/blog`,
            ),
          ),
        }}
      />
    </>
  );
}
