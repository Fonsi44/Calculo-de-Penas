import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, Container } from '@/components/marketing/section';
import { ContactStrip } from '@/components/marketing/cta-buttons';
import { BlogCard } from '@/components/blog/blog-card';
import { blogCategories } from '@/data/blog/categories';
import { getPostsByCategory, getAllCategorySlugs } from '@/lib/blog';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import { site } from '@/lib/site';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return getAllCategorySlugs().map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) return {};
  return {
    title: `${cat.nombre} — Blog Jurídico`,
    description: cat.descripcion,
    alternates: { canonical: `/blog/categoria/${categoria}` },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { categoria } = await params;
  const cat = blogCategories.find((c) => c.slug === categoria);
  if (!cat) notFound();

  const posts = getPostsByCategory(categoria);

  return (
    <>
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-14 md:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs-plus text-accent hover:text-accent-dark transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Volver al blog
          </Link>
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
              Categoría
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {cat.nombre}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {cat.descripcion}
            </p>
          </div>
        </Container>
      </section>

      <Section spacing="md">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">
              No hay artículos publicados en esta categoría aún.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-primary hover:text-accent-dark transition-colors text-sm font-semibold"
            >
              <ArrowLeft size={14} /> Ver todos los artículos
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </Section>

      <Section spacing="md">
        <ContactStrip />
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogCollectionSchema(
              `${cat.nombre} | Blog Jurídico | ${site.name}`,
              cat.descripcion,
              `${site.url}/blog/categoria/${categoria}`,
            ),
          ),
        }}
      />
    </>
  );
}
