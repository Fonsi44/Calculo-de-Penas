import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

async function main() {
  const rows = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    coverImage: blogPosts.coverImage,
    bodyLen: sql<number>`length(${blogPosts.body})`.mapWith(Number),
  }).from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));

  const noCover = rows.filter(r => !r.coverImage && Number(r.bodyLen) > 1500);
  const longTitles = rows.filter(r => r.title.length > 100);
  const thin = rows.filter(r => { const l = Number(r.bodyLen); return l >= 400 && l < 1500; });

  console.log(`Sin cover image: ${noCover.length}`);
  for (const r of noCover) console.log(`  ${r.slug.padEnd(50)} (${r.bodyLen}c)`);

  console.log(`\nTitulos >100c: ${longTitles.length}`);
  for (const r of longTitles) console.log(`  ${r.slug.padEnd(50)} ${r.title.length}c: ${r.title.substring(0, 80)}`);

  console.log(`\nThin content (400-1500c): ${thin.length}`);
  for (const r of thin) console.log(`  ${r.slug.padEnd(50)} ${r.bodyLen}c`);
}

main().catch(console.error);
