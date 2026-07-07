/**
 * Corrige placeholders editoriales sin reemplazar en blog_posts.title y
 * blog_posts.meta_title.
 *
 * Uso:
 *   npx tsx scripts/fix-editorial-placeholders.ts             # dry-run
 *   npx tsx scripts/fix-editorial-placeholders.ts --aplicar    # aplica en DB
 *
 * QUÉ HACE:
 *   Detecta sufijos de placeholder como "| [Tu Empresa]" que quedaron sin
 *   reemplazar en el pipeline editorial y los elimina. El title/meta_title del
 *   post se renderiza vía `stripDuplicateBrand(title) | ${site.name}`, así que
 *   cualquier sufijo de marca redundante o placeholder se duplica o contamina
 *   el <title> de la página.
 *
 *   Reglas de limpieza (idempotentes):
 *     - Elimina sufijos `| [Tu Empresa]`, `| Tu Empresa`, `[Tu Empresa]` y
 *       variantes de mayúsculas al final del title/meta_title.
 *     - Normaliza espacios sobrantes y separadores colgantes (`|`, `-` al final).
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: sin --aplicar no escribe en DB.
 *   - Idempotente: una vez limpio, el valor no vuelve a matchear.
 *   - Requiere backup previo (verifica <2h como fix-internal-redirects).
 *   - No inventa contenido: solo elimina placeholders obvios. No reescribe
 *     texto jurídico ni acorta titles por longitud (eso requiere CSV de Ahrefs).
 *
 * DECISIONES (R4/R13): no inventar datos, no reescribir contenido editorial.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Placeholders editoriales conocidos (regex, anclados al final del string).
// Cubren "| [Tu Empresa]", "| Tu Empresa", "[Tu Empresa]", variantes case.
const PLACEHOLDER_SUFFIX =
  /\s*[\|\-–—]?\s*\[?\s*tu\s+empresa\s*\]?\s*$/gi;

// Separador colgante que puede quedar tras limpiar el placeholder
// (ej: "...ARSA |" → "...ARSA"). Solo se aplica si hubo limpieza previa.
const TRAILING_SEPARATOR = /\s*[\|\-–—]\s*$/;

interface Cambio {
  slug: string;
  campo: 'title' | 'meta_title';
  de: string;
  a: string;
}

function limpiarPlaceholder(valor: string): string | null {
  if (!valor) return null;
  // ¿Contiene el placeholder?
  if (!/tu\s+empresa/i.test(valor)) return null;
  let limpio = valor.replace(PLACEHOLDER_SUFFIX, '').trim();
  // Si el placeholder estaba en medio (no al final), no lo tocamos (caso raro,
  // requeriría decisión editorial). Solo limpiamos sufijos.
  if (limpio === valor.trim()) return null;
  // Elimina separador colgante que pueda haber quedado.
  limpio = limpio.replace(TRAILING_SEPARATOR, '').trim();
  if (!limpio) return null; // no dejar vacío
  return limpio;
}

function checkRecentBackup(): boolean {
  const dir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir).filter(
    (f) => f.startsWith('backup-') && f.endsWith('.json'),
  );
  if (files.length === 0) return false;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const f of files) {
    const stat = fs.statSync(path.join(dir, f));
    if (stat.mtimeMs > twoHoursAgo) return true;
  }
  return false;
}

async function main() {
  const aplicar = process.argv.includes('--aplicar');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DATABASE_URL.');
    process.exit(1);
  }

  if (aplicar && !checkRecentBackup()) {
    console.log('❌ ABORTADO: no hay backup reciente (<2h). Ejecuta primero:');
    console.log('   npx tsx scripts/backup-blog.ts');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const posts = await sql`
    SELECT id, slug, title, meta_title, published
    FROM blog_posts
    ORDER BY creado_en ASC
  `;

  let postsModificados = 0;
  let postsBorradorModificados = 0;
  const cambios: Cambio[] = [];

  for (const p of posts) {
    let newTitle: string | null = null;
    let newMetaTitle: string | null = null;

    const limpioTitle = limpiarPlaceholder(p.title ?? '');
    if (limpioTitle) newTitle = limpioTitle;
    const limpioMeta = limpiarPlaceholder(p.meta_title ?? '');
    if (limpioMeta) newMetaTitle = limpioMeta;

    if (!newTitle && !newMetaTitle) continue;

    postsModificados++;
    if (!p.published) postsBorradorModificados++;
    if (newTitle) cambios.push({ slug: p.slug, campo: 'title', de: p.title, a: newTitle });
    if (newMetaTitle) cambios.push({ slug: p.slug, campo: 'meta_title', de: p.meta_title, a: newMetaTitle });

    if (aplicar) {
      if (newTitle && newMetaTitle) {
        await sql`
          UPDATE blog_posts
          SET title = ${newTitle}, meta_title = ${newMetaTitle}
          WHERE id = ${p.id}
        `;
      } else if (newTitle) {
        await sql`
          UPDATE blog_posts SET title = ${newTitle} WHERE id = ${p.id}
        `;
      } else if (newMetaTitle) {
        await sql`
          UPDATE blog_posts SET meta_title = ${newMetaTitle} WHERE id = ${p.id}
        `;
      }
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN DE PLACEHOLDERS EDITORIALES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Modo:              ${aplicar ? 'APLICAR (escritura DB)' : 'DRY-RUN (solo lectura)'}`);
  console.log(`Posts analizados: ${posts.length}`);
  console.log(`Posts modificados: ${postsModificados} (${postsBorradorModificados} borradores)`);
  console.log(`Campos corregidos: ${cambios.length}`);
  console.log('');

  if (cambios.length > 0) {
    console.log('── Detalle de cambios ──');
    for (const c of cambios) {
      console.log(`  ${c.slug} [${c.campo}]:`);
      console.log(`    DE: ${c.de}`);
      console.log(`    A:  ${c.a}`);
    }
  }

  if (!aplicar && cambios.length > 0) {
    console.log('');
    console.log('💡 Para aplicar estos cambios, ejecuta:');
    console.log('   1. npx tsx scripts/backup-blog.ts         (backup previo)');
    console.log('   2. npx tsx scripts/fix-editorial-placeholders.ts --aplicar');
  }
  if (aplicar && cambios.length > 0) {
    console.log('');
    console.log('✅ Cambios aplicados. Verifica con:');
    console.log('   npm run seo:ahrefs');
  }
  if (cambios.length === 0) {
    console.log('✅ Sin placeholders editoriales pendientes.');
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
