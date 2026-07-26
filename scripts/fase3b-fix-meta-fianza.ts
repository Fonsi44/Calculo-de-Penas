/**
 * Fase 3B — Corrección SEO puntual de meta_description de fianza-medidas-cautelares.
 *
 * La meta description contenía el error "Código Procesal Penal (Decreto 130-201..."
 * (que es el Código Penal, no el Procesal). Se corrige al decreto correcto (9-99-E)
 * para coherencia con el body ya corregido.
 *
 * Solo modifica meta_description. No toca body ni ai_review_status.
 *
 * Uso: npx tsx scripts/fase3b-fix-meta-fianza.ts --dry-run | --aplicar
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

config({ path: path.resolve('.env.local'), override: true });

const SLUG = 'fianza-medidas-cautelares-proceso-penal-honduras';
const BUSCAR = 'Código Procesal Penal (Decreto 130-2017)';
const REEMPLAZAR = 'Código Procesal Penal (Decreto 9-99-E)';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const aplicar = process.argv.includes('--aplicar');
  if (!dryRun && !aplicar) {
    console.error('Usa --dry-run o --aplicar');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  const sql = neon(process.env.DATABASE_URL);
  const [post] = (await sql`
    SELECT meta_description FROM blog_posts WHERE slug = ${SLUG}
  `) as Array<{ meta_description: string | null }>;
  if (!post) {
    console.error('Post no encontrado');
    process.exit(1);
  }
  const actual = post.meta_description || '';
  console.log(`Meta actual: ${actual}`);
  if (!actual.includes(BUSCAR)) {
    console.log('No contiene el patrón a corregir. Nada que hacer.');
    return;
  }
  const nueva = actual.replace(BUSCAR, REEMPLAZAR);
  console.log(`Meta nueva:   ${nueva}`);
  if (aplicar) {
    await sql`
      UPDATE blog_posts SET meta_description = ${nueva}, updated_at = NOW()
      WHERE slug = ${SLUG}
    `;
    console.log('✅ Meta description actualizada.');
  } else {
    console.log('(DRY-RUN: no se modificó la DB)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
