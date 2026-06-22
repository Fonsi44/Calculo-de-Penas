/**
 * Validación standalone del blog — read-only.
 *
 * Reutiliza las funciones puras de `scripts/blog-verify-fix.ts` para validar
 * que los posts publicados cumplen TODAS las normas del repositorio (R13-R17,
 * SEO, GEO, E-E-A-T, enlaces, metadatos, veracidad legal). No escribe nada.
 *
 * USO:
 *   npm run validar:blog                          # Valida todos los posts
 *   npm run validar:blog -- --slug <slug>         # Un solo post
 *   npm run validar:blog -- --limit 10            # Primeros 10
 *   npm run validar:blog -- --json                # Salida JSON (para CI)
 *   npm run validar:blog -- --solo-blocking       # Solo críticos/importantes
 *   npx tsx scripts/validar-blog.ts --help
 *
 * EXIT CODES:
 *   0 — Todos los posts pasan (0 hallazgos blocking)
 *   1 — Hay posts con hallazgos críticos o importantes (requieren acción)
 *   2 — Error de configuración (sin DATABASE_URL, etc.)
 *
 * DIFERENCIA vs blog:verify-fix --solo-verificar:
 *   - Este script es MÁS RÁPIDO y enfocado: solo reporta, sin lógica de
 *     corrección/IA/checkpoint. Pensado para correr tras cualquier cambio
 *     editorial manual o tras --aplicar, para confirmar que todo cumple.
 *   - Salida más compacta y legible (tabla por post + resumen).
 *   - Modo --json para integración CI/CD.
 *   - Modo --solo-blocking para ver solo lo que bloquea "perfecto".
 *
 * VARIABLES DE ENTORNO:
 *   DATABASE_URL (obligatoria) — acceso a Neon PostgreSQL.
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import {
  cargarDatosCanonicos,
  extraerClaims,
  verificarClaims,
  analizarSEO,
  wordCount,
  type PostRow,
  type HallazgoSEO,
} from './blog-verify-fix';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

// ── CLI ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FILTRO_SLUG = (() => {
  const i = args.indexOf('--slug');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
})();
const JSON_OUT = args.includes('--json');
const SOLO_BLOCKING = args.includes('--solo-blocking');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Validación standalone del blog (read-only).

Uso:
  npm run validar:blog [opciones]

Opciones:
  --slug <slug>       Validar un único post.
  --limit <n>         Validar solo los primeros <n> posts.
  --json              Salida JSON (para CI/CD). Sin tabla humana.
  --solo-blocking     Mostrar solo hallazgos críticos/importantes (oculta recomendables).
  --help, -h          Esta ayuda.

Exit codes:
  0 — Todos los posts pasan (0 hallazgos blocking)
  1 — Hay posts con hallazgos críticos o importantes
  2 — Error de configuración

Sin --aplicar ni IA: puro análisis determinista. Corre en segundos sobre 159 posts.`);
  process.exit(0);
}

// ── DB ─────────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL no configurada (o placeholder).');
  process.exit(2);
}
const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  cargarDatosCanonicos();

  let posts: PostRow[] = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      description: blogPosts.description,
      body: blogPosts.body,
      category: blogPosts.category,
      tags: blogPosts.tags,
      coverImage: blogPosts.coverImage,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      publishedAt: blogPosts.publishedAt,
      noindex: blogPosts.noindex,
      canonicalUrl: blogPosts.canonicalUrl,
      author: blogPosts.author,
      ogImage: blogPosts.ogImage,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));


  if (FILTRO_SLUG) posts = posts.filter((p) => p.slug === FILTRO_SLUG);
  if (LIMIT > 0) posts = posts.slice(0, LIMIT);

  if (!JSON_OUT) {
    console.log(`\n${'═'.repeat(72)}`);
    console.log(`  VALIDACIÓN DEL BLOG — ${posts.length} posts`);
    console.log(`${'═'.repeat(72)}\n`);
  }

  type Resultado = {
    slug: string;
    title: string;
    category: string;
    palabras: number;
    ok: boolean;
    criticos: number;
    importantes: number;
    recomendables: number;
    discrepancias: number;
    hallazgos: HallazgoSEO[];
  };

  const resultados: Resultado[] = [];
  let totalOk = 0;
  let totalBlocking = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.body) {
      resultados.push({
        slug: post.slug,
        title: post.title,
        category: post.category,
        palabras: 0,
        ok: false,
        criticos: 0,
        importantes: 0,
        recomendables: 0,
        discrepancias: 0,
        hallazgos: [{ severidad: 'critico', categoria: 'contenido', mensaje: 'Post sin body.' }],
      });
      totalBlocking++;
      continue;
    }

    const palabras = wordCount(post.body);
    const claims = extraerClaims(post.body);
    const discrepancias = verificarClaims(claims);
    const hallazgos = analizarSEO(post, palabras);

    const criticos = hallazgos.filter((h) => h.severidad === 'critico').length + discrepancias.filter((d) => d.severidad === 'critico').length;
    const importantes = hallazgos.filter((h) => h.severidad === 'importante').length + discrepancias.filter((d) => d.severidad === 'importante').length;
    const recomendables = hallazgos.filter((h) => h.severidad === 'recomendable').length;
    const ok = criticos === 0 && importantes === 0;

    if (ok) totalOk++;
    else totalBlocking++;

    if (!JSON_OUT) {
      const icon = ok ? '✅' : criticos > 0 ? '🔴' : '🟡';
      const flags: string[] = [];
      if (criticos > 0) flags.push(`${criticos} crítico(s)`);
      if (importantes > 0) flags.push(`${importantes} importante(s)`);
      if (recomendables > 0 && !SOLO_BLOCKING) flags.push(`${recomendables} recomendable(s)`);
      if (discrepancias.length > 0) flags.push(`${discrepancias.length} discr. legal`);
      const flagStr = flags.length > 0 ? ` — ${flags.join(', ')}` : '';
      console.log(`[${i + 1}/${posts.length}] ${icon} ${post.slug} — ${palabras} palabras${flagStr}`);

      // Detalle de hallazgos (solo si no es OK y no es --json)
      if (!ok) {
        for (const d of discrepancias) {
          console.log(`    ${d.severidad === 'critico' ? '🔴' : d.severidad === 'importante' ? '🟡' : '🔵'} [legal] ${d.mensaje}`);
        }
        for (const h of hallazgos) {
          if (SOLO_BLOCKING && h.severidad === 'recomendable') continue;
          const iconH = h.severidad === 'critico' ? '🔴' : h.severidad === 'importante' ? '🟡' : '🔵';
          console.log(`    ${iconH} [${h.categoria}] ${h.mensaje}`);
        }
      }
    }

    resultados.push({
      slug: post.slug,
      title: post.title,
      category: post.category,
      palabras,
      ok,
      criticos,
      importantes,
      recomendables,
      discrepancias: discrepancias.length,
      hallazgos: SOLO_BLOCKING ? hallazgos.filter((h) => h.severidad !== 'recomendable') : hallazgos,
    });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      total: posts.length,
      ok: totalOk,
      blocking: totalBlocking,
      resultados,
    }, null, 2));
  } else {
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`  RESUMEN VALIDACIÓN`);
    console.log(`${'─'.repeat(72)}`);
    console.log(`  Posts validados:        ${posts.length}`);
    console.log(`  Posts OK (perfectos):   ${totalOk} ✅`);
    console.log(`  Posts con issues:       ${totalBlocking} ${totalBlocking > 0 ? '⚠️' : '✅'}`);
    console.log(`${'─'.repeat(72)}\n`);

    if (totalBlocking === 0) {
      console.log('✅ Todos los posts cumplen TODAS las normas. Cero hallazgos blocking.\n');
    } else {
      console.log(`⚠️  ${totalBlocking} post(s) tienen hallazgos críticos/importantes. Revisa el detalle arriba.\n`);
      console.log('   Para corregir automáticamente: npm run blog:verify-fix:aplicar');
      console.log('   Para un solo post:              npm run blog:verify-fix:aplicar -- --slug <slug>\n');
    }
  }

  const client = (db as unknown as { $client?: { end?: () => unknown } }).$client;
  await client?.end?.();

  process.exit(totalBlocking > 0 ? 1 : 0);
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('validar-blog.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('validar-blog');

if (isDirectRun) {
  main().catch((e) => {
    console.error('Error en validación del blog:', e);
    process.exit(2);
  });
}
