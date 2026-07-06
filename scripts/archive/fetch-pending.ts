import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, ne } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

const sqlConn = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConn);

async function main() {
  const posts = await db.select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title }).from(blogPosts).where(ne(blogPosts.reviewStatus, 'reviewed'));
  
  fs.writeFileSync('pending_posts.json', JSON.stringify(posts, null, 2));
  console.log(`Found ${posts.length} pending posts.`);
}

main().catch(console.error);
