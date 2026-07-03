import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, Container } from '@/components/marketing/section';
import { BlogCard } from '@/components/blog/blog-card';
import { blogCategories } from '@/data/blog/categories';
import { getPostsByCategory, getAllCategorySlugs, getPostsByPage, getTotalPages } from '@/lib/blog';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { site } from '@/lib/site';
import { CategoryFilter } from '@/components/blog/category-filter';
import { BlogSearch } from '@/components/blog/blog-search';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

const ITEMS_PER_PAGE = 12;

type Props = { params: Promise<{ categoria: string }>; searchParams?: Promise<{ page?: string }> };

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const sp = await searchParams;
  const page = parseInt(sp?.page ?? '1', 10) || 1;
  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) return {};
  const isPaginated = page > 1;
  const canonicalPath = isPaginated ? `/blog/${categoria}` : `/blog/${categoria}`;
  return {
    // Absolute para controlar la longitud total. Antes, el template del layout
    // añadía "| Pineda y Asociados" y, sumado a "{cat.nombre} — Blog Jurídico",
    // varias categorías superaban 65 caracteres (p. ej. Derecho Mercantil y
    // Empresarial = 69) y empeoraba con " — Página N" en la paginación.
    title: { absolute: `${cat.nombre} - Blog Jurídico${isPaginated ? ` (Página ${page})` : ''}` },
    description: isPaginated ? `${cat.descripcion} Página ${page}.` : cat.descripcion,
    alternates: { canonical: canonicalPath },
    keywords: [cat.nombre.toLowerCase(), 'artículos legales Honduras', 'blog jurídico Honduras', `${cat.nombre.toLowerCase()} Honduras`],
    // Páginas paginadas (page>1): noindex para consolidar autoridad en page 1.
    robots: isPaginated
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    twitter: {
      card: 'summary_large_image',
      title: `${cat.nombre} - Blog Jurídico | ${site.name}${page > 1 ? ` (Página ${page})` : ''}`,
      description: cat.descripcion,
      images: [`${site.url}/og-image.png`],
    },
    openGraph: {
      title: `${cat.nombre} - Blog Jurídico | ${site.name}${page > 1 ? ` (Página ${page})` : ''}`,
      description: cat.descripcion,
      url: `${site.url}${canonicalPath}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/blog.webp`, width: 1200, height: 630, alt: `${cat.nombre} - Blog Jurídico` }],
    },
  };
}

export default async function BlogCategoryPage(props: Props) {
  const { categoria } = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;

  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) notFound();

  const categoryPosts = await getPostsByCategory(categoria);
  const totalPages = getTotalPages(categoryPosts, ITEMS_PER_PAGE);
  const posts = getPostsByPage(categoryPosts, page, ITEMS_PER_PAGE);

  const buildPageUrl = (p: number) => {
    const base = `/blog/${categoria}`;
    return p > 1 ? `${base}?page=${p}` : base;
  };

  return (
    <>
      {page > 1 && <link rel="prev" href={site.url + buildPageUrl(page - 1)} />}
      {page < totalPages && <link rel="next" href={site.url + buildPageUrl(page + 1)} />}
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Blog Jurídico', href: '/blog' },
        { label: cat.nombre },
      ]} />

      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <Container size="lg" className="relative py-10 md:py-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-dark transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Volver al blog
          </Link>
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">Categoría</p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">{cat.nombre}</h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">{cat.descripcion}</p>
          </div>
        </Container>
      </section>

      <Section spacing="md">
        <div className="mb-6">
          <CategoryFilter />
        </div>
        <BlogSearch posts={categoryPosts} />
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">Aún no hay artículos publicados en la categoría <strong>{cat.nombre.toLowerCase()}</strong>.</p>
            <p className="text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
              Estamos preparando contenido sobre este tema. Mientras tanto, puede explorar
              otras categorías del blog, consultar nuestras preguntas frecuentes o solicitar
              una consulta legal personalizada.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-primary hover:text-accent-dark transition-colors text-sm font-semibold">
                <ArrowLeft size={14} /> Ver todos los artículos
              </Link>
              <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-primary hover:text-accent-dark transition-colors text-sm font-semibold">
                Preguntas frecuentes
              </Link>
              <Link href="/solicitar-consulta#formulario" className="inline-flex items-center gap-1.5 text-primary hover:text-accent-dark transition-colors text-sm font-semibold">
                Solicitar consulta
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((p) => <BlogCard key={p.slug} post={p} />)}
            </div>
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-3 mt-8" aria-label="Paginación">
                {page > 1 ? (
                  <Link href={buildPageUrl(page - 1)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors">
                    <ArrowLeft size={14} /> Anterior
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/20 text-sm text-text-muted opacity-50 cursor-not-allowed">
                    <ArrowLeft size={14} /> Anterior
                  </span>
                )}
                <span className="text-sm text-text-secondary px-2">Página {page} de {totalPages}</span>
                {page < totalPages ? (
                  <Link href={buildPageUrl(page + 1)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors">
                    Siguiente <ArrowRight size={14} />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/20 text-sm text-text-muted opacity-50 cursor-not-allowed">
                    Siguiente <ArrowRight size={14} />
                  </span>
                )}
              </nav>
            )}
          </div>
        )}
      </Section>

      {/* Enlaces cruzados a otras categorías — SSR estático (no JS).
          CAUSA RAÍZ indexación (Jul 2026): las categorías eran semihuérfanas
          (solo enlazadas vía sidebar con JS o vía sitemap). Este bloque HTML
          garantiza que Googlebot descubra todas las categorías sin ejecutar
          JavaScript, distribuyendo autoridad interna desde cada categoría. */}
      <Section background="muted" spacing="sm" ariaLabel="Otras categorías del blog">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif font-bold text-lg text-primary mb-4">
            Explore otras áreas del derecho
          </h2>
          <div className="flex flex-wrap gap-2">
            {blogCategories
              .filter((c) => c.slug !== categoria)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/blog/${c.slug}`}
                  className="focus-ring inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-surface border border-border-light text-text-secondary hover:border-accent/40 hover:text-primary transition-colors"
                >
                  {c.nombre}
                </Link>
              ))}
          </div>
        </div>
      </Section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(blogCollectionSchema(
          `${cat.nombre} | Blog Jurídico | ${site.name}`,
          cat.descripcion,
          `${site.url}/blog/${categoria}`,
        )),
      }} />
    </>
  );
}
