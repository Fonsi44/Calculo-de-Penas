import 'dotenv/config';
import { db } from '../../lib/db';
import { blogPosts } from '../../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  try {
    const posts = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      body: blogPosts.body
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .limit(5)
    .offset(148);

    const outPath = 'C:/Users/Admin/.gemini/antigravity/brain/db2c14cb-5f3b-4e05-8ba3-5a5918fa3125/scratch/batch31.json';
    fs.writeFileSync(outPath, JSON.stringify(posts, null, 2));
    console.log(`Saved ${posts.length} posts to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
