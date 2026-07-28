import fixturesSnapshot from '@/data/seo/preview-blog-fixtures.json';

export function previewFixturesEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const environment = (env.VERCEL_ENV ?? env.APP_ENV ?? '').toLowerCase();
  return (
    (environment === 'preview' || environment === 'staging')
    && env.SEO_PREVIEW_PUBLIC_FIXTURES !== 'false'
  );
}

export function getPreviewBlogFixtures() {
  if (!previewFixturesEnabled()) return [];
  if (!fixturesSnapshot.production_import_forbidden) {
    throw new Error('El snapshot Preview debe prohibir explícitamente su importación productiva.');
  }
  return fixturesSnapshot.fixtures.map((fixture) => ({
    id: `preview-${fixture.slug}`,
    slug: fixture.slug,
    title: fixture.title,
    description: fixture.description,
    body: fixture.body,
    publishedAt: new Date(fixture.published_at),
    updatedAt: fixture.updated_at ? new Date(fixture.updated_at) : null,
    category: fixture.category,
    tags: fixture.tags ?? [],
    author: fixture.author,
    readingTime: fixture.reading_time ?? '5 min',
    coverImage: fixture.cover_image,
    featured: false,
    published: true,
    creadoEn: new Date(fixture.published_at),
    metaTitle: fixture.meta_title,
    metaDescription: fixture.meta_description,
    ogImage: fixture.og_image,
    noindex: fixture.noindex,
    canonicalUrl: fixture.canonical_url,
    authorId: null,
    reviewStatus: fixture.review_status,
    reviewedBy: fixture.reviewed_by,
    reviewedAt: fixture.reviewed_at ? new Date(fixture.reviewed_at) : null,
    legalReviewNotes: fixture.fixture_only
      ? 'Fixture público sanitizado; no equivale a revisión jurídica.'
      : null,
    lastReviewedAt: null,
    nextReviewDueAt: null,
  }));
}
