import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Fetching all blog posts...");
  const posts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    title: blogPosts.title,
    category: blogPosts.category,
    published: blogPosts.published
  }).from(blogPosts);

  console.log(`Found ${posts.length} posts.`);
  
  const outputPath = path.join(__dirname, 'blog_posts_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`Saved to ${outputPath}`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
