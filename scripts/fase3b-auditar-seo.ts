/**
 * Fase 3B — Auditoría SEO/GEO de solo lectura del Lote 1.
 * No modifica nada. Extrae metadatos, descripción, canonical, etc.
 * Uso: npx tsx scripts/fase3b-auditar-seo.ts
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

const SLUGS = [
  'abogado-penalista-choluteca',
  'abogado-penalista-sur-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'antejuicio-en-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'cuando-necesito-abogado-penalista-honduras',
  'cuando-prescribe-delito-en-honduras',
  'defensa-penal-honduras',
  'defensa-penal-menores-edad-honduras',
  'delitos-mas-comunes-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'diferencia-denuncia-querella-acusacion-honduras',
  'estafas-fraudes-tipos-penales-honduras',
  'fianza-medidas-cautelares-proceso-penal-honduras',
  'violencia-domestica-ruta-legal-honduras',
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql`
    SELECT slug, title, description, meta_title, meta_description,
           canonical_url, noindex, category, updated_at, published_at, author
    FROM blog_posts
    WHERE slug = ANY(${SLUGS})
    ORDER BY slug
  `) as any[];

  console.log('=== AUDITORÍA SEO/GEO LOTE 1 ===\n');
  for (const r of rows) {
    const titleLen = (r.meta_title || r.title || '').length;
    const descLen = (r.meta_description || r.description || '').length;
    const flags: string[] = [];
    if (titleLen < 30 || titleLen > 60) flags.push(`title ${titleLen}c (30-60 ideal)`);
    if (descLen < 120 || descLen > 160) flags.push(`desc ${descLen}c (120-160 ideal)`);
    if (r.noindex) flags.push('NOINDEX');
    if (!r.canonical_url) flags.push('sin canonical');

    console.log(`${r.slug}`);
    console.log(`  title(${titleLen}): ${(r.meta_title || r.title || '').substring(0, 80)}`);
    console.log(`  desc(${descLen}):  ${(r.meta_description || r.description || '').substring(0, 100)}`);
    console.log(`  canonical: ${r.canonical_url || '(default)'}`);
    console.log(`  cat: ${r.category} | autor: ${r.author} | updated: ${r.updated_at}`);
    console.log(`  flags: ${flags.length ? flags.join(', ') : 'OK'}`);
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
