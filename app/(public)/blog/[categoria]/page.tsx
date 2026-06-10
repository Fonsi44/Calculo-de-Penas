import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, Container } from '@/components/marketing/section';
import { BlogCard } from '@/components/blog/blog-card';
import { blogCategories } from '@/data/blog/categories';
import { getPostsByCategory, getAllCategorySlugs, getPostsByPage, getTotalPages } from '@/lib/blog';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { site } from '@/lib/site';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

type Props = { params: Promise<{ categoria: string }>; searchParams?: Promise<{ page?: string }> };

export function generateStaticParams() {
  return getAllCategorySlugs().map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const sp = await searchParams;
  const page = parseInt(sp?.page ?? '1', 10) || 1;
  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) return {};
  const canonicalPath = page > 1 ? `/blog/${categoria}?page=${page}` : `/blog/${categoria}`;
  return {
    title: `${cat.nombre} — Blog Jurídico${page > 1 ? ` — Página ${page}` : ''}`,
    description: page > 1 ? `${cat.descripcion} Página ${page}.` : cat.descripcion,
    alternates: { canonical: canonicalPath },
  };
}

export default async function BlogCategoryPage(props: Props) {
  const { categoria } = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;

  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) notFound();

  const categoryPosts = getPostsByCategory(categoria);
  const totalPages = getTotalPages(categoryPosts, ITEMS_PER_PAGE);
  const posts = getPostsByPage(categoryPosts, page, ITEMS_PER_PAGE);

  const buildPageUrl = (p: number) => {
    const base = `/blog/${categoria}`;
    return p > 1 ? `${base}?page=${p}` : base;
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Blog Jurídico', href: '/blog' },
        { label: cat.nombre },
      ]} />

      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <Container size="lg" className="relative py-14 md:py-20">
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
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No hay artículos publicados en esta categoría aún.</p>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-primary hover:text-accent-dark transition-colors text-sm font-semibold">
              <ArrowLeft size={14} /> Ver todos los artículos
            </Link>
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
