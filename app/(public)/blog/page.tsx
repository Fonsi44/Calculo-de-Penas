import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
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
  filterByMonth,
} from '@/lib/blog-hub';
import { resolveBlogPagination } from '@/lib/blog-pagination';

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

type BlogSearchParams = {
  tag?: string | string[];
  page?: string | string[];
  month?: string | string[];
};

type Props = { searchParams?: Promise<BlogSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const contract = resolveBlogPagination({
    basePath: '/blog',
    rawPage: params?.page,
    tag: params?.tag,
    month: params?.month,
  });
  const { page, canonicalPath, isPaginated } = contract;
  const title = `Blog Jurídico de Abogados en Honduras${isPaginated ? ` (Página ${page})` : ''}`;
  const description = `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.${isPaginated ? ` Página ${page}.` : ''}`;
  return {
    // Absolute para controlar la longitud total del title (SEO).
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalPath },
    keywords: ['blog jurídico Honduras', 'artículos legales Honduras', 'derecho penal blog', 'abogados Honduras blog', 'derecho familia artículos', 'noticias legales Honduras', 'guías legales Honduras'],
    // Los filtros son noindex; la paginación editorial es indexable.
    robots: contract.isFiltered
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${site.url}/og-image.webp`],
    },
    openGraph: {
      title,
      description,
      url: `${site.url}${canonicalPath}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/blog.webp`, width: 1200, height: 630, alt: `${site.name} - Blog Juridico` }],
    },
  };
}

export default async function BlogHubPage(props: Props) {
  const searchParams = await props.searchParams;
  const initialContract = resolveBlogPagination({
    basePath: '/blog',
    rawPage: searchParams?.page,
    tag: searchParams?.tag,
    month: searchParams?.month,
  });
  if (initialContract.notFound) notFound();
  if (initialContract.redirectTo) permanentRedirect(initialContract.redirectTo);
  const { page, tag: tagFilter, month: monthFilter, isFiltered: hasFilter } = initialContract;

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

  // La selección de destacados debe ser estable en toda la paginación. Solo
  // se renderiza en página 1, pero sus slugs se excluyen siempre del grid para
  // evitar duplicados y que el total cambie de 11 a 12 al navegar.
  const showFeatured = !hasFilter && page === 1;
  const featuredSelection = !hasFilter ? deriveFeaturedPosts(allPosts, 4) : [];
  const featured = showFeatured ? featuredSelection : [];
  const featuredSlugs = new Set(featuredSelection.map((post) => post.slug));

  // Listado paginado (vista servidor). Sin filtros, se excluyen siempre los
  // destacados del grid para mantener el mismo universo en todas las páginas.
  const gridSource = !hasFilter
    ? monthFiltered.filter((p) => !featuredSlugs.has(p.slug))
    : monthFiltered;
  const totalPages = getTotalPages(gridSource, ITEMS_PER_PAGE);
  const contract = resolveBlogPagination({
    basePath: '/blog',
    rawPage: searchParams?.page,
    tag: tagFilter,
    month: monthFilter,
    totalPages,
  });
  if (contract.notFound) notFound();

  const pagePosts = getPostsByPage(gridSource, page, ITEMS_PER_PAGE);

  // Derivaciones para la navegación y el sidebar tipo magazine/WordPress.
  // Todas parten de la consulta única ya realizada a la DB.
  const categoryCounts = deriveCategoryCounts(allPosts);
  const popular = derivePopularPosts(allPosts, 5).map(toCardData);
  const recent = deriveRecentPosts(allPosts, 5).map(toCardData);
  const archive = deriveArchiveMonths(allPosts, 8);
  const tags = deriveAllTags(allPosts);

  // Payload ligero (sin body) para el explorador cliente. Debe incluir todo el
  // inventario para que la búsqueda y los filtros no pierdan artículos que
  // quedan fuera de la primera página.
  const explorerPosts = monthFiltered.map(toCardData);
  const explorerPagePosts = pagePosts.map(toCardData);

  return (
    <>
      {contract.prevPath && <link rel="prev" href={site.url + contract.prevPath} />}
      {contract.nextPath && <link rel="next" href={site.url + contract.nextPath} />}

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

      {/* ── Contenido principal: cuadrícula + sidebar editorial ── */}
      <section id="articulos" className="py-10 md:py-14">
        <Container size="lg">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-8 lg:gap-10">
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

              <p
                className="text-sm text-text-secondary"
                data-blog-inventory-summary
              >
                {monthFiltered.length} artículos disponibles
                {' · '}Página {page} de {totalPages}
                {' · '}{featured.length + pagePosts.length} visibles en esta página
                {featured.length > 0 ? ` (${featured.length} destacados)` : ''}
              </p>

              <BlogExplorer
                posts={explorerPosts}
                categories={categoryCounts}
                pagePosts={explorerPagePosts}
                page={page}
                totalPages={totalPages}
                activeTag={tagFilter ?? null}
                activeMonth={monthFilter ?? null}
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
            {categoryCounts.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/blog/${c.slug}`}
                className="focus-ring inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium bg-surface border border-border-light text-text-secondary hover:border-accent/40 hover:text-primary transition-colors"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
          {categoryCounts.length > 8 && (
            <details className="mt-4 rounded-lg border border-border-light bg-surface p-4">
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                Ver las {categoryCounts.length} categorías
              </summary>
              <div className="flex flex-wrap gap-2 mt-4">
                {categoryCounts.slice(8).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/blog/${c.slug}`}
                    className="focus-ring inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium bg-surface-alt border border-border-light text-text-secondary hover:border-accent/40 hover:text-primary transition-colors"
                  >
                    {c.nombre}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </Container>
      </section>

      <NewsletterSection />

      {!contract.isFiltered && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              blogCollectionSchema(
                `Blog Jurídico${page > 1 ? ` — Página ${page}` : ''} | ${site.name}`,
                `Artículos, análisis y guías sobre derecho en Honduras.${page > 1 ? ` Página ${page}.` : ''}`,
                `${site.url}${contract.canonicalPath}`,
              ),
            ),
          }}
        />
      )}
    </>
  );
}
