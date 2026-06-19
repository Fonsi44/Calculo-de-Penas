/**
 * Envío conservador y controlado de URLs a IndexNow (Bing/Yandex/Seznam).
 *
 * POLÍTICA (Jun 2026 — corrección urgente):
 *   El envío masivo anterior generaba ~57 URLs por build, incluyendo rutas
 *   inexistentes (/blog/categoria/...) y NOTIFICABA en cada `postbuild`, lo
 *   que produjo 9.450 envíos entre el 7-11/6/2026 con 0 rastreos/0
 *   indexaciones en Bing. Causas raíz: (1) key de envío != key del archivo
 *   público, (2) dominio no verificado en Bing Webmaster Tools (403),
 *   (3) URLs 404, (4) reenvío masivo en cada build.
 *
 *   Este script es CONSERVADOR: solo envía URLs públicas, canónicas,
 *   indexables y de alto valor. Excluye rutas privadas/noindex, deduplica
 *   con Set, normaliza host y trailing slash, y nunca reenvía miles de URLs.
 *
 * MODOS:
 *   1. Completo controlado:  --full        -> URLs del catálogo público real
 *                                            (limitable con --limit N)
 *   2. Incremental (recomendado para postbuild/CI):
 *      (sin flag)           -> solo URLs prioritarias (núcleo)
 *      --incremental        -> solo URLs modificadas vs cache local
 *      --sample | --limit 5 -> lote pequeño de prueba (home + 4 landings)
 *
 * FLAGS:
 *   --dry-run       Simula (no llama a la API). Por defecto en CI si no hay
 *                   ENABLE_INDEXNOW_SUBMIT=true.
 *   --full          Usa el catálogo público completo (no el lote mínimo).
 *   --incremental   Compara con .indexnow-cache.json y envía solo novedades.
 *   --limit N       Limita a N URLs (tras dedup/filtro).
 *   --sample        Alias de --limit 5 con la lista de prueba definida.
 *   --key <key>     Override de INDEXNOW_KEY (poco habitual).
 *   --host <host>   Override de host (para staging; usar con cuidado).
 *
 * CACHÉ:
 *   .indexnow-cache.json  -> { urls: { "<url>": "<iso-ts>" }, lastRun }
 *   No contiene secretos. Está en .gitignore (lo añade este cambio).
 *
 * SEGURIDAD:
 *   - No imprime la key completa (solo primeros 6 chars).
 *   - Aborta si la key no coincide con el archivo public/<key>.txt.
 *   - Aborta si NEXT_PUBLIC_NOINDEX=true (sitio no indexable).
 *   - En CI sin ENABLE_INDEXNOW_SUBMIT=true => dry-run forzado.
 *
 * USO:
 *   node scripts/submit-indexnow.mjs --dry-run --full     # auditar catálogo
 *   node scripts/submit-indexnow.mjs --dry-run             # ver lote mínimo
 *   node scripts/submit-indexnow.mjs --sample              # prueba de 5
 *   node scripts/submit-indexnow.mjs --incremental         # CI recomendado
 *   node scripts/submit-indexnow.mjs --full --limit 200    # completo tope
 */
import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const DEFAULT_HOST = 'www.pinedayasociadoshn.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_ENDPOINT_BING = 'https://www.bing.com/indexnow';
const BATCH_SIZE = 100; // límite de IndexNow por petición
const MAX_URLS_FULL = 500; // techo duro del modo completo

const args = process.argv.slice(2);
const isDryRun =
  args.includes('--dry-run') ||
  process.env.ENABLE_INDEXNOW_SUBMIT !== 'true';
const isFull = args.includes('--full');
const isIncremental = args.includes('--incremental');
const isSample = args.includes('--sample');

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const limitArg = isSample
  ? 5
  : (() => {
      const v = getArg('--limit');
      return v ? parseInt(v, 10) : undefined;
    })();

const overrideKey = getArg('--key');
const overrideHost = getArg('--host');

