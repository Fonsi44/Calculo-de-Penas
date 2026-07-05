import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  // Obtener todos los posts de la DB
  const posts = await sql`
    SELECT id, slug, title, review_status, published_at, creado_en 
    FROM blog_posts 
    ORDER BY creado_en ASC
  `;

  // Leer checkpoint
  const checkpointPath = path.join(process.cwd(), 'data', 'corregir-checkpoint.json');
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  const procesados = new Set(checkpoint.procesados);

  const noProcesados = posts.filter(p => !procesados.has(p.slug));
  
  console.log(`Total DB: ${posts.length}`);
  console.log(`Total checkpoint: ${procesados.size}`);
  console.log(`Total no procesados: ${noProcesados.length}`);
  console.log('Posts no procesados (los 25 primeros):');
  console.log(JSON.stringify(noProcesados, null, 2));
}

main().catch(console.error);
