import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Section, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { getAllPosts, getPostBySlug, formatDate, getCategoryName } from '@/lib/blog';
import { blogPostSchema } from '@/lib/schemas/blog';

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
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <>
      <Section spacing="sm" background="muted">
        <Container size="md">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs-plus text-text-muted hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Volver al blog
          </Link>
          <article>
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary">
                  {getCategoryName(post.category) ?? post.category}
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight text-text">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs-plus text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {post.readingTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={14} /> {post.author}
                </span>
              </div>
            </header>

            {post.coverImage && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md mb-8 border border-border-light shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}

            <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed [&_h2]:text-text [&_h2]:font-serif [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-text [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_strong]:text-text" dangerouslySetInnerHTML={{ __html: post.body }} />

            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2.5 py-1 rounded-full bg-surface-alt text-xs text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {(prevPost || nextPost) && (
            <nav className="mt-10 pt-6 border-t border-border grid sm:grid-cols-2 gap-4">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  <ArrowLeft size={14} className="flex-shrink-0" />
                  <span className="line-clamp-1">{prevPost.title}</span>
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="flex items-center justify-end gap-2 text-sm text-text-secondary hover:text-primary transition-colors sm:text-right"
                >
                  <span className="line-clamp-1">{nextPost.title}</span>
                  <ArrowRight size={14} className="flex-shrink-0" />
                </Link>
              ) : <div />}
            </nav>
          )}
        </Container>
      </Section>

      <Section spacing="md">
        <Container size="md" className="text-center">
          <h2 className="font-serif font-bold text-xl text-text mb-3">¿Necesita asesoría legal?</h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            Si enfrenta una situación legal, nuestro equipo está listo para ayudarle.
          </p>
          <CTAGroup variant="primary" />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema(post)) }}
      />
    </>
  );
}
