import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  getFullPublicBlogSnapshot,
  getLimitedTestBlogFixtures,
  resolvePreviewBlogDataMode,
} from '@/lib/preview-blog-fixtures';
import {
  editorialSignatureSchemaMode,
  hashEditorialContent,
} from '@/lib/editorial-signature';
import {
  projectPublicAttribution,
  type ArticleAttributionRow,
} from '@/lib/blog-attribution';
import { CANONICAL_REVIEWERS } from '@/lib/legal-review';

/**
 * Contrato de lectura del blog público.
 *
 * El frontend no debe depender de columnas operativas del pipeline interno de
 * revisión IA. Mantener una proyección explícita evita que una rama Preview
 * con ese workflow pendiente de migración rompa todas las páginas públicas.
 * Las columnas legales/editoriales sí forman parte del contrato de publicación.
 */
export const publicBlogPostDetailSelection = {
  id: blogPosts.id,
  slug: blogPosts.slug,
  title: blogPosts.title,
  description: blogPosts.description,
  body: blogPosts.body,
  publishedAt: blogPosts.publishedAt,
  updatedAt: blogPosts.updatedAt,
  category: blogPosts.category,
  tags: blogPosts.tags,
  author: blogPosts.author,
  readingTime: blogPosts.readingTime,
  coverImage: blogPosts.coverImage,
  featured: blogPosts.featured,
  published: blogPosts.published,
  creadoEn: blogPosts.creadoEn,
  metaTitle: blogPosts.metaTitle,
  metaDescription: blogPosts.metaDescription,
  ogImage: blogPosts.ogImage,
  noindex: blogPosts.noindex,
  canonicalUrl: blogPosts.canonicalUrl,
  authorId: blogPosts.authorId,
  reviewStatus: blogPosts.reviewStatus,
  reviewedBy: blogPosts.reviewedBy,
  reviewedAt: blogPosts.reviewedAt,
  lastReviewedAt: blogPosts.lastReviewedAt,
  nextReviewDueAt: blogPosts.nextReviewDueAt,
  ...(editorialSignatureSchemaMode() === 'MIGRATED_SIGNATURE_MODE'
    ? {
        reviewOrigin: blogPosts.reviewOrigin,
        signatureType: blogPosts.signatureType,
        signatureName: blogPosts.signatureName,
        signatureCandidate: blogPosts.signatureCandidate,
        reviewedContentHash: blogPosts.reviewedContentHash,
        signatureValid: blogPosts.signatureValid,
      }
    : {}),
} as const;

/**
 * Proyección de listados: excluye expresamente body, notas y payloads
 * editoriales internos. `bodyHashValid` se calcula en DB sin transferir HTML.
 */
export const publicBlogPostSummarySelection = {
  slug: blogPosts.slug,
  title: blogPosts.title,
  description: blogPosts.description,
  publishedAt: blogPosts.publishedAt,
  updatedAt: blogPosts.updatedAt,
  category: blogPosts.category,
  tags: blogPosts.tags,
  author: blogPosts.author,
  readingTime: blogPosts.readingTime,
  coverImage: blogPosts.coverImage,
  featured: blogPosts.featured,
  noindex: blogPosts.noindex,
  canonicalUrl: blogPosts.canonicalUrl,
  reviewStatus: blogPosts.reviewStatus,
  reviewedBy: blogPosts.reviewedBy,
  ...(editorialSignatureSchemaMode() === 'MIGRATED_SIGNATURE_MODE'
    ? {
        reviewOrigin: blogPosts.reviewOrigin,
        signatureType: blogPosts.signatureType,
        signatureName: blogPosts.signatureName,
        signatureValid: blogPosts.signatureValid,
        bodyHashValid: sql<boolean>`
          ${blogPosts.reviewedContentHash} is not null
          and encode(sha256(convert_to(${blogPosts.body}, 'UTF8')), 'hex') = ${blogPosts.reviewedContentHash}
        `,
      }
    : {
        bodyHashValid: sql<boolean>`true`,
      }),
} as const;

export const publicBlogPostParamsSelection = {
  slug: blogPosts.slug,
  category: blogPosts.category,
} as const;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

function isTestPhase(): boolean {
  return process.env.NODE_ENV === 'test';
}

function shouldThrowOnDbError(): boolean {
  if (isBuildPhase()) return false;
  if (isTestPhase()) {
    // En tests, solo lanzamos si se pide explícitamente simular caída
    return process.env.TEST_SIMULATE_DB_DOWN === 'true';
  }
  return true;
}

/**
 * Comprueba si la DB es alcanzable EN ESTE MOMENTO (runtime).
 *
 * Se evalúa como función en cada llamada — no como constante de módulo —
 * para evitar que Next.js fije el valor durante el build (prerender ISR)
 * y diverja del runtime serverless.
 */
