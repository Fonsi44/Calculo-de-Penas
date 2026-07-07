/**
 * Validador SEO — Auditoría Ahrefs (Fases 1 y 6).
 *
 * Lee los CSV de `ahrefs/` (UTF-16LE/TSV export de Ahrefs), autodetecta el tipo
 * por columnas (no por nombre), y reporta incidencias técnicas:
 *   - URLs 4XX/404 reportadas.
 *   - Enlaces internos a 3XX (origen → destino).
 *   - URLs noindex con señales contradictorias (meta noindex + HTTP header index).
 *   - URLs noindex presentes en el sitemap estático (canonical-paths.json).
 *   - Presencia de `/intranet/admin` en componentes HTML públicos.
 *   - (DB) Titles/meta_title con marca "Pineda y Asociados" duplicada (2+ veces).
 *   - (DB) Titles/meta_title con placeholders editoriales sin reemplazar
 *     (`[Tu Empresa]` y similares).
 *   - (DB) Posts publicados sin title o sin meta_description/description.
 *
 * Códigos de salida:
 *   0 = sin incidencias bloqueantes.
 *   1 = incidencias bloqueantes (`/intranet/admin` en HTML/componentes públicos,
 *       titles con marca duplicada, placeholders sin reemplazar, o metadata
 *       crítica ausente en posts publicados).
 *
 * Uso:
 *   npm run seo:ahrefs
 *   node scripts/seo-ahrefs-audit.mjs            # reporta + valida
 *   node scripts/seo-ahrefs-audit.mjs --quiet    # solo errores bloqueantes
 *   node scripts/seo-ahrefs-audit.mjs --no-db    # omite chequeos DB
 *
 * Notas:
 *   - NO usa `|| true`: los fallos se reportan y elevan exit 1.
 *   - Los chequeos DB requieren DATABASE_URL. Si no está disponible, se omiten
 *     con un aviso (no fallan). Usa --no-db para saltarlos explícitamente.
 *   - Los enlaces a 4XX/3XX se reportan desde los CSV de Ahrefs (históricos);
 *     para validar/reescribir en origen usar
 *     `npx tsx scripts/fix-internal-redirects.ts`.
 *   - Para limpiar placeholders: `npx tsx scripts/fix-editorial-placeholders.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AHREFS_DIR = path.join(ROOT, 'ahrefs');
const CANONICAL_PATHS = path.join(ROOT, 'data', 'seo', 'canonical-paths.json');
const BASE_HOST_MATCH = /https?:\/\/[^/]+/;
const quiet = process.argv.includes('--quiet');
const skipDb = process.argv.includes('--no-db');

// ── Helpers de parsing ──────────────────────────────────────────────────────

/** Parsea un CSV de Ahrefs (UTF-16LE con BOM, TSV, comillas dobles). */
function parseAhrefsCSV(filePath) {
  const buf = fs.readFileSync(filePath);
  // Ahrefs exporta en UTF-16LE. Si la conversión directa produce basura, lo
  // leemos como latin1 y convertimos (fallback robusto).
  let text;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.toString('utf16le');
  } else {
    text = buf.toString('utf8');
  }
  const rows = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === '\n' && !inQuotes) {
      rows.push(cur);
      cur = '';
      continue;
    }
    if (ch === '\r') continue;
    cur += ch;
  }
  if (cur) rows.push(cur);
  const parsed = rows.map((r) => r.split('\t'));
  // Limpiar BOM + espacios del primer header.
  if (parsed[0] && parsed[0][0]) {
    parsed[0][0] = parsed[0][0].replace(/^\uFEFF/, '').replace(/^\s+/, '');
  }
  return parsed;
}

/** Carga un CSV como { headers, rows } eliminando filas vacías. */
function loadCSV(fileName) {
  const parsed = parseAhrefsCSV(path.join(AHREFS_DIR, fileName));
  const headers = parsed[0];
  const rows = parsed.slice(1).filter((r) => r.length === headers.length && r.some((c) => c.trim()));
  return { headers, rows };
}

/** Convierte URL absoluta del sitio a path relativo. */
function toRel(url) {
  if (!url) return url;
  return url.replace(BASE_HOST_MATCH, '').trim();
}

