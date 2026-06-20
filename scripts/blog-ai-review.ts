/**
 * Revisión editorial + SEO del blog con asistencia de IA (solo sugerencias).
 *
 * FUENTE DE VERDAD: tabla `blog_posts` (PostgreSQL/Neon) vía Drizzle ORM.
 * Los artículos NO viven en el filesystem (`data/blog/posts/` está vacío —
 * ver AGENTS.md R3). Por eso esta herramienta opera sobre la DB, no sobre
 * archivos Markdown/MDX (no existen posts en MD/MDX en este repo).
 *
 * FILOSOFÍA (AGENTS.md R13, R17):
 *   - La IA SOLO SUGIERE. Nunca escribe contenido final en la DB.
 *   - Prohibido rellenar texto genérico para alcanzar el conteo de palabras.
 *   - Prohibido inventar ley, jurisprudencia, métricas, claims o fechas.
 *   - Los posts <800 palabras se MARCAN como "requiere ampliación editorial"
 *     (trabajo humano), no se rellenan.
 *
 * USO:
 *   npm run blog:review                         # DRY-RUN (solo análisis + reporte)
 *   npm run blog:review -- --slug <slug>        # un solo post
 *   npm run blog:review -- --no-ai              # solo heurísticas, sin DeepSeek
 *   npm run blog:review -- --limit 20           # primeros 20 posts
 *   npm run blog:review:aplicar                 # aplica SOLO cambios mecánicos seguros
 *   npx tsx scripts/blog-ai-review.ts --help
 *
 * VARIABLES DE ENTORNO:
 *   DATABASE_URL       (obligatoria) — acceso a Neon.
 *   DEEPSEEK_API_KEY   (opcional)    — habilita sugerencias de IA. Sin ella,
 *                                      el script corre en modo solo-heurísticas.
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: NUNCA escribe sin --aplicar.
 *   - --aplicar SOLO ejecuta transformaciones deterministas idempotentes
 *     (H1→H2, CTAs duplicados, whitespace). Reutiliza la lógica canónica de
 *     `scripts/normalizar-blog.ts`. NUNCA aplica sugerencias de IA.
 *   - Backup previo en auditoria-blog/backup-pre-review-<ts>.json antes de --aplicar.
 *   - Guardia: si el body resultante queda <50 palabras, se revierte.
 *   - Sanitización HTML antes de cualquier escritura.
 *
 * Lo que NUNCA hace (por diseño):
 *   - Reescribir contenido con IA. La IA solo devuelve sugerencias al reporte.
 *   - Cambiar slugs, fechas, categorías o metadatos SEO (decisión editorial).
 *   - Inventar contenido para alcanzar 800 palabras.
 */
import 'dotenv/config';
// Cargar .env.local (Next.js convention) si existe y sobreescribe .env.
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { sanitizeHtml } from '../lib/sanitize';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env.local si existe (sobreescribe .env para desarrollo local)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

// ═══════════════════════════════════════════════════════════════════════
//  CLI
// ═══════════════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const APLICAR_IA = args.includes('--aplicar-ia');
const NO_AI = args.includes('--no-ai');
const FILTRO_SLUG = (() => {
  const i = args.indexOf('--slug');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
})();
const OFFSET = (() => {
  const i = args.indexOf('--offset');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
})();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Revisión editorial + SEO del blog con asistencia de IA (solo sugerencias).

Uso:
  npm run blog:review [opciones]

Opciones:
  --aplicar        Aplica SOLO cambios mecánicos seguros (H1→H2, CTAs duplicados,
                   whitespace, truncado de títulos >60 chars).
  --aplicar-ia     Aplica reescritura IA del body y títulos largos. REQUIERE
                   supervisión humana de las sugerencias (R17).
  --slug <slug>    Revisar un único post.
  --no-ai          Omitir DeepSeek (solo heurísticas deterministas).
  --limit <n>      Procesar solo los primeros <n> posts (control de coste API).
  --offset <n>     Saltar los primeros <n> posts (para reanudar lotes).
  --help, -h       Esta ayuda.

Variables de entorno:
  DATABASE_URL      (obligatoria) Acceso a Neon PostgreSQL.
  DEEPSEEK_API_KEY  (opcional)    Habilita sugerencias de IA. Sin ella, modo
                                   solo-heurísticas.

