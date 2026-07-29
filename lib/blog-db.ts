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

/**
 * Contrato de lectura del blog público.
 *
 * El frontend no debe depender de columnas operativas del pipeline interno de
 * revisión IA. Mantener una proyección explícita evita que una rama Preview
 * con ese workflow pendiente de migración rompa todas las páginas públicas.
 * Las columnas legales/editoriales sí forman parte del contrato de publicación.
 */
const publicBlogPostSelection = {
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
  legalReviewNotes: blogPosts.legalReviewNotes,
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

function filterSnapshotPosts(
  posts: ReturnType<typeof getLimitedTestBlogFixtures>,
  opts?: { limit?: number; category?: string; featured?: boolean },
) {
  let filtered = posts;
  if (opts?.category) filtered = filtered.filter((post) => post.category === opts.category);
  if (opts?.featured) filtered = filtered.filter((post) => post.featured);
  return opts?.limit ? filtered.slice(0, opts.limit) : filtered;
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
export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return filterSnapshotPosts(getLimitedTestBlogFixtures(), opts);
  }
  if (mode === 'full-public-snapshot') {
    const rows = filterSnapshotPosts(getFullPublicBlogSnapshot(), opts);
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

    const query = db.select(publicBlogPostSelection).from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));

    if (opts?.limit) query.limit(opts.limit);

    const rows = await query;
    assertCanonicalPreviewInventory(rows.length, opts);
    return rows;
  } catch (err) {
    console.error('[blog-db] getPublishedPosts falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getPublishedPosts');
    }
    return [];
  }
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

export async function getPostBySlug(slug: string) {
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
    const [post] = await db.select(publicBlogPostSelection).from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
    return post ?? null;
  } catch (err) {
    console.error('[blog-db] getPostBySlug falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getPostBySlug');
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

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  const mode = resolvePreviewBlogDataMode();
  if (mode === 'limited-test-fixtures') {
    return getLimitedTestBlogFixtures()
      .filter((fixture) => fixture.slug !== slug && fixture.category === category)
      .slice(0, limit);
  }
  if (mode === 'full-public-snapshot') {
    return getFullPublicBlogSnapshot()
      .filter((fixture) => fixture.slug !== slug && fixture.category === category)
      .slice(0, limit);
  }
  if (!isDbReachable() || process.env.TEST_SIMULATE_DB_DOWN === 'true') {
    if (shouldThrowOnDbError()) {
      throw new Error('[blog-db] DATABASE_URL no configurada en runtime.');
    }
    return [];
  }
  try {
    return await db.select(publicBlogPostSelection).from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.category, category),
        sql`${blogPosts.slug} != ${slug}`,
      ))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  } catch (err) {
    console.error('[blog-db] getRelatedPosts falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getRelatedPosts');
    }
    return [];
  }
}