/** Detecta el tipo de CSV por sus columnas. */
function detectType(headers) {
  const h = headers.join('|').toLowerCase();
  // CSV de las Fases A–F (Ahrefs export 2026-07-07) — checks específicos ANTES
  // del genérico '4xx', porque title-too-long y meta-description también traen
  // HTTP status code + Depth + Is indexable page (matchearían 4xx si van antes).
  if (h.includes('title length') && h.includes('title patch')) return 'title-too-long';
  if (h.includes('meta description length') && h.includes('meta description patch')) return 'meta-description';
  if (h.includes('no. of href inlinks') && h.includes('referenced in sitemaps')) return 'orphan-page';
  if (h.includes('schema items') && h.includes('structured data issues')) return 'structured-data';
  if (h.includes('pages to submit') || (h.includes('is indexable page') && h.includes('submit to index'))) return 'pages-to-submit';
  // CSV de la Fase 1.
  if (h.includes('http status code') && h.includes('is indexable page') && h.includes('is noindex')) return 'noindex';
  if (h.includes('internal outlinks to 3xx')) return 'links-3xx';
  if (h.includes('internal outlinks nofollow')) return 'nofollow-out';
  if (h.includes('no. of inlinks dofollow') && h.includes('no. of inlinks nofollow')) return 'page-has-only';
  if (h.includes('http status code') && h.includes('depth') && h.includes('is indexable page')) return '4xx';
  return 'unknown';
}

/** Divide el contenido de una celda con múltiples URLs en array de paths. */
function splitUrlCell(cell) {
  if (!cell) return [];
  return cell
    .split(/,\s*/)
    .map((s) => toRel(s.trim()))
    .filter(Boolean);
}

// ── Verificaciones contra código fuente ─────────────────────────────────────

/**
 * Comprueba si `/intranet/admin` aparece en componentes HTML públicos.
 * Rutas consideradas públicas: app/(public)/, components/marketing/,
 * components/blog/, components/layout/ (compartidos).
 *
 * Exclusiones (falsos positivos):
 *   - Componentes condicionales a autenticación (el enlace solo se renderiza
 *     tras login, nunca llega al HTML público rastreable): se identifican por
 *     archivo. user-actions.tsx renderiza /intranet/admin solo si
 *     `user.rol === 'admin'` y solo se monta en app-shell/calculadora (privadas).
 */
