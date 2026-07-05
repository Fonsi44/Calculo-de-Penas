/**
 * Corrección por lotes de artículos legales con información alucinada/falsa.
 *
 * FUENTE DE VERDAD: tabla `blog_posts` (PostgreSQL/Neon) vía Drizzle ORM.
 * Los artículos se corrigen usando Gemini con Google Search Grounding, que
 * busca en la web en vivo para verificar cada referencia legal (artículos del
 * CP, penas, decretos, Constitución, etc.) antes de corregir.
 *
 * PROBLEMA QUE RESUELVE: artículos legales generados por IA que contienen
 * información falsa (artículos inexistentes, penas incorrectas, citas
 * inventadas, decretos que no existen). Este script usa búsqueda web
 * (grounding) para verificar cada referencia contra fuentes reales y
 * reescribe solo lo que está mal, manteniendo estructura y tono original.
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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
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
  "body": "Cuerpo HTML corregido completo. Mantiene etiquetas originales (p, strong, h2, h3, ul, ol, li, a). Sin introducciones cliché ni conclusiones redundantes. Directo al grano desde el primer párrafo. Encabezados H2/H3 en formato de preguntas basadas en intención de búsqueda real. Cada afirmación clave cita artículo de ley hondureña.",
  "meta_title": "Título SEO optimizado (50-60 caracteres). Incluye keyword principal al inicio y 'Honduras' o ubicación. Sin keyword stuffing.",
  "meta_description": "Meta description optimizada (120-155 caracteres). Persuasiva, incluye keyword secundaria y llamada a la acción sutil.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "enfoque_geo": "Breve resumen (1-3 frases) de las leyes, artículos específicos e instituciones hondureñas que se validaron y citan en este artículo. Ej: 'Se verificaron los artículos 214 y 217 del Código Penal de Honduras (Decreto 130-2017) y jurisprudencia de la Corte Suprema de Justicia sobre homicidio simple.'"
}`;

// ═══════════════════════════════════════════════════════════════════════════
//  Prompt de auditoría legal (versión mejorada: anti-plantilla, SEO, GEO, E-E-A-T)
// ═══════════════════════════════════════════════════════════════════════════

function construirPrompt(titulo: string, body: string): string {
  return `Eres un **Abogado Consultor Senior** especializado en **Derecho Hondureño** y experto en **SEO/GEO Avanzado para firmas jurídicas**. Tu tarea es AUDITAR, CORREGIR y OPTIMIZAR el siguiente artículo legal generado por IA que PUEDE CONTENER INFORMACIÓN FALSA, ALUCINACIONES, o texto con formato de "plantilla genérica de IA".

## 📋 REGLAS ESTRICTAS — LÉELAS EN SU TOTALIDAD ANTES DE COMENZAR

### 🚫 REGLAS ANTI-PLANTILLA (prioridad máxima)
- **PROHIBIDO** usar introducciones cliché como:
  - "En el complejo mundo legal..." / "En el mundo del derecho..."
  - "En este artículo exploraremos..." / "A lo largo de este artículo..."
  - "Es importante destacar que..." / "Cabe señalar que..."
  - "El derecho penal es una rama del derecho..."
  - Cualquier variante de estas frases hechas.
- **PROHIBIDO** usar conclusiones redundantes como:
  - "En resumen..." / "En conclusión..." / "A modo de conclusión..."
  - "Como hemos visto a lo largo de este artículo..."
- El artículo debe **IR DIRECTO AL GRANO** desde el primer párrafo.
- Cada párrafo debe aportar información sustantiva. Sin relleno.
- La extensión final debe ser similar a la original (±20% de palabras).
- Si el original es demasiado corto (<600 palabras), puedes expandir con información legal verificada, pero SIN relleno.

### ⚖️ RIGOR LEGAL Y E-E-A-T (obligatorio)
- **ACTIVA GOOGLE SEARCH GROUNDING** para verificar CADA dato legal.
- Contrasta con la legislación VIGENTE de Honduras:
  - Constitución de la República de Honduras
  - Código Penal (Decreto 130-2017 y sus reformas)
  - Código Procesal Penal
  - Código Civil, Código de Trabajo, Código de Comercio, Código Tributario
  - Leyes especiales y reglamentos aplicables
  - Gacetas oficiales y jurisprudencia de la Corte Suprema de Justicia
- **CADA afirmación clave debe citar el artículo de ley correspondiente** con número exacto.
  - Formato correcto: "según el Artículo 214 del Código Penal de Honduras..."
  - NO cites artículos que no puedas verificar con la búsqueda.
- Si una ley fue **reformada o derogada**, usa la versión vigente, no la original.
- Si no puedes verificar una afirmación, ELIMÍNALA por completo.

### 🌍 OPTIMIZACIÓN GEO (Generative Engine Optimization)
- Incluye menciones naturales de **instituciones públicas reales de Honduras**:
  - Corte Suprema de Justicia (CSJ)
  - Ministerio Público (MP) / Fiscalía
  - Servicio de Administración de Rentas (SAR)
  - Registro Nacional de las Personas (RNP)
  - Instituto de la Propiedad (IP)
  - Secretaría de Derechos Humanos
  - Juzgados de Letras, Tribunal de Sentencia, Corte de Apelaciones
  - Dirección General de Migración y Extranjería (DGME)
- Menciona ubicaciones geográficas reales de Honduras cuando aplique.
- Usa terminología jurídica hondureña precisa (ej: "recurso de casación", "acción de amparo", "excepción de incompetencia").
- Esto permite que **Google AI Overviews y otros motores generativos** identifiquen el artículo como fuente autorizada sobre derecho hondureño.

### 📐 ESTRUCTURA OBLIGATORIA
- Usa **encabezados H2 y H3** basados en **intenciones de búsqueda reales**.
- Preferentemente en **formato de preguntas frecuentes (FAQ)**:
  - ✅ "¿Cómo aplica el artículo 214 del Código Penal?"
  - ✅ "¿Qué requisitos se necesitan para interponer una denuncia?"
  - ✅ "¿Cuál es la pena para el delito de homicidio simple en Honduras?"
  - ✅ "¿Qué reformas ha tenido el Código Penal hondureño?"
- NO uses H2 genéricos como "Introducción" o "Conclusión".
- Mantén el H1 original (el título del artículo) — solo hay UN H1.
- Usa negritas (<strong>) para términos legales clave y cantidades numéricas.

### 🎯 TONO Y ESTILO
- Profesional, autoritativo, pero accesible para el público general.
- Extensión de párrafos: 2-4 oraciones. Nada de bloques extensos.
- Usa listas (<ul>/<ol>) para enumerar requisitos, pasos o elementos.
- Incluye ejemplos prácticos hondureños cuando sea relevante.

## 📄 ARTÍCULO A AUDITAR Y CORREGIR

**Título original:** ${titulo}

**Cuerpo original:**
${body}

	## ✅ FORMATO DE RESPUESTA (OBLIGATORIO — JSON PURO)

	Debes responder ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin bloques de código (ni \`\`\`json), sin texto adicional antes ni después. El JSON debe seguir EXACTAMENTE esta estructura:

	${ESQUEMA_RESPUESTA_JSON}

### ⚠️ IMPORTANTE: ESCAPA CORRECTAMENTE EL JSON
- El campo **"body"** contiene HTML. Las comillas dobles dentro del HTML (ej: class="...", href="...") ROMPEN el JSON.
- Para evitar esto, usa **solo comillas simples** dentro del HTML: \`class='...'\`, \`href='...'\` en lugar de \`class="..."\`.
- Escapa cualquier carácter especial: saltos de línea como \\n, tabs como \\t.
- Si el HTML tiene caracteres especiales, usa &quot; o &#39; en lugar de las comillas literales.

### IMPORTANTE SOBRE "contenido_corregido"
En el JSON de respuesta, la clave debe llamarse **"body"** (no "contenido_corregido"). Si decides que el artículo está 100% correcto y no necesita cambios, devuelve "body": null.

### EJEMPLO DE RESPUESTA VÁLIDA
{"body": "<p>El homicidio simple está tipificado en el Artículo 214 del Código Penal de Honduras (Decreto 130-2017).</p><h2>¿Cuál es la pena para el homicidio simple en Honduras?</h2><p>La pena establecida es de 6 a 8 años de prisión, conforme al Artículo 214 del CP.</p>","meta_title":"Homicidio Simple en Honduras: Pena y Artículo 214 CP","meta_description":"Conozca la pena, requisitos y artículo del homicidio simple en el Código Penal de Honduras. Abogados penalistas explican la ley.","keywords":["homicidio simple","artículo 214 CP Honduras","pena homicidio Honduras","Código Penal Honduras","abogado penalista"],"enfoque_geo":"Se verificó el Artículo 214 del Código Penal de Honduras (Decreto 130-2017) que tipifica el homicidio simple con pena de 6 a 8 años de prisión. Se consultó jurisprudencia de la Corte Suprema de Justicia de Honduras."}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Interfaces de respuesta
// ═══════════════════════════════════════════════════════════════════════════

interface GeminiResult {
  body: string | null;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  enfoque_geo: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Extractor de campos individuales desde JSON mal formado
//  Útil cuando Gemini devuelve JSON con strings sin escapar (comillas dobles
//  dentro del body HTML, newlines literales, etc.) que rompen JSON.parse.
// ─────────────────────────────────────────────────────────────────────────────

function extraerCamposIndividuales(jsonObj: string, rawFallback: string): Record<string, unknown> | null {
  const resultado: Record<string, unknown> = {};

  // Estrategia: extraer cada campo buscando entre comillas de campo conocido
  // El truco: encontrar "field_name": " y luego buscar el cierre antes del siguiente campo conocido

  const camposConocidos = [
    'meta_title',
    'meta_description',
    'keywords',
    'enfoque_geo',
    'body',
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

  // Extraer body (puede contener HTML con comillas, es el más complejo)
  const body = extraerValorString('body', jsonObj);
  if (body) resultado.body = body;

  // Extraer meta_title
  const metaTitle = extraerValorString('meta_title', jsonObj);
  if (metaTitle) resultado.meta_title = metaTitle;

  // Extraer meta_description
  const metaDesc = extraerValorString('meta_description', jsonObj);
  if (metaDesc) resultado.meta_description = metaDesc;

  // Extraer keywords (array de strings)
  const kwMatch = jsonObj.match(/"keywords"\s*:\s*\[([\s\S]*?)\]\s*(?:,|$|\})/);
  if (kwMatch) {
    const kwStr = kwMatch[1];
    const kws = kwStr.match(/"([^"]+)"/g);
    if (kws) {
      resultado.keywords = kws.map((k) => k.replace(/"/g, '').trim()).filter(Boolean);
    }
  }

  // Extraer enfoque_geo
  const geo = extraerValorString('enfoque_geo', jsonObj);
  if (geo) resultado.enfoque_geo = geo;

  // Validar que al menos tengamos body o meta_title
  if (!resultado.body && !resultado.meta_title && !resultado.enfoque_geo) {
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
        tools: [{ googleSearch: {} }],
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

    // Mapear del esquema Gemini (body) al campo esperado
    const bodyCorregido = typeof parsed.body === 'string' && parsed.body.trim().length > 0
      ? parsed.body.trim()
      : null;

    const metaTitle = typeof parsed.meta_title === 'string' ? parsed.meta_title.trim() : '';
    const metaDescription = typeof parsed.meta_description === 'string' ? parsed.meta_description.trim() : '';
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k): k is string => typeof k === 'string')
      : [];
    const enfoqueGeo = typeof parsed.enfoque_geo === 'string' ? parsed.enfoque_geo.trim() : '';

    // Si body es null, el artículo está correcto
    if (bodyCorregido === null) {
      return {
        resultado: {
          body: null,
          meta_title: metaTitle,
          meta_description: metaDescription,
          keywords,
          enfoque_geo: enfoqueGeo,
        },
        error: null,
      };
    }

    // Guardia: el body corregido debe tener al menos 50 palabras
    const palabras = wordCount(bodyCorregido);
    if (palabras < 50) {
      return {
        resultado: null,
        error: `Body corregido demasiado corto (${palabras} palabras, mínimo 50)`,
      };
    }

    // Guardia: detectar placeholders genéricos
    const placeholders = [
      'no pude verificar',
      'no se pudo verificar',
      'no fue posible verificar',
      'información no disponible',
      'no se encontró información',
      'consulte con un abogado',
      'busque asesoría legal',
    ];
    const bodyLower = bodyCorregido.toLowerCase();
    const tienePlaceholder = placeholders.some((p) => bodyLower.includes(p));
    if (tienePlaceholder && palabras < 100) {
      return {
        resultado: null,
        error:
          'El body contiene placeholders genéricos y es demasiado corto. Posible fallo en la búsqueda web.',
      };
    }

    return {
      resultado: {
        body: bodyCorregido,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords,
        enfoque_geo: enfoqueGeo,
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

  // Si body es null, el artículo está correcto
  if (resultado && resultado.body === null) {
    console.log(`  ✅ Artículo correcto (sin cambios necesarios)`);

    // Incluir meta_title, meta_description y enfoque_geo aunque el body no cambie
    if (resultado.meta_title || resultado.meta_description || resultado.enfoque_geo) {
      console.log(`  ℹ️  Metadatos SEO/GEO generados aunque el body no requirió cambios`);
    }

    if (APLICAR) {
      const updateData: Record<string, any> = {
        reviewStatus: 'reviewed',
        reviewedAt: new Date(),
        lastReviewedAt: new Date(),
        legalReviewNotes: 'Verificado por Gemini + Google Search Grounding — sin cambios en body',
      };

      // Actualizar metadatos SEO si Gemini los generó
      if (resultado.meta_title) updateData.metaTitle = resultado.meta_title;
      if (resultado.meta_description) updateData.metaDescription = resultado.meta_description;
      if (resultado.enfoque_geo) {
        updateData.legalReviewNotes = `Verificado por Gemini + Google Search Grounding — sin cambios en body.\nEnfoque GEO: ${resultado.enfoque_geo}`;
      }

      await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, articulo.id));
      console.log(`  💾 Marcado como revisado en DB`);
    }

    return {
      slug: articulo.slug,
      titulo: articulo.title,
      exito: true,
      cambios: [],
      fuentes: [],
      error: null,
      tiempoMs: Date.now() - inicio,
      necesitaCorreccion: false,
      metaTitle: resultado.meta_title || '',
      metaDescription: resultado.meta_description || '',
      keywords: resultado.keywords || [],
      enfoqueGeo: resultado.enfoque_geo || '',
    };
  }

  if (!resultado || !resultado.body) {
    console.log(`  ❌ Error: resultado inválido de Gemini`);
    return {
      slug: articulo.slug,
      titulo: articulo.title,
      exito: false,
      cambios: [],
      fuentes: [],
      error: 'Resultado inválido de Gemini',
      tiempoMs: Date.now() - inicio,
      necesitaCorreccion: true,
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      enfoqueGeo: '',
    };
  }

  // --- Dry-run / Aplicar ---

  // Log de cambios detectados
  console.log(`  🔧 Body corregido (${wordCount(resultado.body)} palabras)`);
  if (resultado.meta_title) console.log(`  🏷️  Meta title: ${resultado.meta_title}`);
  if (resultado.meta_description) console.log(`  📝 Meta desc: ${resultado.meta_description}`);
  if (resultado.keywords && resultado.keywords.length > 0) {
    console.log(`  🔑 Keywords: ${resultado.keywords.join(', ')}`);
  }
  if (resultado.enfoque_geo) {
    console.log(`  🌍 Enfoque GEO: ${resultado.enfoque_geo.slice(0, 120)}${resultado.enfoque_geo.length > 120 ? '…' : ''}`);
  }

  // Extraer "cambios" del enfoque_geo para el log (simulado)
  const cambiosDetectados: string[] = [];
  if (resultado.meta_title) cambiosDetectados.push('Meta title generado');
  if (resultado.meta_description) cambiosDetectados.push('Meta description generada');
  if (resultado.keywords && resultado.keywords.length > 0) cambiosDetectados.push('Keywords generadas');
  if (resultado.enfoque_geo) cambiosDetectados.push('Enfoque GEO documentado');
  cambiosDetectados.push('Body corregido con verificación web');

  if (APLICAR) {
    const updateData: Record<string, any> = {
      body: resultado.body,
      reviewStatus: 'reviewed',
      reviewedAt: new Date(),
      lastReviewedAt: new Date(),
      legalReviewNotes: `Corregido por Gemini AI + Google Search Grounding.\nEnfoque GEO: ${resultado.enfoque_geo || 'No especificado'}.`,
    };

    // Actualizar metadatos SEO si Gemini los generó
    if (resultado.meta_title) updateData.metaTitle = resultado.meta_title;
    if (resultado.meta_description) updateData.metaDescription = resultado.meta_description;

    await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, articulo.id));
    console.log(`  💾 Actualizado en DB (body + meta + reviewStatus)`);
  } else {
    console.log(`  🔍 Dry-run: cambios detectados pero NO aplicados (usa --aplicar)`);
  }

  return {
    slug: articulo.slug,
    titulo: articulo.title,
    exito: true,
    cambios: cambiosDetectados,
    fuentes: [],
    error: null,
    tiempoMs: Date.now() - inicio,
    necesitaCorreccion: true,
    metaTitle: resultado.meta_title || '',
    metaDescription: resultado.meta_description || '',
    keywords: resultado.keywords || [],
    enfoqueGeo: resultado.enfoque_geo || '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   CORRECCIÓN DE ARTÍCULOS LEGALES — GEMINI + GROUNDING        ║');
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
      .where(and(ne(blogPosts.reviewStatus, 'reviewed'), eq(blogPosts.published, true)))
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
