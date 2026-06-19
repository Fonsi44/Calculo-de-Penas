/**
 * Resuelve la canibalización entre landings locales y posts de practica-legal.
 *
 * PROBLEMA (docs/indexacion-plan-decision.md §7):
 *   Hay 3 pares de URLs que compiten por la MISMA intención de búsqueda
 *   "abogados en {ciudad}":
 *     - Landing /abogados-en-nacaome      vs /blog/practica-legal/abogados-en-nacaome
 *     - Landing /abogados-en-choluteca    vs /blog/practica-legal/abogados-en-choluteca
 *     - Landing /abogados-en-san-lorenzo  vs /blog/practica-legal/abogados-en-san-lorenzo
 *
 *   Google ve dos URLs con intención idéntica y, sin canonical, elige una
 *   arbitrariamente (o no indexa ninguna). La landing es la versión canónica
 *   correcta: tiene schema LegalService, NAP completo, mejor diseño y es la
 *   URL promocionada en header/footer.
 *
 * SOLUCIÓN:
 *   Setear canonical_url en los 3 posts apuntando a la landing. El page
 *   /blog/[categoria]/[slug]/page.tsx ya respeta post.canonicalUrl (línea 37).
 *
 *   Los posts de ciudades SATÉLITE (amapala, pespire, marcovia, san-marcos)
 *   NO se tocan: no tienen landing dedicada, son posts legítimos.
 *
 * USO:
 *   npx tsx scripts/fix-canonical-canibalizacion.ts            # dry-run
 *   npx tsx scripts/fix-canonical-canibilizacion.ts --apply     # aplicar
 *
 * TRAZABILIDAD:
 *   Este script es idempotente y reversible (setear canonical_url = NULL
 *   revierte). El cambio NO elimina los posts ni los marca noindex: siguen
 *   accesibles, solo consolidan autoridad en la landing.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const apply = process.argv.includes('--apply');

// (slug del post, canonical destino)
const CANONICAL_MAP: Array<[string, string]> = [
  ['abogados-en-nacaome', '/abogados-en-nacaome'],
  ['abogados-en-choluteca', '/abogados-en-choluteca'],
  ['abogados-en-san-lorenzo', '/abogados-en-san-lorenzo'],
];

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(` Fix canibalización landings vs posts practica-legal`);
  console.log(` Modo: ${apply ? 'APLICAR' : 'DRY-RUN (no escribe)'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  let changed = 0;
  let skipped = 0;

  for (const [slug, canonical] of CANONICAL_MAP) {
    // Verificar estado actual
    const rows = await sql`
      SELECT id, slug, category, canonical_url, published
      FROM blog_posts
      WHERE slug = ${slug} AND category = 'practica-legal'
    `;

    if (rows.length === 0) {
      console.log(`  ⚠ ${slug}: NO ENCONTRADO en DB (categoría practica-legal)`);
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
      changed++;
    } else {
      changed++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(` ${apply ? 'Aplicado' : 'Dry-run'}: ${changed} posts ${apply ? 'actualizados' : 'a actualizar'}, ${skipped} sin cambios.`);
  if (!apply && changed > 0) {
    console.log(`\nPara aplicar: npx tsx scripts/fix-canonical-canibalizacion.ts --apply`);
  }
  if (apply && changed > 0) {
    console.log(`\n✓ Canonicals seteados. Las landings ahora consolidan la autoridad.`);
    console.log(`  Verificar con: curl -s https://www.pinedayasociadoshn.com/blog/practica-legal/abogados-en-nacaome | grep canonical`);
  }
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
