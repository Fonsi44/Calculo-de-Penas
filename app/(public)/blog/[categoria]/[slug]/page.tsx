import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Calendar, Clock, User, ArrowLeft, ArrowRight, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Section, Container } from '@/components/marketing/section';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import {
  getAllPostParams,
  getAllPosts,
  getPostBySlug,
  getRelatedPostsFromSummaries,
  formatDate,
  getCategoryName,
} from '@/lib/blog';
import { blogPostSchema } from '@/lib/schemas/blog';
import { site } from '@/lib/site';
import { buildBlogMetaDescription, buildBlogMetaTitle } from '@/lib/seo';
import { BlogTOC } from '@/components/blog/blog-toc';
import { injectHeadingIds } from '@/lib/blog-toc';
import { ShareButtons } from '@/components/blog/share-buttons';
import { RelatedService } from '@/components/blog/related-service';
import { BlogCtaBar } from '@/components/blog/blog-cta-bar';
import { LegalDisclaimer } from '@/components/marketing/legal-disclaimer';
import {
  isEditoriallyIndexable,
  resolveArticleEditorialState,
} from '@/lib/editorial-signature';
import { extractFAQSchema, faqPageSchema } from '@/lib/faq-schema';
import { BlogSidebar } from '@/components/blog/blog-sidebar';
import {
  injectContextLinks,
  detectMentionedCities,
} from '@/lib/blog-context-linker';
import { normalizeBlogLinksForRender } from '@/lib/blog-link-normalizer';
import {
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
  serializeBlogJsonLd,
} from '@/lib/blog-html-sanitizer';
import { transformBlogTablesForRender } from '@/lib/blog-table-transformer';
import { injectMidArticleCta } from '@/lib/blog-generated-cta';
import { RelatedCities, RelatedCategories } from '@/components/marketing/related-links';
import {
  toCardData,
  deriveCategoryCounts,
  derivePopularPosts,
  deriveRecentPosts,
  deriveArchiveMonths,
  deriveAllTags,
} from '@/lib/blog-hub';
import {
  getCanonicalRelatedSummaries,
  loadArticleSeoRelations,
  type ArticleSeoRelations,
} from '@/lib/seo/article-relations';
import articleSeoRelationsData from '@/data/seo/article-seo-relations.json';

export const revalidate = 3600;

