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
} from '@/lib/blog-hub';

export const revalidate = 3600;

const ITEMS_PER_PAGE = 12;

type Props = { searchParams?: Promise<{ tag?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params?.page ?? '1', 10) || 1;
  const tagFilter = params?.tag;
  const canonicalPath = tagFilter || page > 1
    ? `/blog${page > 1 ? `?page=${page}` : ''}${tagFilter ? `${page > 1 ? '&' : '?'}tag=${encodeURIComponent(tagFilter)}` : ''}`
    : '/blog';
  return {
    // Absolute para controlar la longitud total del title (SEO).
    title: { absolute: `Blog Jurídico de Abogados en Honduras${page > 1 ? ` (Página ${page})` : ''}` },
    description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.${page > 1 ? ` Página ${page}.` : ''}`,
    alternates: { canonical: canonicalPath },
    keywords: ['blog jurídico Honduras', 'artículos legales Honduras', 'derecho penal blog', 'abogados Honduras blog', 'derecho familia artículos', 'noticias legales Honduras', 'guías legales Honduras'],
    // ?tag= no indexable (filtra por etiqueta, no es URL canónica de categoría).
    robots: tagFilter
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    twitter: {
      card: 'summary_large_image',
      title: `Blog Jurídico — Artículos de Abogados en Honduras${page > 1 ? ` (Página ${page})` : ''}`,
      description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
      images: [`${site.url}/og-image.png`],
    },
    openGraph: {
      title: `Blog Jurídico de Abogados en Honduras${page > 1 ? ` — Página ${page}` : ''}`,
      description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
      url: `${site.url}/blog`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/blog.webp`, width: 1200, height: 630, alt: `${site.name} — Blog Jurídico` }],
    },
  };
}

export default async function BlogHubPage(props: Props) {
  const searchParams = await props.searchParams;
  const tagFilter = searchParams?.tag;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;

  // Una sola consulta DB (getAllPosts). El resto se deriva en memoria.
  const allPosts = await getAllPosts();

  // Filtro por etiqueta (?tag=, server-side, noindex) — deriva en memoria.
  const tagFiltered = tagFilter
    ? allPosts.filter((p) => (p.tags ?? []).includes(tagFilter))
    : allPosts;

  // Destacados: solo en página 1 sin filtro de etiqueta.
  const showFeatured = !tagFilter && page === 1;
  const featured = showFeatured ? deriveFeaturedPosts(allPosts, 4) : [];
  const featuredSlugs = new Set(featured.map((f) => f.slug));

  // Listado paginado (vista servidor). En página 1 sin tag, se excluyen los
  // destacados del grid para no duplicarlos con la sección magazine.
  const gridSource = showFeatured
    ? tagFiltered.filter((p) => !featuredSlugs.has(p.slug))
    : tagFiltered;
  const totalPages = getTotalPages(gridSource, ITEMS_PER_PAGE);
  const pagePosts = getPostsByPage(gridSource, page, ITEMS_PER_PAGE);

  // Derivaciones para el sidebar y la navegación (una sola pasada).
  const categoryCounts = deriveCategoryCounts(allPosts);
  const popular = derivePopularPosts(allPosts, 5).map(toCardData);
  const recent = deriveRecentPosts(allPosts, 5).map(toCardData);
  const archive = deriveArchiveMonths(allPosts, 8);
  const tags = deriveAllTags(allPosts);

  // Payload ligero (sin body) para el explorador cliente.
  const explorerPosts = tagFiltered.map(toCardData);
  const explorerPagePosts = pagePosts.map(toCardData);

  const buildPageUrl = (p: number) => {
    const base = '/blog';
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (tagFilter) params.set('tag', tagFilter);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <>
      {/* rel prev/next solo en vista paginada sin tag (indexable). */}
      {!tagFilter && page > 1 && <link rel="prev" href={site.url + buildPageUrl(page - 1)} />}
      {!tagFilter && page < totalPages && <link rel="next" href={site.url + buildPageUrl(page + 1)} />}

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
                  {tagFilter ? 'Artículos etiquetados' : page > 1 ? `Todos los artículos` : 'Todos los artículos'}
                  {totalPages > 1 && !tagFilter && (
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
