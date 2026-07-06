import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT id, slug, title, body FROM blog_posts WHERE review_status != 'reviewed' OR review_status IS NULL ORDER BY published_at ASC LIMIT 1`;
  console.log(JSON.stringify(result[0], null, 2));
}

main().catch(console.error);
