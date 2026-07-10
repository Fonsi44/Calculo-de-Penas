import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const dumpPath = path.join(__dirname, 'target_posts.json');
  const posts = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  console.log("Restaurando DB...");
  for (const post of posts) {
    await db.update(blogPosts)
      .set({
        body: post.body,
        metaDescription: post.metaDescription
      })
      .where(eq(blogPosts.slug, post.slug));
    console.log(`Restaurado: ${post.slug}`);
  }
  console.log("Restauración completa.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