const AUTH_CONDITIONAL_FILES = new Set([
  'components/layout/user-actions.tsx',
]);
function checkIntranetAdminInPublicHTML() {
  const findings = [];
  const scanDirs = [
    path.join(ROOT, 'app', '(public)'),
    path.join(ROOT, 'components', 'marketing'),
    path.join(ROOT, 'components', 'blog'),
    path.join(ROOT, 'components', 'layout'),
  ];
  const codeExt = /\.(tsx|ts|jsx|js)$/;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (codeExt.test(e.name)) {
        const relPath = path.relative(ROOT, full).replace(/\\/g, '/');
        if (AUTH_CONDITIONAL_FILES.has(relPath)) continue;
        const txt = fs.readFileSync(full, 'utf8');
        // Busca href con /intranet/admin en JSX/TS.
        const re = /href\s*=\s*[{"]\s*['"`]?([^'"`"}]*\/intranet\/admin[^'"`}]*)/g;
        let m;
        while ((m = re.exec(txt)) !== null) {
          const lineNo = txt.slice(0, m.index).split('\n').length;
          findings.push({ file: relPath, line: lineNo, href: m[1] });
        }
      }
    }
  }
  for (const d of scanDirs) walk(d);
  return findings;
}

/** Comprueba si las URLs noindex legales están en el sitemap estático. */
function checkNoindexInSitemap(noindexLegalPaths) {
  if (!fs.existsSync(CANONICAL_PATHS)) return { error: 'canonical-paths.json no encontrado' };
  const data = JSON.parse(fs.readFileSync(CANONICAL_PATHS, 'utf8'));
  const sitemapPaths = new Set((data.static_routes || []).map((r) => r.path));
  const present = noindexLegalPaths.filter((p) => sitemapPaths.has(p));
  return { present, total: sitemapPaths.size };
}

// ── Reporte principal ───────────────────────────────────────────────────────

function log(...args) {
  if (!quiet) console.log(...args);
}

/**
 * Chequeos de metadata contra la DB (blog_posts).
 * Requiere DATABASE_URL. Devuelve { skipped } si no hay acceso o --no-db.
 */
async function checkDbMetadata() {
  if (skipDb) return { skipped: 'Chequeos DB omitidos (--no-db).' };
  // Carga .env si está disponible (dotenv). Fallback silencioso si no existe.
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch {
    /* dotenv es dependencia del proyecto; si falla, seguimos con env del proceso */
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('placeholder')) {
    return { skipped: 'DATABASE_URL no configurada; chequeos DB omitidos.' };
  }
  let neon;
  try {
    ({ neon } = await import('@neondatabase/serverless'));
  } catch {
    return { skipped: 'Módulo @neondatabase/serverless no disponible; chequeos DB omitidos.' };
  }
  const sql = neon(dbUrl);

  const posts = await sql`
    SELECT slug, title, meta_title, meta_description, description, published
    FROM blog_posts
    WHERE published = true
    ORDER BY slug
  `;

  const BRAND_RE = /pineda y asociados/gi;
  const PLACEHOLDER_RE = /\[?\s*(tu\s+empresa|nombre\s+del\s+bufete|tu\s+bufete)\s*\]?/i;

  const brandDup = [];
  const placeholders = [];
  const missingMeta = [];

  for (const p of posts) {
    // Marca duplicada (2+ ocurrencias) en title o meta_title.
    for (const campo of ['title', 'meta_title']) {
      const v = p[campo] ?? '';
      const m = v.match(BRAND_RE);
      if (m && m.length >= 2) brandDup.push({ slug: p.slug, campo, valor: v });
    }
    // Placeholders editoriales en title o meta_title.
    for (const campo of ['title', 'meta_title']) {
      const v = p[campo] ?? '';
      if (PLACEHOLDER_RE.test(v)) placeholders.push({ slug: p.slug, campo, valor: v });
    }
    // Metadata crítica ausente en posts publicados.
    if (!(p.title ?? '').trim()) missingMeta.push({ slug: p.slug, campo: 'title' });
    const desc = (p.meta_description ?? '').trim() || (p.description ?? '').trim();
    if (!desc) missingMeta.push({ slug: p.slug, campo: 'meta_description' });
  }

  return { brandDup, placeholders, missingMeta, total: posts.length };
}

/**
 * Analiza los CSV de las Fases A–F (title-too-long, meta-description ×2,
 * orphan-page, structured-data) y reporta incidencias informativas.
 *
 * Estos chequeos son WARNINGS (no bloqueantes): reportan lo que Ahrefs
 * flaggeó en el último export. Las correcciones se aplican vía scripts DB
 * (fix-long-titles, fix-long-metas) y edición de código (metas, schema).
 * Los bloqueantes (placeholder, marca duplicada, metadata ausente) ya están
 * cubiertos en la sección 6.
 */
function analyzeCsvFasesAF(byType) {
  const reports = [];

  // Fase A: titles >70 (CSV title-too-long, indexables).
  if (byType['title-too-long']) {
    let count = 0;
    for (const f of byType['title-too-long']) {
      const { headers, rows } = loadCSV(f);
      const iIdx = headers.indexOf('Is indexable page');
      const iLen = headers.indexOf('Title length');
      for (const r of rows) {
        if (iIdx >= 0 && r[iIdx] === 'true') {
          const len = parseInt(r[iLen] || '0', 10);
          if (len > 70) count++;
        }
      }
    }
    reports.push(count > 0
      ? `⚠️  Fase A: ${count} URL(s) indexables con title >70 chars (CSV title-too-long). Corregir con blog:fix-titles.`
      : '✅ Fase A: sin titles >70 chars en CSV title-too-long.');
  }

  // Fase B+C: metas cortas (<110) y largas (>160) (CSV meta-description ×2).
  if (byType['meta-description']) {
    let cortas = 0, largas = 0, htmlEnMeta = 0, truncadas = 0;
    for (const f of byType['meta-description']) {
      const { headers, rows } = loadCSV(f);
      const iIdx = headers.indexOf('Is indexable page');
      const iLen = headers.indexOf('Meta description length');
      const iMeta = headers.indexOf('Meta description');
      for (const r of rows) {
        if (iIdx >= 0 && r[iIdx] !== 'true') continue;
        const len = parseInt(r[iLen] || '0', 10);
        if (len > 0 && len < 110) cortas++;
        if (len > 160) largas++;
        const meta = r[iMeta] || '';
        if (/<[a-z!/]/i.test(meta)) htmlEnMeta++;
        // Truncamiento: palabra cortada seguida de "Consulta confidencial" o CTA pegado.
        if (/Consulta confidencial/i.test(meta) && /[a-zñ] Consulta/i.test(meta)) truncadas++;
      }
    }
    if (cortas > 0) reports.push(`⚠️  Fase B: ${cortas} meta(s) cortas (<110 chars). Ampliar en data/blog/categories.ts o DB.`);
    else reports.push('✅ Fase B: sin metas cortas (<110) en CSV.');
    if (largas > 0) reports.push(`⚠️  Fase C: ${largas} meta(s) largas (>160 chars). Corregir con blog:fix-metas o helper buildServiceMetaDescription.`);
    else reports.push('✅ Fase C: sin metas largas (>160) en CSV.');
    if (htmlEnMeta > 0) reports.push(`⚠️  Fase C: ${htmlEnMeta} meta(s) con HTML crudo (<strong>, <a>). Usar buildServiceMetaDescription.`);
    if (truncadas > 0) reports.push(`⚠️  Fase C: ${truncadas} meta(s) truncadas (patrón "Consulta confidencial" pegado). Reescribir helper.`);
  }

  // Fase D: orphan pages indexables en sitemap con 0 inlinks.
  if (byType['orphan-page']) {
    const orphans = [];
    for (const f of byType['orphan-page']) {
      const { headers, rows } = loadCSV(f);
      const iUrl = headers.indexOf('URL');
      const iInlinks = headers.indexOf('No. of href inlinks');
      const iSitemap = headers.indexOf('Referenced in sitemaps');
      for (const r of rows) {
        const inlinks = parseInt(r[iInlinks] || '0', 10);
        const inSitemap = (r[iSitemap] || '').includes('sitemap');
        if (inlinks === 0 && inSitemap) orphans.push(toRel(r[iUrl]));
      }
    }
    if (orphans.length > 0) {
      reports.push(`⚠️  Fase D: ${orphans.length} orphan page(s) en sitemap con 0 href inlinks:`);
      for (const o of orphans) reports.push(`       → ${o}`);
    } else {
      reports.push('✅ Fase D: sin orphan pages en CSV.');
    }
  }

  // Fase F: structured data con errores de validación.
  if (byType['structured-data']) {
    let withIssues = 0, aggregateRating = 0;
    for (const f of byType['structured-data']) {
      const { headers, rows } = loadCSV(f);
      const iIssue = headers.indexOf('Structured data issues');
      const iSchema = headers.indexOf('Schema items');
      const iIdx = headers.indexOf('Is indexable page');
      for (const r of rows) {
        if (iIdx >= 0 && r[iIdx] !== 'true') continue;
        if ((r[iIssue] || '').trim()) withIssues++;
        if ((r[iSchema] || '').includes('AggregateRating')) aggregateRating++;
      }
    }
    if (withIssues > 0) reports.push(`⚠️  Fase F: ${withIssues} URL(s) indexables con errores de structured data. Validar con node scripts/validate-jsonld.mjs.`);
    else reports.push('✅ Fase F: sin errores de structured data en CSV.');
    if (aggregateRating > 0) reports.push(`⚠️  Fase F: ${aggregateRating} URL(s) con AggregateRating (política Google self-serving reviews).`);
  }

  return { reports };
}

async function main() {
  if (!fs.existsSync(AHREFS_DIR)) {
    console.error(`❌ No se encontró la carpeta ahrefs/ en ${ROOT}`);
    process.exit(1);
  }
  const csvFiles = fs.readdirSync(AHREFS_DIR).filter((f) => f.endsWith('.csv'));
  if (csvFiles.length === 0) {
    console.error('❌ No hay CSV en ahrefs/. Exporta los reportes de Ahrefs primero.');
    process.exit(1);
  }

  // Clasificar CSVs por tipo.
  const byType = {};
  for (const f of csvFiles) {
    const { headers } = loadCSV(f);
    const type = detectType(headers);
    (byType[type] ||= []).push(f);
  }

  log('═══════════════════════════════════════════════════════════');
  log('  AUDITORÍA SEO AHREFS — FASE 1');
  log('═══════════════════════════════════════════════════════════');
  log(`CSVs detectados (${csvFiles.length}):`);
  for (const [type, files] of Object.entries(byType)) {
    log(`  ${type}: ${files.length} archivo(s)`);
  }
  log('');

  let bloqueantes = 0;

  // 1. URLs 4XX/404.
  log('── 1. URLs 4XX/404 reportadas ──');
  const urls4xx = [];
  if (byType['4xx']) {
    for (const f of byType['4xx']) {
      const { headers, rows } = loadCSV(f);
      const iUrl = headers.indexOf('URL');
      const iStatus = headers.indexOf('HTTP status code');
      const iInlinks = headers.indexOf('No. of all inlinks');
      for (const r of rows) {
        const u = toRel(r[iUrl]);
        urls4xx.push({ url: u, status: r[iStatus], inlinks: r[iInlinks] });
        log(`  ${r[iStatus]}  inlinks=${r[iInlinks]}  ${u}`);
      }
    }
  }
  log(`  Total 4XX: ${urls4xx.length}`);
  log('');

  // 2. Enlaces internos a 3XX (destinos únicos).
  log('── 2. Enlaces internos a 3XX (destinos) ──');
  const dest3xx = new Set();
  if (byType['links-3xx']) {
    for (const f of byType['links-3xx']) {
      const { headers, rows } = loadCSV(f);
      const iDst = headers.indexOf('Internal outlinks to 3xx');
      for (const r of rows) {
        for (const u of splitUrlCell(r[iDst])) dest3xx.add(u);
      }
    }
  }
  const dest3xxSorted = [...dest3xx].sort();
  for (const u of dest3xxSorted) log(`  → ${u}`);
  log(`  Total destinos 3XX únicos: ${dest3xxSorted.length}`);
  log('');

  // 3. URLs noindex legales + señales contradictorias meta vs header.
  log('── 3. noindex con señales contradictorias (meta noindex + header index) ──');
  const conflictivos = [];
  const noindexLegalPaths = [];
  if (byType['noindex']) {
    for (const f of byType['noindex']) {
      const { headers, rows } = loadCSV(f);
      const iUrl = headers.indexOf('URL');
      const iMeta = headers.indexOf('Meta robots');
      const iHdr = headers.indexOf('Robots information in HTTP headers');
      for (const r of rows) {
        const u = toRel(r[iUrl]);
        const meta = (r[iMeta] || '').toLowerCase();
        const hdr = (r[iHdr] || '').toLowerCase();
        // Legales: path sin query en lista conocida.
        const LEGAL = ['/terminos', '/aviso-legal', '/politica-privacidad', '/politica-cookies', '/politica-editorial', '/disclaimer'];
        if (LEGAL.includes(u)) noindexLegalPaths.push(u);
        if (meta.includes('noindex') && hdr.includes('index') && !hdr.includes('noindex')) {
          conflictivos.push({ url: u, meta: r[iMeta], header: r[iHdr] });
        }
      }
    }
  }
  for (const c of conflictivos) log(`  ${c.url}\n     meta="${c.meta}" header="${c.header}"`);
  log(`  Total conflictivos: ${conflictivos.length}`);
  log('');

  // 4. noindex en sitemap.
  log('── 4. URLs noindex legales en sitemap estático ──');
  const sitemapCheck = checkNoindexInSitemap(noindexLegalPaths);
  if (sitemapCheck.error) {
    log(`  ⚠️  ${sitemapCheck.error}`);
  } else {
    if (sitemapCheck.present.length === 0) {
      log('  ✅ Ninguna página legal noindex en sitemap.');
    } else {
      for (const p of sitemapCheck.present) log(`  ❌ En sitemap: ${p}`);
    }
    log(`  (Sitemap estático: ${sitemapCheck.total} rutas)`);
  }
  log('');

  // 5. /intranet/admin en HTML público.
  log('── 5. /intranet/admin en componentes HTML públicos ──');
  const intranetFindings = checkIntranetAdminInPublicHTML();
  if (intranetFindings.length === 0) {
    log('  ✅ No hay enlaces a /intranet/admin en componentes públicos.');
  } else {
    for (const fnd of intranetFindings) log(`  ❌ ${fnd.file}:${fnd.line}  href="${fnd.href}"`);
  }
  log('');

  // 6. Chequeos DB (titles duplicados de marca, placeholders, metadata crítica).
  const dbFindings = await checkDbMetadata();
  log('── 6. Metadata de posts (DB): marca duplicada, placeholders, metadata crítica ──');
  if (dbFindings.skipped) {
    log(`  ⚠️  ${dbFindings.skipped}`);
  } else {
    if (dbFindings.brandDup.length === 0) {
      log('  ✅ Sin titles/meta_title con marca duplicada.');
    } else {
      for (const f of dbFindings.brandDup) log(`  ❌ Marca duplicada: ${f.slug} [${f.campo}]: ${f.valor}`);
    }
    if (dbFindings.placeholders.length === 0) {
      log('  ✅ Sin placeholders editoriales ([Tu Empresa] etc.).');
    } else {
      for (const f of dbFindings.placeholders) log(`  ❌ Placeholder: ${f.slug} [${f.campo}]: ${f.valor}`);
    }
    if (dbFindings.missingMeta.length === 0) {
      log('  ✅ Todos los posts publicados tienen title y meta description.');
    } else {
      for (const f of dbFindings.missingMeta) log(`  ❌ Metadata ausente: ${f.slug} [sin ${f.campo}]`);
    }
  }
  log('');

  // ── 7. CSV Fases A–F: titles largos, metas, orphans, structured data ──
  log('── 7. CSV Fases A–F (titles, metas, orphans, structured data) ──');
  const csvFindings = analyzeCsvFasesAF(byType);
  if (csvFindings.reports.length === 0) {
    log('  ℹ️  No hay CSV de las Fases A–F (title-too-long, meta-description, orphan-page, structured-data).');
  } else {
    for (const r of csvFindings.reports) log(`  ${r}`);
  }
  log('');

  // ── Veredicto ──
  log('═══════════════════════════════════════════════════════════');
  log('  VEREDICTO');
  log('═══════════════════════════════════════════════════════════');

  // Bloqueante si /intranet/admin aparece en componentes públicos hoy, o si la
  // DB tiene titles con marca duplicada, placeholders sin reemplazar, o metadata
  // crítica ausente en posts publicados.
  // Las URLs 4XX/3XX de los CSV son históricas (pueden ya estar corregidas en
  // código/DB); se reportan como informativo, no como bloqueante automático.
  if (intranetFindings.length > 0) {
    bloqueantes += intranetFindings.length;
    log(`❌ BLOQUEANTE: /intranet/admin presente en ${intranetFindings.length} componente(s) público(s).`);
  }
  if (!dbFindings.skipped) {
    const dbBloqueantes = dbFindings.brandDup.length + dbFindings.placeholders.length + dbFindings.missingMeta.length;
    if (dbBloqueantes > 0) {
      bloqueantes += dbBloqueantes;
      log(`❌ BLOQUEANTE (DB): ${dbFindings.brandDup.length} marca duplicada, ${dbFindings.placeholders.length} placeholder(s), ${dbFindings.missingMeta.length} metadata ausente.`);
    }
  }
  if (conflictivos.length > 0) {
    log(`⚠️  ${conflictivos.length} URL(s) noindex con header HTTP contradictorio (revisar next.config.ts headers()).`);
  }
  log(`ℹ️  ${urls4xx.length} URL(s) 4XX en CSV (validar origen con fix-internal-redirects.ts dry-run).`);
  log(`ℹ️  ${dest3xxSorted.length} destino(s) 3XX en CSV (validar con fix-internal-redirects.ts dry-run).`);
  // Resumen de warnings de las Fases A–F (informativo, no bloqueante).
  const csvWarnings = csvFindings.reports.filter((r) => r.startsWith('⚠️')).length;
  if (csvWarnings > 0) {
    log(`ℹ️  ${csvWarnings} warning(s) de Fases A–F (CSV Ahrefs). Ver sección 7 para detalle.`);
  }

  if (bloqueantes > 0) {
    log('');
    log(`❌ Auditoría FALLIDA: ${bloqueantes} incidencia(s) bloqueante(s).`);
    process.exit(1);
  }
  log('');
  log('✅ Auditoría OK (sin incidencias bloqueantes).');
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
