/**
 * Envío conservador y controlado de URLs a IndexNow (Bing/Yandex/Seznam).
 *
 * FUENTE ÚNICA DE VERDAD (Jun 2026 — auditoría SEO 2026-06-23):
 *   El catálogo estático de URLs se lee de `data/seo/canonical-paths.json`,
 *   el mismo archivo que consume `app/sitemap.ts` (PUBLIC_ROUTES). Esto
 *   elimina la duplicación que permitió el bug histórico de Jun 2026, cuando
 *   se enviaron 9.466 URLs a Bing en 5 días (7-11/06/2026) con 0 crawled /
 *   0 indexed. Las URLs candidatas NUNCA deben superar el techo de seguridad
 *   `indexnow_safety_cap` (default 212 = 202 sitemap + 10 margen). Si lo
 *   superan, el script ABORTA con código 1 y no envía nada.
 *
 *   Causas raíz documentadas del bug histórico:
 *     (1) key de envío != key del archivo public/<key>.txt,
 *     (2) dominio no verificado en Bing Webmaster Tools (403),
 *     (3) URLs 404 (/blog/categoria/{x} que no existe),
 *     (4) reenvío masivo en cada build (varias veces al día).
 *
 *   Este script es CONSERVADOR: solo envía URLs públicas, canónicas,
 *   indexables y de alto valor. Excluye rutas privadas/noindex, deduplica
 *   con Set, normaliza host y trailing slash, y nunca reenvía miles de URLs.
 *
 * MODOS:
 *   1. Completo controlado:  --full        -> catálogo estático + categorías
 *                                            (limitable con --limit N)
 *   2. Incremental (recomendado para postbuild/CI):
 *      (sin flag)           -> solo URLs prioritarias (núcleo)
 *      --incremental        -> solo URLs modificadas vs cache local
 *      --sample | --limit 5 -> lote pequeño de prueba (home + 4 landings)
 *
 * FLAGS:
 *   --dry-run       Simula (no llama a la API). Por defecto en CI si no hay
 *                   ENABLE_INDEXNOW_SUBMIT=true.
 *   --full           Usa el catálogo público completo (no el lote mínimo).
 *   --incremental   Compara con .indexnow-cache.json y envía solo novedades.
 *   --limit N        Limita a N URLs (tras dedup/filtro).
 *   --sample         Alias de --limit 5 con la lista de prueba definida.
 *   --deleted-url U  Notifica una única URL eliminada del host canónico.
 *   --key <key>      Override de INDEXNOW_KEY (poco habitual).
 *   --host <host>    Override de host (para staging; usar con cuidado).
 *
 * CACHÉ:
 *   .indexnow-cache.json  -> { urls: { "<url>": "<iso-ts>" }, lastRun }
 *   No contiene secretos. Está en .gitignore.
 *
 * SEGURIDAD:
 *   - No imprime la key completa (solo primeros 6 chars).
 *   - Aborta si la key no coincide con el archivo public/<key>.txt.
 *   - Aborta si NEXT_PUBLIC_NOINDEX=true (sitio no indexable).
 *   - Aborta (código 1) si candidatas > INDEXNOW_SAFETY_CAP (envío masivo).
 *   - En CI sin ENABLE_INDEXNOW_SUBMIT=true => dry-run forzado.
 *
 * USO:
 *   node scripts/submit-indexnow.mjs --dry-run --full     # auditar catálogo
 *   node scripts/submit-indexnow.mjs --dry-run             # ver lote mínimo
 *   node scripts/submit-indexnow.mjs --sample               # prueba de 5
 *   node scripts/submit-indexnow.mjs --incremental          # CI recomendado
 *   node scripts/submit-indexnow.mjs --full --limit 200    # completo tope
 */
import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';