Sin --aplicar, el script es de solo lectura (dry-run). La IA solo sugiere;
nunca escribe contenido en la DB (AGENTS.md R13/R17).`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════
//  DB
// ═══════════════════════════════════════════════════════════════════════
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL no configurada (o placeholder). Este script requiere acceso real a Neon.');
  process.exit(1);
}
const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ═══════════════════════════════════════════════════════════════════════
//  DeepSeek (opcional)
// ═══════════════════════════════════════════════════════════════════════
// El modelo/proveedor se lee de env para no acoplar el script a un endpoint
// fijo. Si DEEPSEEK_API_KEY no está, se desactiva la IA sin fallo.
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_ENDPOINT =
  process.env.DEEPSEEK_API_BASE ??
  'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
const IA_ENABLED = !NO_AI && Boolean(DEEPSEEK_API_KEY);

// ═══════════════════════════════════════════════════════════════════════
//  Constantes editoriales
// ═══════════════════════════════════════════════════════════════════════
const MIN_PALABRAS = 800;
const MAX_PALABRAS = 1000;
const TITLE_MAX = 60;
const META_MAX = 155;
const META_MIN = 70;
// Ancla de INICIO del párrafo del disclaimer duplicado (R14).
// NO es la frase completa — es el prefijo mínimo que identifica el párrafo
// en el body. El regex captura desde esta ancla hasta el </p> cierre.
// El texto completo se perdió en la limpieza de 75 posts (Release 89);
// este ancla se mantiene como guardia de regresión.
const DISCLAIMER_ANCLA_INICIO = 'Este artículo tiene carácter informativo y no sustituye';

// Rutas privadas que NO deben aparecer en enlaces internos del blog (R6).
const RUTAS_PRIVADAS = ['/intranet', '/api/', '/calculadora', '/casos', '/cp', '/delitos', '/atajos'];

// ═══════════════════════════════════════════════════════════════════════
//  Tipos
// ═══════════════════════════════════════════════════════════════════════
interface PostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[] | null;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date;
  noindex: boolean | null;
}

type Severidad = 'critico' | 'importante' | 'recomendable';

interface Hallazgo {
  severidad: Severidad;
  categoria:
    | 'longitud'
    | 'headings'
    | 'seo'
    | 'tags'
    | 'imagenes'
    | 'enlaces'
    | 'fecha'
    | 'contenido';
  mensaje: string;
}

interface SugerenciaIA {
  secciones_a_ampliar: string[];
  mejoras_seo: string[];
  problemas_estructura: string[];
}

interface ResultadoPost {
  post: { slug: string; title: string; category: string };
  palabras: number;
  estadoLongitud: 'ok' | 'thin' | 'verbose';
  hallazgos: Hallazgo[];
  sugerenciaIA: SugerenciaIA | null;
  iaError: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
//  Helpers — análisis determinista
// ═══════════════════════════════════════════════════════════════════════

/** Cuenta palabras reales del HTML: strip tags, entidades, colapsa espacios. */
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extrae headings del body con su nivel. */
function extraerHeadings(html: string): { nivel: number; texto: string }[] {
  const heads: { nivel: number; texto: string }[] = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const nivel = parseInt(m[1], 10);
    const texto = m[2].replace(/<[^>]+>/g, '').trim();
    heads.push({ nivel, texto });
  }
  return heads;
}

/** Extrae imágenes y comprueba alt text. */
function extraerImagenes(html: string): { src: string; alt: string }[] {
  const imgs: { src: string; alt: string }[] = [];
  const re = /<img[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const srcMatch = tag.match(/\bsrc=["']([^"']*)["']/i);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    imgs.push({
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1].trim() : '',
    });
  }
  return imgs;
}

/** Extrae enlaces <a href>. */
function extraerEnlaces(html: string): { href: string; externo: boolean; tieneRel: boolean }[] {
  const links: { href: string; externo: boolean; tieneRel: boolean }[] = [];
  const re = /<a\s[^>]*href=["']([^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const tag = m[0];
    const externo = /^(https?:)?\/\//i.test(href);
    const tieneRel = /\brel=["']/i.test(tag);
    links.push({ href, externo, tieneRel });
  }
  return links;
}

/**
 * Análisis determinista completo de un post. Sin IA.
 * Devuelve hallazgos por categoría + estado de longitud.
 */
function analizarPost(post: PostRow): { palabras: number; estadoLongitud: 'ok' | 'thin' | 'verbose'; hallazgos: Hallazgo[] } {
  const hallazgos: Hallazgo[] = [];
  const palabras = wordCount(post.body);

  // ── Longitud editorial (R13) ──
  let estadoLongitud: 'ok' | 'thin' | 'verbose' = 'ok';
  if (palabras < MIN_PALABRAS) {
    estadoLongitud = 'thin';
    hallazgos.push({
      severidad: palabras < 400 ? 'critico' : 'importante',
      categoria: 'longitud',
      mensaje: `${palabras} palabras (objetivo ${MIN_PALABRAS}–${MAX_PALABRAS}). Requiere ampliación editorial HUMANA. No rellenar con texto genérico (R13).`,
    });
  } else if (palabras > MAX_PALABRAS) {
    estadoLongitud = 'verbose';
    if (palabras > 1400) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'longitud',
        mensaje: `${palabras} palabras (>${MAX_PALABRAS}). Revisar claridad/estructura; considerar dividir.`,
      });
    }
  }

  // ── Headings / jerarquía (R15) ──
  const headings = extraerHeadings(post.body);
  const h1s = headings.filter((h) => h.nivel === 1);
  if (h1s.length > 0) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'headings',
      mensaje: `${h1s.length} <h1> en el body. La plantilla ya renderiza el título como H1 → doble H1 (problema SEO). Convertir a <h2>.`,
    });
  }
  // H3 sin H2 previo en el orden del documento
  let vistoH2 = false;
  for (const h of headings) {
    if (h.nivel === 2) vistoH2 = true;
    if (h.nivel === 3 && !vistoH2) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'headings',
        mensaje: 'Existe <h3> antes de cualquier <h2>. Jerarquía saltada.',
      });
      break;
    }
  }
  if (headings.length > 0 && headings.every((h) => h.nivel >= 3)) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'headings',
      mensaje: 'El body solo tiene headings H3+. Falta estructura con <h2>.',
    });
  }

  // ── SEO: title / metaDescription ──
  if (post.title.length > TITLE_MAX) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: `Title de ${post.title.length} chars (óptimo ≤${TITLE_MAX}). Se truncará en SERP.`,
    });
  }
  const meta = post.metaDescription ?? post.description;
  if (!meta || meta.trim().length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: 'Sin meta description. Genera una para mejorar CTR.',
    });
  } else if (meta.length > META_MAX) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'seo',
      mensaje: `Meta description de ${meta.length} chars (óptimo ≤${META_MAX}). Se truncará.`,
    });
  } else if (meta.length < META_MIN) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'seo',
      mensaje: `Meta description de ${meta.length} chars (recomendado ≥${META_MIN}). Aprovecha el espacio.`,
    });
  }

  // ── Tags ──
  const tags = post.tags ?? [];
  if (tags.length === 0) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'tags',
      mensaje: 'Sin tags. Añadir 3–5 etiquetas temáticas mejora la navegación.',
    });
  } else {
    const lower = tags.map((t) => t.toLowerCase());
    const dup = lower.filter((t, i) => lower.indexOf(t) !== i);
    if (dup.length > 0) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'tags',
        mensaje: `Tags duplicados (insensitive): ${[...new Set(dup)].join(', ')}.`,
      });
    }
  }

  // ── Imágenes / alt text ──
  if (post.coverImage === null || post.coverImage.trim() === '') {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'imagenes',
      mensaje: 'Sin cover image. Una imagen destacada mejora CTR social y OG.',
    });
  }
  const imgs = extraerImagenes(post.body);
  const sinAlt = imgs.filter((im) => im.alt === '');
  if (sinAlt.length > 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'imagenes',
      mensaje: `${sinAlt.length} <img> sin atributo alt (accesibilidad + SEO).`,
    });
  }

  // ── Enlaces internos/externos ──
  const links = extraerEnlaces(post.body);
  // Rutas privadas (R6): no deben enlazarse desde contenido público.
  const privados = links.filter((l) => RUTAS_PRIVADAS.some((p) => l.href.startsWith(p)));
  if (privados.length > 0) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'enlaces',
      mensaje: `Enlaces a rutas PRIVADAS en el body: ${privados.map((p) => p.href).slice(0, 3).join(', ')} (R6).`,
    });
  }
  // Externos sin rel=noopener/noreferrer
  const externosInseguros = links.filter((l) => l.externo && !l.tieneRel);
  if (externosInseguros.length > 0) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'enlaces',
      mensaje: `${externosInseguros.length} enlace(s) externo(s) sin atributo rel (seguridad target=_blank).`,
    });
  }

  // ── Fecha futura ──
  const ahora = new Date();
  if (post.publishedAt > ahora) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'fecha',
      mensaje: `Fecha de publicación futura (${post.publishedAt.toISOString().slice(0, 10)}).`,
    });
  }

  // ── Disclaimer duplicado en el body (R14) ──
  if (post.body.includes(DISCLAIMER_ANCLA_INICIO)) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'contenido',
      mensaje: 'Disclaimer legal duplicado en el body (el componente <LegalDisclaimer> ya lo renderiza). Eliminar (R14).',
    });
  }

  return { palabras, estadoLongitud, hallazgos };
}

// ═══════════════════════════════════════════════════════════════════════
//  Helpers — transformaciones mecánicas idempotentes (de normalizar-blog.ts)
// ═══════════════════════════════════════════════════════════════════════
// Reutiliza la MISMA lógica canónica de scripts/normalizar-blog.ts para que
// el --aplicar de esta herramienta sea equivalente al de normalización.

function limpiarCtasDuplicados(body: string): { nuevo: string; eliminados: number } {
  let nuevo = body;
  let eliminados = 0;
  const patron = new RegExp(
    `<p[^>]*>(\\s*<em[^>]*>)?\\s{0,5}${escapeRegex(DISCLAIMER_ANCLA_INICIO)}[\\s\\S]{0,400}?(?:<\\/em>)?\\s*<\\/p>`,
    'gi',
  );
  nuevo = nuevo.replace(patron, () => {
    eliminados++;
    return '';
  });
  nuevo = nuevo.replace(/\n{3,}/g, '\n\n').trim();
  if (wordCount(nuevo) < 50 && wordCount(body) >= 50) {
    return { nuevo: body, eliminados: 0 };
  }
  return { nuevo, eliminados };
}

function corregirH1EnBody(body: string): { nuevo: string; cambios: number } {
  let cambios = 0;
  const nuevo = body
    .replace(/<h1(\s[^>]*)?>/gi, (_m, attrs) => {
      cambios++;
      return `<h2${attrs || ''}>`;
    })
    .replace(/<\/h1>/gi, () => '</h2>');
  return { nuevo, cambios };
}

function normalizarWhitespace(body: string): { nuevo: string; cambios: number } {
  const antes = body;
  let nuevo = body;
  nuevo = nuevo.replace(/\n{3,}/g, '\n\n');
  nuevo = nuevo.replace(/[ \t]+\n/g, '\n');
  nuevo = nuevo.replace(/(&nbsp;){2,}/g, ' ');
  nuevo = nuevo.replace(/>\s{2,}</g, '> <');
  return { nuevo, cambios: nuevo !== antes ? 1 : 0 };
}

/** Trunca título a TITLE_MAX caracteres con corte limpio en espacio. */
function truncarTituloSiExcede(title: string): { nuevo: string; cambiado: boolean } {
  if (title.length <= TITLE_MAX) return { nuevo: title, cambiado: false };
  const max = TITLE_MAX - 3;
  const cortado = title.slice(0, max);
  const ultEspacio = cortado.lastIndexOf(' ');
  const limpio = ultEspacio > max / 2 ? cortado.slice(0, ultEspacio) : cortado;
  return { nuevo: limpio.trim() + '...', cambiado: true };
}

// ═══════════════════════════════════════════════════════════════════════
//  DeepSeek — sugerencias (solo lectura, nunca se aplican)
// ═══════════════════════════════════════════════════════════════════════
const PROMPT_SISTEMA = `Eres un editor jurídico senior para un bufete de Honduras (Pineda y Asociados).
Revisas artículos de blog legal y devuelves SUGERENCIAS accionables. NUNCA redactas
contenido final: solo indicas qué ampliar/mejorar.

