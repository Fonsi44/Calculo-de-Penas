import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Section, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { RssSidebar } from '@/components/marketing/rss-sidebar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getAllPosts, getPostBySlug, formatDate, getCategoryName } from '@/lib/blog';
import { blogPostSchema } from '@/lib/schemas/blog';
import { site, telHref, whatsappHref } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      ...(post.coverImage ? { images: [{ url: `${site.url}${post.coverImage}`, width: 1200, height: 630, alt: post.title }] } : {}),
    },
  };
}

function getRelatedPosts(slug: string, category: string, tags: string[], limit = 3) {
  const all = getAllPosts();
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const catMatch = p.category === category ? 3 : 0;
      const tagOverlap = p.tags.filter((t) => tags.includes(t)).length;
      return { post: p, score: catMatch + tagOverlap };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.post);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const relatedPosts = getRelatedPosts(slug, post.category, post.tags);

  const categoryName = getCategoryName(post.category) ?? post.category;

  return (
    <>
      {/* ── BREADCRUMBS ── */}
      <div className="bg-surface-alt border-b border-border/50">
        <Container size="lg">
          <Breadcrumbs items={[
            { label: 'Inicio', href: '/' },
            { label: 'Blog Jurídico', href: '/blog' },
            { label: categoryName, href: `/blog/categoria/${post.category}` },
            { label: post.title },
          ]} />
        </Container>
      </div>

      {/* ── HERO ── */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            {/* Categoría */}
            <Link
              href={`/blog/categoria/${post.category}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-eyebrow px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors mb-5"
            >
              {categoryName}
            </Link>

            {/* Título */}
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight text-text tracking-[-0.01em]">
              {post.title}
            </h1>

            {/* Extracto */}
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {post.description}
            </p>

            {/* Metadatos */}
            <div className="flex flex-wrap items-center gap-5 mt-6 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-accent-dark" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-accent-dark" />
                {post.readingTime}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={15} className="text-accent-dark" />
                {post.author}
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── COVER IMAGE ── */}
      {post.coverImage && (
        <Container size="lg" className="mt-0 mb-10">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-border/30 shadow-sm">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </Container>
      )}

      {/* ── CONTENIDO ── */}
      <Section spacing="md">
        <Container size="lg">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Columna principal */}
            <div className="flex-1 min-w-0">
              <article>
                <div className="article-body" dangerouslySetInnerHTML={{ __html: post.body }} />

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="inline-block px-3 py-1.5 rounded-full bg-surface-alt text-xs text-text-secondary border border-border/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA intermedio */}
                <div className="mt-10 p-6 rounded-xl border border-accent/30 bg-accent/5 text-center">
                  <p className="font-serif font-bold text-lg text-primary mb-2">¿Necesita asesoría legal personalizada?</p>
                  <p className="text-sm text-text-secondary mb-4">Cada caso es único. Hable con un abogado y reciba orientación confidencial.</p>
                  <CTAGroup variant="primary" className="justify-center" />
                </div>
              </article>

              {/* Navegación entre posts */}
              {(prevPost || nextPost) && (
                <nav className="mt-10 pt-6 border-t border-border/30 grid sm:grid-cols-2 gap-4" aria-label="Navegación entre artículos">
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.slug}`}
                      className="group flex items-start gap-3 p-4 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-surface-alt transition-colors"
                    >
                      <ArrowLeft size={16} className="flex-shrink-0 mt-0.5 text-text-muted group-hover:text-accent-dark transition-colors" />
                      <div className="min-w-0">
                        <p className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-1">Anterior</p>
                        <p className="text-sm text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">{prevPost.title}</p>
                      </div>
                    </Link>
                  ) : <div />}
                  {nextPost ? (
                    <Link
                      href={`/blog/${nextPost.slug}`}
                      className="group flex items-start justify-end gap-3 p-4 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-surface-alt transition-colors text-right"
                    >
                      <div className="min-w-0">
                        <p className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-1">Siguiente</p>
                        <p className="text-sm text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">{nextPost.title}</p>
                      </div>
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5 text-text-muted group-hover:text-accent-dark transition-colors" />
                    </Link>
                  ) : <div />}
                </nav>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Autor */}
                <div className="p-5 rounded-xl border border-border/30 bg-surface-alt">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Autor</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">PA</div>
                    <div>
                      <p className="font-semibold text-sm text-text">{post.author}</p>
                      <p className="text-xs text-text-muted">Abogados en Honduras</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Bufete multidisciplinario con más de 15 años de experiencia. Abogados
                    colegiados en Honduras, con presencia activa en juzgados del sur del país.
                    Especialistas en defensa penal, derecho laboral, familia, civil, mercantil
                    y asesoría a hondureños en España.
                  </p>
                </div>

                {/* Contacto rápido */}
                <div className="p-5 rounded-xl border border-accent/30 bg-accent/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent-dark mb-3">Consulta gratuita</p>
                  <a href={telHref()} className="flex items-center gap-2.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors mb-2.5">
                    <Phone size={16} className="text-accent-dark" />
                    {site.phoneDisplay}
                  </a>
                  <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
                    <MessageCircle size={16} className="text-accent-dark" />
                    WhatsApp
                  </a>
                </div>

                {/* Compartir este artículo */}
                <div className="p-5 rounded-xl border border-border/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Compartir</p>
                  <p className="text-xs text-text-secondary">Si este artículo le resultó útil, compártalo con alguien que pueda necesitarlo.</p>
                </div>

                {/* RSS Feed */}
                <RssSidebar />
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* ── ARTÍCULOS RELACIONADOS ── */}
      {relatedPosts.length > 0 && (
        <Section spacing="md" background="muted">
          <Container size="lg">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">También puede interesarle</p>
              <h2 className="font-serif font-bold text-2xl text-text">Artículos relacionados</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group block rounded-xl border border-border/30 bg-surface overflow-hidden hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    {rp.coverImage ? (
                      <Image src={rp.coverImage} alt={rp.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">{getCategoryName(rp.category) ?? rp.category}</p>
                    <h3 className="font-serif font-bold text-sm leading-snug text-text group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                    <p className="mt-1.5 text-xs text-text-muted flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(rp.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── SCHEMA ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema(post)) }}
      />
    </>
  );
}