// Host canónico (sin protocolo ni trailing slash).
function resolveHost() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  let host = overrideHost;
  if (!host && fromEnv) {
    try {
      host = new URL(fromEnv).hostname;
    } catch {
      host = DEFAULT_HOST;
    }
  }
  return (host || DEFAULT_HOST).replace(/\/+$/, '');
}
const HOST = resolveHost();

const KEY = overrideKey || process.env.INDEXNOW_KEY;

// Sitio no indexable => no tiene sentido enviar a IndexNow.
const SITE_NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true';

// ---------------------------------------------------------------------------
// Catálogo de URLs públicas (fuente de verdad alineada con app/sitemap.ts)
// ---------------------------------------------------------------------------

// Landings locales: máxima intención comercial ("abogados en {ciudad}").
const LOCAL_LANDINGS = [
  '/abogados-en-nacaome',
  '/abogados-en-choluteca',
  '/abogados-en-san-lorenzo',
];

// Núcleo del sitio: páginas prioritarias de alto valor y/o alta intención.
const CORE_URLS = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  ...LOCAL_LANDINGS,
  '/despacho',
  '/hondurenos-en-espana',
  '/preguntas-frecuentes',
  '/solicitar-consulta',
  '/como-llegar',
];

// Catálogo público amplio (modo --full). Debe reflejar rutas REALES del
// sitemap. NO incluir /blog/categoria/... (no existe) ni páginas 404.
const FULL_CATALOG = [
  ...CORE_URLS,
  // Servicios jurídicos (ramas)
  '/servicios-juridicos/derecho-de-familia',
  '/servicios-juridicos/derecho-laboral',
  '/servicios-juridicos/derecho-civil-y-notarial',
  '/servicios-juridicos/derecho-mercantil-empresarial',
  '/servicios-juridicos/derecho-bancario-y-financiero',
  '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
  '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
  '/servicios-juridicos/regulacion-sanitaria',
  '/servicios-juridicos/extranjeria-en-honduras',
  '/servicios-juridicos/propiedad-intelectual',
  '/servicios-juridicos/tributario-fiscal',
  '/servicios-juridicos/ambiental-regulatorio',
  '/servicios-juridicos/conciliacion-y-arbitraje',
  // Derecho penal (subáreas)
  '/derecho-penal/atencion-casos-penales-litigiosos',
  '/derecho-penal/mediacion-conflictos-penales-y-multas',
  '/derecho-penal/menores-justicia-juvenil',
  '/derecho-penal/proceso-penal-completo',
  '/derecho-penal/recursos-y-defensa-avanzada',
  '/derecho-penal/estrategia-penal-y-litigio',
  '/derecho-penal/ejecucion-penal-y-beneficios',
  // Hondureños en España (subáreas)
  '/hondurenos-en-espana/gestion-documental-y-legalizacion',
  '/hondurenos-en-espana/actos-notariales-internacionales',
  '/hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero',
  // Blog: índice + categorías (slug real = /blog/{category}, sin "categoria/")
  '/blog',
];

// Slugs de categoría del blog (deben coincidir con data/blog/categories.ts).
const BLOG_CATEGORY_SLUGS = [
  'derecho-penal',
  'proceso-penal',
  'derecho-de-familia',
  'derecho-laboral',
  'derecho-civil',
  'derecho-mercantil',
  'extranjeria-migracion',
  'hondurenos-en-espana',
  'derecho-notarial',
  'tributario',
  'noticias-legales',
  'practica-legal',
  'derechos-ciudadanos',
  'derecho-bancario',
  'derecho-administrativo',
  'derecho-aduanero',
  'regulacion-sanitaria',
  'propiedad-intelectual',
  'derecho-ambiental',
  'conciliacion-arbitraje',
];

// ---------------------------------------------------------------------------
// Exclusiones (rutas NO indexables / privadas / ruido)
// ---------------------------------------------------------------------------

