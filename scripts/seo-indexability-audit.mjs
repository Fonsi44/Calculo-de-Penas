/*
 * Auditoría SEO de indexabilidad — chequeo estático del repositorio.
 *
 * PROPÓSITO (auditoría SEO 2026-06-23):
 *   Verificar la consistencia interna del repositorio en cuanto a
 *   indexabilidad. No usa red ni DB (no requiere DATABASE_URL): solo parsea
 *   archivos estáticos (sitemap.ts, canonical-paths.json, robots.ts,
 *   submit-indexnow.mjs, app/(public) y sus page.tsx) y reporta inconsistencias.
 *
 * PROBES:
 *   1. canonical-paths.json vs app/sitemap.ts PUBLIC_ROUTES (DRY).
 *   2. canonical-paths.json vs app/(public) (existencia de page.tsx).
 *   3. THIN_POST_SLUGS en sitemap.ts presente (mitigación activa).
 *   4. Sin trailing slash inconsistente en los paths del catálogo.
 *   5. Sin /_next, /api, /intranet en el catálogo IndexNow.
 *   6. Techo INDEXNOW_SAFETY_CAP > sitemap_observed_count.
 *   7. robots.ts bloquea rutas privadas esperadas (/intranet/, /api/).
 *   8. Sin duplicados en canonical-paths.json.
 *   9. Prioridades válidas (0-1) y change_frequency válida.
 *   10. Landings locales coordinadas con rutas app/(public).
 *   11. IndexNow tiene techo duro y mensaje de ABORTADO.
 *
 * USO:
 *   node scripts/seo-indexability-audit.mjs            (salida Markdown a stdout)
 *   node scripts/seo-indexability-audit.mjs --write    (escribe auditoria-seo/audit-FECHA.md)
 *
 * EXIT CODES:
 *   0 = sin errores bloqueantes (advisories permitidos)
 *   1 = hay errores bloqueantes que deben corregirse antes de deploy
 */
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');

const TODAY = new Date().toISOString().split('T')[0];

/** Estructura de resultados del audit. */
const findings = {
  errors: [],   // bloqueantes (exit 1)
  warnings: [], // advisories
  infos: [],    // informativos
};

function err(category, msg, detail) {
  findings.errors.push({ category, msg, detail });
}
function warn(category, msg, detail) {
  findings.warnings.push({ category, msg, detail });
}
function info(category, msg, detail) {
  findings.infos.push({ category, msg, detail });
}

function readText(p) {
  return readFileSync(p, 'utf8');
}

function readJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ---------------------------------------------------------------------------
// PROBE 1 — canonical-paths.json ↔ app/sitemap.ts PUBLIC_ROUTES (DRY)
// ---------------------------------------------------------------------------
function probeSitemapDRY() {
  const canonical = readJSON(join(ROOT, 'data/seo/canonical-paths.json'));
  const sitemapSrc = readText(join(ROOT, 'lib/seo/sitemap.ts'));

  // PUBLIC_ROUTES debe estar derivado del JSON (post-refactor Jun 2026).
  const usesJson = sitemapSrc.includes('canonical-paths.json');
  if (!usesJson) {
    err('DRY', 'lib/seo/sitemap.ts no importa data/seo/canonical-paths.json', 'Debe derivar PUBLIC_ROUTES del JSON compartido para evitar desincronías.');
  } else {
    info('DRY', 'lib/seo/sitemap.ts importa canonical-paths.json como fuente única.', null);
  }

  // IndexNow script también debe consumir el JSON.
  const idxSrc = readText(join(ROOT, 'scripts/submit-indexnow.mjs'));
  const idxUsesJson = idxSrc.includes('canonical-paths.json');
  if (!idxUsesJson) {
    err('DRY', 'submit-indexnow.mjs no importa canonical-paths.json', 'Debe derivar el catálogo del JSON compartido.');
  } else {
    info('DRY', 'submit-indexnow.mjs usa canonical-paths.json.', null);
  }

  // Techo de seguridad > sitemap observado.
  if (canonical.indexnow_safety_cap <= canonical.sitemap_observed_count) {
    err('Techo', `indexnow_safety_cap (${canonical.indexnow_safety_cap}) <= sitemap_observed_count (${canonical.sitemap_observed_count})`, 'El techo de seguridad debe ser > sitemap observado para permitir un margen.');
  } else {
    info('Techo', `indexnow_safety_cap=${canonical.indexnow_safety_cap}, sitemap_observed=${canonical.sitemap_observed_count}`, null);
  }

  return canonical;
}