/**
 * Catálogo canónico de paths estáticos. Misma fuente de verdad que
 * app/sitemap.ts (PUBLIC_ROUTES), evitando desincronías. Desde Jun 2026
 * (auditoría SEO 2026-06-23) este JSON es la única fuente de rutas estáticas.
 */
import canonicalPathsData from '../data/seo/canonical-paths.json' with { type: 'json' };
import localLandingIndexability from '../data/seo/local-landing-indexability.json' with { type: 'json' };

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
// Techo de seguridad derivado de data/seo/canonical-paths.json (202 + 10 margen).
// Aborta cualquier envío masivo (bug histórico Jun 2026: 9.466 URLs enviadas).
// Override vía env INDEXNOW_SAFETY_CAP para staging/migraciones (no usar en prod).
const SITEMAP_OBSERVED = canonicalPathsData.sitemap_observed_count;
const INDEXNOW_SAFETY_CAP = Number(process.env.INDEXNOW_SAFETY_CAP) || canonicalPathsData.indexnow_safety_cap;
// `MAX_URLS_FULL` (techo propio del script) debe ser SIEMPRE ≤ INDEXNOW_SAFETY_CAP.
const MAX_URLS_FULL = INDEXNOW_SAFETY_CAP;

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
const deletedUrlArg = getArg('--deleted-url');

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
// Catálogo de URLs públicas (FUENTE ÚNICA: data/seo/canonical-paths.json)
// ---------------------------------------------------------------------------
// Desde Jun 2026, el catálogo estático se derivan del mismo JSON que consume
// `app/sitemap.ts` (PUBLIC_ROUTES). Esto elimina la duplicación que provocó el
// bug histórico de 9.466 envíos a IndexNow en 7-11/06/2026.

/** Lista de paths estáticos canónicos (ordenados por prioridad en el JSON). */
const STATIC_PATHS = canonicalPathsData.static_routes.map((r) => r.path);

// Landings locales `NOINDEX_UNTIL_UNIQUE` (fuente:
// data/seo/local-landing-indexability.json). NUNCA deben enviarse a IndexNow.
const NOINDEX_LOCAL_LANDING_PATHS = new Set(
  localLandingIndexability.noindex_until_unique
    .map((slug) => `/abogados-en-${slug}`),
);

// Landings locales: máxima intención comercial ("abogados en {ciudad}").
const LOCAL_LANDINGS = STATIC_PATHS.filter((p) => p.startsWith('/abogados-en-'));

// Núcleo del sitio: páginas prioritarias de alto valor y/o alta intención.
// Subconjunto DRY derivado del catálogo estático (no se necesitan literales
// adicionales: cualquier nueva página prioritaria se añade en el JSON).
const CORE_PATHS = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  ...LOCAL_LANDINGS,
  '/despacho',
  '/hondurenos-en-espana',
  '/preguntas-frecuentes',
  '/solicitar-consulta',
  '/como-llegar',
].filter((p) => STATIC_PATHS.includes(p));

/** Catálogo completo del modo --full: el catálogo estático + el índice /blog. */
function buildCatalogPaths() {
  return [...STATIC_PATHS, '/blog'];
}

