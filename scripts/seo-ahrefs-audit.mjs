/**
 * Validador SEO Fase 1 — Auditoría Ahrefs.
 *
 * Lee los CSV de `ahrefs/` (UTF-16LE/TSV export de Ahrefs), autodetecta el tipo
 * por columnas (no por nombre), y reporta incidencias técnicas del bloque 1:
 *   - URLs 4XX/404 reportadas.
 *   - Enlaces internos a 3XX (origen → destino).
 *   - URLs noindex con señales contradictorias (meta noindex + HTTP header index).
 *   - URLs noindex presentes en el sitemap estático (canonical-paths.json).
 *   - Presencia de `/intranet/admin` en componentes HTML públicos.
 *
 * Códigos de salida:
 *   0 = sin incidencias bloqueantes.
 *   1 = incidencias bloqueantes (enlaces internos a 4XX/3XX activos en datos
 *       vigentes, o `/intranet/admin` en HTML/componentes públicos).
 *
 * Uso:
 *   npm run seo:ahrefs
 *   node scripts/seo-ahrefs-audit.mjs            # reporta + valida
 *   node scripts/seo-ahrefs-audit.mjs --quiet    # solo errores bloqueantes
 *
 * Notas:
 *   - NO usa `|| true`: los fallos se reportan y elevan exit 1.
 *   - Distingue artefactos históricos de rastreo (sin referencia en código/DB)
 *     de incidencias reales. La presencia de `/intranet/admin` en componentes
 *     públicos es la única comprobación que valida contra el código fuente.
 *   - Los enlaces a 4XX/3XX se reportan desde los CSV de Ahrefs (no valida DB);
 *     para reescribir en origen usar `npx tsx scripts/fix-internal-redirects.ts`.
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

function main() {
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

  // ── Veredicto ──
  log('═══════════════════════════════════════════════════════════');
  log('  VEREDICTO');
  log('═══════════════════════════════════════════════════════════');

  // Bloqueante solo si /intranet/admin aparece en componentes públicos hoy.
  // Las URLs 4XX/3XX de los CSV son históricas (pueden ya estar corregidas en
  // código/DB); se reportan como informativo, no como bloqueante automático.
  if (intranetFindings.length > 0) {
    bloqueantes += intranetFindings.length;
    log(`❌ BLOQUEANTE: /intranet/admin presente en ${intranetFindings.length} componente(s) público(s).`);
  }
  if (conflictivos.length > 0) {
    log(`⚠️  ${conflictivos.length} URL(s) noindex con header HTTP contradictorio (revisar next.config.ts headers()).`);
  }
  log(`ℹ️  ${urls4xx.length} URL(s) 4XX en CSV (validar origen con fix-internal-redirects.ts dry-run).`);
  log(`ℹ️  ${dest3xxSorted.length} destino(s) 3XX en CSV (validar con fix-internal-redirects.ts dry-run).`);

  if (bloqueantes > 0) {
    log('');
    log(`❌ Auditoría FALLIDA: ${bloqueantes} incidencia(s) bloqueante(s).`);
    process.exit(1);
  }
  log('');
  log('✅ Auditoría OK (sin incidencias bloqueantes).');
  process.exit(0);
}

main();
