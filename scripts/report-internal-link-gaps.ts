/**
 * Informe determinista de brechas de enlazado interno.
 *
 * Lee el inventario versionado `docs/seo/current/internal-link-audit.csv` y
 * produce un informe accionable para los artículos con status ACTION_REQUIRED,
 * indicando por cada uno:
 *   - slug / URL;
 *   - problema (razón de la resolución del cluster);
 *   - enlace de servicio esperado (BLOG_TO_SERVICE por categoría);
 *   - enlaces de cluster recomendados (hermanos de la misma categoría en el
 *     inventario, sin inventar URLs);
 *   - fuentes ausentes (official_sources = 0);
 *   - acción necesaria.
 *
 * NO modifica datos productivos: solo genera un artefacto de trazabilidad.
 * Incluye metadata común de generación (AGENTS.md §4.13).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { BLOG_TO_SERVICE } from '@/lib/internal-links';

const ROOT = process.cwd();
const SOURCE_CSV = join(ROOT, 'docs/seo/current/internal-link-audit.csv');
const OUTPUT_CSV = join(ROOT, 'docs/seo/current/internal-link-action-report.csv');

/** Parser CSV mínimo que respeta comillas dobles y saltos internos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell); cell = '';
    } else if (char === '\n') {
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += char;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

interface AuditRow {
  url: string;
  category: string;
  slug: string;
  serviceLink: string;
  clusterLinks: string;
  officialSources: string;
  action: string;
  status: string;
  reason: string;
}

const rows = parseCsv(readFileSync(SOURCE_CSV, 'utf8'));
const [header, ...data] = rows;
const col = (name: string) => header.indexOf(name);

function toAuditRow(cells: string[]): AuditRow {
  const url = cells[col('url')];
  const [, category, slug] = url.match(/^\/blog\/([^/]+)\/([^/]+)$/) ?? [];
  return {
    url,
    category: category ?? '',
    slug: slug ?? url.replace(/^\/blog\//, ''),
    serviceLink: cells[col('service_link')],
    clusterLinks: cells[col('cluster_links')],
    officialSources: cells[col('official_sources')],
    action: cells[col('action')],
    status: cells[col('status')],
    reason: cells[col('resolution_reason')] ?? '',
  };
}

const audit = data.map(toAuditRow);
const actionRequired = audit.filter((r) => r.status === 'ACTION_REQUIRED');

// Cluster recomendado: hermanos de la misma categoría con status PASS.
const siblingsByCategory = new Map<string, string[]>();
for (const r of audit) {
  if (r.status === 'PASS' && r.category) {
    const list = siblingsByCategory.get(r.category) ?? [];
    list.push(r.slug);
    siblingsByCategory.set(r.category, list);
  }
}

const GENERATED_AT = new Date().toISOString();
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const ENVIRONMENT = process.env.VERCEL_ENV || process.env.APP_ENV || 'local';
const GIT_HEAD = (() => {
  try {
    return require('child_process')
      .execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
})();

const lines: string[] = [];
lines.push('generated_at,' + GENERATED_AT);
lines.push('timezone,' + TIMEZONE);
lines.push('environment,' + ENVIRONMENT);
lines.push(`source,${SOURCE_CSV.replace(ROOT, '.')}`);
lines.push(`generator,seo:internal-link-gap-report`);
lines.push(`row_count,${actionRequired.length}`);
lines.push(`filters,status=ACTION_REQUIRED`);
lines.push(`commit,${GIT_HEAD ?? 'no-git'}`);
lines.push('');
lines.push('url,slug,category,problema,service_link_esperado,cluster_links_recomendados,official_sources_ausentes,accion');
for (const r of actionRequired) {
  const service = r.category ? BLOG_TO_SERVICE[r.category] : undefined;
  const cluster = (siblingsByCategory.get(r.category) ?? []).slice(0, 2);
  lines.push([
    r.url,
    r.slug,
    r.category,
    r.reason,
    service ? `${service.name} (${service.href})` : '—',
    cluster.length ? cluster.join(' | ') : '—',
    r.officialSources === '0' ? 'si' : 'no',
    'Revisar enlaces contextuales, añadir servicio y fuentes oficiales; no añadir landings noindex.',
  ].join(','));
}

mkdirSync(dirname(OUTPUT_CSV), { recursive: true });
writeFileSync(OUTPUT_CSV, `${lines.join('\n')}\n`, 'utf8');

console.log(`Internal link gap report → ${OUTPUT_CSV.replace(ROOT, '.')}`);
console.log(`rows = ${actionRequired.length}`);