function isDbReachable(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url && !url.includes('placeholder') && !url.includes('localhost:5432/placeholder'),
  );
}

function filterSnapshotPosts<T extends {
  category: string;
  featured?: boolean | null;
}>(
  posts: T[],
  opts?: { limit?: number; category?: string; featured?: boolean },
) {
  let filtered = posts;
  if (opts?.category) filtered = filtered.filter((post) => post.category === opts.category);
  if (opts?.featured) filtered = filtered.filter((post) => post.featured);
  return opts?.limit ? filtered.slice(0, opts.limit) : filtered;
}

type SummaryProjectionSource = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt: Date | null;
  category: string;
  tags: string[] | null;
  author: string | null;
  readingTime: string | null;
  coverImage: string | null;
  featured: boolean | null;
  noindex: boolean | null;
  canonicalUrl: string | null;
  reviewStatus: string | null;
  reviewedBy: string | null;
  reviewOrigin?: string | null;
  signatureType?: string | null;
  signatureName?: string | null;
  signatureValid?: boolean | null;
  bodyHashValid: boolean;
};

function projectSummary(row: SummaryProjectionSource) {
  const status = row.reviewStatus?.trim().toLowerCase() ?? '';
  const unpublishedStatus = new Set([
    'draft',
    'documentary_review',
    'withdrawn',
    'outdated',
    'needs_update',
    'pending_resignature',
    'lawyer_review_pending',
  ]).has(status);
  const migrated = editorialSignatureSchemaMode() === 'MIGRATED_SIGNATURE_MODE';
  const migratedIdentityValid = (
    row.reviewOrigin === 'firm_historical_review'
    && row.signatureType === 'firm'
    && row.signatureName === 'Pineda y Asociados'
  ) || (
    row.reviewOrigin === 'individual_lawyer_review'
    && row.signatureType === 'lawyer'
    && CANONICAL_REVIEWERS.includes(row.signatureName ?? '')
  );
  const editoriallyIndexable = !unpublishedStatus
    && row.bodyHashValid
    && (!migrated || (row.signatureValid === true && migratedIdentityValid));

  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    category: row.category,
    tags: row.tags,
    author: row.author,
    readingTime: row.readingTime,
    coverImage: row.coverImage,
    featured: row.featured,
    noindex: row.noindex,
    canonicalUrl: row.canonicalUrl,
    editoriallyIndexable,
  };
}

function snapshotSummaryRows(posts: ReturnType<typeof getFullPublicBlogSnapshot>) {
  return posts.map((post) => projectSummary({
    ...post,
    bodyHashValid: post.reviewedContentHash
      ? hashEditorialContent(post.body) === post.reviewedContentHash
      : true,
  }));
}

function assertCanonicalPreviewInventory(
  count: number,
  opts?: { limit?: number; category?: string; featured?: boolean },
): void {
  if (opts?.limit || opts?.category || opts?.featured) return;
  const environment = (process.env.VERCEL_ENV ?? process.env.APP_ENV ?? '').toLowerCase();
  if (environment !== 'preview' && environment !== 'staging') return;
  const expected = Number.parseInt(process.env.SEO_PREVIEW_BLOG_EXPECTED_MIN ?? '135', 10);
  if (!Number.isFinite(expected) || expected < 1) {
    throw new Error('[blog-source] SEO_PREVIEW_BLOG_EXPECTED_MIN debe ser un entero positivo.');
  }
  if (count < expected) {
    throw new Error(
      `[blog-source] Inventario Preview truncado: ${count}/${expected}. `
      + 'No se permite fallback silencioso.',
    );
  }
}

/**
 * Capa de acceso a `blog_posts`.
 *
 * Todas las funciones son resilientes en build-time pero lanzan excepciones en runtime
 * si la base de datos no está disponible o falla, de modo que el frontend pueda
 * capturar el error y mostrar una página de error explícita al usuario (app/error.tsx).
 */
export async function getPublishedPostSummaries(
  opts?: { limit?: number; category?: string; featured?: boolean },
) {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return filterSnapshotPosts(snapshotSummaryRows(getLimitedTestBlogFixtures()), opts);
  }
  if (mode === 'full-public-snapshot') {
    const rows = filterSnapshotPosts(snapshotSummaryRows(getFullPublicBlogSnapshot()), opts);
    assertCanonicalPreviewInventory(rows.length, opts);
    return rows;
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return [];
  }
  try {
    const conditions = [eq(blogPosts.published, true)];
    if (opts?.category) conditions.push(eq(blogPosts.category, opts.category));
    if (opts?.featured) conditions.push(eq(blogPosts.featured, true));

    const query = db.select(publicBlogPostSummarySelection).from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));

    if (opts?.limit) query.limit(opts.limit);

    const rows = await query;
    assertCanonicalPreviewInventory(rows.length, opts);
    return rows.map(projectSummary);
  } catch (err) {
    console.error('[blog-db] getPublishedPostSummaries falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getPublishedPostSummaries');
    }
    return [];
  }
}

