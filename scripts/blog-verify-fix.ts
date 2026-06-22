/**
 * Verificación de datos legales + corrección IA + normalización del blog.
 *
 * FUENTE DE VERDAD: tabla `blog_posts` (PostgreSQL/Neon) vía Drizzle ORM.
 * Datos canónicos de verificación: `data/delitos.json` (483 delitos, 100% verificados),
 * `data/articulos_cp.json` (635+ artículos CP), `data/articulos_constitucion.json`
 * (378 artículos Constitución). Categorías válidas: `data/blog/categories.ts`.
 * NAP del bufete: `lib/site.ts`.
 *
 * PROBLEMA QUE RESUELVE: artículos del blog generados por IA que contienen
 * información legal falsa (artículos inexistentes, penas incorrectas, citas
 * inventadas). Este script verifica los datos contra las fuentes canónicas
 * y corrige con DeepSeek solo lo que está objetivamente mal.
 *
 * FILOSOFÍA (hereda de AGENTS.md R13–R17):
 *   - Verificación determinista primero (sin IA), corrección IA después.
 *   - La IA SOLO corrige datos objetivamente falsos detectados en la verificación.
 *   - NO reescribe artículos completos — mantiene estructura e intención original.
 *   - Expansión a 800-1000 palabras solo si el post es thin, usando información
 *     del propio artículo. NUNCA relleno genérico.
 *   - PROHIBIDO inventar leyes, artículos, jurisprudencia, penas, métricas o claims.
 *   - Un post NO se acepta como "ok" hasta que pasa TODOS los validadores
 *     (longitud, SEO meta, headings, disclaimer, enlaces, E-E-A-T, HTML, etc.).
 *
 * USO:
 *   npm run blog:verify-fix                         # DRY-RUN (análisis + fact-check + IA)
 *   npm run blog:verify-fix -- --aplicar            # Aplica cambios (mecánicos + IA)
 *   npm run blog:verify-fix -- --aplicar --slug <s> # Un solo artículo
 *   npm run blog:verify-fix -- --limit 10           # Procesar primeros 10
 *   npm run blog:verify-fix -- --limit 10 --offset 10  # Lotes manuales
 *   npm run blog:verify-fix -- --no-ai              # Solo fact-check + mecánico
 *   npm run blog:verify-fix -- --solo-verificar     # Solo fact-check, nada de cambios
 *   npm run blog:verify-fix -- --reset-checkpoint   # Ignorar checkpoint previo
 *   npx tsx scripts/blog-verify-fix.ts --help
 *
 * VARIABLES DE ENTORNO:
 *   DATABASE_URL       (obligatoria) — acceso a Neon.
 *   DEEPSEEK_API_KEY   (opcional)    — habilita corrección IA. Sin ella,
 *                                      el script solo verifica y normaliza.
 *   DEEPSEEK_MODEL     (opcional)    — modelo a usar (default: deepseek-chat).
 *   DEEPSEEK_API_BASE  (opcional)    — endpoint alternativo.
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: NUNCA escribe sin --aplicar.
 *   - Backup completo previo en auditoria-blog/.
 *   - Sanitización HTML antes de cualquier escritura en DB.
 *   - Guardia: body resultante <50 palabras → revertido.
 *   - Guardia: body IA que sigue <800 palabras → rechazado (R13).
 *   - Guardia: body IA que introduce regresiones SEO/privacidad → rechazado.
 *   - Guardia: body IA ≥98% similar al original → rechazado (cambio irrelevante).
 *   - Validación post-escritura: relee el post de DB y re-analiza; si no pasa
 *     los validadores, revierte al original automáticamente.
 *   - Checkpoint reanudable en auditoria-blog/checkpoint.json para lotes grandes.
 *   - Trazabilidad: cada cambio registra before/after.
 *   - API key siempre de process.env, nunca hardcodeada.
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { sanitizeHtml } from '../lib/sanitize';
import { site } from '../lib/site';
import { LEGAL_DISCLAIMER, LEGAL_DISCLAIMER_SHORT } from '../lib/legal-disclaimer';
import { blogCategories } from '../data/blog/categories';
import {
  extractImages,
} from './seo-content-audit';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env.local si existe (sobreescribe .env para desarrollo local)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

// ═══════════════════════════════════════════════════════════════════════════
//  CLI
// ═══════════════════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const NO_AI = args.includes('--no-ai');
const SOLO_VERIFICAR = args.includes('--solo-verificar');
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
const RESET_CHECKPOINT = args.includes('--reset-checkpoint');
const MAX_REINTENTOS_IA = (() => {
  const i = args.indexOf('--max-reintentos');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 2;
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 2;
})();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Verificación de datos legales + corrección IA + normalización del blog.

Uso:
  npm run blog:verify-fix [opciones]

Opciones:
  --aplicar          Aplica los cambios (mecánicos + IA). Sin esto, es dry-run.
  --slug <slug>      Procesar un único artículo.
  --no-ai            Omitir DeepSeek (solo verificación + cambios mecánicos).
  --solo-verificar   Solo fact-checking, sin modificar nada (ni siquiera mecánico).
  --limit <n>        Procesar solo los primeros <n> posts (control de coste API).
  --offset <n>       Saltar los primeros <n> posts (para reanudar lotes).
  --reset-checkpoint  Ignorar checkpoint previo (empezar desde el principio).
  --max-reintentos <n> Reintentos de IA si un post thin no llega a 800 (1-5, default 2).
  --help, -h         Esta ayuda.

Variables de entorno:
  DATABASE_URL        (obligatoria) Acceso a Neon PostgreSQL.
  DEEPSEEK_API_KEY    (opcional)    Habilita corrección IA.
  DEEPSEEK_MODEL      (opcional)    Modelo a usar (default: deepseek-chat).
  DEEPSEEK_API_BASE   (opcional)    Endpoint alternativo de API.

Sin --aplicar, el script es de solo lectura (dry-run). La verificación de datos
siempre se ejecuta (es determinista, no consume API).`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DB
// ═══════════════════════════════════════════════════════════════════════════
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL no configurada (o placeholder). Este script requiere acceso real a Neon.');
  process.exit(1);
}
const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ═══════════════════════════════════════════════════════════════════════════
//  DeepSeek (opcional)
// ═══════════════════════════════════════════════════════════════════════════
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_ENDPOINT =
  process.env.DEEPSEEK_API_BASE ??
  'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash';
const IA_ENABLED = !NO_AI && !SOLO_VERIFICAR && Boolean(DEEPSEEK_API_KEY);

// ═══════════════════════════════════════════════════════════════════════════
//  Constantes editoriales
// ═══════════════════════════════════════════════════════════════════════════
const MIN_PALABRAS = 600;
const MAX_PALABRAS = 1200;
const TITLE_MAX = 60;
const TITLE_MIN = 30;
const META_MAX = 155;
const META_MIN = 70;
const DESCRIPTION_MAX = 160;
const SLUG_MAX = 200;
const TAGS_MIN = 3;
const TAGS_MAX = 7;

/**
 * Marcadores de disclaimer/aviso legal que NO deben aparecer en el body del
 * post (R14). El componente <LegalDisclaimer> (lib/legal-disclaimer.ts) ya los
 * renderiza en todas las páginas de detalle; duplicarlos en el body es
 * redundante, genera contenido duplicado y penaliza SEO.
 *
 * Fuentes (R2 — una sola fuente de verdad):
 *   - Texto canónico actual: `lib/legal-disclaimer.ts` (LEGAL_DISCLAIMER /
 *     LEGAL_DISCLAIMER_SHORT). Se usan prefijos estables porque el texto
 *     canónico puede llevar la fecha de revisión inyectada
 *     ("al 3 de junio de 2026" en lugar de "al momento de su última revisión"),
 *     lo que rompería un match exacto del texto base.
 *   - Marcadores legacy: `scripts/detectar-posts-plantilla.ts`
 *     (DUPLICATE_CTA_MARKERS). Frases que aparecían en los 75 posts antiguos
 *     antes de la migración a DB (Release 89) y que `normalizar-blog.ts` ya
 *     elimina. Se mantienen aquí como guardia de regresión.
 */
const DISCLAIMER_MARCADORES = [
  // Canónico actual (lib/legal-disclaimer.ts). El texto base lleva la fecha de
  // revisión inyectada ("al 3 de junio de 2026" en lugar de "al momento de su
  // última revisión"), por eso se deriva un prefijo estable cortando en ese
  // punto de inyección. Así el match sobrevive a la variación de fecha.
  LEGAL_DISCLAIMER.split(' al momento de su última revisión')[0],
  // Cobertura sin el prefijo "Aviso legal:" por si un autor lo omitió al copiar
  'este contenido tiene carácter informativo, orientativo y educativo',
  LEGAL_DISCLAIMER_SHORT,
  // Legacy (scripts/detectar-posts-plantilla.ts — DUPLICATE_CTA_MARKERS)
  'Este artículo tiene carácter informativo y no sustituye',
  'Para obtener orientación específica sobre su caso, contacte con un abogado',
  'Solicite una consulta inicial',
];

// Rutas privadas que NO deben aparecer en enlaces internos del blog (R6 AGENTS.md).

// ═══════════════════════════════════════════════════════════════════════════
//  Fuentes canónicas (R2 — una sola fuente de verdad)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Categorías válidas del blog (fuente única: data/blog/categories.ts).
 * Importado directamente para no duplicar la fuente de verdad (R2). Si cambia
 * la fuente, este set se actualiza automáticamente. Refuerza E-E-A-T: una
 * categoría inválida rompe el mapeo a autor Person y el schema BlogPosting.
 */
const CATEGORIAS_BLOG_VALIDAS = new Set(blogCategories.map((c) => c.slug));

/** NAP del bufete (lib/site.ts) — fuente canónica para verificación SEO local. */
const NAP = {
  nombre: site.name,
  ciudad: site.address.city,
  departamento: site.address.department,
  pais: site.address.country,
};

/** Stop-words que NO se cuentan como keyword stuffing aunque se repitan. */
const STOPWORDS_STUFFING = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
  'a', 'ante', 'bajo', 'con', 'contra', 'desde', 'en', 'entre', 'hacia',
  'hasta', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'y', 'o',
  'u', 'ni', 'que', 'se', 'es', 'son', 'ser', 'estar', 'ha', 'han', 'hay',
  'no', 'si', 'sí', 'como', 'cuando', 'donde', 'quien', 'qué', 'cuál',
  'más', 'menos', 'muy', 'puede', 'pueden', 'debe', 'deben', 'este', 'esta',
  'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'su', 'sus', 'le', 'les',
  'lo', 'me', 'te', 'nos', 'os', 'se', 'le', 'han', 'has', 'fue', 'fueron',
  'era', 'será', 'serán', 'honduras', 'hondureño', 'hondureña', // geográfico común
]);

// ═══════════════════════════════════════════════════════════════════════════
//  Tipos
// ═══════════════════════════════════════════════════════════════════════════
export interface PostRow {
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
  canonicalUrl?: string | null;
  author?: string | null;
  ogImage?: string | null;
}

interface DelitoRow {
  nombre: string;
  articulo: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tipo_pena_principal: string;
  tiene_prision: boolean;
  prision_min_valor: number;
  prision_max_valor: number;
  prision_unidad: string;
  tiene_multa: boolean;
  multa_min_valor: number;
  multa_max_valor: number;
  conducta: string;
}

interface ArticuloCpRow {
  articulo: string;
  epigrafe: string;
  texto: string;
  tema: string;
}

interface ArticuloConstRow {
  numero: number;
  articulo: string;
  texto: string;
}

export type Severidad = 'critico' | 'importante' | 'recomendable';

export interface ClaimExtraido {
  tipo: 'articulo_cp' | 'articulo_const' | 'pena_rango' | 'pena_simple' | 'nombre_delito' | 'decreto';
  textoOriginal: string;    // el texto tal cual aparece en el body
  contexto: string;          // 100 chars alrededor para ubicarlo
}

export interface Discrepancia {
  claim: ClaimExtraido;
  severidad: Severidad;
  mensaje: string;
  valorEncontrado: string;   // lo que dice el artículo
  valorCorrecto: string;     // lo que dice la fuente canónica
  fuente: string;            // archivo de datos usado para verificar
}

export interface ResultadoVerificacion {
  post: { slug: string; title: string; category: string };
  claimsExtraidos: ClaimExtraido[];
  discrepancias: Discrepancia[];
  sinClaims: boolean;
}

export interface SugerenciaIA {
  cambiosRealizados: string[];
  advertencias: string[];
  bodyCorregido: string | null;  // null si no se pudo/aplicó corrección
  ampliadoConExito: boolean;
  /**
   * Body generado por la IA aunque haya sido rechazado por guardias (thin,
   * alucinaciones, etc.). Se usa para reintentos: si la IA llegó cerca del
   * umbral (≥700 palabras), se reenvía a la IA como punto de partida para
   * que expanda más, en lugar de empezar desde el body original.
   */
  bodyPrevio?: string | null;
  /**
   * Palabras del bodyPrevio (para decidir si vale la pena reintentar).
   */
  palabrasPrevias?: number;
  /**
   * Discrepancias NUEVAS introducidas por la IA (no presentes en el original).
   * Se detectan re-ejecutando extraerClaims + verificarClaims sobre el body
   * corregido y comparando con las discrepancias originales. Si la IA inventó
   * un artículo del CP, una pena incorrecta, o un delito no verificado, aparece
   * aquí. CRÍTICO: si hay alucinaciones nuevas, el body corregido se rechaza.
   */
  alucinacionesNuevas: Discrepancia[];
  /**
   * Regresiones SEO/privacidad NUEVAS introducidas por la IA (enlace a ruta
   * privada, H1 en body, etc.). Se detectan re-ejecutando analizarSEO sobre el
   * body corregido y comparando hallazgos críticos con los originales.
   */
  regresionesSEO: HallazgoSEO[];
}

export interface ResultadoPost {
  post: { slug: string; title: string; category: string };
  palabras: number;
  estadoLongitud: 'ok' | 'thin' | 'verbose';
  verificacion: ResultadoVerificacion;
  hallazgosSEO: HallazgoSEO[];
  sugerenciaIA: SugerenciaIA | null;
  iaError: string | null;
  cambiosMecanicos: string[];
  cambiosAplicados: boolean;
  /** true si el post pasa TODOS los validadores (0 hallazgos críticos/importantes). */
  ok: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Carga de datos canónicos (una vez al inicio)
// ═══════════════════════════════════════════════════════════════════════════

const delitosData: DelitoRow[] = [];
const delitosPorArticulo = new Map<string, DelitoRow>(); // clave: "art. 214 cp"
const delitosPorNombre = new Map<string, DelitoRow>();
const articulosCpData: ArticuloCpRow[] = [];
const articulosCpSet = new Set<string>();                 // claves: "art. 1 cp"
const articulosCpMap = new Map<string, ArticuloCpRow>();
const articulosConstData: ArticuloConstRow[] = [];
const articulosConstSet = new Set<string>();              // claves: "art. 1 constitucion"
const articulosCtData: ArticuloCpRow[] = [];              // Código de Trabajo
const articulosCtSet = new Set<string>();                 // claves: "art. 80 ct"
const articulosCtMap = new Map<string, ArticuloCpRow>();  // clave → artículo CT
// Códigos adicionales extraídos de PDFs oficiales (docs/)
const articulosCcSet = new Set<string>();                 // Código Civil: "art. 1 cc"
const articulosCcMap = new Map<string, ArticuloCpRow>();  // clave → artículo CC
const articulosCmSet = new Set<string>();                 // Código de Comercio: "art. 1 cm"
const articulosCmMap = new Map<string, ArticuloCpRow>();  // clave → artículo CM
const articulosCtribSet = new Set<string>();              // Código Tributario: "art. 1 ctrib"
const articulosCtribMap = new Map<string, ArticuloCpRow>(); // clave → artículo CTrib

export function cargarDatosCanonicos(): void {
  const dataDir = path.join(process.cwd(), 'data');

  // Delitos
  const delitosPath = path.join(dataDir, 'delitos.json');
  if (fs.existsSync(delitosPath)) {
    const parsed: DelitoRow[] = JSON.parse(fs.readFileSync(delitosPath, 'utf8'));
    delitosData.push(...parsed);
    for (const d of delitosData) {
      // Indexar por clave canónica "art. NNN cp" (match exacto, no substring).
      const key = canonicalArticuloKey(d.articulo);
      if (key && !delitosPorArticulo.has(key)) {
        delitosPorArticulo.set(key, d);
      }
      // Indexar por nombre (lowercase, sin acentos para búsqueda flexible)
      const nombreNorm = d.nombre.toLowerCase().trim();
      if (!delitosPorNombre.has(nombreNorm)) {
        delitosPorNombre.set(nombreNorm, d);
      }
    }
    console.log(`✓ Cargados ${delitosData.length} delitos (${delitosPorArticulo.size} índices por artículo, ${delitosPorNombre.size} por nombre)`);
  } else {
    console.warn('⚠ data/delitos.json no encontrado. Verificación de delitos deshabilitada.');
  }

  // Artículos CP
  const cpPath = path.join(dataDir, 'articulos_cp.json');
  if (fs.existsSync(cpPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
    articulosCpData.push(...parsed);
    for (const a of articulosCpData) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) {
        articulosCpSet.add(key);
        if (!articulosCpMap.has(key)) articulosCpMap.set(key, a);
      }
    }
    console.log(`✓ Cargados ${articulosCpData.length} artículos del CP (${articulosCpSet.size} claves únicas)`);
  } else {
    console.warn('⚠ data/articulos_cp.json no encontrado.');
  }

