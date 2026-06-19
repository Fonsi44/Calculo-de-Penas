import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const posts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    coverImage: blogPosts.coverImage,
  }).from(blogPosts).where(eq(blogPosts.published, true));

  let updated = 0;
  let skipped = 0;

  for (const p of posts) {
    if (p.coverImage) { skipped++; continue; }
    const imgPath = `/images/blog/${p.slug}.webp`;
    await db.update(blogPosts)
      .set({ coverImage: imgPath, updatedAt: new Date() })
      .where(eq(blogPosts.id, p.id));
    updated++;
  }

  console.log(`Posts totales: ${posts.length}`);
  console.log(`Ya tenían imagen: ${skipped}`);
  console.log(`Actualizados con coverImage: ${updated}`);
}

main().catch(console.error);
