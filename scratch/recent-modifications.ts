import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  // Buscar posts modificados hoy
  const posts = await sql`
    SELECT id, slug, title, review_status, updated_at, creado_en
    FROM blog_posts
    WHERE updated_at >= '2026-07-05T00:00:00.000Z'::timestamp OR creado_en >= '2026-07-05T00:00:00.000Z'::timestamp
    ORDER BY updated_at DESC
  `;
  console.log('Posts modificados hoy:');
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);
