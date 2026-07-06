import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

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
  console.log(JSON.stringify(post, null, 2));
  process.exit(0);
}

main().catch(console.error);
