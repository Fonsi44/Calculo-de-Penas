import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const IS_DB_REACHABLE = Boolean(
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && !process.env.DATABASE_URL.includes('localhost:5432/placeholder'),
);

function dbFallback<T extends unknown[] | Record<string, unknown> | null>(fallback: T): T {
  return fallback;
}

export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
  if (!IS_DB_REACHABLE) return [];
  const conditions = [eq(blogPosts.published, true)];
  if (opts?.category) conditions.push(eq(blogPosts.category, opts.category));
  if (opts?.featured) conditions.push(eq(blogPosts.featured, true));

  const query = db.select().from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt));

  if (opts?.limit) query.limit(opts.limit);

  return query;
}

export async function getPostBySlug(slug: string) {
  if (!IS_DB_REACHABLE) return null;
  const [post] = await db.select().from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
  return post ?? null;
}

export async function getBlogCategories() {
  if (!IS_DB_REACHABLE) return [];
  const rows = await db.selectDistinct({ category: blogPosts.category })
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(blogPosts.category);
  return rows.map(r => r.category);
}

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  if (!IS_DB_REACHABLE) return [];
  return db.select().from(blogPosts)
    .where(and(
      eq(blogPosts.published, true),
      eq(blogPosts.category, category),
      sql`${blogPosts.slug} != ${slug}`,
    ))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit);
}
