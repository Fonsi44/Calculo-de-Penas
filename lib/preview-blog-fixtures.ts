import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fixturesSnapshot from '@/data/seo/preview-blog-fixtures.json';

export type PreviewBlogDataMode =
  | 'database'
  | 'full-public-snapshot'
  | 'limited-test-fixtures';

type PublicSnapshotFixture = (typeof fixturesSnapshot.fixtures)[number];

type FullPublicSnapshot = {
  production_import_forbidden: true;
  fixtures: PublicSnapshotFixture[];
};

const VALID_MODES = new Set<PreviewBlogDataMode>([
  'database',
  'full-public-snapshot',
  'limited-test-fixtures',
]);

export function resolvePreviewBlogDataMode(
  env: Record<string, string | undefined> = process.env,
): PreviewBlogDataMode {
  const requested = env.SEO_PREVIEW_BLOG_DATA_MODE;
  const environment = (env.VERCEL_ENV ?? env.APP_ENV ?? '').toLowerCase();

  if (requested) {
    if (!VALID_MODES.has(requested as PreviewBlogDataMode)) {
      throw new Error(`[blog-source] SEO_PREVIEW_BLOG_DATA_MODE inválido: ${requested}.`);
    }
    if (requested === 'limited-test-fixtures') {
      const technicalFixtureContext = (
        env.NODE_ENV === 'test'
        || env.SEO_ALLOW_LIMITED_TEST_FIXTURES === 'true'
      );
      if (environment === 'production' || !technicalFixtureContext) {
        throw new Error(
          '[blog-source] limited-test-fixtures solo se permite en tests o previews técnicas explícitas.',
        );
      }
    }
    return requested as PreviewBlogDataMode;
  }

  if (environment === 'preview' || environment === 'staging') {
    throw new Error(
      '[blog-source] La Preview canónica requiere SEO_PREVIEW_BLOG_DATA_MODE=database '
      + 'o full-public-snapshot; no existe fallback implícito.',
    );
  }

  return 'database';
}

function mapFixture(fixture: PublicSnapshotFixture) {
  return {
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
    reviewOrigin: fixture.review_status === 'lawyer_review_pending'
      ? 'pending_resignature'
      : 'firm_historical_review',
    signatureType: fixture.review_status === 'lawyer_review_pending' ? null : 'firm',
    signatureName: fixture.review_status === 'lawyer_review_pending'
      ? null
      : 'Pineda y Asociados',
    signatureCandidate: null,
    reviewedContentHash: null,
    signatureValid: false,
    legalReviewNotes: fixture.fixture_only
      ? 'Fixture público sanitizado; no equivale a revisión jurídica.'
      : null,
    lastReviewedAt: null,
    nextReviewDueAt: null,
  };
}

export function getLimitedTestBlogFixtures(
  env: Record<string, string | undefined> = process.env,
) {
  if (resolvePreviewBlogDataMode(env) !== 'limited-test-fixtures') {
    throw new Error('[blog-source] Se intentó leer fixtures limitados fuera de su modo explícito.');
  }
  if (!fixturesSnapshot.production_import_forbidden) {
    throw new Error('El snapshot técnico debe prohibir explícitamente su importación productiva.');
  }
  return fixturesSnapshot.fixtures.map(mapFixture);
}

export function getFullPublicBlogSnapshot(
  env: Record<string, string | undefined> = process.env,
) {
  if (resolvePreviewBlogDataMode(env) !== 'full-public-snapshot') {
    throw new Error('[blog-source] Se intentó leer el snapshot completo fuera de su modo explícito.');
  }
  const snapshotPath = resolve('data/seo/preview-blog-full-snapshot.json');
  if (!existsSync(snapshotPath)) {
    throw new Error(
      '[blog-source] Falta data/seo/preview-blog-full-snapshot.json; '
      + 'la Preview no puede degradarse a fixtures limitados.',
    );
  }
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as FullPublicSnapshot;
  if (snapshot.production_import_forbidden !== true || !Array.isArray(snapshot.fixtures)) {
    throw new Error('[blog-source] Snapshot público completo inválido.');
  }
  return snapshot.fixtures.map(mapFixture);
}
