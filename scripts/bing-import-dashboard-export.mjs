#!/usr/bin/env node
/**
 * Bing WMT — Importar export manual del dashboard
 *
 * Lee CSV/JSON exportado manualmente desde el dashboard de Bing WMT
 * (Site Explorer, Site Scan) y genera un análisis accionable.
 *
 * Uso:
 *   1. Entrar a https://www.bing.com/webmasters/siteexplorer?siteUrl=https://www.pinedayasociadoshn.com/
 *   2. Exportar datos (CSV o copiar JSON)
 *   3. Guardar en data/bing/exports/site-explorer.csv o .json
 *   4. Ejecutar: npm run bing:import-dashboard
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const EXPORTS_DIR = resolve(ROOT, 'data', 'bing', 'exports');
const OUT_DIR = resolve(ROOT, 'data', 'bing');
const OUT_JSON = resolve(OUT_DIR, 'dashboard-analysis.json');
const OUT_MD = resolve(ROOT, 'docs', 'audits', 'bing-dashboard-analysis.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

function analyzeRows(rows) {
  const stats = { total: rows.length, warnings: 0, excluded: 0, errors: 0, notices: 0 };

  for (const row of rows) {
    const severity = (row.severity || row.type || row.status || '').toLowerCase();
    if (severity.includes('warning') || severity.includes('warn')) stats.warnings++;
    else if (severity.includes('excluded') || severity.includes('exclude')) stats.excluded++;
    else if (severity.includes('error') || severity.includes('err')) stats.errors++;
    else stats.notices++;
  }

  return stats;
}

function generateReport(stats, rows) {
  const now = new Date().toISOString();

  const json = {
    generatedAt: now,
    source: 'dashboard-export',
    stats,
    topWarnings: rows.filter(r => {
      const s = (r.severity || r.type || '').toLowerCase();
      return s.includes('warning') || s.includes('warn');
    }).slice(0, 20),
    topExcluded: rows.filter(r => {
      const s = (r.severity || r.type || '').toLowerCase();
      return s.includes('excluded');
    }).slice(0, 20),
    allRows: rows.slice(0, 200), // limitar tamaño
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(json, null, 2));
  console.log(`JSON guardado en ${OUT_JSON}`);

  // Generar Markdown
  let md = `# Bing WMT — Análisis de Dashboard\n\n`;
  md += `**Generado:** ${now}\n`;
  md += `**Fuente:** export manual del dashboard\n\n`;
  md += `## Resumen\n\n`;
  md += `| Tipo | Cantidad |\n`;
  md += `|------|----------|\n`;
  md += `| Total URLs analizadas | ${stats.total} |\n`;
  md += `| Warnings | ${stats.warnings} |\n`;
  md += `| Excluidas | ${stats.excluded} |\n`;
  md += `| Errores | ${stats.errors} |\n`;
  md += `| Notices | ${stats.notices} |\n`;

  if (stats.warnings > 0) {
    md += `\n## Warnings\n\n`;
    rows.filter(r => (r.severity || r.type || '').toLowerCase().includes('warning')).slice(0, 30).forEach(r => {
      md += `- **${r.url || r.address || '?'}**: ${r.message || r.description || r.issue || 'sin descripción'}\n`;
    });
  }

  if (stats.excluded > 0) {
    md += `\n## URLs Excluidas\n\n`;
    rows.filter(r => (r.severity || r.type || '').toLowerCase().includes('excluded')).slice(0, 30).forEach(r => {
      md += `- **${r.url || r.address || '?'}**: ${r.reason || r.message || 'sin motivo'}\n`;
    });
  }

  ensureDir(resolve(ROOT, 'docs', 'audits'));
  fs.writeFileSync(OUT_MD, md, 'utf-8');
  console.log(`Reporte guardado en ${OUT_MD}`);
}

async function main() {
  console.log('Bing WMT — Importar Dashboard Export\n');

  ensureDir(EXPORTS_DIR);

  const files = fs.existsSync(EXPORTS_DIR)
    ? fs.readdirSync(EXPORTS_DIR).filter(f => f.endsWith('.csv') || f.endsWith('.json'))
    : [];

  if (files.length === 0) {
    console.log('No se encontraron archivos en data/bing/exports/');
    console.log('');
    console.log('Para usar esta herramienta:');
    console.log('1. Entra a https://www.bing.com/webmasters/siteexplorer');
    console.log('2. Selecciona la propiedad del sitio');
    console.log('3. Exporta los datos de Site Explorer (CSV si es posible)');
    console.log('4. Guarda el archivo en: data/bing/exports/');
    console.log('5. Vuelve a ejecutar: npm run bing:import-dashboard');
    console.log('');
    console.log('Alternativa: también puedes exportar Site Scan (Site Scan → Export).');
    return;
  }

  for (const file of files) {
    console.log(`Procesando: ${file}`);
    const content = fs.readFileSync(resolve(EXPORTS_DIR, file), 'utf-8');

    let rows;
    if (file.endsWith('.csv')) {
      rows = parseCSV(content);
    } else {
      try { rows = JSON.parse(content); if (!Array.isArray(rows)) rows = rows.data || rows.rows || []; }
      catch { console.log(`  ❌ No se pudo parsear ${file}`); continue; }
    }

    if (rows.length === 0) {
      console.log(`  ⚠️ Sin datos en ${file}`);
      continue;
    }

    const stats = analyzeRows(rows);
    console.log(`  Total: ${stats.total} | Warnings: ${stats.warnings} | Excluidas: ${stats.excluded} | Errores: ${stats.errors}`);
    generateReport(stats, rows);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
