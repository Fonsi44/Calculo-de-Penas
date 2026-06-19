/**
 * Resuelve canibalización entre posts que compiten por la misma intención de
 * búsqueda en Google. Detectada exhaustivamente en scripts/audit-canibalizacion.ts.
 *
 * Solo se intervienen pares de URLs validados manualmente: el post "débil"
 * (menos contenido, menos autoridad) canonicaliza hacia el post "fuerte"
 * (más completo, canonical natural) o hacia la landing dedicada.
 * Los posts no se eliminan ni noindexan: solo consolidan autoridad.
 *
 * USO:
 *   npx tsx scripts/fix-canonical-canibalizacion.ts            # dry-run
 *   npx tsx scripts/fix-canonical-canibalizacion.ts --apply     # aplicar
 *
 * REVERSIBLE: setear canonical_url = NULL en cada post lo revierte.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const apply = process.argv.includes('--apply');

// (slug del post débil, categoría, canonical destino)
const CANONICAL_MAP: Array<[string, string, string]> = [
  // Fase 3c: landings locales (la landing es canónica: tiene schema LegalService + NAP)
  ['abogados-en-nacaome', 'practica-legal', '/abogados-en-nacaome'],
  ['abogados-en-choluteca', 'practica-legal', '/abogados-en-choluteca'],
  ['abogados-en-san-lorenzo', 'practica-legal', '/abogados-en-san-lorenzo'],
  // Fase 3d: divorcio-honduras (guía-completa es la más completa: 1200 vs 1125 palabras)
  ['divorcio-honduras-pasos-requisitos', 'derecho-de-familia', '/blog/derecho-de-familia/divorcio-honduras-guia-completa'],
  // Fase 3d: pensión-alimenticia-honduras (guía-completa es la más completa: 1154 vs 699 palabras)
  ['pension-alimenticia-honduras-como-solicitarla', 'derecho-de-familia', '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa'],
];

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(` Fix canibalización (5 pares de URLs)`);
  console.log(` Modo: ${apply ? 'APLICAR' : 'DRY-RUN (no escribe)'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  let changed = 0;
  let skipped = 0;

  for (const [slug, category, canonical] of CANONICAL_MAP) {
    const rows = await sql`
      SELECT id, slug, category, canonical_url, published
      FROM blog_posts
      WHERE slug = ${slug} AND category = ${category}
    `;

    if (rows.length === 0) {
      console.log(`  ⚠ ${category}/${slug}: NO ENCONTRADO en DB`);
      skipped++;
      continue;
    }

    const post = rows[0];
    if (post.canonical_url === canonical) {
      console.log(`  ✓ ${slug}: ya tiene canonical=${canonical} (sin cambios)`);
      skipped++;
      continue;
    }

    console.log(`  → ${slug}: ${post.canonical_url || '(vacío)'} → ${canonical}`);

    if (apply) {
      await sql`
        UPDATE blog_posts
        SET canonical_url = ${canonical}, updated_at = NOW()
        WHERE id = ${post.id}
      `;
    }
    changed++;
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(` ${apply ? 'Aplicado' : 'Dry-run'}: ${changed} posts ${apply ? 'actualizados' : 'a actualizar'}, ${skipped} sin cambios.`);
  if (!apply && changed > 0) {
    console.log(`\nPara aplicar: npx tsx scripts/fix-canonical-canibalizacion.ts --apply`);
  }
  if (apply && changed > 0) {
    console.log(`\n✓ Canonicals seteados. Verificar en sitemap/blog tras próximo deploy.`);
  }
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