// ---------------------------------------------------------------------------
// PROBE 2 — canonical-paths.json ↔ app/(public) existencia de page.tsx
// ---------------------------------------------------------------------------
function probeStaticPagesExist(canonical) {
  const publicDir = join(ROOT, 'app/(public)');
  // Por cada path del JSON, debe existir app/(public)/<path>/page.tsx
  // (salvo el root que es app/(public)/page.tsx).
  // En Windows y unix, los segmentos corresponden a directorios.
  for (const r of canonical.static_routes) {
    const p = r.path;
    let target;
    if (p === '/') {
      target = join(publicDir, 'page.tsx');
    } else {
      const segs = p.replace(/^\//, '').split('/');
      target = join(publicDir, ...segs, 'page.tsx');
      // Algunas rutas son dinámicas con [slug]: la página está en
      // app/(public)/servicios-juridicos/[slug]/page.tsx
      if (!existsSync(target)) {
        // Intenta con [slug]
        const segsWithSlug = [...segs.slice(0, -1), '[slug]', 'page.tsx'];
        target = join(publicDir, ...segsWithSlug);
      }
    }
    if (!existsSync(target)) {
      warn('Página', `No existe page.tsx para la ruta estática '${p}' ( buscado en app/(public)${p}/page.tsx )`, 'Si la ruta es generada por un [slug], omite este aviso; si no, la URL será 404.');
    }
  }
  const counted = canonical.static_routes.length;
  info('Catálogo', `${counted} rutas estáticas en data/seo/canonical-paths.json`, null);
}

// ---------------------------------------------------------------------------
// PROBE 3 — trailing slash consistency
// ---------------------------------------------------------------------------
function probeTrailingSlash(canonical) {
  for (const r of canonical.static_routes) {
    if (r.path !== '/' && r.path.endsWith('/')) {
      err('TrailingSlash', `Path '${r.path}' tiene trailing slash no canónico`, 'Solo la raíz "/" debe tenerlo.');
    }
  }
}

// ---------------------------------------------------------------------------
// PROBE 4 — sin rutas privadas en el catálogo IndexNow
// ---------------------------------------------------------------------------
const PRIVATE_PREFIXES = ['/intranet', '/admin', '/api', '/calculadora', '/casos', '/cp', '/delitos', '/atajos', '/preview', '/login', '/_next', '/_error', '/404', '/500'];

function probeNoPrivateInCatalog(canonical) {
  for (const r of canonical.static_routes) {
    for (const prefix of PRIVATE_PREFIXES) {
      if (r.path === prefix || r.path.startsWith(prefix + '/')) {
        err('RutaPrivada', `Ruta privada en canonical-paths.json: '${r.path}' (prefijo '${prefix}')`, 'Las rutas privadas nunca deben aparecer en el catálogo IndexNow ni en el sitemap estático.');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PROBE 5 — robots.ts bloquea rutas privadas esperadas
// ---------------------------------------------------------------------------
function probeRobots() {
  const robotsSrc = readText(join(ROOT, 'app/robots.ts'));
  const expected = ['/intranet/', '/api/'];
  for (const e of expected) {
    if (!robotsSrc.includes(e)) {
      err('Robots', `robots.ts no bloquea '${e}'`, 'Cualquier debilitamiento del bloqueo puede filtrar URLs privadas en el índice.');
    }
  }
  if (robotsSrc.includes("site.url") && robotsSrc.includes("sitemap")) {
    info('Robots', 'robots.ts referencia el sitemap dinámicamente.', null);
  }
}

// ---------------------------------------------------------------------------
// PROBE 6 — no existen slugs duplicados en el catálogo
// ---------------------------------------------------------------------------
function probeNoDuplicates(canonical) {
  const seen = new Set();
  for (const r of canonical.static_routes) {
    if (seen.has(r.path)) {
      err('Duplicado', `Path duplicado en canonical-paths.json: '${r.path}'`, 'Quita el duplicado; si no, será censado dos veces.');
    }
    seen.add(r.path);
  }
}

// ---------------------------------------------------------------------------
// PROBE 7 — orden de prioridades válido en el catálogo
// ---------------------------------------------------------------------------
function probePriorities(canonical) {
  for (const r of canonical.static_routes) {
    if (typeof r.priority !== 'number' || r.priority < 0 || r.priority > 1) {
      err('Prioridad', `Prioridad inválida en '${r.path}': ${JSON.stringify(r.priority)}`, 'Debe ser un número entre 0 y 1.');
    }
    if (typeof r.change_frequency !== 'string' || !['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(r.change_frequency)) {
      err('Freq', `change_frequency inválido en '${r.path}': '${r.change_frequency}'`, 'Valores válidos: always,hourly,daily,weekly,monthly,yearly,never.');
    }
  }
}

// ---------------------------------------------------------------------------
// PROBE 8 — THIN_POST_SLUGS en sitemap.ts no vacío
// ---------------------------------------------------------------------------
function probeThinSlugs() {
  const sitemapSrc = readText(join(ROOT, 'lib/seo/sitemap.ts'));
  if (!sitemapSrc.includes('THIN_POST_SLUGS')) {
    err('Thin', 'No se encuentra THIN_POST_SLUGS en lib/seo/sitemap.ts', 'Mitigación activa para posts thin/plantilla (AGENTS.md §7).');
  }
  // Cuenta aproximada de slugs en el Set.
  const m = sitemapSrc.match(/THIN_POST_SLUGS\s*=\s*new Set\(\s*\[([\s\S]*?)\]\s*\)/);
  if (m) {
    const slugs = m[1].split(/\n/).map((s) => s.trim().replace(/^'|',?\s*$/g, '')).filter((s) => s && !s.startsWith('//'));
    info('Thin', `THIN_POST_SLUGS declara ~${slugs.length} slugs (mitigación activa).`, null);
  }
}

// ---------------------------------------------------------------------------
// PROBE 9 — landings locales existen en app/(public)/abogados-en-{slug}
// ---------------------------------------------------------------------------
function probeLandingsCoord() {
  const landingsSrc = readText(join(ROOT, 'data/landings-locales.ts'));
  // Slug de la landing = primera ocurrencia de `slug: '...'` de cada bloque
  // `landingsLocales: LandingLocal[] = [`. Para no captar slugs anidados de
  // `postsRelacionados`, recortamos por el patrón `\n    slug: '` (4 espacios)
  // que es la indentación del campo `slug` de la landing dentro del array.
  const matches = [...landingsSrc.matchAll(/\n\s{4}slug:\s*'([^']+)'/g)];
  const slugs = matches.map((m) => m[1]);
  for (const s of slugs) {
    const p = join(ROOT, 'app/(public)', `abogados-en-${s}`, 'page.tsx');
    if (!existsSync(p)) {
      warn('Landing', `Landing '${s}' declarada en data/landings-locales.ts pero no existe app/(public)/abogados-en-${s}/page.tsx`, null);
    }
  }
  info('Landings', `Se encontraron ${slugs.length} landings locales declaradas.`, null);
}

// ---------------------------------------------------------------------------
// PROBE 10 — IndexNow tiene techo por defecto y dry-run en CI
// ---------------------------------------------------------------------------
function probeIndexNowSafety() {
  const idxSrc = readText(join(ROOT, 'scripts/submit-indexnow.mjs'));
  if (!idxSrc.includes('INDEXNOW_SAFETY_CAP')) {
    err('IndexNow', 'submit-indexnow.mjs no define INDEXNOW_SAFETY_CAP', 'Debe haber un techo duro (abortar si superado).');
  }
  if (!idxSrc.includes('ABORTADO')) {
    err('IndexNow', 'submit-indexnow.mjs no contiene mensaje de ABORTADO', 'La validación dura debe abortar con código 1 si se supera el techo.');
  }
  if (!idxSrc.includes("ENABLE_INDEXNOW_SUBMIT !== 'true'")) {
    warn('IndexNow', 'IndexNow no fuerza dry-run cuando falta ENABLE_INDEXNOW_SUBMIT', 'En CI debe ser dry-run por defecto.');
  }
  if (idxSrc.includes("readdirSync(postsDir)")) {
    warn('IndexNow', 'IndexNow lee data/blog/posts/ (posts no viven ahí desde migración a DB)', 'Quita esa rama; los posts se descubren vía sitemap.');
  }
}

// ---------------------------------------------------------------------------
// Reporte Markdown
// ---------------------------------------------------------------------------
function renderReport() {
  const lines = [];
  lines.push(`# Auditoría SEO de Indexabilidad — ${TODAY}`);
  lines.push('');
  lines.push('> Generada por `scripts/seo-indexability-audit.mjs`. Chequeo estático del');
  lines.push('> repositorio (no usa red ni DB). Basada en los hallazgos reales del');
  lines.push('> informe SEO del 2026-06-23 (Bing Webmaster Tools + GSC):');
  lines.push('> 183 URLs "Descubiertas: actualmente sin indexar", 1 URL indexada,');
  lines.push('> 202 URLs en sitemap, 9.466 URLs enviadas por IndexNow con 0 crawled.');
  lines.push('');
  lines.push('## Resumen');
  lines.push('');
  lines.push(`- **Errores bloqueantes:** ${findings.errors.length}`);
  lines.push(`- **Avisos (warnings):** ${findings.warnings.length}`);
  lines.push(`- **Informativos:** ${findings.infos.length}`);
  lines.push('');

  const section = (title, list) => {
    if (list.length === 0) return [];
    const out = [`## ${title} (${list.length})`, ''];
    for (const f of list) {
      out.push(`### [${f.category}] ${f.msg}`);
      if (f.detail) out.push('', f.detail);
      out.push('');
    }
    return out;
  };

  lines.push(...section('Errores bloqueantes', findings.errors));
  lines.push(...section('Avisos', findings.warnings));
  lines.push(...section('Informativos', findings.infos));

  lines.push('## Próximos pasos manuales (no automatizables desde el código)');
  lines.push('');
  lines.push('- Solicitar re-rastreo selectivo en GSC de las 30 URLs con más impresiones (no las 183).');
  lines.push('- Crear/verificar Google Business Profile con NAP consistente (`lib/site.ts`).');
  lines.push('- Link building local: directorios jurídicos, cámaras, medios hondureños.');
  lines.push('- Reforzar titles/meta de DB-driven blog posts vía `npm run blog:review --aplicar-ia`');
  lines.push('  (requiere DEEPSEEK_API_KEY; guardias automáticas activas por AGENTS.md §R17).');
  lines.push('- Ampliar thin posts vía `npm run blog:verify-fix:aplicar` (800-1000 palabras,');
  lines.push('  sin inventar datos legales).');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`═══════════════════════════════════════════════════════════`);
console.log(` Auditoría SEO de indexabilidad — ${TODAY}`);
console.log(`═══════════════════════════════════════════════════════════`);
console.log('');

const canonical = probeSitemapDRY();
probeStaticPagesExist(canonical);
probeTrailingSlash(canonical);
probeNoPrivateInCatalog(canonical);
probeRobots();
probeNoDuplicates(canonical);
probePriorities(canonical);
probeThinSlugs();
probeLandingsCoord();
probeIndexNowSafety();

const report = renderReport();
if (shouldWrite) {
  const outDir = join(ROOT, 'auditoria-seo');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `audit-${TODAY}.md`);
  writeFileSync(outFile, report, 'utf8');
  console.log(`✅ Informe escrito en ${relative(ROOT, outFile)}`);
} else {
  console.log(report);
}

console.log('───────────────────────────────────────────────────────');
console.log(`Errores: ${findings.errors.length}  Avisos: ${findings.warnings.length}  Infos: ${findings.infos.length}`);
if (findings.errors.length > 0) {
  console.log('⛔ Auditoría con errores bloqueantes. Corrige antes de deploy.');
  process.exit(1);
}
console.log('✅ Auditoría sin errores bloqueantes.');