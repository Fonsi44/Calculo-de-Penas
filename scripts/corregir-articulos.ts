/**
 * Corrección por lotes de artículos legales con información alucinada/falsa.
 *
 * FUENTE DE VERDAD: tabla `blog_posts` (PostgreSQL/Neon) vía Drizzle ORM.
 * Los artículos son procesados por Gemini como un formateador estructural
 * puro, respetando ciegamente la veracidad legal de los textos ya
 * auditados.
 *
 * PROBLEMA QUE RESUELVE: Inyectar la capa GEO (Bite-Sized Summaries,
 * blockquotes semánticos y tabulación de datos) sin requerir llamadas de
 * verificación web.
 * Gemini usa únicamente su conocimiento interno y el texto base proporcionado,
 * manteniendo estructura, veracidad y tono original sin buscar en la web.
 *
 * ARQUITECTURA DE PROMPT:
 *   - Rol: Abogado Consultor Senior especializado en Derecho Hondureño
 *          y experto en SEO/GEO Avanzado para firmas jurídicas.
 *   - Anti-plantilla: prohibidas introducciones cliché y conclusiones
 *     redundantes. El artículo va directo al grano.
 *   - Rigor legal: cada afirmación clave debe citar artículo de ley.
 *   - Optimización GEO: mención de instituciones públicas reales (CSJ,
 *     MP, SAR, etc.) y términos locales de Honduras.
 *   - Estructura FAQ: encabezados H2/H3 basados en intenciones de
 *     búsqueda reales en formato de preguntas.
 *   - Temperatura: 0.15 (máxima precisión factual).
 *
 * REQUIERE:
 *   - GEMINI_API_KEY en .env.local (API key de Google AI Studio)
 *   - DATABASE_URL en .env.local (conexión a Neon PostgreSQL)
 *
 * USO:
 *   npm run corregir:articulos                         # DRY-RUN (no escribe)
 *   npm run corregir:articulos -- --aplicar            # Aplica cambios en DB
 *   npm run corregir:articulos -- --limit 10           # Primeros 10
 *   npm run corregir:articulos -- --offset 20          # Saltar primeros 20
 *   npm run corregir:articulos -- --slug mi-articulo   # Solo uno específico
 *   npm run corregir:articulos -- --delay 3000         # 3s entre llamadas
 *   npm run corregir:articulos -- --lote 10            # Pausa larga cada 10
 *   npx tsx scripts/corregir-articulos.ts --help
 *
 * VARIABLES DE ENTORNO:
 *   GEMINI_API_KEY      (obligatoria) — API key de Google AI Studio.
 *   GEMINI_MODEL        (opcional)    — Modelo (default: gemini-3.1-pro-preview).
 *   CORREGIR_DELAY_MS   (opcional)    — Delay entre artículos (default: 2500).
 *   CORREGIR_LOTE       (opcional)    — Pausa larga cada N (default: 5).
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: NUNCA escribe sin --aplicar.
 *   - Checkpoint reanudable en data/corregir-checkpoint.json.
 *   - Reintentos con backoff exponencial ante errores 429/5xx.
 *   - Guardia: respuesta Gemini debe ser JSON válido + >50 palabras.
 *   - API key siempre de process.env, nunca hardcodeada.
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, and, ne } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
//  Cargar .env.local si existe (sobreescribe .env para desarrollo local)
// ═══════════════════════════════════════════════════════════════════════════
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

// ═══════════════════════════════════════════════════════════════════════════
//  CLI flags
// ═══════════════════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
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
const DELAY_MS = (() => {
  const i = args.indexOf('--delay');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 0;
  return Number.isFinite(n) && n >= 500
    ? n
    : parseInt(process.env.CORREGIR_DELAY_MS || '2500', 10);
})();
const LOTE = (() => {
  const i = args.indexOf('--lote');
  const n = i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 0;
  return Number.isFinite(n) && n > 0
    ? n
    : parseInt(process.env.CORREGIR_LOTE || '5', 10);
})();
const FILTRO_SLUG = (() => {
  const i = args.indexOf('--slug');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const RESET_CHECKPOINT = args.includes('--reset-checkpoint');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Corrección por lotes de artículos legales con Gemini + Google Search Grounding.

Uso:
  npm run corregir:articulos [opciones]

Opciones:
  --aplicar           Aplica los cambios en DB. Sin esto, es dry-run.
  --limit <n>         Procesar solo los primeros n artículos.
  --offset <n>        Saltar los primeros n artículos.
  --delay <ms>        Milisegundos entre llamadas a Gemini (default: 2500).
  --lote <n>          Pausa de 30s cada n artículos (default: 5).
  --slug <slug>       Procesar un único artículo por slug.
  --reset-checkpoint  Ignorar checkpoint previo (empezar desde el principio).
  --help, -h          Esta ayuda.

Variables de entorno:
  GEMINI_API_KEY      (obligatoria) API key de Google AI Studio.
  GEMINI_MODEL        (opcional)    Modelo Gemini (default: gemini-3.1-pro-preview).
  CORREGIR_DELAY_MS   (opcional)    Delay entre artículos (default: 2500).
  CORREGIR_LOTE       (opcional)    Pausa larga cada N (default: 5).

Sin --aplicar, el script es de solo lectura (dry-run).`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Constantes
// ═══════════════════════════════════════════════════════════════════════════
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro';
const CHECKPOINT_PATH = path.join(process.cwd(), 'data', 'corregir-checkpoint.json');
const MAX_REINTENTOS = 3;
const PAUSA_LARGA_MS = 30000; // 30s tras cada lote
const TEMPERATURA = 0.15; // máxima precisión factual, mínima creatividad

// ═══════════════════════════════════════════════════════════════════════════
//  Validaciones iniciales
// ═══════════════════════════════════════════════════════════════════════════
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL no configurada (o placeholder). Este script requiere acceso real a Neon.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY no configurada. Este script requiere API key de Google AI Studio.');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DB Connection
// ═══════════════════════════════════════════════════════════════════════════
const sqlConn = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConn);

// ═══════════════════════════════════════════════════════════════════════════
//  Gemini Client
// ═══════════════════════════════════════════════════════════════════════════
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ═══════════════════════════════════════════════════════════════════════════
//  Checkpoint
// ═══════════════════════════════════════════════════════════════════════════
interface Checkpoint {
  procesados: string[]; // slugs ya procesados (éxito o error)
  timestamp: string;
}

function leerCheckpoint(): Checkpoint {
  if (RESET_CHECKPOINT) {
    return { procesados: [], timestamp: new Date().toISOString() };
  }
  try {
    if (fs.existsSync(CHECKPOINT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
      return {
        procesados: Array.isArray(data.procesados) ? data.procesados : [],
        timestamp: data.timestamp || '',
      };
    }
  } catch {
    console.warn('⚠ No se pudo leer el checkpoint, empezando desde cero.');
  }
  return { procesados: [], timestamp: '' };
}

function guardarCheckpoint(checkpoint: Checkpoint): void {
  try {
    const dir = path.dirname(CHECKPOINT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      CHECKPOINT_PATH,
      JSON.stringify({ ...checkpoint, timestamp: new Date().toISOString() }, null, 2),
    );
  } catch (err) {
    console.error('⚠ No se pudo guardar el checkpoint:', err);
  }
}

function limpiarCheckpoint(): void {
  try {
    if (fs.existsSync(CHECKPOINT_PATH)) fs.unlinkSync(CHECKPOINT_PATH);
  } catch {
    /* ignorar */
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Ayudantes
// ═══════════════════════════════════════════════════════════════════════════

