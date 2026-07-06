import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  const postId = process.argv[2];
  if (!postId) {
    console.error('Please provide a post ID');
    process.exit(1);
  }

  const posts = await db.select().from(blogPosts).where(eq(blogPosts.id, postId));
  
  if (posts.length === 0) {
    console.error('Post not found');
    process.exit(1);
  }

  const post = posts[0];
  const outPath = `C:/Users/Admin/.gemini/antigravity/brain/db2c14cb-5f3b-4e05-8ba3-5a5918fa3125/scratch/${postId}.json`;
  
  fs.writeFileSync(outPath, JSON.stringify(post, null, 2));
  console.log(`Saved post to ${outPath}`);
  process.exit(0);
}

main().catch(console.error);