// Slugs de categoría del blog. Leídos dinámicamente desde
// `data/blog/categories.ts` no es trivial desde un .mjs (TS file) por lo que se
// mantiene aquí como lista sincronizada manualmente. CUALQUIER cambio en
// `data/blog/categories.ts` debe reflejarse aquí y viceversa. En el sitemap
// (app/sitemap.ts) las categorías se derivan del propio import, por lo que el
// sitemap es la fuente de verdad de facto para categorías; aquí solo las
// añadimos al catálogo IndexNow --full si el modo --full lo requiere.
// NOTA: Por defecto NO se envían las URLs de categoría vía IndexNow (Bing las
// descubre vía el sitemap.xml). Solo se incluyen cuando se pasa --full
// explícitamente. Si se desincroniza vs data/blog/categories.ts el script
// envía paths 404 y Bing los descarta (no penaliza al sitio).
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
  const paths = buildCatalogPaths();
  // Categorías del blog con la ruta REAL (/blog/{category}). Solo se añaden
  // en modo --full; Bing las descubre vía sitemap.xml y la mayoría son thin
  // por su naturaleza de índice de categoría, así que su envío es opcional
  // pero útil para que Bing las rastree cuando hay cambios en posts jóvenes.
  for (const slug of BLOG_CATEGORY_SLUGS) {
    paths.push(`/blog/${slug}`);
  }
  // Los posts del blog viven en DB y los sirve dinámicamente app/sitemap.ts.
  // Aquí NO los inventamos: Bing los descubre vía sitemap.xml. En el postbuild
  // el script no tiene acceso a DB (no se carga `lib/db.ts`), así que nunca
  // los incluimos. Cualquier intento de inyectar paths manuales generaría
  // URLs 404 (causa del bug histórico de Jun 2026).
  return paths;
}

function buildCoreUrlList() {
  return [...CORE_PATHS];
}

function buildSampleList() {
  // Lote de prueba de 5 URLs de alto valor (subconjunto de CORE_PATHS).
  return [
    '/',
    '/solicitar-consulta',
    '/abogados-en-nacaome',
    '/abogados-en-choluteca',
    '/como-llegar',
  ];
}

