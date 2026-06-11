import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function getPublishedPosts(opts?: { limit?: number; category?: string; featured?: boolean }) {
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
  const [post] = await db.select().from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
  return post ?? null;
}

export async function getBlogCategories() {
  const rows = await db.selectDistinct({ category: blogPosts.category })
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(blogPosts.category);
  return rows.map(r => r.category);
}

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  return db.select().from(blogPosts)
    .where(and(
      eq(blogPosts.published, true),
      eq(blogPosts.category, category),
      sql`${blogPosts.slug} != ${slug}`,
    ))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit);
}