  // Artículos Constitución
  const constPath = path.join(dataDir, 'articulos_constitucion.json');
  if (fs.existsSync(constPath)) {
    const parsed: ArticuloConstRow[] = JSON.parse(fs.readFileSync(constPath, 'utf8'));
    articulosConstData.push(...parsed);
    for (const a of articulosConstData) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) articulosConstSet.add(key);
    }
    console.log(`✓ Cargados ${articulosConstData.length} artículos de la Constitución (${articulosConstSet.size} claves únicas)`);
  } else {
    console.warn('⚠ data/articulos_constitucion.json no encontrado.');
  }

  // Código de Trabajo — fuente prioritaria: artículos verificados manualmente
  // (el PDF de docs/codigo_de_trabajo.pdf tiene numeración diferente a la
  // edición oficial citada comúnmente. Los verificados corrigen esto).
  const ctVerPath = path.join(dataDir, 'codigo_trabajo_verificado.json');
  const articulosCtCargados = new Set<string>();
  if (fs.existsSync(ctVerPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(ctVerPath, 'utf8'));
    for (const a of parsed) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) {
        articulosCtSet.add(key);
        articulosCtMap.set(key, a);
        articulosCtCargados.add(key);
      }
    }
    console.log(`✓ Cargados ${parsed.length} artículos del Código de Trabajo (verificados, ${articulosCtCargados.size} claves)`);
  }
  // Código de Trabajo — fuente secundaria: extracción del PDF oficial
  // (solo para artículos que no están en el archivo verificado)
  const ctPath = path.join(dataDir, 'codigo_trabajo.json');
  if (fs.existsSync(ctPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(ctPath, 'utf8'));
    let anadidos = 0;
    for (const a of parsed) {
      const key = canonicalArticuloKey(a.articulo);
      if (key && !articulosCtCargados.has(key)) {
        articulosCtSet.add(key);
        if (!articulosCtMap.has(key)) articulosCtMap.set(key, a);
        anadidos++;
      }
    }
    console.log(`✓ Cargados ${anadidos} artículos adicionales del CT desde el PDF (${articulosCtSet.size} claves totales)`);
  } else {
    console.warn('⚠ data/codigo_trabajo.json no encontrado.');
  }

  // Código Civil (Decreto 84-2017) — extraído de docs/codigo_civil_honduras.pdf
  const ccPath = path.join(dataDir, 'codigo_civil.json');
  if (fs.existsSync(ccPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(ccPath, 'utf8'));
    for (const a of parsed) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) {
        articulosCcSet.add(key);
        if (!articulosCcMap.has(key)) articulosCcMap.set(key, a);
      }
    }
    console.log(`✓ Cargados ${parsed.length} artículos del Código Civil (${articulosCcSet.size} claves únicas)`);
  } else {
    console.warn('⚠ data/codigo_civil.json no encontrado.');
  }

  // Código de Comercio (Decreto 106-1972) — extraído de docs/codigo del comercio honduras.pdf
  const cmPath = path.join(dataDir, 'codigo_comercio.json');
  if (fs.existsSync(cmPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(cmPath, 'utf8'));
    for (const a of parsed) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) {
        articulosCmSet.add(key);
        if (!articulosCmMap.has(key)) articulosCmMap.set(key, a);
      }
    }
    console.log(`✓ Cargados ${parsed.length} artículos del Código de Comercio (${articulosCmSet.size} claves únicas)`);
  } else {
    console.warn('⚠ data/codigo_comercio.json no encontrado.');
  }

  // Código Tributario (Decreto 51-2003) — extraído de docs/Texto_Consolidado_Codigo_Tributario.pdf
  const ctribPath = path.join(dataDir, 'codigo_tributario.json');
  if (fs.existsSync(ctribPath)) {
    const parsed: ArticuloCpRow[] = JSON.parse(fs.readFileSync(ctribPath, 'utf8'));
    for (const a of parsed) {
      const key = canonicalArticuloKey(a.articulo);
      if (key) {
        articulosCtribSet.add(key);
        if (!articulosCtribMap.has(key)) articulosCtribMap.set(key, a);
      }
    }
    console.log(`✓ Cargados ${parsed.length} artículos del Código Tributario (${articulosCtribSet.size} claves únicas)`);
  } else {
    console.warn('⚠ data/codigo_tributario.json no encontrado.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Helpers — normalización de texto
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convierte una referencia a artículo en una CLAVE CANÓNICA de comparación.
 * Unifica las distintas formas de citar el mismo artículo para que la
 * verificación sea por match EXACTO (no por substring, que producía falsos
 * negativos — ver auditoría).
 *
 *   "Art. 214 CP"                    → "art. 214 cp"
 *   "Artículo 214 del Código Penal"  → "art. 214 cp"
 *   "Art. 15 de la Constitución"     → "art. 15 constitucion"
 *   "Art. 102 CPP"                   → "art. 102 cpp"
 *
 * Devuelve null si no extrae un número de artículo.
 */
export function canonicalArticuloKey(texto: string): string | null {
  const m = texto.match(
    /art(?:ículo)?\.?\s*(\d+(?:-\w+)?)\s*(?:del?(?:\s+la)?\s+)?(código\s+penal|cp|código\s+procesal\s+penal|cpp|código\s+civil|cc|código\s+de\s+familia|cf|código\s+de\s+trabajo|ct|código\s+de\s+comercio|cm|código\s+de\s+la\s+niñez|cn|código\s+tributario|ctrib|código\s+aduanero|ca|constitución|constitucion)?/i,
  );
  if (!m) return null;
  const num = m[1];
  let code = (m[2] ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (code === '' || code === 'código penal' || code === 'cp') code = 'cp';
  else if (code === 'código procesal penal' || code === 'cpp') code = 'cpp';
  else if (code === 'código civil' || code === 'cc') code = 'cc';
  else if (code === 'código de familia' || code === 'cf') code = 'cf';
  else if (code === 'código de trabajo' || code === 'ct') code = 'ct';
  else if (code === 'código de comercio' || code === 'cm') code = 'cm';
  else if (code === 'código de la niñez' || code === 'cn') code = 'cn';
  else if (code === 'código tributario' || code === 'ctrib') code = 'ctrib';
  else if (code === 'código aduanero' || code === 'ca') code = 'ca';
  else if (code === 'constitución' || code === 'constitucion') code = 'constitucion';
  else {
    // Abreviatura no reconocida: conservarla tal cual (no inventar 'cp').
    // Si no hay abreviatura, usar 'cp' como default (texto sin código explícito
    // como "Art. 214" → se asume Código Penal por contexto).
  }
  return `art. ${num} ${code}`.replace(/\s+/g, ' ').trim();
}

/** Cuenta palabras reales del HTML: strip tags, entidades, colapsa espacios. */
export function wordCount(html: string): number {
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

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Similitud entre dos bodies (0..1). Heurística por Jaccard sobre bolsas de
 * palabras (sin stop-words triviales ni tags), normalizada por longitud.
 *
 * Se usa para la Guardia 4 (R17d): si el body corregido por la IA es ≥0.98
 * similar al original, el cambio es irrelevante y NO se escribe en DB
 * (ahorra escrituras inútiles y evita falsos "cambios aplicados").
 *
 * No es un diff estructural — dos bodies con las mismas palabras reordenadas
 * darían 1.0. Para el propósito (detectar "la IA no cambió nada sustancial")
 * es suficiente y O(n) en lugar de O(n·m) como Levenshtein.
 */
export function similitudCuerpo(a: string, b: string): number {
  const ta = new Set(stripHtml(a).toLowerCase().split(/\s+/).filter((w) => w.length >= 3));
  const tb = new Set(stripHtml(b).toLowerCase().split(/\s+/).filter((w) => w.length >= 3));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Umbral de similitud para rechazar un body corregido por "cambio irrelevante". */
export const UMBRAL_SIMILITUD = 0.98;

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 1 — Extracción de claims legales del body
// ═══════════════════════════════════════════════════════════════════════════

export function extraerClaims(body: string): ClaimExtraido[] {
  const claims: ClaimExtraido[] = [];
  const textoPlano = stripHtml(body);

  // 1. Referencias a artículos del CP/códigos — el código es OBLIGATORIO para
  //    considerar la referencia un claim verificable (un "Art. 123" suelto es
  //    ambiguo entre códigos y no se auto-verifica como CP).
  const reArtCp = /(Art(?:ículo)?\.?\s*\d+(?:-\w+)?\s*(?:del?(?:\s+la)?\s+)?(?:Código\s+Penal|CP|Código\s+Procesal\s+Penal|CPP|Código\s+Civil|CC|Código\s+de\s+Familia|CF|Código\s+de\s+Trabajo|CT|Código\s+de\s+Comercio|CM|Código\s+de\s+la\s+Niñez|CN|Código\s+Tributario|CTrib|Código\s+Aduanero|CA))/gi;
  let m: RegExpExecArray | null;
  while ((m = reArtCp.exec(textoPlano)) !== null) {
    const txt = m[0].trim();
    const start = Math.max(0, m.index - 50);
    const end = Math.min(textoPlano.length, m.index + txt.length + 50);
    claims.push({
      tipo: 'articulo_cp',
      textoOriginal: txt,
      contexto: textoPlano.slice(start, end).trim(),
    });
  }

  // 2. Referencias a artículos de la Constitución
  const reArtConst = /(Art(?:ículo)?\.?\s*\d+(?:-\w+)?\s*(?:de\s+la\s+)?Constitución)/gi;
  while ((m = reArtConst.exec(textoPlano)) !== null) {
    const txt = m[0].trim();
    const start = Math.max(0, m.index - 50);
    const end = Math.min(textoPlano.length, m.index + txt.length + 50);
    claims.push({
      tipo: 'articulo_const',
      textoOriginal: txt,
      contexto: textoPlano.slice(start, end).trim(),
    });
  }

  // 3. Rangos de penas: "6 a 8 años de prisión", "3 a 5 años de reclusión"
  const rePenaRango = /(\d+)\s*(?:a|y|–|-)\s*(\d+)\s*(años?|meses?|días?)\s*(?:de\s+)?(prisión|reclusión|multa|inhabilitación|arresto)/gi;
  while ((m = rePenaRango.exec(textoPlano)) !== null) {
    const txt = m[0].trim();
    const start = Math.max(0, m.index - 50);
    const end = Math.min(textoPlano.length, m.index + txt.length + 50);
    claims.push({
      tipo: 'pena_rango',
      textoOriginal: txt,
      contexto: textoPlano.slice(start, end).trim(),
    });
  }

  // 4. Penas simples: "5 años de prisión"
  const rePenaSimple = /(\d+)\s*(años?|meses?)\s*(?:de\s+)?(prisión|reclusión)/gi;
  while ((m = rePenaSimple.exec(textoPlano)) !== null) {
    const txt = m[0].trim();
    const start = Math.max(0, m.index - 50);
    const end = Math.min(textoPlano.length, m.index + txt.length + 50);
    claims.push({
      tipo: 'pena_simple',
      textoOriginal: txt,
      contexto: textoPlano.slice(start, end).trim(),
    });
  }

  // 5. Nombres de delitos: cross-reference contra delitos.json
  for (const [nombre] of delitosPorNombre) {
    const escaped = escapeRegex(nombre);
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    while ((m = re.exec(textoPlano)) !== null) {
      const txt = m[0].trim();
      const start = Math.max(0, m.index - 30);
      const end = Math.min(textoPlano.length, m.index + txt.length + 30);
      claims.push({
        tipo: 'nombre_delito',
        textoOriginal: txt,
        contexto: textoPlano.slice(start, end).trim(),
      });
    }
  }

  // 6. Decretos / instrumentos legales
  const reDecreto = /(Decreto\s*\d+[-\w]*\s*(?:\/\s*\d+)?)/gi;
  while ((m = reDecreto.exec(textoPlano)) !== null) {
    const txt = m[0].trim();
    const start = Math.max(0, m.index - 30);
    const end = Math.min(textoPlano.length, m.index + txt.length + 30);
    claims.push({
      tipo: 'decreto',
      textoOriginal: txt,
      contexto: textoPlano.slice(start, end).trim(),
    });
  }

  return claims;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 1 — Verificación de claims contra fuentes canónicas
// ═══════════════════════════════════════════════════════════════════════════

export function verificarClaims(claims: ClaimExtraido[]): Discrepancia[] {
  const discrepancias: Discrepancia[] = [];

  for (const claim of claims) {
    switch (claim.tipo) {
      case 'articulo_cp': {
        // Match EXACTO contra la clave canónica (no substring). Una clave
        // "art. 51 cp" solo existe si el CP tiene ese artículo literal.
        const key = canonicalArticuloKey(claim.textoOriginal);
        if (!key) break;
        const existeEnCp = articulosCpSet.has(key);
        const existeEnDelitos = delitosPorArticulo.has(key);
        const existeEnCt = articulosCtSet.has(key);
        const existeEnCc = articulosCcSet.has(key);
        const existeEnCm = articulosCmSet.has(key);
        const existeEnCtrib = articulosCtribSet.has(key);
        if (!existeEnCp && !existeEnDelitos && !existeEnCt && !existeEnCc && !existeEnCm && !existeEnCtrib) {
          discrepancias.push({
            claim,
            severidad: 'critico',
            mensaje: `El artículo "${claim.textoOriginal}" no se encuentra en las fuentes canónicas (CP, delitos, Código de Trabajo, Civil, Comercio, Tributario). Posiblemente inventado por IA.`,
            valorEncontrado: claim.textoOriginal,
            valorCorrecto: '(no encontrado en fuentes canónicas)',
            fuente: 'data/articulos_cp.json + data/delitos.json + data/codigo_trabajo.json + data/codigo_civil.json + data/codigo_comercio.json + data/codigo_tributario.json',
          });
        }
        break;
      }

      case 'articulo_const': {
        const key = canonicalArticuloKey(claim.textoOriginal);
        if (!key) break;
        if (!articulosConstSet.has(key)) {
          discrepancias.push({
            claim,
            severidad: 'critico',
            mensaje: `El artículo constitucional "${claim.textoOriginal}" no se encuentra en data/articulos_constitucion.json.`,
            valorEncontrado: claim.textoOriginal,
            valorCorrecto: '(no encontrado)',
            fuente: 'data/articulos_constitucion.json',
          });
        }
        break;
      }

      case 'pena_rango': {
        // Extraer valores: min, max, unidad, tipo
        const m = claim.textoOriginal.match(/(\d+)\s*(?:a|y|–|-)\s*(\d+)\s*(años?|meses?|días?)\s*(?:de\s+)?(prisión|reclusión|multa|inhabilitación|arresto)/i);
        if (m) {
          const min = parseInt(m[1], 10);
          const max = parseInt(m[2], 10);
          const unidad = m[3].toLowerCase();
          const tipo = m[4].toLowerCase();
          const minMeses = unidad.startsWith('año') ? min * 12 : min;
          const maxMeses = unidad.startsWith('año') ? max * 12 : max;

          // CRUCE REAL artículo→delito→pena: buscar en el contexto un artículo
          // del CP cercano (ej: "Art. 214 CP ... 1 a 2 años de prisión") y
          // verificar que el delito correspondiente tenga ese rango de pena.
          // La clave de lookup ahora usa el formato canónico "art. NNN cp"
          // consistente con el índice delitosPorArticulo.
          const artCercano = claim.contexto.match(/art(?:ículo)?\.?\s*(\d+)/i);
          if (artCercano && tipo === 'prisión') {
            const numArt = artCercano[1];
            const delito = delitosPorArticulo.get(`art. ${numArt} cp`);
            if (delito && delito.tiene_prision) {
              const dMin = delito.prision_min_valor;
              const dMax = delito.prision_max_valor;
              const dUnidad = delito.prision_unidad ?? 'meses';
              const dMinMeses = dUnidad.startsWith('año') ? dMin * 12 : dMin;
              const dMaxMeses = dUnidad.startsWith('año') ? dMax * 12 : dMax;
              // Tolerancia de 1 mes por redondeo
              if (Math.abs(dMinMeses - minMeses) > 1 || Math.abs(dMaxMeses - maxMeses) > 1) {
                discrepancias.push({
                  claim,
                  severidad: 'critico',
                  mensaje: `Pena incorrecta para ${delito.articulo} (${delito.nombre}). El artículo dice "${claim.textoOriginal}" pero el CP establece ${dMin}-${dMax} ${dUnidad}.`,
                  valorEncontrado: claim.textoOriginal,
                  valorCorrecto: `${dMin} a ${dMax} ${dUnidad} de prisión (${delito.articulo}, ${delito.nombre})`,
                  fuente: `data/delitos.json — ${delito.articulo}`,
                });
              }
            }
          }

          // Detección de penas atípicas sin artículo cercano (posible alucinación)
          if (!artCercano && tipo === 'prisión' && minMeses > 0 && maxMeses > 0) {
            const coincideAlgunDelito = delitosData.some((d) => {
              if (!d.tiene_prision) return false;
              const dUnidad = d.prision_unidad ?? 'meses';
              const dMinMeses = dUnidad.startsWith('año') ? d.prision_min_valor * 12 : d.prision_min_valor;
              const dMaxMeses = dUnidad.startsWith('año') ? d.prision_max_valor * 12 : d.prision_max_valor;
              return Math.abs(dMinMeses - minMeses) <= 1 && Math.abs(dMaxMeses - maxMeses) <= 1;
            });
            if (!coincideAlgunDelito) {
              discrepancias.push({
                claim,
                severidad: 'importante',
                mensaje: `Pena "${claim.textoOriginal}" no coincide con ningún delito en data/delitos.json y no hay artículo del CP cerca para verificar. Posible alucinación.`,
                valorEncontrado: claim.textoOriginal,
                valorCorrecto: '(verificar contra CP Honduras)',
                fuente: 'data/delitos.json (483 delitos verificados)',
              });
            }
          }
        }
        break;
      }

      case 'pena_simple': {
        const m = claim.textoOriginal.match(/(\d+)\s*(años?|meses?)\s*(?:de\s+)?(prisión|reclusión)/i);
        if (m) {
          const valor = parseInt(m[1], 10);
          const unidad = m[2].toLowerCase();
          const valorMeses = unidad.startsWith('año') ? valor * 12 : valor;
          const artCercano = claim.contexto.match(/art(?:ículo)?\.?\s*(\d+)/i);
          if (artCercano) {
            const numArt = artCercano[1];
            const delito = delitosPorArticulo.get(`art. ${numArt} cp`);
            if (delito && delito.tiene_prision) {
              const dUnidad = delito.prision_unidad ?? 'meses';
              const dMinMeses = dUnidad.startsWith('año') ? delito.prision_min_valor * 12 : delito.prision_min_valor;
              const dMaxMeses = dUnidad.startsWith('año') ? delito.prision_max_valor * 12 : delito.prision_max_valor;
              // La pena simple debe estar dentro del rango del delito
              if (valorMeses < dMinMeses - 1 || valorMeses > dMaxMeses + 1) {
                discrepancias.push({
                  claim,
                  severidad: 'critico',
                  mensaje: `Pena "${claim.textoOriginal}" fuera del rango legal para ${delito.articulo} (${delito.nombre}). Rango correcto: ${delito.prision_min_valor}-${delito.prision_max_valor} ${dUnidad}.`,
                  valorEncontrado: claim.textoOriginal,
                  valorCorrecto: `${delito.prision_min_valor} a ${delito.prision_max_valor} ${dUnidad} (${delito.articulo})`,
                  fuente: `data/delitos.json — ${delito.articulo}`,
                });
              }
            }
          }
        }
        break;
      }

      case 'nombre_delito': {
        // Ya sabemos que existe (se extrajo de delitosPorNombre).
        // La verificación de coherencia nombre↔artículo requiere NLP avanzado;
        // registramos que se encontró y confiamos en la IA para el resto.
        break;
      }

      case 'decreto': {
        const conocidos = [
          '130-2017', '119-2019', '144-83', '132-2007', '9-99', '59-97', '189-87',
          '189-1959', '189-59',    // Código de Trabajo
          '51-2003',                // Código Tributario
          '106-1972',               // Código de Comercio
          '84-2017',                // Código Civil (nuevo)
          '76-84',                  // Código de Familia
        ];
        const numDecreto = claim.textoOriginal.replace(/Decreto\s*/i, '').trim();
        if (!conocidos.some((c) => numDecreto.includes(c))) {
          discrepancias.push({
            claim,
            severidad: 'importante',
            mensaje: `Decreto "${claim.textoOriginal}" no está verificado en las fuentes canónicas. Posiblemente inventado por IA. Verificar contra la fuente oficial o eliminar la cita.`,
            valorEncontrado: claim.textoOriginal,
            valorCorrecto: '(verificar contra fuente oficial — La Gaceta, TSJ, Congreso)',
            fuente: 'fuentes oficiales de Honduras',
          });
        }
        break;
      }
    }
  }

  // Eliminar duplicados (mismo mensaje)
  const seen = new Set<string>();
  return discrepancias.filter((d) => {
    const key = d.mensaje;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 2.5 — Detección de alucinaciones NUEVAS introducidas por la IA
// ═══════════════════════════════════════════════════════════════════════════
//
// Tras corregir un artículo con DeepSeek, re-ejecutamos extraerClaims +
// verificarClaims sobre el body corregido y comparamos con las discrepancias
// originales. Cualquier discrepancia NUEVA (no presente en el original) es una
// alucinación introducida por la IA. Si se detectan, el body corregido se
// RECHAZA y se conserva el original (mejor contenido imperfecto que contenido
// con alucinaciones nuevas).

export function detectarAlucinacionesNuevas(
  discrepanciasOriginales: Discrepancia[],
  bodyCorregido: string,
): Discrepancia[] {
  const claimsNuevos = extraerClaims(bodyCorregido);
  const discrepanciasNuevas = verificarClaims(claimsNuevos);

  const mensajesOriginales = new Set(
    discrepanciasOriginales.map((d) => d.mensaje),
  );

  // Solo discrepancias CRÍTICAS o IMPORTANTES nuevas cuentan como alucinaciones.
  // Las 'recomendable' (ej: decreto no en lista de conocidos) son informativas
  // y no deben bloquear el body corregido — son "verificar manualmente", no
  // "la IA inventó un dato falso".
  return discrepanciasNuevas.filter(
    (d) =>
      (d.severidad === 'critico' || d.severidad === 'importante') &&
      !mensajesOriginales.has(d.mensaje),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Helpers — extracción de headings, imágenes, enlaces, HTML (análisis SEO)
// ═══════════════════════════════════════════════════════════════════════════

export interface HallazgoSEO {
  severidad: Severidad;
  categoria: 'longitud' | 'headings' | 'seo' | 'tags' | 'imagenes' | 'enlaces' | 'fecha' | 'contenido' | 'keyword_stuffing' | 'eeat' | 'seo_local' | 'geo' | 'html' | 'slug' | 'canonical' | 'autor' | 'estructura';
  mensaje: string;
}

export function extraerHeadings(html: string): { nivel: number; texto: string }[] {
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

/** Extrae párrafos <p> con su texto plano (para análisis de estructura). */
function extraerParrafos(html: string): string[] {
  const parrafos: string[] = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const texto = m[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
    parrafos.push(texto);
  }
  return parrafos;
}

/**
 * Verifica el balance de tags HTML (apertura vs cierre). Tags comunes en
 * bodies de blog. Devuelve la lista de tags desbalanceados.
 */
export function verificarHtmlBalance(html: string): string[] {
  const tagsToCheck = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h2', 'h3', 'h4', 'span'];
  const desbalanceados: string[] = [];
  for (const tag of tagsToCheck) {
    const openRe = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    const closeRe = new RegExp(`</${tag}>`, 'gi');
    const opens = (html.match(openRe) || []).length;
    const closes = (html.match(closeRe) || []).length;
    if (opens !== closes) {
      desbalanceados.push(`${tag} (${opens}/${closes})`);
    }
  }
  return desbalanceados;
}

/**
 * Comprueba si una ruta interna apunta a una ruta privada (R6).
 * Matching por segmento de path para evitar falsos positivos:
 * "/cp" matchea "/cp" y "/cp/..." pero NO "/cputados".
 */

/**
 * Detecta keyword stuffing: palabras (no stop-words) que se repiten
 * excesivamente en el cuerpo. Umbral: >2.5% del total de palabras Y ≥12
 * apariciones. Heurística conservadora (los artículos jurídicos repiten
 * "prisión", "artículo" naturalmente — el umbral evita falsos positivos).
 */
export function detectarKeywordStuffing(html: string): { palabra: string; count: number; densidadPct: number }[] {
  const texto = stripHtml(html).toLowerCase();
  const tokens = texto.split(/\s+/).filter(Boolean);
  const total = tokens.length;
  if (total < 200) return []; // poco contenido: no se puede evaluar densidad
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 4) continue; // ignorar tokens cortos
    if (STOPWORDS_STUFFING.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const hallazgos: { palabra: string; count: number; densidadPct: number }[] = [];
  for (const [palabra, count] of counts) {
    const densidadPct = (count / total) * 100;
    // Umbral: ≥12 apariciones Y >2.5% densidad (muy conservador para derecho)
    if (count >= 12 && densidadPct > 2.5) {
      hallazgos.push({ palabra, count, densidadPct: Math.round(densidadPct * 10) / 10 });
    }
  }
  return hallazgos.sort((a, b) => b.count - a.count).slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 2.7 — Controles de calidad de redacción (anti-plantilla)
// ═══════════════════════════════════════════════════════════════════════════
//
// La IA tiende a generar texto plantilla/filler cuando se le pide "expandir"
// sin guía específica. Aunque el prompt ya prohíbe frases genéricas, estos
// checks deterministas detectan si el texto resultante tiene señales de
// relleno o baja variedad léxica. Son verificables y no dependen de la IA.

/**
 * Frases filler genéricas que indican padding en lugar de sustancia jurídica.
 * Lista curada de patrones comunes en texto autogenerado en español. La
 * presencia de 1 puede ser legítima; ≥3 en un artículo de 800-1000 palabras
 * es señal clara de relleno. Se busca por substring case-insensitive.
 *
 * No incluye frases que aparecen naturalmente en escritura jurídica rigurosa
 * (ej: "conforme al artículo", "en virtud de" son legítimas).
 */
const FRASES_FILLER: string[] = [
  'es importante destacar que',
  'cabe señalar que',
  'cabe mencionar que',
  'cabe resaltar que',
  'no cabe duda de que',
  'como es sabido',
  'como es de conocimiento general',
  'en el contexto jurídico actual',
  'en el contexto legal actual',
  'en el ordenamiento jurídico hondureño',
  'el derecho penal es una rama',
  'el derecho civil es una rama',
  'el derecho de familia es una rama',
  'el derecho laboral es una rama',
  'es una rama fundamental',
  'es una materia de gran importancia',
  'es un tema de gran relevancia',
  'juega un papel fundamental',
  'juega un papel crucial',
  'reviste especial importancia',
  'resulta de vital importancia',
  'en la actualidad, es fundamental',
  'hoy en día, es indispensable',
  'en conclusión, este tema',
  'en resumen, podemos afirmar',
  'a modo de conclusión',
  'como punto de partida',
  'para comprender mejor este tema',
  'para entender mejor este concepto',
  'es necesario comprender que',
  'es preciso tener en cuenta que',
];

/**
 * Detecta frases filler/genéricas en el body. Retorna las frases encontradas
 * (con count). El caller decide el umbral de severidad.
 *
 * @returns Lista de { frase, count } ordenada por count desc.
 */
export function detectarFrasesFiller(html: string): { frase: string; count: number }[] {
  const texto = stripHtml(html).toLowerCase();
  const hallazgos: { frase: string; count: number }[] = [];
  for (const frase of FRASES_FILLER) {
    // Contar apariciones (puede aparecer más de una vez)
    let count = 0;
    let idx = 0;
    while ((idx = texto.indexOf(frase, idx)) !== -1) {
      count++;
      idx += frase.length;
    }
    if (count > 0) hallazgos.push({ frase, count });
  }
  return hallazgos.sort((a, b) => b.count - a.count);
}

/**
 * Diversidad léxica: type-token ratio (TTR) = palabras únicas / total palabras.
 * Un TTR bajo indica texto repetitivo/genérico (la IA recicla el mismo
 * vocabulario). Un TTR alto indica variedad léxica (escritura de calidad).
 *
 * Para español jurídico de 800-1000 palabras, umbral ~0.30 es realista:
 * - >0.35: buena variedad léxica
 * - 0.30-0.35: aceptable (derecho usa vocabulario técnico repetido)
 * - <0.30: repetitivo, posible plantilla/filler
 *
 * Se calcula sobre tokens ≥4 chars (excluye artículos/preposiciones cortas
 * que inflarían artificialmente el TTR) sin stop-words.
 *
 * @returns { ttr, palabrasUnicas, totalTokens } o null si el body es <300
 *          palabras (TTR no es fiable en muestras cortas).
 */
export function diversidadLexica(html: string): { ttr: number; palabrasUnicas: number; totalTokens: number } | null {
  const texto = stripHtml(html).toLowerCase();
  const tokens = texto
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS_STUFFING.has(t));
  const total = tokens.length;
  if (total < 200) return null; // muestra demasiado corta para TTR fiable
  const unicas = new Set(tokens);
  return {
    ttr: Math.round((unicas.size / total) * 1000) / 1000,
    palabrasUnicas: unicas.size,
    totalTokens: total,
  };
}

/** Umbral de TTR para marcar texto repetitivo/genérico. */
export const UMBRAL_TTR = 0.30;

/**
 * Términos vagos que indican que la IA escribió placeholders en lugar de
 * datos específicos. Común cuando la IA no tiene la fuente legal canónica
 * (ej: Código de Trabajo) y evita inventar — correcto, pero el resultado es
 * texto inútil como "porcentaje base" en lugar del valor real.
 *
 * Detectar estos términos permite:
 *   - Marcar el artículo como "requiere datos específicos"
 *   - Forzar reintento de IA con prompt más específico
 *   - Señalar a humanos qué artículos necesitan revisión con fuentes
 */
const TERMINOS_VAGOS: string[] = [
  'porcentaje base',
  'porcentaje intermedio',
  'porcentaje mayor',
  'porcentaje alto',
  'porcentaje maximo',
  'porcentaje máximo',
  'cantidad determinada',
  'cantidad especifica',
  'cantidad específica',
  'según corresponda',
  'segun corresponda',
  'monto correspondiente',
  'valor establecido',
  'porcentaje aplicable',
  'tasas correspondientes',
  'requisitos correspondientes',
  'plazo razonable',
  'monto razonable',
  'cantidad razonable',
  'parámetros establecidos',
  'parametros establecidos',
  'cifras correspondientes',
  'porcentajes correspondientes',
  'valores específicos',
  'valores especificos',
  'monto respectivo',
];

/**
 * Detecta términos vagos en el body. Retorna los términos encontrados.
 * Presencia de ≥2 = señal de que la IA escribió placeholders.
 */
export function detectarTextoVago(html: string): { termino: string; count: number }[] {
  const texto = stripHtml(html).toLowerCase();
  const hallazgos: { termino: string; count: number }[] = [];
  for (const termino of TERMINOS_VAGOS) {
    let count = 0;
    let idx = 0;
    while ((idx = texto.indexOf(termino, idx)) !== -1) {
      count++;
      idx += termino.length;
    }
    if (count > 0) hallazgos.push({ termino, count });
  }
  return hallazgos.sort((a, b) => b.count - a.count);
}

/**
 * Verifica si el body tiene una declaración de entidad clara al inicio
 * (primeros 300 chars de texto plano). Patrón GEO para motores IA:
 * "El <concepto> en Honduras es...", "Las <institución> en Honduras...",
 * "El <delito> consiste en...", etc.
 *
 * @returns true si encuentra declaración de entidad, false si no.
 */
export function tieneDeclaracionEntidad(html: string): boolean {
  // Normalizar acentos para que \w funcione con texto español
  const texto = stripHtml(html)
    .slice(0, 400)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Patrones de declaración de entidad (GEO)
  const patrones: RegExp[] = [
    /\b(?:el|la|los|las)\s+[\w\s]{3,40}\s+(?:en\s+honduras|consiste\s+en|se\s+define\s+como|se\s+refiere\s+a|es\s+un|es\s+una)\b/i,
    /\b(?:el|la)\s+[\w\s]{3,40}\s+(?:del\s+codigo\s+penal|de\s+la\s+constitucion)\s+(?:establece|tipifica|dispone|regula)\b/i,
    /\b(?:que\s+es|que\s+son)\s+[\w\s]{3,30}\s*\?/i,
    /\b(?:un|una)\s+[\w\s]{3,30}\s+(?:es\s+(?:el|la|un|una)|consiste\s+en)\b/i,
  ];
  return patrones.some((re) => re.test(texto));
}

/**
 * Verifica señales de SEO local en el body: menciones de NAP (ciudad,
 * departamento). Severidad 'recomendable' (no todos los posts lo necesitan).
 */
/**
 * Ciudades objetivo del bufete para SEO local (sur de Honduras).
 * Fuente: data/landings-locales.ts — las 3 ciudades con landing page propia
 * que aparecen en el pie de página de la web. Se usan para sugerir a la IA
 * dónde añadir mención geográfica cuando el artículo no tiene ninguna.
 */
const CIUDADES_OBJETIVO_SEO_LOCAL = [
  { ciudad: 'Nacaome', departamento: 'Valle', url: '/abogados-en-nacaome' },
  { ciudad: 'Choluteca', departamento: 'Choluteca', url: '/abogados-en-choluteca' },
  { ciudad: 'San Lorenzo', departamento: 'Valle', url: '/abogados-en-san-lorenzo' },
];

function verificarSeoLocal(html: string): string[] {
  const texto = stripHtml(html).toLowerCase();
  const faltantes: string[] = [];
  // SEO local jerárquico: país > departamento > ciudad.
  // Para un bufete hondureño, "Honduras" ya es señal geográfica suficiente
  // para la mayoría de artículos. Solo se marca débil si NO menciona ni el
  // país ni la ciudad ni el departamento — eso sí es un problema real.
  const mencionaPais = texto.includes('honduras') ||
    texto.includes('hondureño') || texto.includes('hondureña');
  const mencionaCiudad = texto.includes(NAP.ciudad.toLowerCase()) ||
    texto.includes(NAP.departamento.toLowerCase());
  if (!mencionaPais && !mencionaCiudad) {
    const listaCiudades = CIUDADES_OBJETIVO_SEO_LOCAL.map(
      (c) => `${c.ciudad} (${c.departamento})`,
    ).join(', ');
    faltantes.push(
      `Sin señal geográfica (Honduras/${NAP.ciudad}/${NAP.departamento}). ` +
      `Para SEO local del sur de Honduras, añadir una mención natural a una ` +
      `de las ciudades donde el bufete tiene presencia: ${listaCiudades}. ` +
      `NO cambiar la intención del artículo — solo reforzar con una mención ` +
      `geográfica donde encaje naturalmente.`,
    );
  }
  return faltantes;
}

/**
 * Valida el formato de un slug: lowercase, sin espacios/acentos, longitud
 * razonable, separadores con guiones.
 */
function validarSlug(slug: string): string[] {
  const hallazgos: string[] = [];
  if (slug.length < 10) {
    hallazgos.push(`Slug muy corto (${slug.length} chars): "${slug}". Poco descriptivo para SEO.`);
  }
  if (slug.length > SLUG_MAX) {
    hallazgos.push(`Slug muy largo (${slug.length} chars > ${SLUG_MAX}). Puede truncarse en SERP.`);
  }
  if (/[A-Z]/.test(slug)) {
    hallazgos.push(`Slug con mayúsculas: "${slug}". Los slugs deben ser lowercase.`);
  }
  if (/[áéíóúñü]/i.test(slug)) {
    hallazgos.push(`Slug con acentos/ñ: "${slug}". Usar ASCII (aeioun).`);
  }
  if (/\s/.test(slug)) {
    hallazgos.push(`Slug con espacios: "${slug}". Usar guiones.`);
  }
  return hallazgos;
}

/**
 * Análisis SEO/GEO/contenido COMPLETO de un post. Sin IA.
 * Un post se considera "ok" solo si no tiene hallazgos críticos ni importantes.
 *
 * Validadores cubiertos:
 *   - Longitud (R13): 800-1000 palabras
 *   - Headings (R15): sin H1 en body, jerarquía H2→H3, sin headings vacíos,
 *     sin headings duplicados, escaneabilidad mínima
 *   - SEO meta: title (30-60), metaTitle (≤60), metaDescription (70-155),
 *     description (fallback), coverImage, ogImage
 *   - Tags: 3-7, sin duplicados
 *   - Slug: formato lowercase ASCII, longitud
 *   - Canonical: si se setea, debe ser URL absoluta https
 *   - Contenido (R14): sin disclaimer duplicado en body
 *   - E-E-A-T: categoría válida, autor presente, sin autopromoción excesiva,
 *     sin frases prohibidas (R4/R17)
 *   - Enlaces (R6): sin rutas privadas, sin nofollow internos, anchors
 *     descriptivos, externos con rel, sin http://
 *   - Imágenes: alt text presente
 *   - Keyword stuffing: densidad ≤2%
 *   - SEO local (NAP): mención de ciudad/departamento
 *   - HTML: tags balanceados, sin párrafos vacíos, sin párrafos excesivamente largos
 *   - Fecha: no futura, no inválida
 */
export function analizarSEO(
  post: PostRow,
  palabras: number,
): HallazgoSEO[] {
  const hallazgos: HallazgoSEO[] = [];

  // ── Longitud editorial (R13) ──
  if (palabras < MIN_PALABRAS) {
    hallazgos.push({
      severidad: palabras < 400 ? 'critico' : 'importante',
      categoria: 'longitud',
      mensaje: `${palabras} palabras (objetivo ${MIN_PALABRAS}–${MAX_PALABRAS}). Requiere ampliación editorial.`,
    });
  } else if (palabras > 1400) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'longitud',
      mensaje: `${palabras} palabras (>${MAX_PALABRAS}). Revisar claridad/estructura; considerar dividir.`,
    });
  }

  // ── Headings (R15) ──
  const headings = extraerHeadings(post.body);
  const h1s = headings.filter((h) => h.nivel === 1);
  if (h1s.length > 0) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'headings',
      mensaje: `${h1s.length} <h1> en el body. La plantilla ya renderiza el título como H1 → doble H1 (problema SEO).`,
    });
  }
  // Jerarquía: H3 sin H2 previo (salto de nivel)
  let primerH2Idx = -1;
  let primerH3Idx = -1;
  headings.forEach((h, i) => {
    if (h.nivel === 2 && primerH2Idx < 0) primerH2Idx = i;
    if (h.nivel === 3 && primerH3Idx < 0) primerH3Idx = i;
  });
  if (primerH3Idx >= 0 && (primerH2Idx < 0 || primerH3Idx < primerH2Idx)) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'headings',
      mensaje: 'Salto de jerarquía: <h3> aparece antes que el primer <h2>. Estructura de headings no jerárquica.',
    });
  }
  // Sin headings en body largo → mala escaneabilidad
  const h2h3 = headings.filter((h) => h.nivel === 2 || h.nivel === 3);
  if (palabras > 600 && h2h3.length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'headings',
      mensaje: `${palabras} palabras sin ningún H2/H3 en el body. Mala escaneabilidad y estructura SEO.`,
    });
  }
  // Headings vacíos
  const vacios = headings.filter((h) => h.texto.length === 0);
  if (vacios.length > 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'headings',
      mensaje: `${vacios.length} heading(s) vacío(s) (sin texto). Penaliza SEO y accesibilidad.`,
    });
  }
  // Headings duplicados (mismo texto en mismo nivel)
  const vistos = new Map<string, number>();
  const duplicados: string[] = [];
  for (const h of headings) {
    if (h.texto.length === 0) continue;
    const key = `${h.nivel}:${h.texto.toLowerCase()}`;
    vistos.set(key, (vistos.get(key) ?? 0) + 1);
    if (vistos.get(key) === 2) duplicados.push(h.texto);
  }
  if (duplicados.length > 0) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'headings',
      mensaje: `Headings duplicados: "${duplicados.slice(0, 3).join('", "')}". Diversificar los subtítulos.`,
    });
  }

  // ── SEO meta: title ──
  if (post.title.length > TITLE_MAX) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: `Title de ${post.title.length} chars (óptimo ≤${TITLE_MAX}). Se truncará en SERP.`,
    });
  } else if (post.title.length < TITLE_MIN) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'seo',
      mensaje: `Title de ${post.title.length} chars (óptimo ≥${TITLE_MIN}). Title corto pierde keywords.`,
    });
  }

  // ── GEO / SEO local: señal geográfica en el title ──
  // AGENTS.md §5 ("SEO local"): "keywords geográficas en title/H1/contenido".
  // Para un bufete hondureño, el title es la señal geográfica más fuerte en
  // SERP. Se verifica como 'recomendable' (no bloqueante) porque no todos los
  // artículos tienen intención local pura, pero conviene señalar la oportunidad.
  const titleLower = post.title.toLowerCase();
  const geoKeywords = [
    'honduras', 'hondureño', 'hondureña',
    NAP.ciudad.toLowerCase(),
    NAP.departamento.toLowerCase(),
  ].filter(Boolean);
  const tieneGeoTitle = geoKeywords.some((g) => titleLower.includes(g));
  // También considerar la metaDescription como señal geográfica alternativa:
  // si el title no lleva geo pero la meta sí, la intención geográfica sigue
  // presente en SERP (la meta se muestra bajo el title). Solo se marca cuando
  // AMBOS (title y meta) carecen de señal geográfica.
  const metaParaGeo = post.metaDescription ?? post.description ?? '';
  const metaGeoLower = metaParaGeo.toLowerCase();
  const tieneGeoMeta = geoKeywords.some((g) => metaGeoLower.includes(g));
  if (!tieneGeoTitle && !tieneGeoMeta) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'geo',
      mensaje: `Ni el title ni la metaDescription incluyen señal geográfica (Honduras/${NAP.ciudad}/${NAP.departamento}). Para SEO local y GEO, añadir el país o la ciudad al title o la meta refuerza la intención geográfica en SERP y motores IA.`,
    });
  } else if (!tieneGeoTitle && tieneGeoMeta) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'geo',
      mensaje: `El title no incluye señal geográfica (Honduras/${NAP.ciudad}/${NAP.departamento}); solo la metaDescription la trae. Mover la keyword geográfica al title refuerza más la intención local en SERP.`,
    });
  }

  // ── SEO meta: metaTitle (si se setea, debe ser ≤60) ──
  if (post.metaTitle && post.metaTitle.trim().length > 0) {
    if (post.metaTitle.length > TITLE_MAX) {
      hallazgos.push({
        severidad: 'importante',
        categoria: 'seo',
        mensaje: `metaTitle de ${post.metaTitle.length} chars (óptimo ≤${TITLE_MAX}). Se truncará en SERP.`,
      });
    }
  }

  // ── SEO meta: metaDescription ──
  const meta = post.metaDescription ?? post.description;
  if (!meta || meta.trim().length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: 'Sin meta description. Campo obligatorio para SEO — genera una alineada con el objetivo del artículo.',
    });
  } else if (meta.length < META_MIN) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'seo',
      mensaje: `Meta description de ${meta.length} chars (óptimo ≥${META_MIN}). Aprovecha el espacio.`,
    });
  } else if (meta.length > META_MAX) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: `Meta description de ${meta.length} chars (óptimo ≤${META_MAX}). Se truncará en SERP.`,
    });
  }

  // ── Alineación title ↔ meta description ↔ contenido ──
  const textoBody = stripHtml(post.body).toLowerCase();
  const metaLower = (meta ?? '').toLowerCase();
  // Palabras significativas del title (≥4 chars, sin stopwords)
  const stopwords = new Set(['para', 'como', 'con', 'por', 'del', 'las', 'los', 'que', 'una', 'este', 'esta', 'tiene', 'debe', 'puede', 'más', 'entre', 'todo', 'cada', 'solo']);
  const titleWords = titleLower.split(/\s+/).filter(w => w.length >= 4 && !stopwords.has(w));
  const metaWords = metaLower.split(/\s+/).filter(w => w.length >= 4 && !stopwords.has(w));

  // Meta description similar al title (>60% overlap de palabras significativas)
  if (meta && meta.trim().length > 0 && titleWords.length > 0) {
    const overlap = metaWords.filter(w => titleWords.includes(w));
    if (overlap.length / titleWords.length >= 0.6) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'seo',
        mensaje: `Meta description muy similar al title (${Math.round(overlap.length / titleWords.length * 100)}% palabras compartidas). La SERP desperdicia espacio: usa la meta para expandir.`,
      });
    }
  }

  // Keywords del title no aparecen en el body
  if (titleWords.length > 0) {
    const ausentes = titleWords.filter(w => !textoBody.includes(w));
    if (ausentes.length >= Math.ceil(titleWords.length / 2)) {
      hallazgos.push({
        severidad: 'importante',
        categoria: 'seo',
        mensaje: `El title incluye palabras que no aparecen en el body ("${ausentes.slice(0, 4).join('", "')}"). El title debe reflejar el contenido real del artículo.`,
      });
    }
  }

  // Meta description sin palabras del body (desalineada)
  if (meta && meta.trim().length > 0 && metaWords.length >= 3) {
    const ausentesMeta = metaWords.filter(w => !textoBody.includes(w));
    if (ausentesMeta.length >= Math.ceil(metaWords.length / 2)) {
      hallazgos.push({
        severidad: 'importante',
        categoria: 'seo',
        mensaje: `La meta description describe temas no presentes en el body ("${ausentesMeta.slice(0, 4).join('", "')}"). La meta debe resumir el contenido real del artículo.`,
      });
    }
  }

  // ── SEO meta: description (fallback de meta, usada en cards/OG) ──
  if (!post.description || post.description.trim().length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo',
      mensaje: 'Sin description. Campo obligatorio — se usa como fallback de metaDescription y en cards/OG.',
    });
  } else if (post.description.length > DESCRIPTION_MAX) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'seo',
      mensaje: `Description de ${post.description.length} chars (óptimo ≤${DESCRIPTION_MAX}).`,
    });
  }

  // ── SEO meta: coverImage ──
  if (!post.coverImage || post.coverImage.trim() === '') {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'imagenes',
      mensaje: 'Sin cover image. Campo obligatorio para SEO — asigna una imagen destacada.',
    });
  }

  // ── OG Image (si no se setea, la mayoría de frameworks usa coverImage como fallback) ──
  if (!post.ogImage && !post.coverImage) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'imagenes',
      mensaje: 'Sin ogImage ni coverImage. OG image es obligatoria para CTR social — asigna al menos coverImage como fallback.',
    });
  }

  // ── Tags ──
  const tags = post.tags ?? [];
  if (tags.length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'tags',
      mensaje: `Sin tags. Obligatorio para SEO — añadir ${TAGS_MIN}–${TAGS_MAX} etiquetas temáticas.`,
    });
  } else {
    if (tags.length < TAGS_MIN) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'tags',
        mensaje: `Solo ${tags.length} tag(s) (recomendado ${TAGS_MIN}–${TAGS_MAX}).`,
      });
    } else if (tags.length > TAGS_MAX) {
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'tags',
        mensaje: `${tags.length} tags (recomendado ≤${TAGS_MAX}). Exceso diluye la relevancia temática.`,
      });
    }
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

  // ── Slug ──
  for (const msg of validarSlug(post.slug)) {
    hallazgos.push({ severidad: 'recomendable', categoria: 'slug', mensaje: msg });
  }

  // ── Canonical (si se setea, debe ser URL absoluta https) ──
  if (post.canonicalUrl && post.canonicalUrl.trim().length > 0) {
    const c = post.canonicalUrl.trim();
    try {
      const u = new URL(c);
      if (u.protocol !== 'https:') {
        hallazgos.push({
          severidad: 'importante',
          categoria: 'canonical',
          mensaje: `canonicalUrl con protocolo ${u.protocol} (debe ser https).`,
        });
      }
    } catch {
      hallazgos.push({
        severidad: 'importante',
        categoria: 'canonical',
        mensaje: `canonicalUrl no es una URL absoluta válida: "${c}".`,
      });
    }
  }

  // ── Autor (E-E-A-T) ──
  if (!post.author || post.author.trim().length === 0) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'autor',
      mensaje: 'Sin autor explícito. Campo obligatorio para E-E-A-T en temas YMYL.',
    });
  }

  // ── Disclaimer duplicado en body (R14) ──
  const bodyLower = post.body.toLowerCase();
  const disclaimerEncontrado = DISCLAIMER_MARCADORES.find((m) =>
    bodyLower.includes(m.toLowerCase()),
  );
  if (disclaimerEncontrado) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'contenido',
      mensaje: `Disclaimer legal duplicado en el body (R14). El componente <LegalDisclaimer> ya lo renderiza. Marcador detectado: "${disclaimerEncontrado.slice(0, 60)}${disclaimerEncontrado.length > 60 ? '…' : ''}".`,
    });
  }

  // ── Fecha futura / inválida ──
  const fecha = post.publishedAt;
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'fecha',
      mensaje: 'Fecha de publicación inválida (no es Date parseable).',
    });
  } else if (fecha > new Date()) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'fecha',
      mensaje: `Fecha de publicación futura (${fecha.toISOString().slice(0, 10)}).`,
    });
  }

  // ── E-E-A-T: categoría válida ──
  if (!CATEGORIAS_BLOG_VALIDAS.has(post.category)) {
    hallazgos.push({
      severidad: 'critico',
      categoria: 'eeat',
      mensaje: `Categoría "${post.category}" no está en data/blog/categories.ts (${CATEGORIAS_BLOG_VALIDAS.size} válidas). Rompe el mapeo a autor Person y el schema BlogPosting.`,
    });
  }

  // ── Imágenes sin alt ──
  const imgs = extractImages(post.body);
  const sinAlt = imgs.filter((im) => !im.hasAltAttr || !im.alt || im.alt.trim() === '');
  if (sinAlt.length > 0) {
    hallazgos.push({
      severidad: sinAlt.length > 2 ? 'importante' : 'recomendable',
      categoria: 'imagenes',
      mensaje: `${sinAlt.length} imagen(es) sin alt text. El alt es crítico para accesibilidad (WCAG) y SEO de imágenes. Ej: "${sinAlt[0].src.slice(0, 60)}".`,
    });
  }

  // ── Keyword stuffing ──
  const stuffing = detectarKeywordStuffing(post.body);
  if (stuffing.length > 0) {
    const top = stuffing[0];
    hallazgos.push({
      severidad: 'importante',
      categoria: 'keyword_stuffing',
      mensaje: `Posible keyword stuffing: "${top.palabra}" aparece ${top.count} veces (${top.densidadPct}% del texto). Umbral de aviso: >2.5% con ≥12 apariciones. Densidad natural recomendada ≤2%.`,
    });
  }

  // ── Frases filler (anti-plantilla, calidad de redacción) ──
  // Detecta texto genérico que la IA tiende a generar como padding.
  // ≥3 frases filler en un artículo = señal clara de relleno (importante).
  // 1-2 = recomendable (puede ser uso legítimo puntual).
  const fillers = detectarFrasesFiller(post.body);
  if (fillers.length >= 3) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'contenido',
      mensaje: `${fillers.length} frases filler/genéricas detectadas (anti-plantilla): "${fillers.slice(0, 3).map((f) => f.frase).join('", "')}". El texto parece relleno autogenerado; requiere expansión con sustancia jurídica (ejemplos, análisis, procedimiento), no frases genéricas.`,
    });
  } else if (fillers.length > 0) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'contenido',
      mensaje: `${fillers.length} frase(s) filler: "${fillers.map((f) => f.frase).join('", "')}". Considerar reformular con contenido específico.`,
    });
  }

  // ── Diversidad léxica (TTR, anti-repetitivo) ──
  // TTR <0.30 = texto repetitivo, posible plantilla. Solo en bodies ≥300
  // palabras (TTR no es fiable en muestras cortas).
  const ttr = diversidadLexica(post.body);
  if (ttr && ttr.ttr < UMBRAL_TTR) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'contenido',
      mensaje: `Diversidad léxica baja (TTR=${ttr.ttr}, umbral ≥${UMBRAL_TTR}): ${ttr.palabrasUnicas} palabras únicas de ${ttr.totalTokens} tokens. Texto repetitivo; el vocabulario se recicla demasiado. Requiere variedad léxica para no leerse como plantilla.`,
    });
  }

  // ── Texto vago (placeholders en lugar de datos específicos) ──
  // Detecta términos como "porcentaje base", "cantidad determinada" que
  // indican que la IA no tuvo la fuente legal canónica y escribió placeholders.
  // ≥2 términos vagos = señal clara de contenido superficial (importante).
  const vagos = detectarTextoVago(post.body);
  if (vagos.length >= 2) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'contenido',
      mensaje: `${vagos.length} término(s) vago(s) detectados: "${vagos.slice(0, 3).map((v) => v.termino).join('", "')}". El texto usa placeholders en lugar de datos específicos. Requiere citar los valores reales de la fuente legal (ej: porcentajes exactos, artículos del código).`,
    });
  } else if (vagos.length === 1) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'contenido',
      mensaje: `Término vago: "${vagos[0].termino}". Considerar reemplazar con el valor específico de la fuente legal.`,
    });
  }

  // ── Declaración de entidad GEO (motores IA) ──
  // Verifica que el body empieza con una declaración clara de entidad
  // ("El X en Honduras es...") para que los motores IA extraigan la entidad.
  if (!tieneDeclaracionEntidad(post.body)) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'geo',
      mensaje: 'El body no empieza con una declaración de entidad clara (ej: "El X en Honduras es..."). Para GEO (motores IA), iniciar con una definición directa mejora la extracción de entidad.',
    });
  }

  // ── SEO local (NAP) — esencial para GEO local ──
  const faltantesNAP = verificarSeoLocal(post.body);
  for (const f of faltantesNAP) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'seo_local',
      mensaje: f,
    });
  }

  // ── Cita a la marca excesiva (autopromoción, degrada E-E-A-T) ──
  const textoPlano = stripHtml(post.body).toLowerCase();
  const mencionesMarca = (textoPlano.match(/pineda y asociados/g) ?? []).length;
  // Umbral: más de 1 mención por cada 250 palabras es autopromoción excesiva
  const umbralMarca = Math.max(3, Math.floor(palabras / 250));
  if (mencionesMarca > umbralMarca) {
    hallazgos.push({
      severidad: 'importante',
      categoria: 'eeat',
      mensaje: `"${NAP.nombre}" mencionada ${mencionesMarca} veces en ${palabras} palabras. Exceso de autopromoción degrada E-E-A-T. Limitar a menciones naturales.`,
    });
  }

  // ── Frases prohibidas de autopromoción (R17, claim comercial sin verificación) ──
  // Frases distintivas seguras por substring (lo bastante largas/específicas
  // para no aparecer en texto inocente).
  const frasesProhibidasSimples = [
    'somos los mejores', 'los mejores abogados', 'líderes en', 'lideres en',
    'los únicos', 'los unicos', 'mejor bufete', 'mejor despacho',
    'más reconocidos', 'mas reconocidos', 'galardonados', 'premiados', 'award winning',
  ];
  // Patrones numéricos que REQUIEREN contexto autopromocional para no generar
  // falsos positivos. "número 1" / "numero 1" / "#1" aparecen con frecuencia
  // en texto jurídico inocente: "el artículo número 1", "el caso número 1",
  // "el ejemplo número 1", "el numeral 1". Por eso solo se marcan cuando hay
  // un sujeto autopromocional antes (somos/el/los/bufete/despacho) o un
  // ámbito competitivo después ("número 1 en...").
  const frasesProhibidasNumericas: RegExp[] = [
    /\b(?:somos|bufete|despacho|el|los)\s+(?:el\s+|los\s+)?n[uú]mero\s*1\b/i,
    /\b#\s*1\s+en\b/i,
    /\bn[uú]mero\s*1\s+en\b/i,
  ];
  const frasesSimplesEncontradas = frasesProhibidasSimples.filter((f) =>
    textoPlano.includes(f),
  );
  const frasesNumericasEncontradas = frasesProhibidasNumericas.filter((re) =>
    re.test(textoPlano),
  );
  if (frasesSimplesEncontradas.length > 0 || frasesNumericasEncontradas.length > 0) {
    const todas = [
      ...frasesSimplesEncontradas,
      ...frasesNumericasEncontradas.map((re) => re.source),
    ];
    hallazgos.push({
      severidad: 'critico',
      categoria: 'eeat',
      mensaje: `Frases de autopromoción no verificables (R4/R17): "${todas.join('", "')}". Violan la regla de no inventar métricas/rankings.`,
    });
  }

  // ── HTML: tags balanceados ──
  const desbalance = verificarHtmlBalance(post.body);
  if (desbalance.length > 0) {
    hallazgos.push({
      severidad: desbalance.length > 2 ? 'importante' : 'recomendable',
      categoria: 'html',
      mensaje: `HTML desbalanceado: ${desbalance.join(', ')}. Tags abiertas/cerradas inconsistentes.`,
    });
  }

  // ── Estructura: párrafos vacíos o excesivamente largos ──
  const parrafos = extraerParrafos(post.body);
  const parrafosVacios = parrafos.filter((p) => p.length === 0);
  if (parrafosVacios.length > 2) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'estructura',
      mensaje: `${parrafosVacios.length} párrafo(s) <p> vacío(s). Eliminar para evitar nodos vacíos.`,
    });
  }
  const largos = parrafos.filter((p) => wordCount(p) > 120);
  if (largos.length > 0) {
    hallazgos.push({
      severidad: 'recomendable',
      categoria: 'estructura',
      mensaje: `${largos.length} párrafo(s) muy largo(s) (>120 palabras). Dividir para mejorar legibilidad y escaneabilidad.`,
    });
  }

  // ── Estructura de contenido editorial ──
  // Verifica qué elementos de calidad editorial están presentes en el body.
  // Basado en el checklist: cita legal, explicación sencilla, ejemplo práctico,
  // interpretación, errores frecuentes, FAQs, fuente oficial, fecha referencia.
  // Severidad 'recomendable' (no bloqueante): la estructura mejora E-E-A-T y
  // ayuda a Google a entender el contenido, pero su ausencia no invalida el post.
  {
    const texto = stripHtml(post.body).toLowerCase();
    const elementos = [
      { id: 'cita_legal', label: 'Cita legal (Art. N del Código)', presente: /art(?:ículo)?\.?\s*\d+/i.test(texto) },
      { id: 'explicacion_llana', label: 'Explicación en lenguaje llano', presente: /(?:en otras palabras|es decir|dicho de otro modo|en términos sencillos|explicado de forma simple|esto significa|lo que quiere decir|básicamente|en cristiano|en lenguaje claro)/i.test(texto) },
      { id: 'ejemplo', label: 'Ejemplo práctico', presente: /\b(?:ejemplo|supuesto|caso práctico|caso hipotético|imagina|imaginar|pongamos|supongamos|maría|juan)\b/i.test(texto) || /(?:maría|juan|pedro|carlos|ana) .*(?:trabaj|despid|contrat|demand|reclam)/i.test(texto) },
      { id: 'errores', label: 'Errores o malentendidos frecuentes', presente: /(?:error(?:es)?|frecuente(?:s)?|malinterpre|creen\s+que|suelen|equivoc|confund|mito|lo\s+que\s+muchos\s+creen)/i.test(texto) },
      { id: 'relacion', label: 'Relación con otros temas', presente: /(?:relacionado|temas\s+relacionados|artículos?\s+que\s+(?:pueden|te)\s+interes|más\s+información\s+en|también\s+es\s+importante|te\s+recomendamos|puede\s+interesarle|conoce\s+también)/i.test(texto) },
      { id: 'faqs', label: 'Preguntas frecuentes (FAQ)', presente: /¿[^?]+\?/i.test(texto) || /\b(?:preguntas? frecuentes?|faq)\b/i.test(texto) },
      { id: 'fuente', label: 'Fuente oficial (Decreto, año, vigencia)', presente: /\b(?:decreto\s*\d+|código\s+\w+\s*,\s*decreto|vigente|vigencia|base\s+legal|normativa\s+aplicable)\b/i.test(texto) },
    ];
    const ausentes = elementos.filter((e) => !e.presente);
    if (ausentes.length >= 5) {
      // >50% de los elementos faltan: la IA debe reescribir
      hallazgos.push({
        severidad: 'importante',
        categoria: 'estructura',
        mensaje: `Estructura editorial muy incompleta: faltan ${ausentes.length} de 7 elementos (${ausentes.map((e) => e.label).join(', ')}). La IA debe reescribir el artículo.`,
      });
    } else if (ausentes.length > 0) {
      // 1-4 elementos faltan: guía, no bloquea
      hallazgos.push({
        severidad: 'recomendable',
        categoria: 'estructura',
        mensaje: `Falta${ausentes.length > 1 ? 'n' : ''} ${ausentes.length} elemento${ausentes.length > 1 ? 's' : ''} editorial${ausentes.length > 1 ? 'es' : ''}: ${ausentes.map((e) => e.label).join(', ')}.`,
      });
    }
  }

  // ── Oportunidades de enlazado interno (sugerencias editoriales) ──
  // La IA en el prompt ya se encarga de añadir enlaces internos como parte
  // de la estructura editorial (Relación con otros temas).

  return hallazgos;
}