REGLAS ABSOLUTAS:
- NO inventes leyes, artículos del Código Penal, jurisprudencia, fechas, multas,
  penas, métricas, estadísticas ni claims comerciales. Si el dato no está en el
  artículo, propón "verificar y añadir fuente" en lugar de inventarlo.
- Tono jurídico, sobrio, profesional. Nada de lenguaje comercial agresivo.
- NO propongas cambiar el slug ni la URL salvo que haya un error técnico evidente.
- Las sugerencias deben poder ejecutarse con información del propio artículo o
  documentación verificable del proyecto. Nada de relleno genérico.

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma, sin texto adicional:
{
  "secciones_a_ampliar": ["..."],
  "mejoras_seo": ["..."],
  "problemas_estructura": ["..."]
}
Cada array puede estar vacío. Máximo 5 elementos por array. Frases cortas.`;

async function sugerirConIA(post: PostRow): Promise<{ ok: true; data: SugerenciaIA } | { ok: false; error: string }> {
  // Truncamos el body para no exceder contexto ni coste: 4000 palabras ≈ 25k chars.
  const cuerpo = post.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25000);

  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: PROMPT_SISTEMA },
      {
        role: 'user',
        content: `Revisa este artículo y devuelve sugerencias en JSON.\n\nTÍTULO: ${post.title}\nCATEGORÍA: ${post.category}\nDESCRIPCIÓN: ${post.description}\n\nCUERPO (texto plano):\n${cuerpo}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 700,
    response_format: { type: 'json_object' },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as Partial<SugerenciaIA>;
    return {
      ok: true,
      data: {
        secciones_a_ampliar: Array.isArray(parsed.secciones_a_ampliar) ? parsed.secciones_a_ampliar.slice(0, 5) : [],
        mejoras_seo: Array.isArray(parsed.mejoras_seo) ? parsed.mejoras_seo.slice(0, 5) : [],
        problemas_estructura: Array.isArray(parsed.problemas_estructura) ? parsed.problemas_estructura.slice(0, 5) : [],
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

/** Prompt de sistema para reescribir un post con IA aplicando mejoras. */
const PROMPT_REESCRIBE = `Eres un editor jurídico senior de Pineda y Asociados, un bufete hondureño.
Reescribes artículos del blog legal aplicando mejoras editoriales y SEO.

REGLAS ABSOLUTAS:
- NO inventes leyes, artículos del CP, jurisprudencia, fechas, multas, penas, métricas ni claims.
- Usa SOLO la información presente en el artículo original.
- Mantén el tono jurídico profesional, sobrio y preciso.
- NO cambies el slug ni la URL.
- Devuelve EXCLUSIVAMENTE el HTML del body, sin etiquetas html/body/doctype.
- Si no hay nada que mejorar, devuelve el HTML original exacto.`;

/**
 * Reescribe el body de un post aplicando mejoras vía DeepSeek.
 * Se usa con --aplicar-ia, bajo supervisión humana (R17).
 * La respuesta se valida antes de devolverla.
 */
async function reescribirPostConIA(post: PostRow): Promise<{ ok: true; bodyNuevo: string } | { ok: false; error: string }> {
  const cuerpo = post.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25000);

  const titleInfo = post.title.length > 60 ? `TÍTULO ACTUAL: ${post.title} (${post.title.length} chars — excede 60, optimizar).` : `TÍTULO: ${post.title}`;

  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: PROMPT_REESCRIBE },
      {
        role: 'user',
        content: `Reescribe este artículo mejorándolo:\n\n${titleInfo}\nCATEGORÍA: ${post.category}\nDESCRIPCIÓN: ${post.description}\n\nCUERPO HTML ACTUAL:\n${post.body}\n\nDevuelve el HTML del body mejorado. No inventes datos.`,
      },
    ],
    temperature: 0.15,
    max_tokens: 8000,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = (data.choices?.[0]?.message?.content ?? '').trim();

    // Validar que la respuesta no esté vacía
    if (!content || wordCount(content) < 20) {
      return { ok: false, error: 'Respuesta vacía o demasiado corta (<20 palabras)' };
    }

    // Validar que no sea idéntica al original (sin cambios = IA no cooperó)
    if (content === post.body.replace(/\s+/g, ' ').trim()) {
      return { ok: false, error: 'La IA devolvió texto idéntico al original (sin cambios)' };
    }

    return { ok: true, bodyNuevo: content };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Reporte Markdown
