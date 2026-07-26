/**
 * Fase 3 — Exportar Lote Penal
 *
 * Exporta los 15 artículos del lote 1 penal desde la DB.
 * Usado como entrada para la Capa A (Google Search) y Capa B (DeepSeek).
 *
 * Uso: npx tsx scripts/fase3-exportar-lote.ts
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
} else {
  config();
}

const SLUGS_LOTE1 = [
  'delitos-mas-comunes-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'diferencia-denuncia-querella-acusacion-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'antejuicio-en-honduras',
  'abogado-penalista-sur-honduras',
  'defensa-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-menores-edad-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'abogado-penalista-choluteca',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const posts = await sql`
    SELECT id, slug, title, body, description, category, tags,
           published, published_at, updated_at, creado_en,
           meta_title, meta_description, author, canonical_url,
           ai_review_status
    FROM blog_posts
    WHERE slug = ANY(${SLUGS_LOTE1})
    ORDER BY slug
  `;

  const outputPath = path.resolve(process.cwd(), 'data/lote-penal-1.json');
  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));

  console.log(`${posts.length} artículos exportados a ${outputPath}`);
  for (const p of posts as any[]) {
    console.log(`  ${p.slug} (${(p.body || '').length} bytes, status=${p.ai_review_status})`);
  }
}

main().catch(console.error);