/**
 * Compara los hallazgos SEO del body original con los del body corregido por IA.
 * Devuelve solo las REGRESIONES críticas nuevas (no presentes en el original):
 * un enlace a ruta privada, un H1, etc. introducidos por la IA. Si hay
 * regresiones, el body corregido se RECHAZA (conservar el original es más
 * seguro que aceptar una regresión de privacidad/SEO).
 *
 * EXCLUSIONES:
 *   - categoria 'longitud': su mensaje contiene el conteo de palabras, que
 *     cambia entre original y corregido (p.ej. "432 palabras..." vs "860
 *     palabras...") y generaría una falsa "regresión nueva" cada vez que la IA
 *     expande un post thin. La longitud se valida aparte en la Guardia 3
 *     (ampliadoConExito), así que aquí se ignora para evitar falsos positivos.
 *   - categorías no críticas: detectarRegresionesSEO solo busca REGRESIONES
 *     críticas (enlaces a rutas privadas, H1, disclaimer, fecha futura,
 *     categoría inválida, frases prohibidas, canonical inválido, HTML roto).
 */
export function detectarRegresionesSEO(
  post: PostRow,
  bodyOriginal: string,
  bodyCorregido: string,
): HallazgoSEO[] {
  const originales = analizarSEO({ ...post, body: bodyOriginal }, wordCount(bodyOriginal));
  const corregidos = analizarSEO({ ...post, body: bodyCorregido }, wordCount(bodyCorregido));
  // Clave de comparación estable: categoria + mensaje. La categoria 'longitud'
  // se excluye porque su mensaje incluye el conteo variable de palabras y se
  // gestiona en la Guardia 3 (ampliación).
  const claveOriginal = new Set(
    originales
      .filter((h) => h.categoria !== 'longitud')
      .map((h) => `${h.categoria}|${h.mensaje}`),
  );
  return corregidos.filter(
    (h) =>
      h.severidad === 'critico' &&
      h.categoria !== 'longitud' &&
      !claveOriginal.has(`${h.categoria}|${h.mensaje}`),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 2.6 — Validación post-escritura (R13/R17)
// ═══════════════════════════════════════════════════════════════════════════
//
// Tras escribir el body en DB (ya sanitizado), el script relee el post y
// re-analiza. Si el body escrito NO pasa los validadores blocking (crítico/
// importante) o introduce discrepancias fácticas nuevas respecto al body
// final pre-escritura, se REVIERTE al body original. Esto garantiza que un
// cambio nunca degrada el post: si la sanitización o un edge-case rompe algo,
// el original se conserva.

export interface ResultadoPostEscritura {
  deberiaRevertir: boolean;
  motivo: string;
  hallazgosBlocking: HallazgoSEO[];
  discrepanciasNuevas: Discrepancia[];
}

/**
 * Evalúa si el body recién escrito en DB debe revertirse al original.
 * FUNCIÓN PURA (testeable sin DB): recibe los hallazgos y discrepancias del
 * body re-leído de DB, y los del bodyFinal pre-escritura, y decide.
 *
 * Criterios de reversión:
 *   - Cualquier hallazgo crítico/importante NUEVO (no presente en el
 *     bodyFinal pre-escritura) → revertir. La sanitización no debería
 *     introducir problemas; si lo hace, es un bug y el original es más seguro.
 *   - Cualquier discrepancia fáctica NUEVA (alucinación introducida por
 *     sanitización o edge-case) → revertir.
 *   - Si el body escrito tiene <50 palabras → revertir (guardia existente).
 */
export function evaluarPostEscritura(
  hallazgosPost: HallazgoSEO[],
  discrepanciasPost: Discrepancia[],
  hallazgosPreEscritura: HallazgoSEO[],
  discrepanciasPreEscritura: Discrepancia[],
  palabrasPost: number,
): ResultadoPostEscritura {
  if (palabrasPost < 50) {
    return {
      deberiaRevertir: true,
      motivo: `Body escrito tiene ${palabrasPost} palabras (<50). Revertido al original.`,
      hallazgosBlocking: hallazgosPost.filter((h) => h.severidad === 'critico' || h.severidad === 'importante'),
      discrepanciasNuevas: [],
    };
  }
  const msgsPre = new Set(
    hallazgosPreEscritura
      .filter((h) => h.severidad === 'critico' || h.severidad === 'importante')
      .map((h) => `${h.categoria}|${h.mensaje}`),
  );
  const blockingNuevos = hallazgosPost.filter(
    (h) =>
      (h.severidad === 'critico' || h.severidad === 'importante') &&
      !msgsPre.has(`${h.categoria}|${h.mensaje}`),
  );
  const msgsDiscPre = new Set(discrepanciasPreEscritura.map((d) => d.mensaje));
  const discNuevas = discrepanciasPost.filter((d) => !msgsDiscPre.has(d.mensaje));
  if (blockingNuevos.length > 0) {
    return {
      deberiaRevertir: true,
      motivo: `Validación post-escritura: ${blockingNuevos.length} hallazgo(s) blocking nuevo(s): ${blockingNuevos.slice(0, 2).map((h) => h.mensaje).join(' | ')}`,
      hallazgosBlocking: blockingNuevos,
      discrepanciasNuevas: discNuevas,
    };
  }
  if (discNuevas.length > 0) {
    return {
      deberiaRevertir: true,
      motivo: `Validación post-escritura: ${discNuevas.length} discrepancia(s) fáctica(s) nueva(s): ${discNuevas.slice(0, 2).map((d) => d.mensaje).join(' | ')}`,
      hallazgosBlocking: blockingNuevos,
      discrepanciasNuevas: discNuevas,
    };
  }
  return { deberiaRevertir: false, motivo: 'OK', hallazgosBlocking: [], discrepanciasNuevas: [] };
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 2.8 — Repetición entre artículos (anti-plantilla cross-article)
// ═══════════════════════════════════════════════════════════════════════════
//
// Si la IA genera el mismo bloque de texto en múltiples artículos, están
// actúan como plantilla. Este check cross-article extrae n-grams de palabras
// de cada body y detecta secuencias compartidas por ≥N artículos. Se ejecuta
// a nivel de lote (no por-post) al final del procesamiento.

export interface BloqueRepetido {
  /** La secuencia de palabras compartida (n-gram). */
  secuencia: string;
  /** Slugs de los artículos que la contienen. */
  slugs: string[];
  /** Número de artículos que la comparten. */
  count: number;
}

/**
 * Detecta bloques de texto repetidos entre múltiples artículos.
 *
 * @param bodies Array de { slug, body } (texto plano o HTML — se strippea).
 * @param nGramSize Tamaño del n-gram en palabras (default 8 — balance entre
 *                  falsos positivos y detección real).
 * @param minArticulos Mínimo de artículos que comparten el bloque para
 *                     considerarse repetido (default 3).
 * @returns Bloques repetidos ordenados por count desc.
 */
export function detectarRepeticionCrossArticle(
  bodies: { slug: string; body: string }[],
  nGramSize = 8,
  minArticulos = 3,
): BloqueRepetido[] {
  // Map: n-gram normalizado → set de slugs
  const ngramToSlugs = new Map<string, Set<string>>();
  for (const { slug, body } of bodies) {
    const texto = stripHtml(body)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tokens = texto.split(' ').filter((t) => t.length > 0);
    if (tokens.length < nGramSize) continue;
    const vistosEnEsteSlug = new Set<string>();
    for (let i = 0; i <= tokens.length - nGramSize; i++) {
      const ngram = tokens.slice(i, i + nGramSize).join(' ');
      // Evitar contar el mismo n-gram múltiples veces dentro del mismo artículo
      if (vistosEnEsteSlug.has(ngram)) continue;
      vistosEnEsteSlug.add(ngram);
      if (!ngramToSlugs.has(ngram)) ngramToSlugs.set(ngram, new Set());
      ngramToSlugs.get(ngram)!.add(slug);
    }
  }
  const repetidos: BloqueRepetido[] = [];
  for (const [secuencia, slugs] of ngramToSlugs) {
    if (slugs.size >= minArticulos) {
      repetidos.push({ secuencia, slugs: [...slugs], count: slugs.size });
    }
  }
  return repetidos.sort((a, b) => b.count - a.count).slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 3 — Correcciones mecánicas idempotentes (de normalizar-blog.ts)
// ═══════════════════════════════════════════════════════════════════════════

function limpiarCtasDuplicados(body: string): { nuevo: string; eliminados: number } {
  let nuevo = body;
  let eliminados = 0;
  // El regex ancla el inicio del <p> en cualquiera de los marcadores de
  // disclaimer/CTA duplicados (canónico actual + legacy). Así se eliminan
  // tanto los disclaimers legacy de los 75 posts antiguos como cualquier
  // copia del disclaimer canónico actual (lib/legal-disclaimer.ts) que un
  // autor hubiera pegado en el body.
  const alternacion = DISCLAIMER_MARCADORES.map(escapeRegex).join('|');
  const patron = new RegExp(
    `<p[^>]*>(\\s*<em[^>]*>)?\\s{0,5}(?:${alternacion})[\\s\\S]{0,400}?(?:<\\/em>)?\\s*<\\/p>`,
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

function truncarTituloSiExcede(title: string): { nuevo: string; cambiado: boolean } {
  if (title.length <= TITLE_MAX) return { nuevo: title, cambiado: false };
  const max = TITLE_MAX - 3;
  const cortado = title.slice(0, max);
  const ultEspacio = cortado.lastIndexOf(' ');
  const limpio = ultEspacio > max / 2 ? cortado.slice(0, ultEspacio) : cortado;
  return { nuevo: limpio.trim() + '...', cambiado: true };
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 3.5 — Auto-fix de metadatos (campos fuera del body)
// ═══════════════════════════════════════════════════════════════════════════
//
// Estos auto-fixes cubren los hallazgos SEO que el script hasta ahora SOLO
// reportaba (metaDescription, description, author, coverImage, rel externos,
// tags). Son transformaciones deterministas y seguras (no tocan slugs, URLs,
// fechas ni categorías — prohibido por R17). Su objetivo: que una pasada de
// --aplicar produzca un post que pase TODOS los validadores, no solo el body.
//
// Todas son funciones PURAS (testeables sin DB) y exportadas.

/** Imagen OG/cover por defecto del bufete (de data/images.ts CORPORATE). */
const COVER_POR_DEFECTO = '/images/og/og-default.webp';

/** Autor canónico del bufete (lib/site.ts — site.name). */
const AUTOR_POR_DEFECTO = site.name;

/**
 * Genera una metaDescription válida (70-155 chars) a partir de la description
 * existente o, si falta, del primer párrafo del body. Trunca en palabra
 * completa a 155 chars. Si el resultado es <70 chars, no se aplica (la IA es
 * quien debe redactar una meta mejor; el auto-fix no inventa contenido).
 *
 * Retorna null si no hay nada que hacer (ya hay meta válida, o el candidato
 * es demasiado corto).
 */
export function autoFixMetaDescription(post: PostRow): { nuevo: string; cambiado: boolean } | null {
  const actual = post.metaDescription ?? '';
  // Si ya hay meta válida en rango, no tocar
  if (actual.trim().length >= META_MIN && actual.length <= META_MAX) {
    return null;
  }
  // Si la meta existe pero es >155, truncar en palabra
  if (actual.trim().length > 0 && actual.length > META_MAX) {
    const truncado = truncarEnPalabra(actual, META_MAX);
    return truncado !== actual ? { nuevo: truncado, cambiado: true } : null;
  }
  // Si no hay meta o es <70, derivar de description o primer párrafo
  let candidata = '';
  if (post.description && post.description.trim().length > 0) {
    candidata = post.description.trim();
  } else {
    // Primer párrafo <p> con texto del body
    const m = post.body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (m) candidata = stripHtml(m[1]).trim();
  }
  if (!candidata) return null;
  const truncada = truncarEnPalabra(candidata, META_MAX);
  // Solo aplicar si alcanza el mínimo (70); si no, la IA debe redactar
  if (truncada.length < META_MIN) return null;
  if (truncada === actual.trim()) return null;
  return { nuevo: truncada, cambiado: true };
}

/**
 * Genera una description (fallback de meta, usada en cards/OG) si falta o es
 * >160. Deriva del primer párrafo del body, truncada a 160. No inventa
 * contenido: si no hay body con párrafos, no aplica.
 */
export function autoFixDescription(post: PostRow): { nuevo: string; cambiado: boolean } | null {
  const actual = post.description ?? '';
  if (actual.trim().length > 0 && actual.length <= DESCRIPTION_MAX) {
    return null;
  }
  if (actual.trim().length > 0 && actual.length > DESCRIPTION_MAX) {
    const truncado = truncarEnPalabra(actual, DESCRIPTION_MAX);
    return truncado !== actual ? { nuevo: truncado, cambiado: true } : null;
  }
  const m = post.body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return null;
  const candidata = stripHtml(m[1]).trim();
  if (!candidata) return null;
  const truncada = truncarEnPalabra(candidata, DESCRIPTION_MAX);
  if (truncada === actual.trim()) return null;
  return { nuevo: truncada, cambiado: true };
}

/**
 * Setea el autor por defecto ('Pineda y Asociados') si el post no tiene autor.
 * Refuerza E-E-A-T en temas YMYL (R17 no prohíbe añadir autor, solo cambiar
 * slugs/URLs/fechas/categorías).
 */
export function autoFixAuthor(post: PostRow): { nuevo: string; cambiado: boolean } | null {
  const actual = post.author ?? '';
  if (actual.trim().length > 0) return null;
  return { nuevo: AUTOR_POR_DEFECTO, cambiado: true };
}

/**
 * Asigna una coverImage por defecto si el post no tiene. Usa la imagen OG
 * canónica del bufete. No sobreescribe una existente.
 */
export function autoFixCoverImage(post: PostRow): { nuevo: string; cambiado: boolean } | null {
  const actual = post.coverImage ?? '';
  if (actual.trim().length > 0) return null;
  return { nuevo: COVER_POR_DEFECTO, cambiado: true };
}

/**
 * Si el post tiene <3 tags, añade tags deterministas derivados de la categoría
 * y el título. NO elimina ni modifica tags existentes (respeta curaduría
 * editorial). Genera slugs ASCII lowercase consistentes con el resto del blog.
 *
 * R17 prohíbe cambiar slugs/URLs/fechas/categorías automáticamente, pero NO
 * tags. Añadir tags faltantes es seguro y mejora navegación/SEO.
 */
export function autoFixTags(post: PostRow): { nuevo: string[]; cambiado: boolean } | null {
  const actuales = post.tags ?? [];
  if (actuales.length >= TAGS_MIN) return null;
  const nuevos = [...actuales];
  // 1. La categoría slug siempre es un tag válido
  const catSlug = post.category;
  if (catSlug && !nuevos.some((t) => t.toLowerCase() === catSlug.toLowerCase())) {
    nuevos.push(catSlug);
  }
  // 2. 'honduras' como tag geográfico (refuerza SEO local)
  if (nuevos.length < TAGS_MIN && !nuevos.some((t) => t.toLowerCase() === 'honduras')) {
    nuevos.push('honduras');
  }
  // 3. Keyword principal del título (primera palabra significativa ≥4 chars)
  if (nuevos.length < TAGS_MIN) {
    const titleTokens = post.title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !STOPWORDS_STUFFING.has(t));
    for (const tok of titleTokens) {
      if (nuevos.length >= TAGS_MIN) break;
      if (!nuevos.some((t) => t.toLowerCase() === tok)) {
        nuevos.push(tok);
      }
    }
  }
  if (nuevos.length === actuales.length) return null;
  // Limitar a TAGS_MAX
  const finales = nuevos.slice(0, TAGS_MAX);
  if (finales.length === actuales.length) return null;
  return { nuevo: finales, cambiado: true };
}

/** Helper: trunca un texto en la última palabra completa ≤ maxLen chars. */
function truncarEnPalabra(texto: string, maxLen: number): string {
  const t = texto.trim();
  if (t.length <= maxLen) return t;
  const cortado = t.slice(0, maxLen);
  const ultEspacio = cortado.lastIndexOf(' ');
  const limpio = ultEspacio > maxLen / 2 ? cortado.slice(0, ultEspacio) : cortado;
  return limpio.trim();
}

/**
 * Resultado de aplicar todos los auto-fixes de metadatos a un post. Cada campo
 * que no es null debe escribirse en DB.
 */
export interface AutoFixMetadatos {
  title: { nuevo: string; cambiado: boolean } | null;
  metaDescription: { nuevo: string; cambiado: boolean } | null;
  description: { nuevo: string; cambiado: boolean } | null;
  author: { nuevo: string; cambiado: boolean } | null;
  coverImage: { nuevo: string; cambiado: boolean } | null;
  tags: { nuevo: string[]; cambiado: boolean } | null;
  cambiosAplicados: string[];
}

/**
 * Aplica TODOS los auto-fixes de metadatos a un post (función pura, no escribe).
 * Retorna los campos a escribir + lista descriptiva de cambios. El caller es
 * responsable de persistir en DB (solo si --aplicar).
 *
 * @param post Post actual (con body ya corregido por IA/mecánico si aplicó)
 */
export function aplicarAutoFixesMetadatos(post: PostRow): AutoFixMetadatos {
  const cambios: string[] = [];
  const rTitle = truncarTituloSiExcede(post.title);
  if (rTitle.cambiado) cambios.push(`title truncado a ${rTitle.nuevo.length} chars`);
  const rMeta = autoFixMetaDescription(post);
  if (rMeta) cambios.push(`metaDescription generada/truncada (${rMeta.nuevo.length} chars)`);
  const rDesc = autoFixDescription(post);
  if (rDesc) cambios.push(`description generada/truncada (${rDesc.nuevo.length} chars)`);
  const rAuthor = autoFixAuthor(post);
  if (rAuthor) cambios.push(`author seteado a "${rAuthor.nuevo}"`);
  const rCover = autoFixCoverImage(post);
  if (rCover) cambios.push(`coverImage seteada a "${rCover.nuevo}"`);
  const rTags = autoFixTags(post);
  if (rTags) cambios.push(`tags: ${post.tags?.length ?? 0} → ${rTags.nuevo.length}`);
  return {
    title: rTitle.cambiado ? rTitle : null,
    metaDescription: rMeta,
    description: rDesc,
    author: rAuthor,
    coverImage: rCover,
    tags: rTags,
    cambiosAplicados: cambios,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  FASE 3.7 — Sanitización de citas legales (lista blanca)
// ═══════════════════════════════════════════════════════════════════════════
//
// EL PROBLEMA: la IA inventa decretos, números de artículo y valores.
// El enfoque anterior (detectar y bloquear) siempre se cuela algo.
//
// LA SOLUCIÓN: lista blanca. Después de que la IA genere el body, esta
// función ELIMINA automáticamente cualquier cita legal que no podamos
// verificar contra las fuentes canónicas. El texto se conserva pero la
// cita específica se reemplaza por una referencia genérica segura.
//
// Así, el published body NUNCA contiene datos legales no verificados.

/**
 * Decretos verificados contra fuentes oficiales (AGENTS.md §8).
 * Cualquier "Decreto X-YYYY" que no esté aquí se elimina del body.
 */
const DECRETOS_VERIFICADOS = new Set([
  '130-2017', '119-2019', '144-83', '132-2007', '9-99', '59-97', '189-87',
  '189-1959', '189-59', '51-2003', '106-1972', '84-2017', '76-84',
]);

/**
 * Elimina del body todas las citas legales no verificadas:
 * 1. Decretos no en la lista verificada → reemplazar por "la legislación vigente"
 * 2. Artículos que no existen en las fuentes canónicas → eliminar la referencia
 *
 * @returns Body sanitizado + conteo de citas eliminadas
 */
function sanitizarCitasLegales(body: string): { nuevo: string; eliminados: number } {
  let eliminados = 0;

  // Los tags de formato (<em>, <strong>, <span>, <sup>) dentro de los
  // paréntesis impiden que el regex matchee. Los quitamos temporalmente
  // del body — el contenido es más importante que el formato inline.
  // También decodificamos entities HTML comunes para que el regex matchee.
  let nuevo = body
    .replace(/<\/?(?:em|strong|span|sup|sub)[^>]*>/gi, '')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&Ntilde;/gi, 'Ñ');

  // 1a. "Código X (Decreto Y-YYYY...)" → "Código X" (eliminar paréntesis completo)
  nuevo = nuevo.replace(
    /(Código\s+(?:Penal|Civil|de\s+Comercio|de\s+Trabajo|Tributario|Procesal\s+Penal|de\s+Familia|Aduanero)|Ley\s+de\s+[\w\s]{3,40}|Constitución\s+de\s+(?:la\s+)?(?:República|Honduras)(?:\s+de\s+Honduras)?)\s*\(\s*Decreto\s*(\d+[-–]\w+)[^)]*\)/gi,
    (match, nombre: string, numDecreto: string) => {
      const normalized = numDecreto.replace('–', '-');
      if (DECRETOS_VERIFICADOS.has(normalized)) return match;
      eliminados++;
      return nombre;
    },
  );

  // 1b. "Decreto Y-YYYY" solo → "la legislación vigente"
  nuevo = nuevo.replace(
    /\bDecreto\s*(\d+[-–]\w+)\b/gi,
    (match, numDecreto: string) => {
      const normalized = numDecreto.replace('–', '-');
      if (DECRETOS_VERIFICADOS.has(normalized)) return match;
      eliminados++;
      return 'la legislación vigente';
    },
  );

  // 1c. Limpiar "(la legislación vigente)" redundante cuando va después de
  //     un nombre de código/ley/constitución (producto de pasadas anteriores
  //     donde el decreto fue reemplazado pero el paréntesis quedó).
  nuevo = nuevo.replace(
    /(Código\s+(?:Penal|Civil|de\s+Comercio|de\s+Trabajo|Tributario|Procesal\s+Penal|de\s+Familia|Aduanero)|Ley\s+de\s+[\w\s]{3,40}|Constitución\s+de\s+(?:la\s+)?(?:República|Honduras)(?:\s+de\s+Honduras)?)\s*\(\s*la\s+legislación\s+vigente\s*\)/gi,
    '$1',
  );

  // 2. Artículos del CP/Códigos que no existen en fuentes canónicas
  // Buscar "Art. N del Código X" o "Art. N CP/CT/CC/CM/CTrib"
  nuevo = nuevo.replace(
    /\bArt(?:ículo)?\.?\s*(\d+(?:-\w+)?)\s*(?:del?(?:\s+la)?\s+)?(?:Código\s+Penal|CP|Código\s+Procesal\s+Penal|CPP|Código\s+Civil|CC|Código\s+de\s+Familia|CF|Código\s+de\s+Trabajo|CT|Código\s+de\s+Comercio|CM|Código\s+Tributario|CTrib|Código\s+Aduanero|CA)\b/gi,
    (match, _num: string) => {
      const key = canonicalArticuloKey(match);
      if (!key) return match;
      const existe =
        articulosCpSet.has(key) ||
        delitosPorArticulo.has(key) ||
        articulosCtSet.has(key) ||
        articulosCcSet.has(key) ||
        articulosCmSet.has(key) ||
        articulosCtribSet.has(key);
      if (existe) return match;
      eliminados++;
      return 'la normativa aplicable';
    },
  );

  // 3. Artículos de la Constitución no verificados
  nuevo = nuevo.replace(
    /\bArt(?:ículo)?\.?\s*(\d+(?:-\w+)?)\s*(?:de\s+la\s+)?Constitución\b/gi,
    (match, _num: string) => {
      const key = canonicalArticuloKey(match);
      if (!key) return match;
      if (articulosConstSet.has(key)) return match;
      eliminados++;
      return 'la Constitución de la República';
    },
  );

  return { nuevo, eliminados };
}

const PROMPT_SISTEMA_CORRECCION = `Eres un editor jurídico senior de Pineda y Asociados, un bufete serio en Honduras.
Corriges errores fácticos y mejoras la profesionalidad y SEO/GEO de artículos del blog legal.

REGLAS ABSOLUTAS:
1. Corriges los errores fácticos listados en el reporte de verificación.
   PUEDES reescribir el artículo completo si es necesario para cumplir la
   ESTRUCTURA DE CALIDAD EDITORIAL (ver abajo). Lo ÚNICO que debes conservar
   es el TEMA y OBJETIVO original del artículo — si habla de salarios en
   Honduras, el artículo corregido debe seguir hablando de salarios en
   Honduras, pero con la estructura correcta. Elimina sin problema contenido
   obsoleto, genérico, plantilla o redundante.
2. Si el artículo tiene <600 palabras, lo expandes a 600-1200 palabras usando SOLO
   información del propio artículo o de su categoría. Si el artículo ya tiene ≥600
   palabras, NUNCA lo acortes ni elimines contenido — solo optimiza SEO/GEO/meta.
   NUNCA inventas datos no presentes en el artículo original o en las fuentes
   canónicas cargadas.
   PRIORIDAD: la calidad del contenido y su optimización SEO/GEO es MÁS importante
   que el conteo de palabras. Un artículo de 650 palabras bien optimizado vale más
   que uno de 1000 con relleno.

3. REVISIÓN DE PROFESIONALIDAD (todos los artículos, incluso los >800 palabras):
   - Eliminas lenguaje sensacionalista, clickbait o amarillista.
   - Los temas penales (delitos, violencia, detenciones, allanamientos) requieren
     tono jurídico riguroso, sin morbo ni detalles escabrosos innecesarios.
   - Los temas de familia (divorcio, custodia, unión de hecho, adopción) requieren
     empatía y precisión, sin simplificaciones burdas.
   - Los temas fiscales/tributarios requieren exactitud técnica.
   - Referencias a "Pineda y Asociados" solo donde sea natural, nunca cada 2 párrafos.
   - NUNCA uses frases como "somos los mejores", "líderes en", "los únicos",
     "número 1", "mejor bufete", "premiados", "galardonados" (claims no verificables).
4. Si el artículo ya tiene la estructura de calidad completa (las 7 secciones),
   es profesional y tiene ≥600 palabras, devuelves el HTML original EXACTO.
   Si le falta alguna sección, la añades reescribiendo lo necesario.
5. OPTIMIZACIÓN SEO/GEO (siguiendo mejores prácticas de Google y Bing):
   - Headings jerárquicos: H2→H3, NUNCA <h1> en el body (la plantilla ya renderiza
     el H1 con el título). Si hay <h1>, conviértelo a <h2>.
   - Keywords naturales, sin keyword stuffing (densidad ≤2% por palabra clave).
   - Estructura clara: párrafos de 3-5 líneas máximo, listas donde aporten valor.
    - Toda imagen debe tener alt text descriptivo (si la imagen ya existe, no lo
      inventes — solo si falta el atributo alt, añade alt="" decorativo o descriptivo).
    - NO añadas el disclaimer legal al body (el componente ya lo renderiza).
    - NO inventes métricas, rankings, premios, ubicaciones, clientes ni fechas.
    - META DESCRIPTION alineada con el objetivo del artículo: ni copia del title,
      ni describiendo temas que el artículo no toca. Debe resumir el contenido real
      y contener al menos una keyword geográfica si aplica.
6. OPTIMIZACIÓN GEO (Generative Engine Optimization — IA answer engines):
   - Declaraciones de entidad claras al inicio: "El <delito/concepto> en Honduras
     es..." para que los motores IA extraigan la entidad correcta.
   - Bloques en formato respuesta directa (pregunta + respuesta concisa) para
     alimentar featured snippets y respuestas IA.
   - Datos estructurados implícitos: cuando menciones un artículo del CP, usa el
     formato "Art. NNN del Código Penal de Honduras (Decreto 130-2017)".
   - Mantén la precisión jurídica sobre la optimización: nunca sacrifiques verdad
     legal por claridad. Una cita incorrecta es peor que una cita ausente.
   - SEO LOCAL: el bufete atiende en el SUR de Honduras, con sede en Nacaome
     (Valle) y presencia en Choluteca y San Lorenzo. Si el artículo NO menciona
     ninguna ciudad o zona geográfica, añade UNA mención natural a una de estas
     ciudades donde encaje (ej: "En Nacaome y la zona sur de Honduras, este
     delito se procesa en los tribunales de Valle"). NO cambies la intención
     del artículo ni inventes datos locales específicos (casos, sentencias
     locales) — solo añade una mención geográfica natural que refuerce el SEO
      local. Si el artículo ya menciona Honduras o una ciudad, NO añadas más.
7. Mantienes HTML válido y bien formado.

ESTRUCTURA DE CALIDAD EDITORIAL — OBLIGATORIA para TODO artículo:
   El artículo DEBE cubrir estos 7 TEMAS (no tienen que usar títulos literales;
   la IA elige los H2/H3 que mejor encajen con el tema concreto del artículo):

   1. CITA Y BASE LEGAL: transcribe o parafrasea la norma relevante del código
      citado. Usa títulos como "¿Qué dice el Código de Trabajo sobre X?" o
      "Marco legal de X en Honduras" — lo que sea natural para el tema.
   2. EXPLICACIÓN EN LENGUAJE LLANO: reescribe la norma para que cualquier
      persona sin formación jurídica la entienda. Sin tecnicismos innecesarios.
   3. EJEMPLO PRÁCTICO: caso hipotético con nombres ficticios, números
      concretos y resultado final. Titúlalo como "Ejemplo: el caso de María"
      o "Caso práctico: ¿qué pasa si...?".
   4. ERRORES O MALENTENDIDOS FRECUENTES: cosas que la gente suele creer
      mal. Título sugerido: "Lo que muchos creen (y no es cierto)" o
      "Errores habituales al reclamar X".
   5. RELACIÓN CON OTROS TEMAS: menciona y enlaza al menos 2 artículos
      relacionados del blog o áreas jurídicas. Título: "Temas relacionados"
      o "Artículos que pueden interesarte".
   6. PREGUNTAS FRECUENTES: 2-3 FAQs con formato pregunta-respuesta.
      Usa H3 para cada pregunta: "¿Cuánto tiempo tengo para reclamar?".
   7. FUENTE OFICIAL Y VIGENCIA: cita el código con decreto, año y estado
      de actualización. Título: "Base legal" o "Normativa aplicable".

   REGLAS:
   - Los títulos de arriba son SUGERENCIAS. La IA debe adaptarlos al tema.
     Si el artículo es sobre "cómo calcular prestaciones", no pongas "Cita
     legal y explicación" — pon "¿Qué establece el Código de Trabajo?" o
     "Marco legal de las prestaciones en Honduras".
   - El H1 lo renderiza la plantilla. NUNCA uses <h1> en el body.
   - NO añadas disclaimer legal al body (el componente ya lo renderiza).
   - Cada sección debe contener información SUSTANCIAL, no frases genéricas.
   - Prioriza la VERDAD sobre la completitud.

Devuelve EXCLUSIVAMENTE un JSON con esta forma, sin texto adicional:
{
  "body": "<HTML del body corregido>",
  "cambios_realizados": ["descripción breve de cada cambio"],
  "advertencias": ["cualquier cosa que necesite revisión humana adicional"]
}`;

/**
 * fetch con reintento y backoff exponencial para 429/5xx. Sin esto, un pico
 * de rate-limit de DeepSeek sobre 159 posts descarta artículos sin motivo.
 */
async function fetchConRetry(
  url: string,
  opts: RequestInit,
  timeoutMs: number,
  maxRetries = 2,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const wait = 2000 * Math.pow(2, attempt); // 2s, 4s
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(timeout);
      if (attempt < maxRetries && !(e instanceof Error && e.name === 'AbortError')) {
        const wait = 2000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
}

async function corregirConIA(
  post: PostRow,
  discrepancias: Discrepancia[],
  hallazgosSEO: HallazgoSEO[],
  palabrasActuales: number,
  necesitaCorreccion: boolean,
  intento = 1,
  bodyPrevioIntento: string | null = null,
): Promise<{ ok: true; data: SugerenciaIA } | { ok: false; error: string }> {
  // En reintentos, usar el body previo de la IA como punto de partida (la IA
  // ya expandió desde el original; retomar desde ahí es más eficiente que
  // empezar de nuevo). El body original se conserva para guardias/validación.
  const bodyBase = intento > 1 && bodyPrevioIntento ? bodyPrevioIntento : post.body;
  const palabrasBase = wordCount(bodyBase);
  // Construir el reporte de discrepancias fácticas para el prompt
  let reporteTxt = '';
  if (discrepancias.length > 0) {
    reporteTxt = 'ERRORES FÁCTICOS DETECTADOS (corregir SOLO estos):\n';
    for (const d of discrepancias) {
      reporteTxt += `- [${d.severidad}] ${d.mensaje}\n`;
      reporteTxt += `  Valor en el artículo: "${d.valorEncontrado}"\n`;
      reporteTxt += `  Valor correcto: ${d.valorCorrecto}\n`;
      reporteTxt += `  Fuente: ${d.fuente}\n`;
    }
  } else {
    reporteTxt = 'No se detectaron errores fácticos.';
  }

  // Construir el reporte de hallazgos SEO/GEO para el prompt
  const hallazgosSEOActivos = hallazgosSEO.filter(
    (h) => h.categoria !== 'longitud', // la longitud se maneja aparte
  );
  let reporteSEOTxt = '';
  if (hallazgosSEOActivos.length > 0) {
    reporteSEOTxt = '\n\nHALLAZGOS SEO/GEO (corregir según reglas del sistema):\n';
    for (const h of hallazgosSEOActivos) {
      reporteSEOTxt += `- [${h.severidad}] (${h.categoria}) ${h.mensaje}\n`;
    }
  }

  const necesitaExpandir = palabrasBase < MIN_PALABRAS;
  const palabrasFaltan = MIN_PALABRAS - palabrasBase;
  const instruccionExpandir = necesitaExpandir
    ? `\n\n⚠️ EXPANSIÓN OBLIGATORIA: El artículo tiene ${palabrasBase} palabras (mínimo requerido: ${MIN_PALABRAS}). Debes expandirlo a 800-1000 palabras usando SOLO información ya presente en el artículo o en su categoría "${post.category}". NO inventes datos legales nuevos. Si no puedes expandir sin inventar, indícalo en advertencias.${intento > 1 ? `\n\n🔄 REINTENTO #${intento}: En el intento anterior generaste ${palabrasBase} palabras. Te faltan ${palabrasFaltan} palabras para alcanzar el mínimo de ${MIN_PALABRAS}. Expande el contenido existente con más detalle, ejemplos, explicaciones o análisis — SIEMPRE usando solo información ya presente. NO repitas contenido ya escrito; añade profundidad nueva.` : ''}`
    : '';

  // Instrucción de profesionalidad para artículos ya OK (>800 palabras, sin discrepancias)
  // Determinar si el body tiene citas legales (para instrucción de verificación)
  const bodyTieneCitas = extraerClaims(bodyBase).some(
    (c) => c.tipo === 'articulo_cp' || c.tipo === 'articulo_const',
  );
  const instruccionProfesionalidad = !necesitaCorreccion
    ? (bodyTieneCitas
        ? `\n\nVERIFICACIÓN DE PRECISIÓN DE CITAS LEGALES: Este artículo tiene buena longitud (${palabrasBase} palabras) y sin errores fácticos detectados. PERO contiene citas a artículos legales. Recibirás los TEXTOS OFICIALES de esos artículos. Tu tarea es: 1) comparar los valores del body con los textos oficiales, 2) si hay discrepancias (porcentajes, plazos, cantidades), CORREGIRLOS para que coincidan con la fuente oficial, 3) si falta algún elemento de estructura, añadirlo. NO devuelvas el HTML sin cambios si los valores no coinciden — la precisión legal es prioritaria.`
        : `\n\nEste artículo ya tiene buena longitud (${palabrasBase} palabras) y sin errores fácticos detectados. SOLO revisa su profesionalidad, tono y SEO/GEO. Si es profesional y correcto, devuelve el HTML EXACTO sin cambios. Solo modifica si encuentras lenguaje sensacionalista, clickbait, falta de rigor en temas penales/familia/fiscales, exceso de autopromoción, o problemas SEO/GEO listados arriba.`)
    : '';

  const accion = necesitaCorreccion ? 'CORRIGE' : 'REVISA';

  // ── TEXTOS LEGALES DE REFERENCIA ──
  // Inyectar los textos reales de los artículos citados en el body para que
  // la IA pueda citarlos con precisión en lugar de inventar porcentajes o
  // valores aproximados. Se busca en todos los códigos cargados (CP, CT,
  // CC, CM, CTrib) usando el mismo canonicalArticuloKey.
  let refsTxt = '';
  const claimsEnBody = extraerClaims(bodyBase);
  const citados = new Set<string>();
  for (const claim of claimsEnBody) {
    if (claim.tipo !== 'articulo_cp' && claim.tipo !== 'articulo_const') continue;
    const key = canonicalArticuloKey(claim.textoOriginal);
    if (!key || citados.has(key)) continue;
    citados.add(key);
    // Buscar en todos los Maps
    let art: ArticuloCpRow | undefined;
    if (articulosCpMap.has(key)) art = articulosCpMap.get(key);
    else if (articulosCtMap.has(key)) art = articulosCtMap.get(key);
    else if (articulosCcMap.has(key)) art = articulosCcMap.get(key);
    else if (articulosCmMap.has(key)) art = articulosCmMap.get(key);
    else if (articulosCtribMap.has(key)) art = articulosCtribMap.get(key);
    if (art && art.texto) {
      const textoCorto = art.texto.length > 600 ? art.texto.slice(0, 600) + '...' : art.texto;
      refsTxt += `\n${art.articulo} (${art.epigrafe}): ${textoCorto}`;
    }
  }
  if (refsTxt) {
    refsTxt = '\n\n══════════════════════════════════════════════\n'
      + 'TEXTOS LEGALES OFICIALES DE HONDURAS — FUENTE CANÓNICA\n'
      + '══════════════════════════════════════════════\n'
      + refsTxt
      + '\n\n══════════════════════════════════════════════\n'
      + '⚠️ INSTRUCCIÓN CRÍTICA — LEE ESTO CON ATENCIÓN:\n'
      + 'Los valores numéricos en el body actual pueden ser INCORRECTOS.\n'
      + 'DEBES reemplazar cualquier porcentaje, plazo o cantidad del body\n'
      + 'por los valores EXACTOS de los textos oficiales de arriba.\n'
      + 'Si el texto oficial dice "1 mes por año", NO uses porcentajes.\n'
      + 'Si el texto oficial dice "2-5 años", NO uses "1 año, 2 años, 3 años".\n'
      + 'La fuente oficial es la VERDAD. El body actual puede mentir.\n'
      + '══════════════════════════════════════════════';
  }

  // Truncar el body para no exceder contexto ni coste (≈25k chars como blog-ai-review)
  const bodyParaIA = bodyBase.length > 25000 ? bodyBase.slice(0, 25000) : bodyBase;

  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: PROMPT_SISTEMA_CORRECCION },
      {
        role: 'user',
        content: `${accion} este artículo del blog jurídico:\n\nTÍTULO: ${post.title}\nCATEGORÍA: ${post.category}\nDESCRIPCIÓN: ${post.description}\nPALABRAS ACTUALES: ${palabrasBase}\n\n${reporteTxt}${reporteSEOTxt}${instruccionExpandir}${instruccionProfesionalidad}${refsTxt}\n\nCUERPO HTML ACTUAL:\n${bodyParaIA}\n\nDevuelve el JSON con el body ${necesitaCorreccion ? 'corregido' : 'revisado'}.`,
      },
    ],
    temperature: 0.15,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  };

  try {
    const res = await fetchConRetry(
      DEEPSEEK_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(payload),
      },
      90_000,
    );
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = (data.choices?.[0]?.message?.content ?? '').trim();

    if (!content) {
      return { ok: false, error: 'Respuesta vacía de la IA' };
    }

    let parsed: { body?: string; cambios_realizados?: string[]; advertencias?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false, error: 'La IA no devolvió JSON válido' };
    }

    let bodyCorregido = parsed.body?.trim() ?? '';
    if (!bodyCorregido || wordCount(bodyCorregido) < 20) {
      return { ok: false, error: 'Body corregido vacío o demasiado corto (<20 palabras)' };
    }

    // Verificar que no sea idéntico al original
    if (bodyCorregido === post.body.trim()) {
      return {
        ok: true,
        data: {
          cambiosRealizados: ['Sin cambios — el artículo ya es correcto'],
          advertencias: parsed.advertencias ?? [],
          bodyCorregido: null, // null = sin cambios necesarios
          ampliadoConExito: false,
          alucinacionesNuevas: [],
          regresionesSEO: [],
        },
      };
    }

    // ── SANITIZAR BODY ANTES DE GUARDIAS ──
    // La IA puede incluir decretos no verificados o artículos inexistentes.
    // La sanitización (lista blanca) los elimina ANTES de que las guardias
    // los detecten como alucinaciones. Así, un body con decretos inventados
    // se limpia y se acepta (sin los decretos) en vez de ser rechazado.
    const sanitizado = sanitizarCitasLegales(bodyCorregido);
    if (sanitizado.eliminados > 0) {
      bodyCorregido = sanitizado.nuevo;
    }

    // ── GUARDIA 1: DETECCIÓN DE ALUCINACIONES NUEVAS INTRODUCIDAS POR LA IA ──
    // Re-ejecutar verificación de claims sobre el body corregido (ya sanitizado)
    // y comparar con las discrepancias originales.
    const alucinacionesNuevas = detectarAlucinacionesNuevas(discrepancias, bodyCorregido);

    if (alucinacionesNuevas.length > 0) {
      // RECHAZAR el body corregido: la IA introdujo datos falsos nuevos.
      const advertenciasAluc = alucinacionesNuevas.map(
        (d) => `🚨 ALUCINACIÓN IA: ${d.mensaje}`,
      );
      return {
        ok: true,
        data: {
          cambiosRealizados: [],
          advertencias: [
            ...advertenciasAluc,
            '⚠️ Body corregido RECHAZADO: la IA introdujo datos falsos nuevos. Se conserva el original. Requiere corrección humana.',
            ...(Array.isArray(parsed.advertencias) ? parsed.advertencias : []),
          ],
          bodyCorregido: null, // RECHAZADO por alucinaciones
          ampliadoConExito: false,
          alucinacionesNuevas,
          regresionesSEO: [],
        },
      };
    }

    // ── GUARDIA 2: DETECCIÓN DE REGRESIONES SEO/PRIVACIDAD NUEVAS ──
    // La IA podría introducir un enlace a /intranet o un H1 a pesar del prompt.
    // Re-ejecutar analizarSEO sobre el body corregido y comparar críticos.
    const regresionesSEO = detectarRegresionesSEO(post, post.body, bodyCorregido);
    if (regresionesSEO.length > 0) {
      const advertenciasReg = regresionesSEO.map(
        (h) => `🚨 REGRESIÓN SEO: ${h.mensaje}`,
      );
      return {
        ok: true,
        data: {
          cambiosRealizados: [],
          advertencias: [
            ...advertenciasReg,
            '⚠️ Body corregido RECHAZADO: la IA introdujo regresiones SEO/privacidad. Se conserva el original.',
            ...(Array.isArray(parsed.advertencias) ? parsed.advertencias : []),
          ],
          bodyCorregido: null, // RECHAZADO por regresiones
          ampliadoConExito: false,
          alucinacionesNuevas: [],
          regresionesSEO,
        },
      };
    }

    // ── GUARDIA 3: si el post era thin, el resultado debe alcanzar ≥800 ──
    const palabrasCorregidas = wordCount(bodyCorregido);
    const ampliadoConExito = necesitaExpandir && palabrasCorregidas >= MIN_PALABRAS;
    if (necesitaExpandir && !ampliadoConExito) {
      return {
        ok: true,
        data: {
          cambiosRealizados: Array.isArray(parsed.cambios_realizados) ? parsed.cambios_realizados : [],
          advertencias: [
            `⚠️ IA expandió a ${palabrasCorregidas} palabras (objetivo ≥${MIN_PALABRAS}). Body rechazado: sigue thin. Requiere nuevo intento de IA o revisión humana puntual (fallback).`,
            ...(Array.isArray(parsed.advertencias) ? parsed.advertencias : []),
          ],
          bodyCorregido: null, // RECHAZADO: sigue thin (R13)
          bodyPrevio: bodyCorregido, // Guardar para posible reintento
          palabrasPrevias: palabrasCorregidas,
          ampliadoConExito: false,
          alucinacionesNuevas: [],
          regresionesSEO: [],
        },
      };
    }

    // ── GUARDIA 4: SIMILITUD — cambio irrelevante (R17d) ──
    // Si el body corregido es ≥98% similar al original, la IA no hizo un
    // cambio sustancial. Pero si el post ya era OK y la IA se llamó solo para
    // verificar precisión de citas (necesitaCorreccion=false), un cambio
    // pequeño SÍ es valioso — la IA corrigió porcentajes erróneos o añadió
    // enlaces que faltaban.
    const sim = similitudCuerpo(post.body, bodyCorregido);
    if (sim >= UMBRAL_SIMILITUD && bodyCorregido !== post.body.trim()) {
      if (necesitaCorreccion) {
        return {
          ok: true,
          data: {
            cambiosRealizados: [],
            advertencias: [
              `ℹ️ Body corregido rechazado por similitud ≥${(UMBRAL_SIMILITUD * 100).toFixed(0)}% (similitud real ${(sim * 100).toFixed(1)}%). Cambio irrelevante; se conserva el original.`,
              ...(Array.isArray(parsed.advertencias) ? parsed.advertencias : []),
            ],
            bodyCorregido: null,
            ampliadoConExito: false,
            alucinacionesNuevas: [],
            regresionesSEO: [],
          },
        };
      }
      // Post ya OK + IA verificó citas → aceptar aunque la similitud sea alta.
      // Un cambio pequeño (corregir 10%→1 mes) es valioso.
    }

    return {
      ok: true,
      data: {
        cambiosRealizados: Array.isArray(parsed.cambios_realizados) ? parsed.cambios_realizados : ['Corrección aplicada'],
        advertencias: Array.isArray(parsed.advertencias) ? parsed.advertencias : [],
        bodyCorregido,
        ampliadoConExito,
        alucinacionesNuevas: [],
        regresionesSEO: [],
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Reporte
// ═══════════════════════════════════════════════════════════════════════════

function generarReporteMD(resultados: ResultadoPost[], modo: string, iaActiva: boolean): string {
  const L: Record<Severidad, string> = { critico: '🔴', importante: '🟡', recomendable: '🔵' };
  const lines: string[] = [];
  lines.push(`# Verificación + corrección del blog — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  lines.push('');
  lines.push(`- **Modo:** ${modo}`);
  lines.push(`- **Corrección IA:** ${iaActiva ? `activa (${DEEPSEEK_MODEL})` : 'inactiva'}`);
  lines.push(`- **Posts analizados:** ${resultados.length}`);
  lines.push(`- **Posts OK (sin críticos/importantes):** ${resultados.filter((r) => r.ok).length}`);
  lines.push('');

  // Resumen
  const conDiscrepancias = resultados.filter((r) => r.verificacion.discrepancias.length > 0);
  const conCorreccionIA = resultados.filter((r) => r.sugerenciaIA?.bodyCorregido);
  const thin = resultados.filter((r) => r.estadoLongitud === 'thin');
  const sinClaims = resultados.filter((r) => r.verificacion.sinClaims);

  lines.push('## Resumen');
  lines.push('');
  lines.push('| Métrica | Valor |');
  lines.push('|---|---|');
  lines.push(`| Posts OK (validadores pasan) | ${resultados.filter((r) => r.ok).length} |`);
  lines.push(`| Posts con discrepancias fácticas | ${conDiscrepancias.length} |`);
  lines.push(`| Posts corregidos por IA | ${conCorreccionIA.length} |`);
  lines.push(`| Posts thin (<${MIN_PALABRAS} palabras) | ${thin.length} |`);
  lines.push(`| Posts sin claims legales detectables | ${sinClaims.length} |`);
  lines.push(`| Posts con cambios mecánicos | ${resultados.filter((r) => r.cambiosMecanicos.length > 0).length} |`);
  lines.push('');

  if (conDiscrepancias.length > 0) {
    lines.push('## ⚠️ Posts con discrepancias fácticas');
    lines.push('');
    for (const r of conDiscrepancias) {
      lines.push(`### \`${r.post.slug}\``);
      lines.push(`**${r.post.title}** · ${r.post.category} · ${r.palabras} palabras`);
      lines.push('');
      for (const d of r.verificacion.discrepancias) {
        lines.push(`- ${L[d.severidad]} **${d.mensaje}**`);
        lines.push(`  - Encontrado: \`${d.valorEncontrado}\``);
        lines.push(`  - Correcto: \`${d.valorCorrecto}\` (fuente: ${d.fuente})`);
      }
      if (r.sugerenciaIA?.bodyCorregido) {
        lines.push(`- ✅ Corregido por IA (${r.sugerenciaIA.cambiosRealizados.length} cambios)`);
      } else if (r.iaError) {
        lines.push(`- ❌ Error de IA: ${r.iaError}`);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  if (thin.length > 0) {
    lines.push('## 📝 Posts que requieren ampliación editorial');
    lines.push('');
    for (const r of thin) {
      const ampliado = r.sugerenciaIA?.ampliadoConExito ? '✅ Ampliado por IA' : '⚠️ Pendiente (IA fallback / revisión humana puntual)';
      lines.push(`- \`${r.post.slug}\` — ${r.palabras} palabras — ${ampliado}`);
    }
    lines.push('');
  }

  lines.push('## Detalle por post');
  lines.push('');
  for (const r of resultados) {
    const tieneHallazgos = r.verificacion.discrepancias.length > 0 || r.cambiosMecanicos.length > 0 || r.sugerenciaIA?.bodyCorregido || !r.ok;
    if (!tieneHallazgos) continue;
    lines.push(`### \`${r.post.slug}\` ${r.ok ? '✅' : '⚠️'}`);
    lines.push(`**${r.post.title}** · ${r.post.category} · ${r.palabras} palabras (${r.estadoLongitud})`);
    lines.push('');
    if (r.verificacion.discrepancias.length > 0) {
      lines.push(`**Discrepancias:** ${r.verificacion.discrepancias.length}`);
    }
    if (r.hallazgosSEO.length > 0) {
      lines.push(`**Hallazgos SEO/GEO:**`);
      for (const h of r.hallazgosSEO) {
        lines.push(`- ${L[h.severidad]} [${h.categoria}] ${h.mensaje}`);
      }
    }
    if (r.cambiosMecanicos.length > 0) {
      lines.push(`**Cambios mecánicos:** ${r.cambiosMecanicos.join(', ')}`);
    }
    if (r.sugerenciaIA?.bodyCorregido) {
      lines.push(`**Corrección IA:** ${r.sugerenciaIA.cambiosRealizados.join(', ')}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
//  Checkpoint reanudable (lotes grandes)
// ═══════════════════════════════════════════════════════════════════════════
//
// Para lotes grandes (159 posts con IA), un fallo a mitad puede perder
// progreso. El checkpoint guarda el índice del último post procesado en
// auditoria-blog/checkpoint.json. Al reiniciar (sin --reset-checkpoint), el
// script reanuda desde ahí. Las funciones son puras (testeable sin disco).

export interface Checkpoint {
  modo: string;
  iaActiva: boolean;
  total: number;
  lastCompletedIndex: number; // índice del último post terminado (-1 = ninguno)
  updatedAt: string;
}

const CHECKPOINT_PATH = path.join(
  process.cwd(),
  'auditoria-blog',
  'checkpoint.json',
);

/** Decide si un checkpoint es reanudable: mismo modo, misma IA, mismo total. */
export function checkpointEsReanudable(
  cp: Checkpoint | null,
  modo: string,
  iaActiva: boolean,
  total: number,
): cp is Checkpoint {
  if (!cp) return false;
  return cp.modo === modo && cp.iaActiva === iaActiva && cp.total === total;
}

function leerCheckpoint(): Checkpoint | null {
  try {
    if (!fs.existsSync(CHECKPOINT_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
    if (
      typeof raw?.modo === 'string' &&
      typeof raw?.iaActiva === 'boolean' &&
      typeof raw?.total === 'number' &&
      typeof raw?.lastCompletedIndex === 'number'
    ) {
      return raw as Checkpoint;
    }
    return null;
  } catch {
    return null;
  }
}

function escribirCheckpoint(cp: Checkpoint): void {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 2), 'utf8');
}

function borrarCheckpoint(): void {
  if (fs.existsSync(CHECKPOINT_PATH)) fs.unlinkSync(CHECKPOINT_PATH);
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  const modo = APLICAR ? 'APLICAR' : SOLO_VERIFICAR ? 'SOLO VERIFICAR' : 'DRY-RUN';
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  VERIFICACIÓN + CORRECCIÓN DEL BLOG — MODO ${modo}`);
  console.log(`${'═'.repeat(72)}\n`);

  // Cargar datos canónicos
  console.log('Cargando datos canónicos...');
  cargarDatosCanonicos();
  console.log('');

  if (IA_ENABLED) {
    console.log(`🤖 Corrección IA activa: DeepSeek (modelo "${DEEPSEEK_MODEL}"). Solo corrige datos falsos verificados.`);
  } else if (SOLO_VERIFICAR) {
    console.log('📐 Modo solo verificación: no se aplicará ningún cambio.');
  } else if (NO_AI) {
    console.log('📐 IA inactiva (--no-ai). Solo verificación + cambios mecánicos.');
  } else {
    console.log('📐 IA inactiva (sin DEEPSEEK_API_KEY). Solo verificación + cambios mecánicos.');
  }
  if (!APLICAR && !SOLO_VERIFICAR) {
    console.log('⚠️  DRY-RUN: no se escribirá nada en la DB.');
  }
  if (APLICAR) {
    console.log('⚠️  APLICAR: se escribirán cambios en la DB (body + IA + metadatos + mecánicos).');
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
      canonicalUrl: blogPosts.canonicalUrl,
      author: blogPosts.author,
      ogImage: blogPosts.ogImage,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  if (FILTRO_SLUG) posts = posts.filter((p) => p.slug === FILTRO_SLUG);


  // ── Checkpoint reanudable ──
  // Solo aplica cuando NO hay --slug (lote completo) y NO hay --offset manual.
  // --reset-checkpoint ignora y borra el checkpoint previo.
  let startIdx = 0;
  if (!RESET_CHECKPOINT && !FILTRO_SLUG && OFFSET === 0) {
    const cp = leerCheckpoint();
    if (checkpointEsReanudable(cp, modo, IA_ENABLED, posts.length)) {
      startIdx = cp.lastCompletedIndex + 1;
      if (startIdx > 0 && startIdx < posts.length) {
        console.log(`↻ Checkpoint reanudable encontrado: reanudando desde el post ${startIdx + 1}/${posts.length} (último completado: ${cp.lastCompletedIndex}).\n`);
      } else if (startIdx >= posts.length) {
        console.log(`↻ Checkpoint indica lote ya completado (${cp.lastCompletedIndex + 1}/${posts.length}). Usa --reset-checkpoint para empezar de nuevo.\n`);
        borrarCheckpoint();
        const client0 = (db as unknown as { $client?: { end?: () => unknown } }).$client;
        await client0?.end?.();
        process.exit(0);
      }
    } else if (cp) {
      console.log(`ℹ Checkpoint previo ignorado (modo/IA/total cambiaron). Empezando desde el principio.\n`);
      borrarCheckpoint();
    }
  } else if (RESET_CHECKPOINT) {
    borrarCheckpoint();
    console.log(`↻ Checkpoint reseteado (--reset-checkpoint).\n`);
  }

  if (OFFSET > 0) posts = posts.slice(OFFSET);
  else if (startIdx > 0) posts = posts.slice(startIdx);
  if (LIMIT > 0) posts = posts.slice(0, LIMIT);

  console.log(`Posts publicados cargados. A procesar: ${posts.length}\n`);

  // ── Backup previo ──
  const backupDir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-verify-fix-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`✓ Backup previo: ${backupFile}\n`);

  // ── Procesar ──
  const resultados: ResultadoPost[] = [];
  const resumen = {
    total: posts.length,
    ok: 0,
    conDiscrepancias: 0,
    corrigioIA: 0,
    erroresIA: 0,
    cambiosMecanicos: 0,
    titulosTruncados: 0,
    sinClaims: 0,
    hallazgosSEO: 0,
    alucinacionesIA: 0,
    regresionesSEO: 0,
    reversionesPostEscritura: 0,
    similitudRechazos: 0,
    metaFixes: 0,
    reintentosIA: 0,
    repeticionCrossArticle: 0,
  };

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progreso = `[${i + 1}/${posts.length}]`;

    if (!post.body) {
      console.log(`${progreso} ⚠ ${post.slug} (sin body) — skipeado`);
      continue;
    }

    // ── FASE 1: Verificación ──
    const claims = extraerClaims(post.body);
    const discrepancias = verificarClaims(claims);
    const sinClaims = claims.length === 0;
    if (sinClaims) resumen.sinClaims++;
    if (discrepancias.length > 0) resumen.conDiscrepancias++;

    const verificacion: ResultadoVerificacion = {
      post: { slug: post.slug, title: post.title, category: post.category },
      claimsExtraidos: claims,
      discrepancias,
      sinClaims,
    };

    // ── Análisis SEO ──
    const palabras = wordCount(post.body);
    const estadoLongitud: 'ok' | 'thin' | 'verbose' =
      palabras < MIN_PALABRAS ? 'thin' : palabras > MAX_PALABRAS ? 'verbose' : 'ok';
    const hallazgosSEO = analizarSEO(post, palabras);
    if (hallazgosSEO.length > 0) resumen.hallazgosSEO++;

    // Post OK = sin discrepancias y sin hallazgos críticos/importantes
    const ok = discrepancias.length === 0 &&
      !hallazgosSEO.some((h) => h.severidad === 'critico' || h.severidad === 'importante');
    if (ok) resumen.ok++;

    // ── Icono de estado ──
    const iconoDiscrepancia = discrepancias.some((d) => d.severidad === 'critico')
      ? '🔴' : discrepancias.length > 0 ? '🟡' : '';
    const iconoThin = estadoLongitud === 'thin' ? ' 📝' : '';
    const icono = ok ? '✓' : discrepancias.length > 0 ? iconoDiscrepancia : '🟡';

    // ── FASE 2: Corrección IA (con reintentos si el post thin no llega a 800) ──
    let sugerenciaIA: SugerenciaIA | null = null;
    let iaError: string | null = null;
    const necesitaCorreccion = discrepancias.length > 0 || estadoLongitud === 'thin' ||
      hallazgosSEO.some((h) => h.severidad === 'critico' || h.severidad === 'importante');
    // Forzar IA cuando hay citas legales presentes Y el post no está 100% OK
    // (tiene cualquier hallazgo, aunque sea recomendable). Así la IA recibe los
    // textos canónicos y puede verificar/fijar la precisión de las citas.
    const tieneCitasLegales = claims.some((c) => c.tipo === 'articulo_cp' || c.tipo === 'articulo_const');
    const forzarIA = tieneCitasLegales && hallazgosSEO.length > 0 && IA_ENABLED && !necesitaCorreccion;
    if (IA_ENABLED && (necesitaCorreccion || forzarIA)) {
      // Loop de reintentos: si la IA expande pero no llega a 800, y su body
      // previo tiene ≥700 palabras (cerca del umbral), se reintenta desde ese
      // body con un prompt que le indica exactamente cuántas palabras faltan.
      // Esto resuelve el caso común donde la IA se queda a 20-50 palabras del
      // mínimo por falta de instrucción específica.
      let bodyPrevioRetry: string | null = null;
      let palabrasPreviasRetry = 0;
      for (let intento = 1; intento <= MAX_REINTENTOS_IA; intento++) {
        const r = await corregirConIA(
          post,
          discrepancias,
          hallazgosSEO,
          intento === 1 ? palabras : palabrasPreviasRetry,
          necesitaCorreccion,
          intento,
          bodyPrevioRetry,
        );
        if (!r.ok) {
          iaError = r.error;
          resumen.erroresIA++;
          break;
        }
        sugerenciaIA = r.data;
        if (r.data.bodyCorregido) {
          resumen.corrigioIA++;
          if (intento > 1) {
            resumen.reintentosIA++;
            console.log(`    🔄 Reintento #${intento} exitoso: ${palabrasPreviasRetry} → ${wordCount(r.data.bodyCorregido)} palabras.`);
          }
          break; // Body aceptado, salir del loop
        }
        // Body rechazado. ¿Por thin cercano? Reintentar si vale la pena.
        if (r.data.bodyPrevio && r.data.palabrasPrevias && r.data.palabrasPrevias >= 700 && intento < MAX_REINTENTOS_IA) {
          bodyPrevioRetry = r.data.bodyPrevio;
          palabrasPreviasRetry = r.data.palabrasPrevias;
          console.log(`    🔄 IA intento #${intento}: ${r.data.palabrasPrevias} palabras (≥700, reintento #${intento + 1}...).`);
          continue;
        }
        // Rechazado por otra guardia o demasiado lejos del umbral: no reintentar
        break;
      }
      if (sugerenciaIA) {
        if (sugerenciaIA.alucinacionesNuevas.length > 0) {
          resumen.alucinacionesIA += sugerenciaIA.alucinacionesNuevas.length;
        }
        if (sugerenciaIA.regresionesSEO.length > 0) {
          resumen.regresionesSEO += sugerenciaIA.regresionesSEO.length;
        }
      }
    }

    // ── FASE 3: Correcciones mecánicas ──
    const cambiosMecanicos: string[] = [];
    let bodyFinal = post.body;
    let cambiosAplicados = false;

    if (!SOLO_VERIFICAR) {
      // ── GUARDIA: no degradar posts que ya están bien ──
      // Si el post no tiene issues blocking (ok=true), NO modificar el body.
      // Solo se aplican meta-fixes seguros (metaDescription, author, tags, etc.).
      // Esto evita que el script degrade posts ya buenos quitando formato,
      // reemplazando enlaces buenos, o cambiando contenido correcto.
      const postYaOk = ok && !sugerenciaIA?.bodyCorregido;

      if (postYaOk) {
        // Solo meta-fixes, no tocar body
        const autoFixesMeta = aplicarAutoFixesMetadatos(post);
        if (autoFixesMeta.cambiosAplicados.length > 0 && APLICAR) {
          const setObj: Record<string, unknown> = { updatedAt: new Date() };
          let hayCambiosMeta = false;
          if (autoFixesMeta.title) { setObj.title = autoFixesMeta.title.nuevo; hayCambiosMeta = true; }
          if (autoFixesMeta.metaDescription) { setObj.metaDescription = autoFixesMeta.metaDescription.nuevo; hayCambiosMeta = true; }
          if (autoFixesMeta.description) { setObj.description = autoFixesMeta.description.nuevo; hayCambiosMeta = true; }
          if (autoFixesMeta.author) { setObj.author = autoFixesMeta.author.nuevo; hayCambiosMeta = true; }
          if (autoFixesMeta.coverImage) { setObj.coverImage = autoFixesMeta.coverImage.nuevo; hayCambiosMeta = true; }
          if (autoFixesMeta.tags) { setObj.tags = autoFixesMeta.tags.nuevo; hayCambiosMeta = true; }
          if (hayCambiosMeta) {
            await db.update(blogPosts).set(setObj).where(eq(blogPosts.id, post.id));
            cambiosAplicados = true;
            resumen.metaFixes++;
            for (const c of autoFixesMeta.cambiosAplicados) cambiosMecanicos.push(c);
          }
        }
        // Sanitización de decretos (siempre, como red de seguridad)
        const rSan = sanitizarCitasLegales(post.body);
        if (rSan.eliminados > 0 && APLICAR) {
          const bodySanitizado = sanitizeHtml(rSan.nuevo);
          await db.update(blogPosts).set({ body: bodySanitizado, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
          cambiosMecanicos.push(`citas no verificadas eliminadas: ${rSan.eliminados}`);
        }
      } else {
        // Post con issues: aplicar corrección completa (IA + mecánicos + body)

      // Aplicar primero la corrección IA si existe
      if (sugerenciaIA?.bodyCorregido && APLICAR) {
        bodyFinal = sugerenciaIA.bodyCorregido;
      }

      // Luego normalización mecánica
      const rCta = limpiarCtasDuplicados(bodyFinal);
      if (rCta.eliminados > 0) {
        bodyFinal = rCta.nuevo;
        cambiosMecanicos.push(`CTAs duplicados eliminados: ${rCta.eliminados}`);
      }
      const rH1 = corregirH1EnBody(bodyFinal);
      if (rH1.cambios > 0) {
        bodyFinal = rH1.nuevo;
        cambiosMecanicos.push(`H1→H2: ${rH1.cambios}`);
      }
      const rWs = normalizarWhitespace(bodyFinal);
      if (rWs.cambios > 0) {
        bodyFinal = rWs.nuevo;
        cambiosMecanicos.push('whitespace normalizado');
      }

      if (cambiosMecanicos.length > 0) resumen.cambiosMecanicos++;

      // ── Auto-fix de metadatos (Fase 3.5) ──
      // Aplica a TODOS los posts (no solo los que tienen bodyCorregido), porque
      // los metadatos pueden faltar aunque el body esté perfecto. Se ejecuta en
      // cualquier modo que no sea --solo-verificar.

      // ── Enlaces internos: la IA en el prompt se encarga de añadirlos ──
      // como parte de la estructura editorial (Relación con otros temas).
      // No se hace auto-enlazado programático.

      const autoFixesMeta = aplicarAutoFixesMetadatos(post);
      if (autoFixesMeta.cambiosAplicados.length > 0) {
        for (const c of autoFixesMeta.cambiosAplicados) cambiosMecanicos.push(c);
        if (cambiosMecanicos.length > 0) resumen.cambiosMecanicos++;
      }

      // Sanitización de citas legales (lista blanca): elimina decretos no
      // verificados y artículos inexistentes. Reemplaza por referencias
      // genéricas seguras. Esto garantiza que el published body NUNCA
      // contiene datos legales no verificados.
      const rSan = sanitizarCitasLegales(bodyFinal);
      if (rSan.eliminados > 0) {
        bodyFinal = rSan.nuevo;
        cambiosMecanicos.push(`citas no verificadas eliminadas: ${rSan.eliminados}`);
        resumen.cambiosMecanicos++;
      }

      // ── Escribir en DB si --aplicar ──
      // Se escriben TODOS los campos auto-fixeables + el body, en una sola
      // query update. Esto garantiza que tras --aplicar el post pasa TODOS los
      // validadores (no solo el body).
      if (APLICAR) {
        const setObj: Record<string, unknown> = { updatedAt: new Date() };
        let hayCambiosBody = false;
        let hayCambiosMeta = false;

        // Body (con guardias). similitud ≥98% SOLO para cuerpos IA.
        const guardia = wordCount(bodyFinal);
        if (bodyFinal !== post.body && guardia >= 50) {
          // Solo verificar similitud si el cambio principal vino de la IA
          const cambioDeIA = sugerenciaIA?.bodyCorregido != null;
          if (cambioDeIA) {
            const sim = similitudCuerpo(post.body, bodyFinal);
            if (sim >= UMBRAL_SIMILITUD) {
              console.log(`    ℹ ${post.slug}: body IA ≥${(UMBRAL_SIMILITUD * 100).toFixed(0)}% similar (cambio irrelevante) — NO se escribe body.`);
              resumen.similitudRechazos++;
            } else {
              setObj.body = sanitizeHtml(bodyFinal);
              hayCambiosBody = true;
            }
          } else {
            // Fix mecánico: siempre aplicarlo
            setObj.body = sanitizeHtml(bodyFinal);
            hayCambiosBody = true;
          }
        } else if (guardia < 50 && wordCount(post.body) >= 50) {
          console.warn(`    ⚠ ${post.slug}: resultado <50 palabras — body NO escrito.`);
          resumen.reversionesPostEscritura++;
        }

        // Metadatos auto-fixeables
        if (autoFixesMeta.title) {
          setObj.title = autoFixesMeta.title.nuevo;
          hayCambiosMeta = true;
          resumen.titulosTruncados++;
        }
        if (autoFixesMeta.metaDescription) {
          setObj.metaDescription = autoFixesMeta.metaDescription.nuevo;
          hayCambiosMeta = true;
        }
        if (autoFixesMeta.description) {
          setObj.description = autoFixesMeta.description.nuevo;
          hayCambiosMeta = true;
        }
        if (autoFixesMeta.author) {
          setObj.author = autoFixesMeta.author.nuevo;
          hayCambiosMeta = true;
        }
        if (autoFixesMeta.coverImage) {
          setObj.coverImage = autoFixesMeta.coverImage.nuevo;
          hayCambiosMeta = true;
        }
        if (autoFixesMeta.tags) {
          setObj.tags = autoFixesMeta.tags.nuevo;
          hayCambiosMeta = true;
        }

        // Ejecutar update si hay algo que escribir (body o metadatos)
        if (hayCambiosBody || hayCambiosMeta) {
          await db.update(blogPosts).set(setObj).where(eq(blogPosts.id, post.id));
          cambiosAplicados = true;
          resumen.metaFixes += hayCambiosMeta ? 1 : 0;

          // ── VALIDACIÓN POST-ESCRITURA (R13/R17) ──
          // Releer el post de DB y re-analizar. Si aparecen hallazgos blocking
          // o discrepancias NUEVAS (p.ej. la sanitización rompió algo), revertir
          // al body original. Esto confirma que el cambio funcionó.
          // Solo se valida el BODY (los metadatos auto-fixeados son deterministas
          // y no requieren reversión — ya pasaron los validadores por construcción).
          if (hayCambiosBody) {
            try {
              const re = await db
                .select({ body: blogPosts.body })
                .from(blogPosts)
                .where(eq(blogPosts.id, post.id))
                .limit(1);
              const bodyEscrito = re[0]?.body ?? '';
              const palabrasEscritas = wordCount(bodyEscrito);
              const hallazgosPost = analizarSEO({ ...post, body: bodyEscrito }, palabrasEscritas);
              const discPost = verificarClaims(extraerClaims(bodyEscrito));
              const hallazgosPre = analizarSEO({ ...post, body: bodyFinal }, wordCount(bodyFinal));
              const discPre = verificarClaims(extraerClaims(bodyFinal));
              const evalResult = evaluarPostEscritura(
                hallazgosPost,
                discPost,
                hallazgosPre,
                discPre,
                palabrasEscritas,
              );
              if (evalResult.deberiaRevertir) {
                console.warn(`    ⚠ ${post.slug}: ${evalResult.motivo} — REVERSION del body al original.`);
                const bodyOriginalSanitizado = sanitizeHtml(post.body);
                await db.update(blogPosts).set({ body: bodyOriginalSanitizado, updatedAt: new Date() }).where(eq(blogPosts.id, post.id));
                cambiosAplicados = false;
                resumen.reversionesPostEscritura++;
                cambiosMecanicos.push(`BODY REVERTIDO: ${evalResult.motivo}`);
              }
            } catch (e) {
              console.warn(`    ⚠ ${post.slug}: validación post-escritura no pudo releer (DB transient): ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      }

      // Log
      const flags: string[] = [];
      if (discrepancias.length > 0) flags.push(`${discrepancias.length} discr.`);
      const hallazgosCriticosSEO = hallazgosSEO.filter((h) => h.severidad === 'critico').length;
      const hallazgosImportSEO = hallazgosSEO.filter((h) => h.severidad === 'importante').length;
      if (hallazgosCriticosSEO > 0) flags.push(`🔴 ${hallazgosCriticosSEO} SEO crítico`);
      if (hallazgosImportSEO > 0) flags.push(`🟡 ${hallazgosImportSEO} SEO importante`);
      if (cambiosMecanicos.length > 0) flags.push(`${cambiosMecanicos.length} mec.`);
      if (sugerenciaIA?.bodyCorregido) {
        const palabrasCorregidas = wordCount(sugerenciaIA.bodyCorregido);
        if (estadoLongitud === 'thin') {
          flags.push(`IA: ${palabras}→${palabrasCorregidas} palabras ✓`);
        } else {
          flags.push('IA mejorado');
        }
      } else if (iaError) {
        flags.push(`IA err: ${iaError}`);
      } else if (sugerenciaIA && sugerenciaIA.alucinacionesNuevas.length > 0) {
        flags.push(`🚨 ${sugerenciaIA.alucinacionesNuevas.length} alucinación(es) IA — body rechazado`);
      } else if (sugerenciaIA && sugerenciaIA.regresionesSEO.length > 0) {
        flags.push(`🚨 ${sugerenciaIA.regresionesSEO.length} regresión(es) SEO — body rechazado`);
      } else if (IA_ENABLED && !necesitaCorreccion) {
        if (forzarIA) flags.push('IA: verificando precisión de citas');
        else flags.push('IA: no necesaria (post OK)');
      }
      if (ok) flags.push('✅ OK');
      if (postYaOk && cambiosMecanicos.length > 0) flags.push('meta-fixes only');
      console.log(`${progreso} ${icono}${iconoThin} ${post.slug} — ${palabras} palabras (${estadoLongitud})${flags.length > 0 ? ' — ' + flags.join(', ') : ''}`);
      } // fin else (post con issues)
    } else {
      // Modo solo-verificar: solo análisis, sin modificar
      const discFlag = discrepancias.length > 0 ? ` — ${discrepancias.length} discr.` : '';
      const seoFlag = hallazgosSEO.length > 0 ? ` — ${hallazgosSEO.length} hallazgos SEO` : '';
      const okFlag = ok ? ' — ✅ OK' : '';
      console.log(`${progreso} ${icono}${iconoThin} ${post.slug} — ${palabras} palabras (${estadoLongitud})${discFlag}${seoFlag}${okFlag}`);
    }

    resultados.push({
      post: { slug: post.slug, title: post.title, category: post.category },
      palabras,
      estadoLongitud,
      verificacion,
      hallazgosSEO,
      sugerenciaIA,
      iaError,
      cambiosMecanicos,
      cambiosAplicados,
      ok,
    });

    // ── Checkpoint: registrar progreso tras cada post (solo lote completo) ──
    if (!FILTRO_SLUG && OFFSET === 0 && startIdx >= 0) {
      escribirCheckpoint({
        modo,
        iaActiva: IA_ENABLED,
        total: resumen.total,
        lastCompletedIndex: startIdx + i,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // ── Lote completado: borrar checkpoint ──
  if (!FILTRO_SLUG && OFFSET === 0) borrarCheckpoint();

  // ── Check cross-article: repetición entre artículos (anti-plantilla) ──
  // Se ejecuta sobre todos los bodies (originales + corregidos) del lote.
  // Si la IA generó el mismo bloque en ≥3 artículos, están actúan como plantilla.
  if (resultados.length >= 3) {
    const bodiesParaCheck = resultados.map((r) => ({
      slug: r.post.slug,
      // Usar el body final si hubo corrección IA, si no el original
      body: r.sugerenciaIA?.bodyCorregido ?? posts.find((p) => p.slug === r.post.slug)?.body ?? '',
    })).filter((b) => b.body.length > 0);
    const repeticiones = detectarRepeticionCrossArticle(bodiesParaCheck);
    if (repeticiones.length > 0) {
      console.log(`\n${'─'.repeat(72)}`);
      console.log(`  ⚠️  REPETICIÓN ENTRE ARTÍCULOS (anti-plantilla)`);
      console.log(`${'─'.repeat(72)}`);
      console.log(`  ${repeticiones.length} bloque(s) de texto compartido(s) por ≥3 artículos:`);
      for (const r of repeticiones.slice(0, 10)) {
        console.log(`  · [${r.count} artículos] "...${r.secuencia.slice(0, 60)}${r.secuencia.length > 60 ? '...' : ''}"`);
        console.log(`    Artículos: ${r.slugs.slice(0, 5).join(', ')}${r.slugs.length > 5 ? `, +${r.slugs.length - 5} más` : ''}`);
      }
      console.log(`${'─'.repeat(72)}\n`);
      resumen.repeticionCrossArticle = repeticiones.length;
    }
  }

  // ── Resumen final ──
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`  RESUMEN ${modo}`);
  console.log(`${'─'.repeat(72)}`);
  console.log(`  Posts analizados:              ${resumen.total}`);
  console.log(`  Posts OK (validadores pasan):   ${resumen.ok}`);
  console.log(`  Con discrepancias fácticas:     ${resumen.conDiscrepancias}`);
  console.log(`  Sin claims legales detectables: ${resumen.sinClaims}`);
  console.log(`  Con hallazgos SEO/GEO:          ${resumen.hallazgosSEO}`);
  if (IA_ENABLED) console.log(`  Corregidos por IA:              ${resumen.corrigioIA}`);
  if (IA_ENABLED) console.log(`  Reintentos de IA exitosos:      ${resumen.reintentosIA}`);
  if (IA_ENABLED) console.log(`  Errores de IA:                  ${resumen.erroresIA}`);
  if (IA_ENABLED) console.log(`  Alucinaciones IA detectadas:    ${resumen.alucinacionesIA} (bodies rechazados)`);
  if (IA_ENABLED) console.log(`  Regresiones SEO detectadas:     ${resumen.regresionesSEO} (bodies rechazados)`);
  if (!SOLO_VERIFICAR) console.log(`  Con cambios mecánicos:          ${resumen.cambiosMecanicos}`);
  if (APLICAR) console.log(`  Títulos truncados:              ${resumen.titulosTruncados}`);
  if (APLICAR) console.log(`  Posts con meta-fixes:            ${resumen.metaFixes} (metadatos auto-corregidos)`);
  if (APLICAR) console.log(`  Reversiones post-escritura:     ${resumen.reversionesPostEscritura} (bodies revertidos al original)`);
  if (!SOLO_VERIFICAR) console.log(`  Rechazos por similitud ≥98%:    ${resumen.similitudRechazos} (escrituras omitidas)`);
  if (resumen.repeticionCrossArticle > 0) console.log(`  Repetición entre artículos:     ${resumen.repeticionCrossArticle} bloque(s) plantilla detectado(s)`);
  console.log(`${'─'.repeat(72)}\n`);

  // ── Guardar reporte JSON ──
  const reporteJSON = path.join(backupDir, `verify-fix-reporte-${ts}.json`);
  fs.writeFileSync(reporteJSON, JSON.stringify({
    timestamp: new Date().toISOString(),
    modo,
    iaActiva: IA_ENABLED,
    modelo: IA_ENABLED ? DEEPSEEK_MODEL : null,
    resumen,
    resultados: resultados.map((r) => ({
      slug: r.post.slug,
      title: r.post.title,
      category: r.post.category,
      palabras: r.palabras,
      estadoLongitud: r.estadoLongitud,
      ok: r.ok,
      discrepancias: r.verificacion.discrepancias.length,
      discrepanciasDetalle: r.verificacion.discrepancias.map((d) => ({
        severidad: d.severidad,
        mensaje: d.mensaje,
        encontrado: d.valorEncontrado,
        correcto: d.valorCorrecto,
      })),
      hallazgosSEO: r.hallazgosSEO.map((h) => ({
        severidad: h.severidad,
        categoria: h.categoria,
        mensaje: h.mensaje,
      })),
      cambiosMecanicos: r.cambiosMecanicos,
      correccionIA: r.sugerenciaIA?.bodyCorregido ? 'aplicada' : null,
      iaError: r.iaError,
      alucinacionesIA: r.sugerenciaIA?.alucinacionesNuevas?.map((d) => d.mensaje) ?? [],
      regresionesSEO: r.sugerenciaIA?.regresionesSEO?.map((h) => h.mensaje) ?? [],
      advertenciasIA: r.sugerenciaIA?.advertencias ?? [],
    })),
  }, null, 2), 'utf8');
  console.log(`📄 Reporte JSON: ${reporteJSON}`);

  // ── Guardar reporte Markdown ──
  const md = generarReporteMD(resultados, modo, IA_ENABLED);
  const reporteMD = path.join(backupDir, `verify-fix-reporte-${ts}.md`);
  fs.writeFileSync(reporteMD, md, 'utf8');
  console.log(`📄 Reporte Markdown: ${reporteMD}`);

  if (resumen.conDiscrepancias > 0) {
    console.log(`\n⚠️  ${resumen.conDiscrepancias} post(s) con discrepancias fácticas. Revisa el reporte.`);
  }
  if (resumen.hallazgosSEO > 0) {
    console.log(`📊 ${resumen.hallazgosSEO} post(s) con hallazgos SEO/GEO. Revisa el reporte.`);
  }
  if (resumen.alucinacionesIA > 0) {
    console.log(`🚨 ${resumen.alucinacionesIA} alucinación(es) IA detectada(s) y rechazada(s). Bodies conservados originales.`);
  }
  if (resumen.regresionesSEO > 0) {
    console.log(`🚨 ${resumen.regresionesSEO} regresión(es) SEO detectada(s) y rechazada(s). Bodies conservados originales.`);
  }

  // ── Cierre ──
  const client = (db as unknown as { $client?: { end?: () => unknown } }).$client;
  await client?.end?.();

  const msgFinal = APLICAR
    ? '✅ Verificación y corrección aplicadas.'
    : SOLO_VERIFICAR
      ? 'ℹ️  Verificación completada (solo lectura).'
      : 'ℹ️  Dry-run completado. Usa --aplicar para escribir cambios.';
  console.log(`\n${msgFinal}\n`);
}

// Guard: solo ejecutar main() cuando el script se invoca directamente (CLI),
// no cuando se importa como módulo (tests solo usan las funciones puras).
const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('blog-verify-fix.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('blog-verify-fix');

if (isDirectRun) {
  main().catch((e) => {
    console.error('Error en verificación del blog:', e);
    process.exit(1);
  });
}
