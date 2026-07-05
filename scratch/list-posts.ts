import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    SELECT id, slug, title, review_status, creado_en 
    FROM blog_posts 
    ORDER BY creado_en DESC 
    LIMIT 20
  `;
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);
