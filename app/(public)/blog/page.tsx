import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { Section, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { BlogCard } from '@/components/blog/blog-card';
import { BlogSidebar } from '@/components/blog/blog-sidebar';
import { getAllPosts, getFeaturedPosts, getPostsByTag } from '@/lib/blog';
import { blogCollectionSchema } from '@/lib/schemas/blog';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog Jurídico',
  description: `Artículos, análisis y guías sobre derecho penal, familia, laboral y más en Honduras. Escrito por el equipo de ${site.name}.`,
  alternates: { canonical: '/blog' },
};

export default async function BlogHubPage(props: { searchParams?: Promise<{ tag?: string }> }) {
  const searchParams = await props.searchParams;
  const tagFilter = searchParams?.tag;
  const allPosts = getAllPosts();
  const posts = tagFilter ? getPostsByTag(tagFilter) : allPosts;
  const featured = tagFilter ? [] : getFeaturedPosts();

  return (
    <>
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
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {posts.map((p) => (
                    <BlogCard key={p.slug} post={p} />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link
                    href="/blog/feed.xml"
                    className="text-sm text-text-muted hover:text-primary transition-colors"
                  >
                    Suscribirse al RSS
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <BlogSidebar />
          </div>
        </div>
      </Section>

      <Section spacing="md">
        <ContactStrip />
      </Section>

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
