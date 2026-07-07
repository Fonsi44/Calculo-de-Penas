/**
 * Corrige titles demasiado largos en blog_posts.title y blog_posts.meta_title.
 *
 * Uso:
 *   npx tsx scripts/fix-long-titles.ts             # dry-run
 *   npx tsx scripts/fix-long-titles.ts --aplicar    # aplica en DB
 *
 * QUÉ HACE:
 *   El CSV `title-too-long` de Ahrefs reporta 121 blog posts con titles
 *   renderizados de 71–109 caracteres. El <title> renderizado es:
 *     stripDuplicateBrand(meta_title || title) | "Pineda y Asociados"
 *   La marca `| Pineda y Asociados` = 21 chars, así que el valor DB debe
 *   ser ≤49 chars para que el renderizado sea ≤70 (umbral Ahrefs).
 *
 *   Reglas de limpieza (idempotentes, aplicadas a meta_title Y title):
 *     1. Decodifica entidades HTML visibles (&oacute; → ó, &ntilde; → ñ, ...).
 *     2. Elimina sufijos de placeholder: `| [Tu Empresa]`, `[Tu Empresa]`.
 *     3. Elimina sufijo de marca redundante: `| Pineda y Asociados`
 *        (el template lo reañade en runtime vía stripDuplicateBrand + layout).
 *     4. Compacta patrones verbosos:
 *        - "Guía Completa | Requisitos y Trámites" → "Requisitos y Trámites"
 *        - "Guía Completa 2024 |" → "Guía 2024:"
 *        - "Conozca sus Derechos y Qué Hacer" → "Derechos y Qué Hacer"
 *        - elimina ", Honduras" redundante cuando la ciudad ya contextualiza.
 *     5. Recorta a TITLE_MAX_DB (49) en límite de palabra.
 *
 *   Objetivo: titles claros, naturales, SEO-safe, marca una sola vez (la
 *   añade el template), sin placeholders ni entidades HTML visibles.
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: sin --aplicar no escribe en DB.
 *   - Idempotente: una vez limpio, el valor no vuelve a matchear.
 *   - Requiere backup previo (verifica <2h).
 *   - No inventa datos legales (R4): solo limpia y recorta.
 *
 * DECISIONES (R4/R13): no inventar datos, no reescribir contenido jurídico.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// La marca `| Pineda y Asociados` = 21 chars. Para renderizado ≤70 (umbral
// Ahrefs), el valor DB tras stripDuplicateBrand debe ser ≤49.
const TITLE_MAX_DB = 49;

// Marca del sitio (para detectar/eliminar duplicación en el valor DB).
const BRAND = 'Pineda y Asociados';

// Sufijos de marca y placeholder al final del title (anclados).
const BRAND_SUFFIX = /\s*[\|\-–—]\s*Pineda y Asociados\s*$/i;
const BRAND_TAIL = /\s+Pineda y Asociados\s*$/i;
const PLACEHOLDER_SUFFIX = /\s*[\|\-–—]?\s*\[?\s*tu\s+empresa\s*\]?\s*$/gi;

// Entidades HTML comunes a decodificar.
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#0?39;': "'",
  '&nbsp;': ' ',
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
};

function decodeEntities(s: string): string {
  let out = s;
  for (const [ent, ch] of Object.entries(ENTITY_MAP)) {
    // ent puede ser regex (#0?39) — usamos replace con string source.
    if (ent.includes('?')) {
      out = out.replace(new RegExp(ent, 'g'), ch);
    } else {
      out = out.split(ent).join(ch);
    }
  }
  return out;
}

// Patrones de compactación verbosa (aplicados una vez, case-insensitive).
const COMPACTION_RULES: Array<{ re: RegExp; rep: string }> = [
  // "Guía Completa | Requisitos y Trámites" → "Requisitos y Trámites"
  { re: /^Gu[ií]a Completa\s*[\|\-–—:]\s*/i, rep: '' },
  // "Guía Completa 2024 |" / "Guía Completa 2024:" → "Guía 2024:"
  { re: /^Gu[ií]a Completa\s*(20\d{2})\s*[\|\-–—:]?\s*/i, rep: 'Guía $1: ' },
  // "Conozca sus Derechos y Qué Hacer" → "Derechos y Qué Hacer"
  { re: /^Conozca sus\s+/i, rep: '' },
  // ", Honduras" al final cuando ya hay ciudad (redundante en context local)
  { re: /,\s*Honduras\s*$/i, rep: '' },
  // "en Honduras:" al inicio redundante cuando el título ya menciona Honduras
  { re: /^Todo lo que Debes Saber\s*[\|\-–—:]?\s*/i, rep: '' },
];

