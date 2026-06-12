import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { Section, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { BlogCard } from '@/components/blog/blog-card';
import { CategoryFilter } from '@/components/blog/category-filter';
import { NewsletterSection } from '@/components/blog/newsletter-section';
import { getAllPosts, getFeaturedPosts, getPostsByTag, getPostsByPage, getTotalPages } from '@/lib/blog';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import Link from 'next/link';
import { RssButton } from '@/components/marketing/rss-button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
    title: `Blog Jurídico de Abogados en Honduras | Derecho Penal, Familia, Laboral y Más${page > 1 ? ` — Página ${page}` : ''}`,
    description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.${page > 1 ? ` Página ${page}.` : ''}`,
    alternates: { canonical: canonicalPath },
    robots: tagFilter ? { index: false, follow: true, googleBot: { index: false, follow: true } } : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      title: `Blog Jurídico — ${site.name}`,
      description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
      url: `${site.url}/blog`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Blog Jurídico` }],
    },
  };
}

export default async function BlogHubPage(props: Props) {
  const searchParams = await props.searchParams;
  const tagFilter = searchParams?.tag;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;

  const allPosts = await getAllPosts();
  const filteredPosts = tagFilter ? await getPostsByTag(tagFilter) : allPosts;
  const totalPages = getTotalPages(filteredPosts, ITEMS_PER_PAGE);
  const posts = getPostsByPage(filteredPosts, page, ITEMS_PER_PAGE);
  const featured = tagFilter || page > 1 ? [] : await getFeaturedPosts();

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
      {!tagFilter && page > 1 && <link rel="prev" href={site.url + buildPageUrl(page - 1)} />}
      {!tagFilter && page < totalPages && <link rel="next" href={site.url + buildPageUrl(page + 1)} />}
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Blog Jurídico' },
      ]} />

      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
              Blog Jurídico
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              Conocimiento legal al servicio de sus derechos
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              Artículos, análisis y guías escritos por nuestro equipo. Información clara y práctica
              sobre el sistema legal hondureño.
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="md">
        <div className="space-y-6">
          <CategoryFilter />

          {featured.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-lg text-text mb-4">Artículo destacado</h2>
              {featured.map((p) => (
                <BlogCard key={p.slug} post={p} featured />
              ))}
            </div>
          )}

          {tagFilter && (
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                Filtrando por etiqueta:
              </span>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {tagFilter}
              </span>
              <Link
                href="/blog"
                className="text-xs text-text-muted hover:text-primary ml-2 transition-colors"
              >
                Limpiar filtro
              </Link>
            </div>
          )}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                {tagFilter ? `No hay artículos con la etiqueta "${tagFilter}".` : 'Próximamente publicaremos nuestros primeros artículos.'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-bold text-lg text-text mb-4">
                {featured.length > 0 ? 'Todos los artículos' : tagFilter ? `Artículos etiquetados: ${tagFilter}` : 'Artículos'}
                {totalPages > 1 && <span className="text-text-muted font-normal text-sm ml-2">— Página {page} de {totalPages}</span>}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex justify-center items-center gap-3 mt-8" aria-label="Paginación del blog">
                  {page > 1 ? (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
                    >
                      <ArrowLeft size={14} /> Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/20 text-sm text-text-muted opacity-50 cursor-not-allowed">
                      <ArrowLeft size={14} /> Anterior
                    </span>
                  )}
                  <span className="text-sm text-text-secondary px-2">
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
                    >
                      Siguiente <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/20 text-sm text-text-muted opacity-50 cursor-not-allowed">
                      Siguiente <ArrowRight size={14} />
                    </span>
                  )}
                </nav>
              )}

              <div className="mt-8">
                <RssButton />
              </div>

              <p className="mt-4 text-center">
                ¿Tiene dudas legales?{' '}
                <Link
                  href="/preguntas-frecuentes"
                  className="text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
                >
                  Consulte nuestras preguntas frecuentes →
                </Link>
              </p>
            </div>
          )}
        </div>
      </Section>

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
