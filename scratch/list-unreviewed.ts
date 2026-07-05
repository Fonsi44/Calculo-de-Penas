import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    SELECT id, slug, title, review_status, published
    FROM blog_posts 
    WHERE published = true AND (review_status IS NULL OR review_status != 'reviewed')
    ORDER BY creado_en ASC
  `;
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);
