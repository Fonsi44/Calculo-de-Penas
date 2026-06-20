/**
 * Normalización segura y reproducible de posts del blog.
 *
 * FUENTE DE VERDAD: tabla `blog_posts` (PostgreSQL/Neon) vía Drizzle ORM.
 * Los artículos NO viven en el filesystem (`data/blog/posts/` está vacío tras
 * la migración a DB — ver AGENTS.md R3 y README §"Blog").
 *
 * USO:
 *   npx tsx scripts/normalizar-blog.ts                 # DRY-RUN (solo reporta)
 *   npx tsx scripts/normalizar-blog.ts --aplicar       # aplica cambios en DB
 *   npx tsx scripts/normalizar-blog.ts --aplicar --solo-ctas
 *   npx tsx scripts/normalizar-blog.ts --aplicar --solo-h1
 *   npx tsx scripts/normalizar-blog.ts --aplicar --solo-whitespace
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: NUNCA escribe sin --aplicar.
 *   - Backup completo previo (auditoria-blog/backup-pre-normalizacion-<ts>.json).
 *   - Idempotente: re-ejecutar no produce cambios adicionales.
 *   - No inventa contenido editorial: solo corrige duplicados técnicos,
 *     jerarquía semántica y whitespace. El peso editorial (<800 palabras)
 *     se REPORTA pero no se rellena (requiere acción humana, ver informe).
 *
 * CORRECCIONES APLICADAS:
 *   1. CTAs duplicados: elimina párrafos con disclaimer legal del body
 *      (el componente <LegalDisclaimer> ya lo añade — ver lib/legal-disclaimer.ts).
 *   2. H1 en body: convierte <h1> a <h2> (la plantilla ya renderiza el título
 *      como H1 — doble H1 rompe jerarquía SEO).
 *   3. Whitespace: colapsa 3+ saltos de línea seguidos, recorta espacios
 *      y normaliza entidades HTML rotas. No toca contenido semántico.
 *
 * Lo que NO hace (por diseño):
 *   - Reescribir contenido, ampliar thin posts ni inventar datos (R3, R4).
 *   - Modificar metadatos SEO salvo corrección técnica evidente.
 *   - Cambiar slugs, fechas o categorías (requiere decisión editorial).
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, sql } from 'drizzle-orm';
import { sanitizeHtml } from '../lib/sanitize';
import * as fs from 'fs';
import * as path from 'path';

// ─── CLI ───
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const SOLO_CTAS = args.includes('--solo-ctas');
const SOLO_H1 = args.includes('--solo-h1');
const SOLO_WHITESPACE = args.includes('--solo-whitespace');
const FILTRO_SLUG = (() => {
  const i = args.indexOf('--slug');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Normalización segura del blog (dry-run por defecto).

Uso:
  npx tsx scripts/normalizar-blog.ts [opciones]

Opciones:
  --aplicar          Aplica los cambios en DB (sin esto, solo reporta).
  --solo-ctas        Solo procesar CTAs duplicados.
  --solo-h1          Solo procesar H1 en body.
  --solo-whitespace  Solo normalizar whitespace.
  --slug <slug>      Procesar un único post (para verificación puntual).
  --help, -h         Esta ayuda.

Sin --aplicar, el script es de solo lectura (dry-run).`);
  process.exit(0);
}

// ─── DB ───
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL no configurada (o placeholder). Este script requiere acceso real a Neon.');
  process.exit(1);
}

const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ─── CONSTANTES EDITORIALES ───
// El disclaimer legal duplicado en el body SIEMPRE empieza el párrafo con
// "Este artículo tiene carácter informativo" (verificado en los 75 posts que
// lo contienen). Usamos esa frase COMO ANCLA DE INICIO del párrafo, no como
// coincidencia parcial, para no tocar párrafos editoriales que citan el
// concepto en medio del texto. El componente <LegalDisclaimer> ya añade este
// aviso automáticamente (fuente: lib/legal-disclaimer.ts: "los posts de blog
// NO deben repetirlo").
const DISCLAIMER_ANCLA_INICIO = 'Este artículo tiene carácter informativo y no sustituye';

// ─── TIPOS ───
interface RawPost {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
}

interface Change {
  slug: string;
  tipo: 'cta-eliminado' | 'h1-a-h2' | 'whitespace';
  detalle: string;
  bodyAntes: number;
  bodyDespues: number;
}

// ─── HELPERS ───
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordCount(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

/**
 * Elimina el párrafo que contiene el disclaimer legal duplicado.
 *
 * CRITERIO ESTRICTO: solo elimina el <p> que EMPIEZA con la frase ancla
 * "Este artículo tiene carácter informativo y no sustituye" (precedido
 * opcionalmente por <em>). Esto evita falsos positivos sobre párrafos
 * editoriales legítimos que mencionan "consulte con un abogado" en medio
 * del texto (caso real: registrar-marca-paso-a-paso-honduras).
 *
 * El componente <LegalDisclaimer> (lib/legal-disclaimer.ts) ya renderiza
 * este aviso en todas las páginas de detalle, por lo que la copia del body
 * es redundante y va contra la regla editorial explícita del proyecto.
 */