function buildDeletedUrlList(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname !== HOST || parsed.search || parsed.hash) {
      throw new Error('La URL eliminada debe usar HTTPS, el host canónico y no incluir query ni hash.');
    }
    return [parsed.pathname];
  } catch (error) {
    console.log(`⛔ URL eliminada inválida: ${error.message}`);
    process.exit(1);
  }
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
    // Landings locales noindex: excluidas de IndexNow (decisión 2026-08-03).
    if (NOINDEX_LOCAL_LANDING_PATHS.has(path)) {
      exclusions[EXCLUSION_REASONS.explicitNoindex]++;
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

  // Envío DUAL resiliente (auditoría SEO 2026-06-25):
  //   - api.indexnow.org  → redistribuye a Bing/Yandex/Seznam (oficial).
  //   - www.bing.com/indexnow → directo a Bing (red path oficial Bing).
  //
  // Ambos endpoints reciben el MISMO payload. Se usan Promise.allSettled:
  //   - Ningún fallo individual aborta el envío al otro endpoint.
  //   - Se registran los HTTP status de cada uno.
  //   - El resultado global es OK si al menos uno responde 200/202 (mejor
  //     cobertura de Bing; si api.indexnow.org está caído, Bing directo
  //     sigue recibiendo la señal).
  //
  // Se respetan dry-run, incremental cache y safety cap existentes (este
  // cambio no los altera).
  const endpoints = [
    { label: 'api.indexnow.org', url: INDEXNOW_ENDPOINT },
    { label: 'www.bing.com', url: INDEXNOW_ENDPOINT_BING },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const ok = res.ok || res.status === 200 || res.status === 202;
      let body = '';
      if (!ok) body = (await res.text().catch(() => '')).slice(0, 200);
      return { label: ep.label, status: res.status, ok, body };
    }),
  );

  const settled = results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { label: 'unknown', status: 'network-error', ok: false, body: String(r.reason).slice(0, 200) },
  );

  const anyOk = settled.some((r) => r.ok);

  return {
    status: anyOk ? 200 : 'all-failed',
    ok: anyOk,
    count: urls.length,
    endpoints: settled.map((r) => `${r.label}=${r.status}${r.ok ? '✓' : '✗'}`),
    failed: settled.filter((r) => !r.ok).map((r) => `${r.label}:${r.body || r.status}`),
  };
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
  console.log(' IndexNow — envío conservador (fuente única: canonical-paths.json)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Host:                    ${HOST}`);
  console.log(`Key (mask):              ${maskKey(KEY)}`);
  console.log(`Catálogo estático (JSON): ${STATIC_PATHS.length} rutas`);
  console.log(`Sitemap observado (cap): ${SITEMAP_OBSERVED} URLs`);
  console.log(`Techo de seguridad:      ${INDEXNOW_SAFETY_CAP} URLs (abortar si se supera)`);
  console.log(
    `Modo:                    ${
      deletedUrlArg ? 'URL ELIMINADA (1)' : isSample ? 'SAMPLE (5)' : isFull ? 'FULL (catálogo + categorías)' : isIncremental ? 'INCREMENTAL' : 'MÍNIMO (core)'
    }`,
  );
  console.log(`Ejecución:               ${isDryRun ? 'DRY-RUN (simulación)' : 'REAL'}`);
  console.log(`Endpoint:                api.indexnow.org + www.bing.com/indexnow (dual)`);
  console.log(`noindex sitio:           ${SITE_NOINDEX ? 'SÍ (abortar)' : 'no'}`);
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
  console.log(`Key location:            ${keyLocation}`);
  console.log(`Validación key:          ✓ coincide con public/${KEY}.txt`);
  console.log('');

  // Construcción de la lista base -----------------------------------------
  let basePaths;
  if (deletedUrlArg) basePaths = buildDeletedUrlList(deletedUrlArg);
  else if (isSample) basePaths = buildSampleList();
  else if (isFull) basePaths = buildFullUrlList();
  else basePaths = buildCoreUrlList();

  const { urls, exclusions } = prepareUrls(basePaths);

  console.log('── Resumen de preparación ──────────────────────────────');
  console.log(`URLs candidatas (antes de filtro): ${basePaths.length}`);
  for (const [reason, count] of Object.entries(exclusions)) {
    if (count > 0) console.log(`  ✗ excluidas (${reason}): ${count}`);
  }
  console.log(`URLs únicas válidas:              ${urls.length}`);

  // ── Validación DURA vs sitemap (techo de seguridad) ────────────────────
  // Aborta si el número final de URLs candidatas supera el techo de seguridad
  // (sitemap observado + margen). Esto impide la recurrencia del bug histórico
  // de Jun 2026 (9.466 URLs enviadas, 0 crawled / 0 indexed).
  if (urls.length > INDEXNOW_SAFETY_CAP) {
    console.log('');
    console.log(`⛔ ABORTADO: ${urls.length} URLs candidatas superan el techo de seguridad (${INDEXNOW_SAFETY_CAP}).`);
    console.log('   Posibles causas:');
    console.log('     1. El catálogo data/seo/canonical-paths.json se ha ampliado sin actualizar indexnow_safety_cap.');
    console.log('     2. Se están inyectando URLs duplicadas o parámetros no normalizados.');
    console.log('     3. Alguien está intentando reenviar el blog completo vía IndexNow (no se debe).');
    console.log('   Acción: revisa data/seo/canonical-paths.json y los logs de preparación arriba.');
    process.exit(1);
  }
  // Aviso preventivo (no aborta) si nos acercamos al cap.
  if (urls.length > SITEMAP_OBSERVED) {
    console.log(`  ⚠ aviso: candidatas (${urls.length}) > sitemap observado (${SITEMAP_OBSERVED}).`);
    console.log('    Revisa que no se estén duplicando URLs o incluyendo rutas canonicalizadas.');
  }

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
  console.log(`Total final a enviar: ${toSend.length} / ${INDEXNOW_SAFETY_CAP} (techo)`);
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
      // Envío dual: mostrar estado por endpoint (api.indexnow.org + www.bing.com).
      const endpointsStr = (r.endpoints || []).join(' ');
      console.log(`✓ HTTP ${r.status} [${endpointsStr}]`);
    } else {
      failBatches++;
      const reasons = (r.failed || []).join('; ') || '';
      console.log(`✗ HTTP ${r.status}${reasons ? ' :: ' + reasons : ''}`);
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
