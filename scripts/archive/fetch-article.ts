import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

const sqlConn = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConn);

async function main() {
  const slug = process.argv[2] || 'mediacion-vs-juicio-cual-elegir';
  const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (post.length > 0) {
    console.log("--- TITLE ---");
    console.log(post[0].title);
    console.log("--- BODY ---");
    console.log(post[0].body);
  } else {
    console.log("NOT FOUND");
  }
}

main().catch(console.error);