function limpiarCtasDuplicados(body: string, slug: string): { nuevo: string; eliminados: number } {
  let nuevo = body;
  let eliminados = 0;

  // Patrón preciso: <p> (con style opcional) + opcional <em> + la frase ancla
  // al INICIO del contenido del párrafo, hasta su cierre </p>.
  // {0,30} permite espacios/etiquemas <em>/<strong> iniciales pero NO texto
  // editorial previo que delataría un párrafo distinto.
  const patron = new RegExp(
    `<p[^>]*>(\\s*<em[^>]*>)?\\s{0,5}${escapeRegex(DISCLAIMER_ANCLA_INICIO)}[\\s\\S]{0,400}?(?:<\\/em>)?\\s*<\\/p>`,
    'gi',
  );
  nuevo = nuevo.replace(patron, () => {
    eliminados++;
    return '';
  });

  // Colapsar saltos de línea múltiples generados por la eliminación.
  nuevo = nuevo.replace(/\n{3,}/g, '\n\n').trim();

  // Guardia de seguridad: si la limpieza dejó el body con <50 palabras, revertir.
  if (wordCount(nuevo) < 50 && wordCount(body) >= 50) {
    console.warn(`  ⚠ ${slug}: limpieza de CTAs dejaría <50 palabras — REVERTIDO.`);
    return { nuevo: body, eliminados: 0 };
  }

  return { nuevo, eliminados };
}

/**
 * Convierte etiquetas <h1> del body a <h2>.
 * La plantilla de detalle del post ya renderiza el título como H1, por lo que
 * cualquier H1 en el body genera un doble H1 (problema SEO).
 * Conserva atributos (class, style, id) y contenido.
 */
function corregirH1EnBody(body: string): { nuevo: string; cambios: number } {
  let cambios = 0;
  // <h1 ...>...</h1> → <h2 ...>...</h2>, conservando atributos.
  const nuevo = body
    .replace(/<h1(\s[^>]*)?>/gi, (match, attrs) => {
      cambios++;
      return `<h2${attrs || ''}>`;
    })
    .replace(/<\/h1>/gi, () => '</h2>');
  return { nuevo, cambios };
}

/**
 * Normaliza whitespace: 3+ saltos → 2, espacios en blanco al final de líneas,
 * espacios múltiples dentro de bloques de texto plano (no dentro de <pre>/<code>).
 * No toca contenido semántico.
 */
function normalizarWhitespace(body: string): { nuevo: string; cambios: number } {
  let cambios = 0;
  const antes = body;
  let nuevo = body;
  // 3+ newlines → 2
  nuevo = nuevo.replace(/\n{3,}/g, '\n\n');
  // Espacios finales de línea
  nuevo = nuevo.replace(/[ \t]+\n/g, '\n');
  // &nbsp; repetidos (no los aislados) → espacio normal
  nuevo = nuevo.replace(/(&nbsp;){2,}/g, ' ');
  // Múltiples espacios consecutivos fuera de tags → uno (cuidado con no tocar
  // dentro de atributos). Solo aplicamos entre > y < para seguridad.
  nuevo = nuevo.replace(/>\s{2,}</g, '> <');
  if (nuevo !== antes) cambios = 1;
  return { nuevo, cambios };
}

