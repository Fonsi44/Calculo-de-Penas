/**
 * Corrige meta descriptions demasiado largas en blog_posts.meta_description.
 *
 * Uso:
 *   npx tsx scripts/fix-long-metas.ts             # dry-run
 *   npx tsx scripts/fix-long-metas.ts --aplicar    # aplica en DB
 *
 * QUÉ HACE:
 *   El CSV `meta-descripti` de Ahrefs reporta 15 posts con metas de 162–202
 *   caracteres. Recorta a ≤155 en límite de palabra (sin cortar palabras) y
 *   elimina sufijos de relleno comercial no verificables como policy global:
 *     - "Asesoría legal.", "Asesoría legal experta.", "Asesoría legal tributaria."
 *     - "Consulta legal."
 *     - "¡Infórmese y cumpla la ley!", "¡Evita multas!", "¡Proteja sus derechos!"
 *   También sanitiza HTML si la meta contiene tags (<strong>, <a>).
 *
 *   No reescribe contenido jurídico: solo recorta y limpia claims comerciales
 *   de cierre. El cuerpo descriptivo se conserva.
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: sin --aplicar no escribe en DB.
 *   - Idempotente: una vez recortada a ≤155 sin claims, no vuelve a matchear.
 *   - Requiere backup previo (verifica <2h como fix-internal-redirects).
 *   - No inventa contenido: solo recorta y elimina sufijos obvios.
 *
 * DECISIONES (R4/R13): no inventar datos, no claims comerciales no verificables.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Umbral: Ahrefs flaggea metas >160. Objetivo ≤155.
const META_MAX = 155;

// Sufijos de relleno comercial a eliminar (anclados al final, opcionales).
// No son claims verificables como política global del bufete.
const COMMERCIAL_SUFFIXES = [
  /\s*¡Infórmese y cumpla la ley!\s*\.?$/i,
  /\s*¡Evita multas!\s*\.?$/i,
  /\s*¡Evite multas!\s*\.?$/i,
  /\s*¡Proteja sus derechos!\s*\.?$/i,
  /\s*Asesoría legal experta\s*\.?$/i,
  /\s*Asesoría legal tributaria\s*\.?$/i,
  /\s*Asesoría legal especializada\s*\.?$/i,
  /\s*Asesoría legal\s*\.?$/i,
  /\s*Consulta legal\s*\.?$/i,
];

// Detecta HTML crudo en la meta.
const HTML_TAG_RE = /<[^>]+>/;

/** Sanitiza HTML básico (sin sanitize-html para mantener el script ligero). */
function stripHtmlBasic(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&oacute;/g, 'ó')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Recorta a ≤max en límite de palabra (sin cortar palabras). */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Si el corte cae en medio de una palabra y hay espacio cerca, corta ahí.
  if (lastSpace > max * 0.7) return cut.slice(0, lastSpace).trim();
  // Si no hay espacio útil, corta duro (mejor que palabra rota en SERP).
  return cut.trim();
}

interface Cambio {
  slug: string;
  de: string;
  a: string;
  deLen: number;
  aLen: number;
  motivo: string;
}

function procesarMeta(meta: string): { valor: string; motivo: string } | null {
  if (!meta) return null;
  let valor = meta;
  const motivos: string[] = [];

  // 1. Sanitizar HTML si lo hay.
  if (HTML_TAG_RE.test(valor)) {
    valor = stripHtmlBasic(valor);
    motivos.push('HTML sanitizado');
  }

  // 2. Eliminar sufijos comerciales.
  for (const re of COMMERCIAL_SUFFIXES) {
    const antes = valor;
    valor = valor.replace(re, '').trim();
    if (valor !== antes) {
      motivos.push('claim comercial eliminado');
      break; // un solo sufijo por pasada
    }
  }

  // 3. Recortar a ≤155 en límite de palabra.
  if (valor.length > META_MAX) {
    valor = truncateAtWord(valor, META_MAX);
    motivos.push(`recortado a ${valor.length}`);
  }

  // Normalizar espacios finales.
  valor = valor.replace(/\s+/g, ' ').trim();

  // ¿Hubo cambio real?
  if (valor === meta.trim()) return null;
  if (!valor) return null;
  return { valor, motivo: motivos.join('; ') || 'recortado' };
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
    SELECT id, slug, meta_description, published
    FROM blog_posts
    WHERE published = true
    ORDER BY slug ASC
  `;

  const cambios: Cambio[] = [];

  for (const p of posts) {
    const meta = p.meta_description ?? '';
    const resultado = procesarMeta(meta);
    if (!resultado) continue;

    cambios.push({
      slug: p.slug,
      de: meta,
      a: resultado.valor,
      deLen: meta.length,
      aLen: resultado.valor.length,
      motivo: resultado.motivo,
    });

    if (aplicar) {
      await sql`
        UPDATE blog_posts
        SET meta_description = ${resultado.valor}, updated_at = NOW()
        WHERE id = ${p.id}
      `;
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN DE META DESCRIPTIONS LARGAS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Modo:              ${aplicar ? 'APLICAR (escritura DB)' : 'DRY-RUN (solo lectura)'}`);
  console.log(`Posts analizados: ${posts.length}`);
  console.log(`Posts modificados: ${cambios.length}`);
  console.log('');

  if (cambios.length > 0) {
    console.log('── Detalle de cambios ──');
    for (const c of cambios) {
      console.log(`  ${c.slug} [${c.deLen}→${c.aLen}] (${c.motivo}):`);
      console.log(`    DE: ${c.de}`);
      console.log(`    A:  ${c.a}`);
    }
  }

  if (!aplicar && cambios.length > 0) {
    console.log('');
    console.log('💡 Para aplicar estos cambios, ejecuta:');
    console.log('   1. npx tsx scripts/backup-blog.ts         (backup previo)');
    console.log('   2. npx tsx scripts/fix-long-metas.ts --aplicar');
  }
  if (aplicar && cambios.length > 0) {
    console.log('');
    console.log('✅ Cambios aplicados. Verifica con:');
    console.log('   npm run seo:ahrefs');
  }
  if (cambios.length === 0) {
    console.log('✅ Sin meta descriptions largas pendientes.');
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