type Props = { params: Promise<{ categoria: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllPostParams();
  return posts.map((p) => ({ categoria: p.category, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.category !== categoria) return {};

  // `absolute` evita que el template raíz añada otra marca. El helper conserva
  // primero la intención de búsqueda y solo añade la marca si cabe completa.
  const metaTitle = buildBlogMetaTitle(post.metaTitle || post.title);
  const metaDesc = buildBlogMetaDescription(
    post.metaDescription,
    post.description,
  );
  const ogImg = post.ogImage || post.coverImage || '/og-image.webp';
  const canonical = post.canonicalUrl || `/blog/${post.category}/${post.slug}`;
  // Una versión publicada con firma institucional o individual válida es
  // indexable. Drafts, versiones desactualizadas y propuestas aún sin nueva
  // firma reciben noindex sin afectar a la versión histórica publicada.
  const noindex = post.noindex === true
    || !isEditoriallyIndexable(post);

  return {
    title: { absolute: metaTitle },
    description: metaDesc,
    alternates: { canonical },
    keywords: post.tags,
    robots: noindex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: [`${site.url}${ogImg}`],
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `${site.url}${canonical}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: `${site.url}${ogImg}`, width: 1200, height: 630, alt: metaTitle }],
    },
  };
}

export default async function BlogPostByCategoryPage({ params }: Props) {
  const { categoria, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.category !== categoria) notFound();

  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  // Relaciones canónicas (lib/seo/article-relations.ts): si el artículo tiene
  // relación definida y validada, se usan targets deterministas; si no, se
  // mantiene el fallback por similitud (categoría + tags).
  const editorial = resolveArticleEditorialState(post);
  const relationsBySlug = new Map<string, ArticleSeoRelations>(
    loadArticleSeoRelations(articleSeoRelationsData).map((r) => [r.slug, r]),
  );
  // El registro article-seo-relations.json cubre hoy los 53 ACTION_REQUIRED.
  // No se usa como cluster público hasta revisión jurídica (NO_SAFE_CLUSTER_TARGET).
  const suppressUnsafeRelated =
    editorial.publicationState === 'pending_resignature'
    || editorial.publicationState === 'draft'
    || relationsBySlug.has(slug);
  const canonicalRelation = suppressUnsafeRelated ? undefined : relationsBySlug.get(slug);
  const canonicalRelated = canonicalRelation
    ? getCanonicalRelatedSummaries(allPosts, canonicalRelation)
    : [];
  // PASS: máximo 3 y solo si hay overlap real de tags (no basta la categoría).
  const relatedPosts = suppressUnsafeRelated
    ? []
    : canonicalRelated.length > 0
      ? canonicalRelated
      : getRelatedPostsFromSummaries(
        allPosts,
        slug,
        post.category,
        post.tags,
      );
  const categoryName = getCategoryName(post.category) ?? post.category;

  const postUrl = `/blog/${post.category}/${post.slug}`;

  const LAWYER_SLUGS: Record<string, string> = {
    'Danilo Pineda Maradiaga': 'danilo-pineda-maradiaga',
    'Thania Marlene Paz': 'thania-marlene-paz',
    'Emil Barahona': 'emil-barahona',
  };
  const validSignature = editorial.signatureValid ? editorial.signature : null;
  const individualSignature = validSignature?.type === 'lawyer';
  const showPreviewResignatureNotice =
    (process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'staging')
    && editorial.publicationState === 'pending_resignature';

  const authorSlug = post.author ? LAWYER_SLUGS[post.author] : null;
  const authorHref = authorSlug ? `/equipo/${authorSlug}` : '/despacho';

  // Inyecta CTA mid-article y luego asigna IDs estables a los H2/H3 del body
  // (server-side) para que el TOC y los fragment anchors (#section) existan en
  // el HTML servidor (SEO/GEO: crawlers y LLMs ven la estructura del doc).
  // Frontera 1: todo body persistido es no confiable. La sanitización ocurre
  // exclusivamente en render y nunca altera el body ni su hash editorial.
  const sanitizedSource = sanitizeBlogSourceHtml(post.body);
  const rawHtml = injectMidArticleCta(sanitizedSource.html, post.slug);
  const { html: withHeadings, headings } = injectHeadingIds(rawHtml);
  // AUTO-LINKING CONTEXTUAL (Jul 2026): inserta enlaces internos a ciudades y
  // áreas de práctica detectadas en el body. Crea la tela de araña blog→geo.
  // Anti-over-optimization: máx 5 enlaces, respeta headings y anchors existentes.
  const renderSafeHtml = normalizeBlogLinksForRender(withHeadings).html;
  const contextLinkedHtml = injectContextLinks(renderSafeHtml, {
    excludeHrefs: [postUrl], // evitar self-link
  });
  // Transformación de tablas → fichas responsive (Jul 2026): sustituye las
  // `<table>` del body por fichas semánticas (article-comparison-cards /
  // article-data-cards) legibles en móvil, sin overflow horizontal ni palabras
  // partidas letra por letra. Render-only: NO muta post.body ni su hash/firma.
  const tableCards = transformBlogTablesForRender(contextLinkedHtml);
  // Frontera 2: ninguna transformación controlada llega directamente al sink.
  // El sanitizer de render prohíbe etiquetas de tabla, de modo que cualquier
  // tabla no transformada se degrada a texto (defense in depth).
  const articleHtml = sanitizeBlogRenderedHtml(tableCards.html).html;
  // Detecta ciudades mencionadas para el bloque RelatedCities al final.
  const mentionedCities = detectMentionedCities(sanitizedSource.html);
  const faqItems = extractFAQSchema(sanitizedSource.html);
  const faqLd = faqPageSchema(faqItems);

  const categoryCounts = deriveCategoryCounts(allPosts);
  const popularSidebar = derivePopularPosts(allPosts, 5).map(toCardData);
  const recentSidebar = deriveRecentPosts(allPosts, 5).map(toCardData);
  const archive = deriveArchiveMonths(allPosts, 8);
  const allTags = deriveAllTags(allPosts);

  return (
    <>
      {/* ── BREADCRUMBS ── */}
      <div className="bg-surface-alt border-b border-border/50">
        <Container size="lg">
          <Breadcrumbs items={[
            { label: 'Inicio', href: '/' },
            { label: 'Blog Jurídico', href: '/blog' },
            { label: categoryName, href: `/blog/${post.category}` },
            { label: post.title },
          ]} />
        </Container>
      </div>

      {/* ── HERO ── */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/blog/${post.category}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-eyebrow px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors mb-5"
            >
              {categoryName}
            </Link>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight text-text tracking-[-0.01em]">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {post.description}
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-6 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-accent-dark" />
                <span>Publicado: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
              </span>
              {post.updatedAt && (
                <span className="flex items-center gap-1.5" title="Última actualización">
                  <Clock size={15} className="text-accent-dark" />
                  <span>Actualizado: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-accent-dark" />
                {post.readingTime}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={15} className="text-accent-dark" />
                <span>Autor: <Link href={authorHref} className="hover:text-primary hover:underline transition-colors font-medium text-text-secondary">{post.author}</Link></span>
              </span>
              {validSignature && (
                <span className="flex flex-wrap items-center gap-1.5">
                  <BadgeCheck size={15} className="text-accent-dark" />
                  <span>{individualSignature ? 'Revisión jurídica:' : 'Revisión jurídica institucional:'}</span>
                  <Link href={validSignature.profileUrl ?? '/despacho'} className="hover:text-primary hover:underline transition-colors font-medium text-text-secondary font-semibold">
                    {validSignature.name}
                  </Link>
                  {validSignature.signedAt && (
                    <time dateTime={new Date(validSignature.signedAt).toISOString()}>
                      {' · '}{formatDate(new Date(validSignature.signedAt).toISOString())}
                    </time>
                  )}
                </span>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* ── SOCIAL SHARE BAR ── */}
      <Container size="lg" className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border/30 bg-surface-alt">
          <span className="text-sm font-semibold text-text">Compartir este artículo</span>
          <ShareButtons title={post.title} url={postUrl} variant="horizontal" />
        </div>
      </Container>

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

      {/* ── CONTENIDO + SIDEBAR ── */}
      <Section spacing="md">
        <Container size="lg">
          <div className="grid lg:grid-cols-[1fr_20rem] gap-8 lg:gap-10">
            <div className="min-w-0">
              <article>
                {showPreviewResignatureNotice && (
                  <div
                    className="mb-6 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm font-semibold text-text"
                    data-preview-editorial-status="pending_resignature"
                  >
                    Versión editorial en preparación para nueva firma
                  </div>
                )}
                <BlogTOC headings={headings} />
                <div className="article-body" dangerouslySetInnerHTML={{ __html: articleHtml }} />

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          rel="nofollow"
                          className="inline-block px-3 py-1.5 rounded-full bg-surface-alt text-xs text-text-secondary border border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer legal único con fecha de revisión real del post (E-E-A-T).
                    El footer global NO repite este concepto (ver public-footer.tsx). */}
                <LegalDisclaimer
                  documentaryReviewedAt={
                    post.aiReviewStatus === 'completed' || post.aiReviewStatus === 'source_checked'
                      ? post.aiReviewedAt
                      : null
                  }
                />

                <RelatedService category={post.category} slug={post.slug} />

                {/* Author Box */}
                <div className="mt-10 pt-6 border-t border-border/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Sobre el autor</p>
                  <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-lg border border-border/30 bg-surface-alt">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {post.author === 'Danilo Pineda Maradiaga' ? 'DP' : post.author === 'Thania Marlene Paz' ? 'TP' : post.author === 'Emil Barahona' ? 'EB' : 'PA'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text">
                        <Link href={authorHref} className="hover:text-primary hover:underline transition-colors">
                          {post.author}
                        </Link>
                      </p>
                      <p className="text-xs text-text-muted">Abogados en Nacaome, Valle, zona sur de Honduras</p>
                      <p className="text-sm text-text-secondary leading-relaxed mt-2">
                        Bufete jurídico con sede en Nacaome y más de 15 años de experiencia. Abogados
                        colegiados en Honduras, con presencia activa en juzgados de la zona sur.
                      </p>
                      {validSignature && (
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-text-secondary">
                          <BadgeCheck size={14} className="text-accent-dark" />
                          <span>{individualSignature ? 'Revisión jurídica:' : 'Revisión jurídica institucional:'}</span>
                          <Link href={validSignature.profileUrl ?? '/despacho'} className="hover:text-primary hover:underline transition-colors font-semibold">
                            {validSignature.name}
                          </Link>
                          {validSignature.signedAt && (
                            <time dateTime={new Date(validSignature.signedAt).toISOString()}>
                              {' · '}{formatDate(new Date(validSignature.signedAt).toISOString())}
                            </time>
                          )}
                        </p>
                      )}
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
                      >
                        Más artículos del equipo <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Share at end */}
                <div className="mt-8 pt-6 border-t border-border/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Compartir</p>
                  <ShareButtons title={post.title} url={postUrl} variant="horizontal" />
                </div>
              </article>

              {/* Navegación entre posts */}
              {(prevPost || nextPost) && (
                <nav className="mt-10 pt-6 border-t border-border/30 grid sm:grid-cols-2 gap-4" aria-label="Navegación entre artículos">
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.category}/${prevPost.slug}`}
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
                      href={`/blog/${nextPost.category}/${nextPost.slug}`}
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

            <BlogSidebar
              categories={categoryCounts}
              popular={popularSidebar}
              recent={recentSidebar}
              archive={archive}
              tags={allTags}
              showTags={false}
            />
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
                  href={`/blog/${rp.category}/${rp.slug}`}
                  className="group block rounded-lg border border-border/30 bg-surface overflow-hidden hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    {rp.coverImage ? (
                      <Image src={rp.coverImage} alt={rp.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-[1.025] transition-transform duration-200" />
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

      {/* CLUSTER CONTEXTUAL: solo geo si el cuerpo menciona una ciudad.
          Sin mención, el footer ya cubre las 7 landings indexables. */}
      {(mentionedCities[0] || post.category) && (
      <Section background="muted" spacing="sm">
        <Container size="md">
          <div className="flex flex-col gap-6">
            {mentionedCities[0] ? (
              <RelatedCities
                mentionedCitySlug={mentionedCities[0]}
                limit={2}
                eyebrow="Atendemos en el sur de Honduras"
              />
            ) : null}
            <RelatedCategories current={post.category} limit={2} />
          </div>
        </Container>
      </Section>
      )}

      {/* ── FINAL CTA ── */}
      {/* Un único CTA de cierre por post. LocalConsultForm eliminado: era
          redundante con BlogCtaBar (ambos al mismo endpoint /api/consulta).
          BlogCtaBar ya ofrece teléfono + WhatsApp + enlace al formulario. */}
      <Section spacing="md">
        <Container size="md">
          <BlogCtaBar category={post.category} />
        </Container>
      </Section>

      {/* ── SCHEMAS ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeBlogJsonLd(blogPostSchema(post)) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeBlogJsonLd(faqLd) }}
        />
      )}
    </>
  );
}