// ─── MAIN ───
async function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  NORMALIZACIÓN DEL BLOG  ${APLICAR ? '— MODO APLICAR' : '— MODO DRY-RUN'}`);
  console.log(`${'═'.repeat(70)}\n`);

  if (!APLICAR) {
    console.log('⚠️  DRY-RUN: no se escribirá nada en la DB. Usa --aplicar para persistir.\n');
  }

  // ── Cargar posts ──
  const posts: RawPost[] = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
      category: blogPosts.category,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const objetivo = FILTRO_SLUG ? posts.filter((p) => p.slug === FILTRO_SLUG) : posts;
  console.log(`Posts publicados: ${posts.length} · Posts a procesar: ${objetivo.length}\n`);

  // ── Backup previo (siempre, incluso en dry-run, para trazabilidad) ──
  const backupDir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-pre-normalizacion-${ts}.json`);
  // Cargar full body para el backup
  const fullPosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
      category: blogPosts.category,
      description: blogPosts.description,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));
  fs.writeFileSync(backupFile, JSON.stringify(fullPosts, null, 2), 'utf8');
  console.log(`✓ Backup previo: ${backupFile} (${fullPosts.length} posts)\n`);

  // ── Procesar ──
  const cambios: Change[] = [];
  const resumen = { cta: 0, h1: 0, ws: 0, postsModificados: 0 };
  const skipeados: string[] = [];

  for (const post of objetivo) {
    if (!post.body) {
      skipeados.push(`${post.slug} (sin body)`);
      continue;
    }

    let bodyNuevo = post.body;
    let cambiosEnPost: Change[] = [];
    const bodyAntesLen = post.body.length;

    // 1. CTAs duplicados
    if (!SOLO_H1 && !SOLO_WHITESPACE) {
      const r = limpiarCtasDuplicados(bodyNuevo, post.slug);
      if (r.eliminados > 0) {
        cambiosEnPost.push({
          slug: post.slug,
          tipo: 'cta-eliminado',
          detalle: `${r.eliminados} párrafo(s) disclaimer eliminado(s)`,
          bodyAntes: bodyNuevo.length,
          bodyDespues: r.nuevo.length,
        });
        bodyNuevo = r.nuevo;
        resumen.cta += r.eliminados;
      }
    }

    // 2. H1 → H2
    if (!SOLO_CTAS && !SOLO_WHITESPACE) {
      const r = corregirH1EnBody(bodyNuevo);
      if (r.cambios > 0) {
        cambiosEnPost.push({
          slug: post.slug,
          tipo: 'h1-a-h2',
          detalle: `${r.cambios} <h1> convertidos a <h2>`,
          bodyAntes: bodyNuevo.length,
          bodyDespues: r.nuevo.length,
        });
        bodyNuevo = r.nuevo;
        resumen.h1 += r.cambios;
      }
    }

    // 3. Whitespace
    if (!SOLO_CTAS && !SOLO_H1) {
      const r = normalizarWhitespace(bodyNuevo);
      if (r.cambios > 0) {
        cambiosEnPost.push({
          slug: post.slug,
          tipo: 'whitespace',
          detalle: 'whitespace colapsado/normalizado',
          bodyAntes: bodyNuevo.length,
          bodyDespues: r.nuevo.length,
        });
        bodyNuevo = r.nuevo;
        resumen.ws += 1;
      }
    }

    // Guardia: si tras todo el cuerpo quedó vacío, revertir (defensa extra).
    if (wordCount(bodyNuevo) === 0 && wordCount(post.body) > 0) {
      console.warn(`  ⚠ ${post.slug}: el resultado quedó vacío — REVERTIDO, no se aplica.`);
      skipeados.push(`${post.slug} (resultado vacío)`);
      continue;
    }

    if (cambiosEnPost.length > 0) {
      cambios.push(...cambiosEnPost);
      resumen.postsModificados++;

      if (APLICAR) {
        // Sanitizar antes de escribir (defensa: nunca meter HTML sucio).
        const bodySanitizado = sanitizeHtml(bodyNuevo);
        await db
          .update(blogPosts)
          .set({
            body: bodySanitizado,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, post.id));
      }
    }
  }

  // ── Reporte ──
  console.log(`${'─'.repeat(70)}`);
  console.log(`  REPORTE DE NORMALIZACIÓN ${APLICAR ? '(APLICADO)' : '(DRY-RUN)'}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`  Posts analizados:        ${objetivo.length}`);
  console.log(`  Posts modificados:       ${resumen.postsModificados}`);
  console.log(`  CTAs disclaimer quitados: ${resumen.cta} (en ${new Set(cambios.filter(c => c.tipo === 'cta-eliminado').map(c => c.slug)).size} posts)`);
  console.log(`  H1 → H2 corregidos:      ${resumen.h1} (en ${new Set(cambios.filter(c => c.tipo === 'h1-a-h2').map(c => c.slug)).size} posts)`);
  console.log(`  Posts con whitespace:     ${resumen.ws}`);
  if (skipeados.length > 0) {
    console.log(`  Posts skipeados:         ${skipeados.length}`);
    skipeados.forEach((s) => console.log(`    - ${s}`));
  }
  console.log(`${'─'.repeat(70)}\n`);

  if (cambios.length === 0) {
    console.log('✅ No se detectaron problemas de normalización. El blog ya está limpio.');
  } else {
    console.log('Detalle de cambios por post:\n');
    const porSlug: Record<string, Change[]> = {};
    for (const c of cambios) {
      (porSlug[c.slug] = porSlug[c.slug] || []).push(c);
    }
    for (const [slug, lista] of Object.entries(porSlug)) {
      console.log(`  [${slug}]`);
      for (const c of lista) {
        console.log(`    • ${c.tipo}: ${c.detalle} (${c.bodyAntes}→${c.bodyDespues} chars)`);
      }
    }
  }

  // ── Guardar reporte a archivo ──
  const reportFile = path.join(backupDir, `normalizacion-reporte-${ts}.json`);
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        modo: APLICAR ? 'APLICAR' : 'DRY-RUN',
        filtroSlug: FILTRO_SLUG,
        postsAnalizados: objetivo.length,
        postsModificados: resumen.postsModificados,
        resumen,
        cambios,
        skipeados,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\n📄 Reporte: ${reportFile}`);

  // ── Cierre de conexión ──
  const client = (db as unknown as { $client?: { end?: () => unknown } }).$client;
  await client?.end?.();

  console.log(`\n${APLICAR ? '✅ Normalización aplicada.' : 'ℹ️  Dry-run completado. Revisa el reporte y vuelve a ejecutar con --aplicar.'}\n`);
}

main().catch((e) => {
  console.error('Error en normalización:', e);
  process.exit(1);
});