export async function getPublishedPostParams() {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return getLimitedTestBlogFixtures().map(({ slug, category }) => ({ slug, category }));
  }
  if (mode === 'full-public-snapshot') {
    const rows = getFullPublicBlogSnapshot().map(({ slug, category }) => ({ slug, category }));
    assertCanonicalPreviewInventory(rows.length);
    return rows;
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return [];
  }
  const rows = await db.select(publicBlogPostParamsSelection)
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));
  assertCanonicalPreviewInventory(rows.length);
  return rows;
}

export async function getPublishedPostRouteBySlug(slug: string) {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    const post = getLimitedTestBlogFixtures().find((fixture) => fixture.slug === slug);
    return post ? { slug: post.slug, category: post.category } : null;
  }
  if (mode === 'full-public-snapshot') {
    const post = getFullPublicBlogSnapshot().find((fixture) => fixture.slug === slug);
    return post ? { slug: post.slug, category: post.category } : null;
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return null;
  }
  const [row] = await db.select(publicBlogPostParamsSelection)
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);
  return row ?? null;
}

const attributionSelection = {
  slug: blogPosts.slug,
  title: blogPosts.title,
  category: blogPosts.category,
  publishedAt: blogPosts.publishedAt,
  author: blogPosts.author,
  published: blogPosts.published,
  noindex: blogPosts.noindex,
  reviewStatus: blogPosts.reviewStatus,
  reviewedBy: blogPosts.reviewedBy,
  reviewOrigin: blogPosts.reviewOrigin,
  signatureType: blogPosts.signatureType,
  signatureName: blogPosts.signatureName,
  signatureCandidate: blogPosts.signatureCandidate,
  signatureValid: blogPosts.signatureValid,
  hashValid: sql<boolean>`encode(sha256(convert_to(${blogPosts.body}, 'UTF8')), 'hex') = ${blogPosts.reviewedContentHash}`,
} as const;

function snapshotAttributionRows(
  posts: ReturnType<typeof getFullPublicBlogSnapshot>,
): ArticleAttributionRow[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    publishedAt: post.publishedAt,
    author: post.author,
    published: post.published,
    noindex: post.noindex,
    reviewStatus: post.reviewStatus,
    reviewedBy: post.reviewedBy,
    reviewOrigin: post.reviewOrigin,
    signatureType: post.signatureType,
    signatureName: post.signatureName,
    signatureCandidate: post.signatureCandidate,
    signatureValid: post.signatureValid,
    hashValid: post.reviewedContentHash
      ? hashEditorialContent(post.body) === post.reviewedContentHash
      : editorialSignatureSchemaMode() === 'LEGACY_INSTITUTIONAL_MODE',
    redirected: false,
  }));
}

/** Proyección pública ligera para perfiles. Nunca devuelve body ni notas. */
export async function getPublishedArticleAttributionMetadata() {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return snapshotAttributionRows(getLimitedTestBlogFixtures())
      .map((row) => projectPublicAttribution(row, editorialSignatureSchemaMode()));
  }
  if (mode === 'full-public-snapshot') {
    const posts = getFullPublicBlogSnapshot();
    assertCanonicalPreviewInventory(posts.length);
    return snapshotAttributionRows(posts)
      .map((row) => projectPublicAttribution(row, editorialSignatureSchemaMode()));
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return [];
  }
  const rows = await db.select(attributionSelection)
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));
  assertCanonicalPreviewInventory(rows.length);
  return rows.map((row) => projectPublicAttribution(
    { ...row, redirected: false },
    editorialSignatureSchemaMode(),
  ));
}

export async function getPublishedPostDetailBySlug(slug: string) {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return getLimitedTestBlogFixtures().find((fixture) => fixture.slug === slug) ?? null;
  }
  if (mode === 'full-public-snapshot') {
    return getFullPublicBlogSnapshot().find((fixture) => fixture.slug === slug) ?? null;
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return null;
  }
  try {
    const [post] = await db.select(publicBlogPostDetailSelection).from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
    return post ?? null;
  } catch (err) {
    console.error('[blog-db] getPublishedPostDetailBySlug falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getPublishedPostDetailBySlug');
    }
    return null;
  }
}

export async function getBlogCategories() {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return [...new Set(getLimitedTestBlogFixtures().map((fixture) => fixture.category))].sort();
  }
  if (mode === 'full-public-snapshot') {
    return [...new Set(getFullPublicBlogSnapshot().map((fixture) => fixture.category))].sort();
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return [];
  }
  try {
    const rows = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.category);
    return rows.map(r => r.category);
  } catch (err) {
    console.error('[blog-db] getBlogCategories falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getBlogCategories');
    }
    return [];
  }
}