function compact(t: string): string {
  let out = t;
  for (const rule of COMPACTION_RULES) {
    out = out.replace(rule.re, rule.rep);
  }
  return out.trim();
}

/** Recorta a ≤max en límite de palabra, prefiriendo cortes naturales. */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  // Preferir cortar en un separador natural (`:` o `,`) si está en el último
  // 40% del rango — produce titles más limpios que un corte en espacio.
  const lastColon = cut.lastIndexOf(':');
  if (lastColon > max * 0.6) return cut.slice(0, lastColon).trim();
  const lastComma = cut.lastIndexOf(',');
  if (lastComma > max * 0.6) return cut.slice(0, lastComma).trim();
  // Si no hay separador natural útil, corta en el último espacio.
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.6) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

interface TitleCambio {
  slug: string;
  campo: 'title' | 'meta_title';
  de: string;
  a: string;
  deLen: number;
  aLen: number;
  motivos: string[];
}

function procesarTitle(valor: string): { valor: string; motivos: string[] } | null {
  if (!valor) return null;
  let t = valor;
  const motivos: string[] = [];
  const original = valor.trim();

  // 1. Decodificar entidades HTML.
  if (/&[a-z]+;|&#\d+;/i.test(t)) {
    t = decodeEntities(t);
    motivos.push('entidades HTML');
  }

  // 2. Eliminar placeholder [Tu Empresa].
  if (/tu\s+empresa/i.test(t)) {
    t = t.replace(PLACEHOLDER_SUFFIX, '').trim();
    motivos.push('placeholder');
  }

  // 3. Eliminar sufijo de marca redundante (hasta 2 pasadas).
  for (let i = 0; i < 2; i++) {
    const prev = t;
    t = t.replace(BRAND_SUFFIX, '').replace(BRAND_TAIL, '').trim();
    if (t === prev) break;
    if (i === 0 && t !== prev) motivos.push('marca duplicada');
  }

  // 4. Compactar patrones verbosos.
  const antesCompact = t;
  t = compact(t);
  if (t !== antesCompact) motivos.push('compactación');

  // 5. Recortar a TITLE_MAX_DB.
  if (t.length > TITLE_MAX_DB) {
    t = truncateAtWord(t, TITLE_MAX_DB);
    motivos.push(`recortado a ${t.length}`);
  }

  // Limpiar separadores colgantes.
  t = t.replace(/\s*[\|\-–—:]\s*$/, '').trim();

  if (t === original || !t) return null;
  return { valor: t, motivos };
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
    WHERE published = true
    ORDER BY slug ASC
  `;

  const cambios: TitleCambio[] = [];

  for (const p of posts) {
    for (const campo of ['title', 'meta_title'] as const) {
      const valor = (p[campo] as string | null) ?? '';
      if (!valor) continue;
      const resultado = procesarTitle(valor);
      if (!resultado) continue;

      cambios.push({
        slug: p.slug,
        campo,
        de: valor,
        a: resultado.valor,
        deLen: valor.length,
        aLen: resultado.valor.length,
        motivos: resultado.motivos,
      });

      if (aplicar) {
        if (campo === 'title') {
          await sql`UPDATE blog_posts SET title = ${resultado.valor}, updated_at = NOW() WHERE id = ${p.id}`;
        } else {
          await sql`UPDATE blog_posts SET meta_title = ${resultado.valor}, updated_at = NOW() WHERE id = ${p.id}`;
        }
      }
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN DE TITLES LARGOS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Modo:              ${aplicar ? 'APLICAR (escritura DB)' : 'DRY-RUN (solo lectura)'}`);
  console.log(`Posts analizados: ${posts.length}`);
  console.log(`Campos modificados: ${cambios.length}`);
  console.log('');

  if (cambios.length > 0) {
    console.log('── Detalle de cambios ──');
    for (const c of cambios) {
      console.log(`  ${c.slug} [${c.campo}] [${c.deLen}→${c.aLen}] (${c.motivos.join('; ')}):`);
      console.log(`    DE: ${c.de}`);
      console.log(`    A:  ${c.a}`);
    }
  }

  if (!aplicar && cambios.length > 0) {
    console.log('');
    console.log('💡 Para aplicar estos cambios, ejecuta:');
    console.log('   1. npx tsx scripts/backup-blog.ts         (backup previo)');
    console.log('   2. npx tsx scripts/fix-long-titles.ts --aplicar');
  }
  if (aplicar && cambios.length > 0) {
    console.log('');
    console.log('✅ Cambios aplicados. Verifica con:');
    console.log('   npm run seo:ahrefs');
  }
  if (cambios.length === 0) {
    console.log('✅ Sin titles largos pendientes.');
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
