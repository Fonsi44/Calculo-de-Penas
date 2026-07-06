import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
async function main() {
  const p = await db.select().from(blogPosts).where(eq(blogPosts.id, "1db443d3-3023-42ec-ab05-2571f9da18c0"));
  console.log(p[0].body);
  process.exit(0);
}
main().catch(console.error);