// Patrones de rutas que NUNCA deben enviarse a IndexNow.
const EXCLUDE_PATTERNS = [
  /^\/intranet(\/|$)/i, // panel interno
  /^\/admin(\/|$)/i, // admin
  /^\/api(\/|$)/i, // API
  /^\/calculadora(\/|$)/i, // herramienta interna (noindex/no valor SEO)
  /^\/casos(\/|$)/i, // casos (privado/noindex)
  /^\/cp(\/|$)/i, // supuestos penales (interno)
  /^\/delitos(\/|$)/i, // delitos (interno)
  /^\/atajos(\/|$)/i, // atajos internos
  /^\/preview(\/|$)/i, // previews
  /^\/login(\/|$)/i, // login
  /^\/_next(\/|$)/i, // assets Next.js
  /^\/_error/i,
  /^\/404/i,
  /^\/500/i,
  /^\/_not-found/i,
  /^\/buscador(\/|$)/i, // búsquedas internas si existen
  // Red de seguridad defensiva: /blog/categoria/{x} NO existe (la ruta real
  // es /blog/{category} sin "categoria/"). Fue la causa de 20 URLs 404 en el
  // bug histórico de IndexNow. Aunque el catálogo no la genera, la excluimos
  // explícitamente por si llegara a inyectarse dinámicamente.
  /^\/blog\/categoria(\/|$)/i,
];

// Rutas explícitamente noindex por next.config.ts (login redirect).
const NOINDEX_ROUTES = ['/login'];

const EXCLUSION_REASONS = {
  private: 'ruta privada/noindex (intranet/admin/api/calculadora/casos/...)',
  trailingSlash: 'trailing slash no canónico',
  duplicate: 'duplicada',
  notCanonicalHost: 'host no canónico',
  withQuery: 'URL con parámetros de consulta',
  explicitNoindex: 'ruta marcada como noindex',
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function buildFullUrlList() {
  const paths = [...FULL_CATALOG];
  // Categorías del blog con la ruta REAL (/blog/{category}).
  for (const slug of BLOG_CATEGORY_SLUGS) {
    paths.push(`/blog/${slug}`);
  }
  // Posts del blog desde el sistema de archivos (si existen).
  // NOTA: actualmente los posts viven en DB; el sitemap los sirve. Aquí no
  // los inventamos. Si en el futuro hay posts en data/blog/posts/*.ts, se
  // añadirían como /blog/{category}/{slug}.
  const postsDir = join(ROOT, 'data/blog/posts');
  if (existsSync(postsDir)) {
    for (const f of readdirSync(postsDir)) {
      if (f.endsWith('.ts') && f !== 'index.ts') {
        // No sabemos la categoría desde el nombre; omisión segura.
        // El sitemap ya los incluye y Bing los descubrirá vía sitemap.xml.
      }
    }
  }
  return paths;
}

function buildCoreUrlList() {
  return [...CORE_URLS];
}

function buildSampleList() {
  // Lote de prueba de 5 URLs de alto valor.
  return [
    '/',
    '/solicitar-consulta',
    '/abogados-en-nacaome',
    '/abogados-en-choluteca',
    '/como-llegar',
  ];
}

function isExcluded(pathname) {
  for (const re of EXCLUDE_PATTERNS) {
    if (re.test(pathname)) return EXCLUSION_REASONS.private;
  }
  if (NOINDEX_ROUTES.includes(pathname)) {
    return EXCLUSION_REASONS.explicitNoindex;
  }
  return null;
}

function normalizePath(p) {
  // Sin trailing slash salvo la raíz.
  if (p.length > 1 && p.endsWith('/')) {
    return p.replace(/\/+$/, '');
  }
  return p;
}

/**
 * Construye, filtra y deduplica la lista final de URLs.
 * Devuelve { urls, stats }.
 */
function prepareUrls(rawPaths) {
  const seen = new Set();
  const urls = [];
  const exclusions = {};
  for (const reason of Object.values(EXCLUSION_REASONS)) exclusions[reason] = 0;

  for (const raw of rawPaths) {
    const path = normalizePath(raw);
    const reason = isExcluded(path);
    if (reason) {
      exclusions[reason]++;
      continue;
    }
    const url = `https://${HOST}${path}`;
    if (seen.has(url)) {
      exclusions[EXCLUSION_REASONS.duplicate]++;
      continue;
    }
    seen.add(url);
    urls.push(url);
  }
  return { urls, exclusions };
}

// ---------------------------------------------------------------------------
// Cache incremental (.indexnow-cache.json)
// ---------------------------------------------------------------------------

const CACHE_FILE = join(ROOT, '.indexnow-cache.json');

function loadCache() {
  if (!existsSync(CACHE_FILE)) return { urls: {}, lastRun: null };
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return { urls: {}, lastRun: null };
  }
}