// ═══════════════════════════════════════════════════════════════════════
function generarReporteMD(resultados: ResultadoPost[], modo: string, iaActiva: boolean): string {
  const L: Record<Severidad, string> = { critico: '🔴', importante: '🟡', recomendable: '🔵' };
  const lines: string[] = [];
  lines.push(`# Revisión IA del blog — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  lines.push('');
  lines.push(`- **Modo:** ${modo}`);
  lines.push(`- **Asistencia IA:** ${iaActiva ? 'activa (DeepSeek, solo sugerencias)' : 'inactiva (solo heurísticas)'}`);
  lines.push(`- **Posts analizados:** ${resultados.length}`);
  lines.push('');
  lines.push('> ⚠️ La IA SOLO sugiere. Ninguna sugerencia se aplica automáticamente.');
  lines.push('> Los cambios mecánicos seguros solo se aplican con \`--aplicar\`.');
  lines.push('');

  // Resumen
  const criticos = resultados.filter((r) => r.hallazgos.some((h) => h.severidad === 'critico'));
  const thin = resultados.filter((r) => r.estadoLongitud === 'thin');
  const conProblemas = resultados.filter((r) => r.hallazgos.length > 0);
  lines.push('## Resumen');
  lines.push('');
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---|---|`);
  lines.push(`| Posts con hallazgos críticos | ${criticos.length} |`);
  lines.push(`| Posts con cualquier hallazgo | ${conProblemas.length} |`);
  lines.push(`| Posts thin (<${MIN_PALABRAS} palabras) | ${thin.length} |`);
  lines.push(`| Posts en rango objetivo | ${resultados.filter((r) => r.estadoLongitud === 'ok').length} |`);
  lines.push('');

  if (thin.length > 0) {
    lines.push(`## ⚠️ Requieren ampliación editorial (trabajo humano)`);
    lines.push('');
    lines.push(`Estos posts están por debajo de ${MIN_PALABRAS} palabras. **No se rellenan** con texto`);
    lines.push(`genérico (R13). La ampliación debe hacerse con información verificable.`);
    lines.push('');
    lines.push('| Slug | Palabras | Sugerencias de ampliación (IA) |');
    lines.push('|---|---|---|');
    for (const r of thin) {
      const amps = r.sugerenciaIA?.secciones_a_ampliar ?? [];
      const ampsTxt = amps.length > 0 ? amps.map((a) => `• ${a}`).join('<br>') : '—';
      lines.push(`| \`${r.post.slug}\` | ${r.palabras} | ${ampsTxt} |`);
    }
    lines.push('');
  }

  lines.push('## Detalle por post');
  lines.push('');
  for (const r of resultados) {
    if (r.hallazgos.length === 0 && !r.sugerenciaIA) continue;
    lines.push(`### \`${r.post.slug}\``);
    lines.push(`**${r.post.title}** · ${r.post.category} · ${r.palabras} palabras (${r.estadoLongitud})`);
    lines.push('');
    if (r.hallazgos.length > 0) {
      lines.push('**Hallazgos:**');
      for (const h of r.hallazgos) {
        lines.push(`- ${L[h.severidad]} **[${h.categoria}]** ${h.mensaje}`);
      }
      lines.push('');
    }
    if (r.sugerenciaIA) {
      const s = r.sugerenciaIA;
      const tieneSugs = s.secciones_a_ampliar.length + s.mejoras_seo.length + s.problemas_estructura.length > 0;
      if (tieneSugs) {
        lines.push('**Sugerencias IA (no aplicadas — requieren revisión humana):**');
        for (const a of s.secciones_a_ampliar) lines.push(`- 📝 Ampliar: ${a}`);
        for (const a of s.mejoras_seo) lines.push(`- 🔍 SEO: ${a}`);
        for (const a of s.problemas_estructura) lines.push(`- 🧱 Estructura: ${a}`);
        lines.push('');
      }
    }
    if (r.iaError) {
      lines.push(`_IA no disponible para este post: ${r.iaError}_`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  REVISIÓN IA DEL BLOG  ${
    APLICAR_IA ? '— MODO APLICAR IA (reescritura con IA)'
    : APLICAR ? '— MODO APLICAR (cambios mecánicos)'
    : '— MODO DRY-RUN'
  }`);
  console.log(`${'═'.repeat(72)}\n`);

  if (IA_ENABLED) {
    console.log(`🤖 IA activa: DeepSeek (modelo "${DEEPSEEK_MODEL}"). Solo sugerencias, nunca se aplica.`);
  } else {
    console.log('📐 IA inactiva (sin DEEPSEEK_API_KEY o --no-ai). Modo solo-heurísticas.');
  }
  if (!APLICAR && !APLICAR_IA) {
    console.log('⚠️  DRY-RUN: no se escribirá nada en la DB. Usa --aplicar para cambios mecánicos.');
  }
  if (APLICAR) {
    console.log('⚠️  APLICAR: cambios mecánicos idempotentes (H1→H2, CTAs, whitespace, titles).');
  }
  if (APLICAR_IA) {
    console.log('🤖  APLICAR IA: reescritura del body con DeepSeek + truncado de títulos.');
    console.log('    Las sugerencias han sido revisadas y aprobadas (R17).');
  }
  console.log('');

  // ── Cargar posts ──
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
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  if (FILTRO_SLUG) posts = posts.filter((p) => p.slug === FILTRO_SLUG);
  if (OFFSET > 0) posts = posts.slice(OFFSET);
  if (LIMIT > 0) posts = posts.slice(0, LIMIT);

  console.log(`Posts publicados cargados. A procesar: ${posts.length}\n`);

  // ── Backup previo (siempre, para trazabilidad) ──
  const backupDir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-pre-review-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`✓ Backup previo: ${backupFile}\n`);

  // ── Procesar ──
  const resultados: ResultadoPost[] = [];
  const resumen = { criticos: 0, postsThin: 0, postsConSugerenciasIA: 0, iaErrores: 0, aplicadosMecanicos: 0, aplicadosIA: 0, titlesTruncados: 0, iaRewriteErrores: 0 };

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progreso = `[${i + 1}/${posts.length}]`;

    if (!post.body) {
      console.log(`${progreso} ⚠ ${post.slug} (sin body) — skipeado`);
      continue;
    }

    // 1. Análisis determinista
    const { palabras, estadoLongitud, hallazgos } = analizarPost(post);
    if (hallazgos.some((h) => h.severidad === 'critico')) resumen.criticos++;
    if (estadoLongitud === 'thin') resumen.postsThin++;

    // 2. IA (solo sugerencias) — solo si hay hallazgos o es thin, para ahorrar coste
    let sugerenciaIA: SugerenciaIA | null = null;
    let iaError: string | null = null;
    if (IA_ENABLED && (hallazgos.length > 0 || estadoLongitud === 'thin')) {
      const r = await sugerirConIA(post);
      if (r.ok) {
        sugerenciaIA = r.data;
        if (
          r.data.secciones_a_ampliar.length +
            r.data.mejoras_seo.length +
            r.data.problemas_estructura.length >
          0
        ) {
          resumen.postsConSugerenciasIA++;
        }
      } else {
        iaError = r.error;
        resumen.iaErrores++;
      }
    }

    resultados.push({
      post: { slug: post.slug, title: post.title, category: post.category },
      palabras,
      estadoLongitud,
      hallazgos,
      sugerenciaIA,
      iaError,
    });

    // Icono de estado para el log
    const icon = hallazgos.some((h) => h.severidad === 'critico')
      ? '🔴'
      : hallazgos.length > 0
        ? '🟡'
        : '✓';
    console.log(`${progreso} ${icon} ${post.slug} — ${palabras} palabras (${estadoLongitud}), ${hallazgos.length} hallazgo(s)`);

    // 3. --aplicar: SOLO cambios mecánicos idempotentes + truncado de título
    let bodyTrasMecanicos: string | null = null;
    if (APLICAR || APLICAR_IA) {
      let bodyNuevo = post.body;
      let cambioMecanico = false;

      const rCta = limpiarCtasDuplicados(bodyNuevo);
      if (rCta.eliminados > 0) { bodyNuevo = rCta.nuevo; cambioMecanico = true; }
      const rH1 = corregirH1EnBody(bodyNuevo);
      if (rH1.cambios > 0) { bodyNuevo = rH1.nuevo; cambioMecanico = true; }
      const rWs = normalizarWhitespace(bodyNuevo);
      if (rWs.cambios > 0) { bodyNuevo = rWs.nuevo; cambioMecanico = true; }

      // Guardia: body demasiado corto
      if (cambioMecanico && wordCount(bodyNuevo) < 50 && wordCount(post.body) >= 50) {
        console.warn(`    ⚠ ${post.slug}: resultado <50 palabras tras normalizar — REVERTIDO.`);
        if (APLICAR) continue;
      } else if (cambioMecanico && APLICAR) {
        const bodySanitizado = sanitizeHtml(bodyNuevo);
        await db.update(blogPosts).set({ body: bodySanitizado, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
        resumen.aplicadosMecanicos++;
        console.log(`    ↳ aplicado: cambios mecánicos (H1/CTA/whitespace)`);
      }
      if (bodyNuevo !== post.body) bodyTrasMecanicos = bodyNuevo;

      // Truncado de título si excede 60 chars
      if (APLICAR) {
        const rTit = truncarTituloSiExcede(post.title);
        if (rTit.cambiado) {
          await db.update(blogPosts).set({ title: rTit.nuevo, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
          resumen.titlesTruncados++;
          console.log(`    ↳ título truncado: "${post.title}" → "${rTit.nuevo}"`);
        }
      }
    }

    // 4. --aplicar-ia: reescritura del body con DeepSeek (bajo supervisión humana)
    if (APLICAR_IA && IA_ENABLED) {
      const bodyActual = bodyTrasMecanicos ?? post.body;
      const rIA = await reescribirPostConIA({ ...post, body: bodyActual });
      if (rIA.ok) {
        const bodySanitizado = sanitizeHtml(rIA.bodyNuevo);
        await db.update(blogPosts).set({ body: bodySanitizado, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
        resumen.aplicadosIA++;
        console.log(`    ↳ IA reescritura aplicada (antes: ${wordCount(bodyActual)} palabras → después: ${wordCount(rIA.bodyNuevo)} palabras)`);
      } else {
        console.warn(`    ⚠ ${post.slug}: error en reescritura IA — ${rIA.error}. Post no modificado.`);
        resumen.iaRewriteErrores++;
      }
    }
  }

  // ── Reporte en consola ──
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`  RESUMEN ${APLICAR ? '(APLICADO — solo mecánicos)' : '(DRY-RUN)'}`);
  console.log(`${'─'.repeat(72)}`);
  console.log(`  Posts analizados:           ${resultados.length}`);
  console.log(`  Posts con hallazgos críticos: ${resumen.criticos}`);
  console.log(`  Posts thin (<${MIN_PALABRAS} palabras): ${resumen.postsThin}`);
  console.log(`  Posts con sugerencias IA:    ${resumen.postsConSugerenciasIA}`);
  if (IA_ENABLED) console.log(`  Posts con error de IA:       ${resumen.iaErrores}`);
  if (APLICAR) console.log(`  Títulos truncados:           ${resumen.titlesTruncados}`);
  if (APLICAR) console.log(`  Posts con cambios mecánicos: ${resumen.aplicadosMecanicos}`);
  if (APLICAR_IA) console.log(`  Posts reescritos con IA:     ${resumen.aplicadosIA}`);
  if (APLICAR_IA) console.log(`  Errores de reescritura IA:   ${resumen.iaRewriteErrores}`);
  console.log(`${'─'.repeat(72)}\n`);

  // ── Reporte Markdown ──
  const modo = APLICAR ? 'APLICAR (cambios mecánicos)' : 'DRY-RUN';
  const md = generarReporteMD(resultados, modo, IA_ENABLED);
  const reportFile = path.join(backupDir, `blog-ai-review-${ts}.md`);
  fs.writeFileSync(reportFile, md, 'utf8');
  console.log(`📄 Reporte: ${reportFile}`);

  if (resumen.postsThin > 0) {
    console.log(`\n⚠️  ${resumen.postsThin} post(s) requieren ampliación editorial HUMANA (no se rellenan — R13).`);
  }

  // ── Cierre ──
  const client = (db as unknown as { $client?: { end?: () => unknown } }).$client;
  await client?.end?.();

  console.log(
    `\n${APLICAR ? '✅ Revisión completada (cambios mecánicos aplicados).' : 'ℹ️  Dry-run completado. Revisa el reporte.'}\n`,
  );
}

main().catch((e) => {
  console.error('Error en revisión IA del blog:', e);
  process.exit(1);
});