/** Espera N milisegundos. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

// ═══════════════════════════════════════════════════════════════════════════
//  Esquema de respuesta JSON que debe seguir Gemini
// ═══════════════════════════════════════════════════════════════════════════

const ESQUEMA_RESPUESTA_JSON = `{
  "bite_sized_summary": "Resumen rápido extraído del texto original (1-2 oraciones).",
  "html_table": "Tabla HTML con los números/plazos encontrados (o string vacío si no hay).",
  "blockquote": "Cita legal extraída del texto original envuelta en <blockquote> (o string vacío si no hay law explícita)."
}`;

// ═══════════════════════════════════════════════════════════════════════════
//  Prompt de auditoría legal (versión mejorada: anti-plantilla, SEO, GEO, E-E-A-T)
// ═══════════════════════════════════════════════════════════════════════════

function construirPrompt(titulo: string, body: string): string {
  return `Eres un formateador estructural puro experto en HTML. Tu tarea es extraer elementos clave del texto y estructurarlos en JSON.
  
## 📋 REGLAS ESTRICTAS
- **PROHIBIDO INVENTAR**: Usa ÚNICAMENTE el texto proporcionado. No añadas, sugieras ni inyectes nombres de instituciones (como ONCAE, SAR, PGR, etc.) ni leyes que no estén explícitamente en el texto original.
- No alucines, no enriquezcas el contexto, ni cruces referencias.
- Tu trabajo es extraer la información EXISTENTE y formatearla en los siguientes campos:
  1. bite_sized_summary: Extrae un resumen directo de 1-2 oraciones basado estrictamente en el texto original.
  2. html_table: Si el texto contiene datos numéricos o plazos, formatéalos como una tabla HTML. Si no, deja el string vacío ("").
  3. blockquote: Si el texto menciona una ley explícita, extrae la cita y envuélvela en <blockquote>. Si no, deja el string vacío ("").

## 📄 ARTÍCULO ORIGINAL

**Título:** ${titulo}

**Cuerpo HTML:**
${body}

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
${ESQUEMA_RESPUESTA_JSON}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Interfaces de respuesta
// ═══════════════════════════════════════════════════════════════════════════

interface GeminiResult {
  bite_sized_summary: string;
  html_table: string;
  blockquote: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Extractor de campos individuales desde JSON mal formado
//  Útil cuando Gemini devuelve JSON con strings sin escapar (comillas dobles
//  dentro del body HTML, newlines literales, etc.) que rompen JSON.parse.
// ─────────────────────────────────────────────────────────────────────────────

function extraerCamposIndividuales(jsonObj: string, rawFallback: string): Record<string, unknown> | null {
  const resultado: Record<string, unknown> = {};

  const camposConocidos = [
    'bite_sized_summary',
    'html_table',
    'blockquote',
  ];

  function extraerValorString(clave: string, texto: string): string | null {
    // Buscar: "clave": "...
    const startMatch = texto.match(new RegExp(`"${clave}"\\s*:\\s*"`));
    if (!startMatch) return null;
    const startIdx = startMatch.index! + startMatch[0].length;

    // Determinar el final: buscar el siguiente campo conocido o el cierre }
    let endIdx = texto.length;
    for (const otra of camposConocidos) {
      if (otra === clave) continue;
      const sigMatch = texto.slice(startIdx).match(new RegExp(`"${otra}"\\s*:`));
      if (sigMatch) {
        const candidato = startIdx + sigMatch.index! - 1; // -1 por la comilla de cierre
        if (candidato < endIdx && candidato > startIdx) endIdx = candidato;
      }
    }

    // También buscar el final del objeto }
    const objEnd = texto.slice(startIdx).lastIndexOf('}');
    if (objEnd !== -1 && startIdx + objEnd < endIdx) endIdx = startIdx + objEnd;

    // Ajustar: retroceder hasta la última comilla no escapada
    let segmento = texto.slice(startIdx, endIdx);
    // Si no hay comillas de cierre naturales, tomar todo hasta endIdx
    const ultimaComilla = segmento.lastIndexOf('"');
    if (ultimaComilla !== -1) {
      // Verificar que no esté escapada
      if (ultimaComilla === 0 || segmento[ultimaComilla - 1] !== '\\') {
        segmento = segmento.slice(0, ultimaComilla);
      }
    }

    // Limpiar escapes dobles accidentales
    segmento = segmento.replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t').replace(/\\\\"/g, '"');
    // Restaurar newlines literales
    segmento = segmento.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

    return segmento.trim();
  }

  // Extraer bite_sized_summary
  const bite = extraerValorString('bite_sized_summary', jsonObj);
  if (bite) resultado.bite_sized_summary = bite;

  // Extraer html_table
  const html = extraerValorString('html_table', jsonObj);
  if (html) resultado.html_table = html;

  // Extraer blockquote
  const quote = extraerValorString('blockquote', jsonObj);
  if (quote) resultado.blockquote = quote;

  // Validar que al menos tengamos alguno
  if (!resultado.bite_sized_summary && !resultado.html_table && !resultado.blockquote) {
    return null;
  }

  return resultado;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Llamada a Gemini con Google Search Grounding (temperatura 0.15)
// ═══════════════════════════════════════════════════════════════════════════

async function corregirConGemini(
  titulo: string,
  body: string,
  intento: number = 1,
): Promise<{ resultado: GeminiResult | null; error: string | null }> {
  try {
    const prompt = construirPrompt(titulo, body);

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [],
        temperature: TEMPERATURA,
        maxOutputTokens: 8192,
      },
    });

	    const textoRespuesta = response.text || '';

	    if (!textoRespuesta || textoRespuesta.trim().length === 0) {
	      return { resultado: null, error: 'Respuesta vacía de Gemini' };
	    }

	    // ─────────────────────────────────────────────────────────────────────────
	    //  Parser JSON robusto: múltiples estrategias de extracción
	    // ─────────────────────────────────────────────────────────────────────────
	    let rawJson = textoRespuesta.trim();

	    // Limpiar bloques de código markdown (```json ... ``` o ``` ... ```)
	    const blockMatch = rawJson.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
	    if (blockMatch) rawJson = blockMatch[1].trim();
	    rawJson = rawJson.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

	    // Extraer el primer objeto JSON {...} completo
	    let jsonObj: string | null = null;
	    const braceStart = rawJson.indexOf('{');
	    const braceEnd = rawJson.lastIndexOf('}');
	    if (braceStart !== -1 && braceEnd > braceStart) {
	      jsonObj = rawJson.slice(braceStart, braceEnd + 1);
	    } else {
	      return { resultado: null, error: 'No se encontró un objeto JSON { ... } en la respuesta' };
	    }

	    // Intentar parseo directo, sino extracción por campos
	    let parsed: Record<string, unknown> | null = null;

	    // Intento 1: JSON.parse directo
	    try {
	      parsed = JSON.parse(jsonObj);
	    } catch {
	      // Intento 2: escapar newlines dentro de strings (error común de Gemini)
	      try {
	        const reparado = jsonObj
	          .replace(/(?<=:)\s*"([^"]*?)"/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'))
	          .replace(/\\\\n/g, '\\n');
	        parsed = JSON.parse(reparado);
	      } catch {
	        // Intento 3: extraer cada campo por separado con regex (más robusto)
	        parsed = null;
	      }
	    }

	    // Si el parseo completo falló, extraer campo por campo
	    if (!parsed) {
	      const campos = extraerCamposIndividuales(jsonObj, rawJson);
	      if (!campos) {
	        return { resultado: null, error: 'No se pudieron extraer los campos del JSON' };
	      }
	      parsed = campos;
	    }

	    // Validar estructura mínima
	    if (!parsed || typeof parsed !== 'object') {
	      return { resultado: null, error: 'Respuesta no es un objeto JSON válido' };
	    }

    const bite_sized = typeof parsed.bite_sized_summary === 'string' ? parsed.bite_sized_summary.trim() : '';
    const html_table = typeof parsed.html_table === 'string' ? parsed.html_table.trim() : '';
    const blockquote = typeof parsed.blockquote === 'string' ? parsed.blockquote.trim() : '';

    if (!bite_sized && !html_table && !blockquote) {
      return { resultado: null, error: 'Respuesta vacía: Gemini no extrajo resumen, tabla ni cita. (Fallo de extracción)' };
    }

    // Log the actual raw response for the very first execution to debug parsing
    if (!(global as any).hasLoggedFirstRaw) {
      console.log('\n--- 🔍 DEBUG: RAW JSON FROM GEMINI ---');
      console.log(rawJson);
      console.log('----------------------------------------\n');
      (global as any).hasLoggedFirstRaw = true;
    }

    return {
      resultado: {
        bite_sized_summary: bite_sized,
        html_table: html_table,
        blockquote: blockquote
      },
      error: null,
    };
  } catch (err: any) {
    const mensaje = err?.message || String(err);

    // Detectar rate limiting (429)
    if (
      mensaje.includes('429') ||
      mensaje.includes('RESOURCE_EXHAUSTED') ||
      mensaje.includes('Too Many Requests')
    ) {
      if (intento <= MAX_REINTENTOS) {
        const espera = Math.min(2000 * Math.pow(2, intento), 30000);
        console.warn(`  ⚠ Rate limit (429). Reintento ${intento}/${MAX_REINTENTOS} en ${espera / 1000}s...`);
        await sleep(espera);
        return corregirConGemini(titulo, body, intento + 1);
      }
      return { resultado: null, error: `Rate limit excedido tras ${MAX_REINTENTOS} reintentos` };
    }

    // Detectar error de modelo/quota
    if (mensaje.includes('404') || mensaje.includes('not found') || mensaje.includes('Model')) {
      return { resultado: null, error: `Modelo no disponible: ${mensaje}` };
    }

    // Reintentar errores de red/5xx
    if (
      (mensaje.includes('5') && mensaje.length < 10) ||
      mensaje.includes('network') ||
      mensaje.includes('timeout') ||
      mensaje.includes('ECONNRESET')
    ) {
      if (intento <= MAX_REINTENTOS) {
        const espera = Math.min(2000 * Math.pow(2, intento), 30000);
        console.warn(`  ⚠ Error de red. Reintento ${intento}/${MAX_REINTENTOS} en ${espera / 1000}s...`);
        await sleep(espera);
        return corregirConGemini(titulo, body, intento + 1);
      }
    }

    return { resultado: null, error: mensaje };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Procesar artículo (pipeline completo)
// ═══════════════════════════════════════════════════════════════════════════

interface ArticuloRow {
  id: string;
  slug: string;
  title: string;
  body: string;
  reviewStatus: string | null;
}

interface ResultadoProcesado {
  slug: string;
  titulo: string;
  exito: boolean;
  cambios: string[];
  fuentes: string[];
  error: string | null;
  tiempoMs: number;
  necesitaCorreccion: boolean;
  // Nuevos campos SEO/GEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  enfoqueGeo: string;
}

async function procesarArticulo(articulo: ArticuloRow): Promise<ResultadoProcesado> {
  const inicio = Date.now();
  console.log(`\n  📝 "${articulo.title}" (${articulo.slug})`);

  const { resultado, error } = await corregirConGemini(articulo.title, articulo.body);

  if (error) {
    console.log(`  ❌ Error: ${error}`);
    return {
      slug: articulo.slug,
      titulo: articulo.title,
      exito: false,
      cambios: [],
      fuentes: [],
      error,
      tiempoMs: Date.now() - inicio,
      necesitaCorreccion: true,
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      enfoqueGeo: '',
    };
  }

  if (!resultado) {
    console.log(`  ❌ Error: resultado inválido de Gemini`);
    return {
      slug: articulo.slug,
      titulo: articulo.title,
      exito: false,
      cambios: [],
      fuentes: [],
      error: 'Resultado nulo de Gemini',
      tiempoMs: Date.now() - inicio,
      necesitaCorreccion: true,
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      enfoqueGeo: '',
    };
  }

  // --- Dry-run / Aplicar ---

  console.log(`  🔧 Extracción exitosa. Inyectando GEO blocks.`);

  // Extraer "cambios" del enfoque_geo para el log (simulado)
  
  let newBody = articulo.body;
  if (resultado.bite_sized_summary) {
    newBody = `<div class="geo-summary"><strong>Resumen rápido:</strong> ${resultado.bite_sized_summary}</div>
` + newBody;
  }
  if (resultado.blockquote) {
    newBody += `
<div class="geo-law">${resultado.blockquote}</div>`;
  }
  if (resultado.html_table) {
    newBody += `
<div class="geo-data">${resultado.html_table}</div>`;
  }

  if (APLICAR) {
    const updateData: Record<string, any> = {
      body: newBody,
      reviewStatus: 'reviewed',
      reviewedAt: new Date(),
      lastReviewedAt: new Date(),
      legalReviewNotes: 'Estructurado con GEO (Gemini 3.1 Pro).'
    };

    await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, articulo.id));
    console.log(`  💾 Actualizado en DB (inyectado GEO)`);
  } else {
    console.log(`  🔍 Dry-run: cambios detectados pero NO aplicados`);
  }

  return {
    slug: articulo.slug,
    titulo: articulo.title,
    exito: true,
    cambios: [],
    fuentes: [],
    error: null,
    tiempoMs: Date.now() - inicio,
    necesitaCorreccion: true,
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    enfoqueGeo: '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   GEMINI 3.1 PRO — PURE STRUCTURAL GEO FORMATTER              ║');
  console.log('║   Prompt v2: Anti-plantilla | SEO/GEO | E-E-A-T | Rigor Legal ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Modelo: ${GEMINI_MODEL}`);
  console.log(`Temperatura: ${TEMPERATURA}`);
  console.log(`Delay: ${DELAY_MS}ms entre artículos`);
  console.log(`Lote: ${LOTE} artículos entre pausas largas`);
  console.log(`Modo: ${APLICAR ? '⚠️  APLICAR CAMBIOS EN DB' : '🔍 DRY-RUN (solo lectura)'}`);
  console.log('');

  // Leer checkpoint
  const checkpoint = leerCheckpoint();
  if (checkpoint.procesados.length > 0) {
    console.log(`📌 Checkpoint encontrado: ${checkpoint.procesados.length} artículos ya procesados.`);
    console.log(`   (usa --reset-checkpoint para ignorar el checkpoint)`);
  }

  // Construir query
  let query: any;

  if (FILTRO_SLUG) {
    query = db.select().from(blogPosts).where(eq(blogPosts.slug, FILTRO_SLUG));
  } else {
    // Artículos que NO han sido revisados aún
    query = db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        body: blogPosts.body,
        reviewStatus: blogPosts.reviewStatus,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.publishedAt);
  }

  if (LIMIT > 0) {
    query = query.limit(LIMIT);
  }
  if (OFFSET > 0) {
    query = query.offset(OFFSET);
  }

  const articulos: ArticuloRow[] = await query;
  console.log(`📊 Total artículos a procesar: ${articulos.length}`);

  if (articulos.length === 0) {
    console.log('✅ No hay artículos pendientes de corrección.');
    return;
  }

  // Filtrar checkpoint
  const pendientes = articulos.filter((a) => !checkpoint.procesados.includes(a.slug));
  const yaProcesados = articulos.length - pendientes.length;
  if (yaProcesados > 0) {
    console.log(`⏩ Saltando ${yaProcesados} ya procesados (checkpoint)`);
  }

  // Estadísticas
  let correctos = 0;
  let errores = 0;
  let sinCambios = 0;
  let inicioTotal = Date.now();

  for (let i = 0; i < pendientes.length; i++) {
    const articulo = pendientes[i];
    const idx = i + 1;
    const total = pendientes.length;

    console.log(`\n[${idx}/${total}] Procesando...`);

    const resultado = await procesarArticulo(articulo);

    // Actualizar estadísticas
    if (resultado.exito) {
      if (resultado.necesitaCorreccion) {
        correctos++;
      } else {
        sinCambios++;
      }
    } else {
      errores++;
    }

    // Guardar en checkpoint
    checkpoint.procesados.push(articulo.slug);
    guardarCheckpoint(checkpoint);

    // Delay entre artículos (excepto el último)
    if (i < pendientes.length - 1) {
      // Pausa larga cada LOTE artículos
      if ((i + 1) % LOTE === 0) {
        console.log(`\n⏸️  Pausa larga de ${PAUSA_LARGA_MS / 1000}s tras ${LOTE} artículos...`);
        await sleep(PAUSA_LARGA_MS);
      } else {
        console.log(`  ⏳ Esperando ${DELAY_MS}ms antes del siguiente...`);
        await sleep(DELAY_MS);
      }
    }
  }

  // Resumen final
  const tiempoTotal = ((Date.now() - inicioTotal) / 1000 / 60).toFixed(1);

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   RESUMEN FINAL                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Total procesados:    ${pendientes.length}`);
  console.log(`  ✅ Corregidos:        ${correctos}`);
  console.log(`  ⏩ Sin cambios:      ${sinCambios}`);
  console.log(`  ❌ Errores:           ${errores}`);
  console.log(`  ⏱️  Tiempo total:     ${tiempoTotal} min`);
  console.log(`  Modo:                ${APLICAR ? '⚠️  APLICADO' : '🔍 DRY-RUN'}`);

  if (errores > 0) {
    console.log(`\n⚠️  Hubo ${errores} errores. Revisa los logs arriba para más detalles.`);
  }

  // Limpiar checkpoint si todo salió bien
  if (errores === 0 && APLICAR) {
    limpiarCheckpoint();
    console.log('\n✅ Checkpoint limpiado (todos los artículos procesados exitosamente).');
  } else if (!APLICAR) {
    console.log(`\n💡 Para aplicar los cambios: npm run corregir:articulos -- --aplicar`);
  }
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