function saveCache(cache) {
  cache.lastRun = new Date().toISOString();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function diffIncremental(allUrls, cache) {
  const now = Date.now();
  const THROTTLE_MS = 24 * 60 * 60 * 1000; // no reenviar la misma URL < 24h
  const fresh = [];
  let skipped = 0;
  for (const url of allUrls) {
    const ts = cache.urls[url];
    if (ts && now - new Date(ts).getTime() < THROTTLE_MS) {
      skipped++;
      continue;
    }
    fresh.push(url);
  }
  return { fresh, skipped };
}

// ---------------------------------------------------------------------------
// Validación de la key
// ---------------------------------------------------------------------------

function validateKey() {
  if (!KEY) {
    return { ok: false, reason: 'INDEXNOW_KEY no definida (define en .env/.env.local o Vercel)' };
  }
  const keyFile = join(ROOT, 'public', `${KEY}.txt`);
  if (!existsSync(keyFile)) {
    return {
      ok: false,
      reason: `No existe public/${KEY}.txt para la key configurada. ` +
        `Crea el archivo con el contenido exacto de INDEXNOW_KEY o ajusta la variable.`,
    };
  }
  const fileContent = readFileSync(keyFile, 'utf8').trim();
  if (fileContent !== KEY) {
    return {
      ok: false,
      reason: `El contenido de public/${KEY}.txt (${fileContent.slice(0, 6)}...) ` +
        `no coincide con INDEXNOW_KEY (${KEY.slice(0, 6)}...). Deben ser idénticos.`,
    };
  }
  return { ok: true, keyLocation: `https://${HOST}/${KEY}.txt` };
}

// ---------------------------------------------------------------------------
// Envío
// ---------------------------------------------------------------------------

async function submitBatch(urls, keyLocation) {
  const payload = { host: HOST, key: KEY, keyLocation, urlList: urls };

  if (isDryRun) {
    return { status: 'dry-run', ok: true, count: urls.length };
  }

  // Endpoint principal; IndexNow redistribuye a Bing/Yandex/Seznam.
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 200 || res.status === 202) {
      return { status: res.status, ok: true, count: urls.length };
    }
    const text = await res.text().catch(() => '');
    return {
      status: res.status,
      ok: false,
      count: urls.length,
      body: text.slice(0, 200),
    };
  } catch (err) {
    return { status: 'network-error', ok: false, count: urls.length, body: String(err).slice(0, 200) };
  }
}

