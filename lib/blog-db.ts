import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

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

/**
 * Capa de acceso a `blog_posts`.
 *
 * Todas las funciones son resilientes en build-time pero lanzan excepciones en runtime
 * si la base de datos no está disponible o falla, de modo que el frontend pueda
 * capturar el error y mostrar una página de error explícita al usuario (app/error.tsx).
 */
export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
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

    return await query;
  } catch (err) {
    console.error('[blog-db] getPublishedPosts falló.', err);
    if (shouldThrowOnDbError()) {
      throw new Error('Error al conectar con la base de datos en getPublishedPosts');
    }
    return [];
  }
}

export async function getPostBySlug(slug: string) {
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
