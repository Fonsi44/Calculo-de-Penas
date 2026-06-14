import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

function isDbError(err: unknown): boolean {
  return err instanceof Error && (err.message?.includes('connect') || err.message?.includes('fetch failed') || err.message?.includes('ECONNREFUSED'));
}

export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
  try {
    const conditions = [eq(blogPosts.published, true)];
    if (opts?.category) conditions.push(eq(blogPosts.category, opts.category));
    if (opts?.featured) conditions.push(eq(blogPosts.featured, true));

    const query = db.select().from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));

    if (opts?.limit) query.limit(opts.limit);

    return query;
  } catch (err) {
    if (isDbError(err)) return [];
    throw err;
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const [post] = await db.select().from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
    return post ?? null;
  } catch (err) {
    if (isDbError(err)) return null;
    throw err;
  }
}

export async function getBlogCategories() {
  try {
    const rows = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.category);
    return rows.map(r => r.category);
  } catch (err) {
    if (isDbError(err)) return [];
    throw err;
  }
}

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  try {
    return db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.category, category),
        sql`${blogPosts.slug} != ${slug}`,
      ))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  } catch (err) {
    if (isDbError(err)) return [];
    throw err;
  }
}