function maskKey(k) {
  if (!k) return '(vacía)';
  return k.length > 8 ? `${k.slice(0, 6)}…${k.slice(-2)}` : '***';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' IndexNow — envío conservador');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Host:            ${HOST}`);
  console.log(`Key (mask):      ${maskKey(KEY)}`);
  console.log(
    `Modo:            ${
      isSample ? 'SAMPLE (5)' : isFull ? 'FULL (catálogo)' : isIncremental ? 'INCREMENTAL' : 'MÍNIMO (core)'
    }`,
  );
  console.log(`Ejecución:       ${isDryRun ? 'DRY-RUN (simulación)' : 'REAL'}`);
  console.log(`Endpoint:        ${INDEXNOW_ENDPOINT}`);
  console.log(`noindex sitio:   ${SITE_NOINDEX ? 'SÍ (abortar)' : 'no'}`);
  console.log('');

  // Bloqueos de seguridad --------------------------------------------------
  if (SITE_NOINDEX) {
    console.log('⛔ Abortado: NEXT_PUBLIC_NOINDEX=true. El sitio no es indexable; no se envía a IndexNow.');
    process.exit(0);
  }

  const keyCheck = validateKey();
  if (!keyCheck.ok) {
    console.log(`⛔ Validación de key fallida: ${keyCheck.reason}`);
    console.log('   Ejecuta con --dry-run para auditar URLs sin enviar.');
    process.exit(0);
  }
  const { keyLocation } = keyCheck;
  console.log(`Key location:    ${keyLocation}`);
  console.log(`Validación key:  ✓ coincide con public/${KEY}.txt`);
  console.log('');

  // Construcción de la lista base -----------------------------------------
  let basePaths;
  if (isSample) basePaths = buildSampleList();
  else if (isFull) basePaths = buildFullUrlList();
  else basePaths = buildCoreUrlList();

  const { urls, exclusions } = prepareUrls(basePaths);

  console.log('── Resumen de preparación ──────────────────────────────');
  console.log(`URLs candidatas (antes de filtro): ${basePaths.length}`);
  for (const [reason, count] of Object.entries(exclusions)) {
    if (count > 0) console.log(`  ✗ excluidas (${reason}): ${count}`);
  }
  console.log(`URLs únicas válidas:              ${urls.length}`);

  // Modo incremental: diff contra cache -----------------------------------
  let toSend = urls;
  if (isIncremental) {
    const cache = loadCache();
    const { fresh, skipped } = diffIncremental(urls, cache);
    console.log(`  ↳ incremental: ${skipped} ya enviadas <24h (throttle), ${fresh.length} nuevas`);
    toSend = fresh;
  }

  // Límite -----------------------------------------------------------------
  if (typeof limitArg === 'number' && toSend.length > limitArg) {
    const before = toSend.length;
    toSend = toSend.slice(0, limitArg);
    console.log(`  ↳ --limit ${limitArg}: recortado de ${before} a ${toSend.length}`);
  }
  if (toSend.length > MAX_URLS_FULL) {
    const before = toSend.length;
    toSend = toSend.slice(0, MAX_URLS_FULL);
    console.log(`  ⚠ techo de seguridad ${MAX_URLS_FULL}: recortado de ${before}`);
  }

  console.log('───────────────────────────────────────────────────────');
  console.log(`Total final a enviar: ${toSend.length}`);
  console.log('');

  if (toSend.length === 0) {
    console.log('✅ Nada que enviar (0 URLs tras filtros/incremental).');
    return;
  }

  if (isDryRun) {
    console.log('── URLs (dry-run) ─────────────────────────────────────');
    toSend.forEach((u) => console.log(`  ${u}`));
    console.log('');
    console.log('✅ Dry-run completo. Para envío real: ENABLE_INDEXNOW_SUBMIT=true sin --dry-run.');
    return;
  }

  // Envío real -------------------------------------------------------------
  console.log('── Envío ──────────────────────────────────────────────');
  let okBatches = 0;
  let failBatches = 0;
  for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
    const batch = toSend.slice(i, i + BATCH_SIZE);
    const n = Math.floor(i / BATCH_SIZE) + 1;
    const total = Math.ceil(toSend.length / BATCH_SIZE);
    process.stdout.write(`Batch ${n}/${total} (${batch.length} URLs)... `);
    const r = await submitBatch(batch, keyLocation);
    if (r.ok) {
      okBatches++;
      console.log(`✓ HTTP ${r.status}`);
    } else {
      failBatches++;
      console.log(`✗ HTTP ${r.status}${r.body ? ' :: ' + r.body : ''}`);
    }
    if (i + BATCH_SIZE < toSend.length) await new Promise((r) => setTimeout(r, 400));
  }

  // Actualizar cache -------------------------------------------------------
  if (isIncremental) {
    const cache = loadCache();
    const ts = new Date().toISOString();
    for (const url of toSend) cache.urls[url] = ts;
    saveCache(cache);
    console.log(`Cache actualizado: ${toSend.length} URLs registradas en ${CACHE_FILE.replace(ROOT, '.')}`);
  }

  console.log('');
  if (failBatches === 0) {
    console.log(`✅ Envío completado: ${okBatches} batch(es) OK, ${toSend.length} URLs notificadas.`);
  } else {
    console.log(`⚠️ Envío con errores: ${okBatches} OK, ${failBatches} fallidos. Revisa HTTP 403/422 (verificación de dominio en Bing Webmaster Tools).`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
