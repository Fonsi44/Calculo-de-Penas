import fs from 'fs';
import path from 'path';
import 'dotenv/config';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, ''));
}

async function main() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const bingDir = path.join(dataDir, 'bing');
  const csvPath = path.join(bingDir, 'bing-crawl-errors.csv');
  const outJsonPath = path.join(dataDir, 'seo', 'bing-crawl-errors-imported.json');
  const outMdPath = path.join(dataDir, 'seo', 'bing-crawl-errors-imported.md');

  if (!fs.existsSync(csvPath)) {
    console.log(`\n❌ No se encontró el archivo CSV de Bing en: ${csvPath}`);
    console.log(`\nPor favor, exporta los errores desde Bing Webmaster Tools:`);
    console.log(`1. Ve a Bing Webmaster Tools > SEO > Crawl Information`);
    console.log(`2. Exporta el reporte de errores (4xx, 5xx, etc) a formato CSV`);
    console.log(`3. Guarda el archivo como 'data/bing/bing-crawl-errors.csv'`);
    console.log(`4. Vuelve a ejecutar este script.\n`);
    process.exit(0);
  }

  console.log(`Analizando CSV de Bing en ${csvPath}...`);
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 2) {
    console.log('El archivo CSV parece estar vacío o no tiene el formato correcto.');
    process.exit(0);
  }

  const header = parseCSVLine(lines[0].toLowerCase());
  const urlIdx = header.findIndex(h => h.includes('url') || h.includes('page') || h.includes('path'));
  const statusIdx = header.findIndex(h => h.includes('status') || h.includes('code') || h.includes('error'));
  const dateIdx = header.findIndex(h => h.includes('date'));

  if (urlIdx === -1) {
    console.log('No se pudo detectar la columna de URL en el CSV.');
    process.exit(0);
  }

  const errors = [];
  const statusCounts: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const url = row[urlIdx];
    if (!url) continue;
    
    let pathName = url;
    try {
      if (url.startsWith('http')) {
        const u = new URL(url);
        pathName = u.pathname;
      }
    } catch(e) {}

    const statusCode = statusIdx !== -1 ? row[statusIdx] : 'Unknown';
    const date = dateIdx !== -1 ? row[dateIdx] : '';

    statusCounts[statusCode] = (statusCounts[statusCode] || 0) + 1;

    let recommendation = 'Revisar manualmente';
    if (pathName.includes('/intranet') || pathName.includes('/api') || pathName.includes('/admin')) {
      recommendation = 'Mantener bloqueada (Robots.txt ok)';
    } else if (pathName.match(/\.(jpg|png|js|css|webp|svg|pdf)$/i)) {
      recommendation = 'Ignorar bot noise (Assets)';
    } else if (pathName.includes('?')) {
      recommendation = 'Parámetro / Filtrar - Ignorar bot noise';
    } else if (pathName.endsWith('/') && pathName.length > 1) {
      recommendation = 'Redirigir 301 a sin trailing slash';
    } else {
      recommendation = 'Redirigir 301 o devolver 410 si no existe';
    }

    errors.push({
      url: pathName,
      originalUrl: url,
      statusCode,
      date,
      recommendation
    });
  }

  const results = {
    total: errors.length,
    statusCounts,
    errors
  };

  fs.writeFileSync(outJsonPath, JSON.stringify(results, null, 2));

  let md = `# Reporte Importado de Errores Bing WMT\n\n`;
  md += `Fecha de importación: ${new Date().toISOString()}\n`;
  md += `Total URLs con error: ${errors.length}\n\n`;
  md += `## Resumen por Status Code\n`;
  for (const [code, count] of Object.entries(statusCounts)) {
    md += `- **${code}**: ${count}\n`;
  }
  md += `\n## Detalle de Recomendaciones\n`;
  md += `| Ruta | Código | Recomendación |\n`;
  md += `|---|---|---|\n`;
  
  // Max 500 lines to avoid massive MD files
  const displayErrors = errors.slice(0, 500);
  for (const e of displayErrors) {
    md += `| ${e.url} | ${e.statusCode} | ${e.recommendation} |\n`;
  }
  
  if (errors.length > 500) {
    md += `| ... | ... | ... (${errors.length - 500} URLs omitidas) |\n`;
  }

  fs.writeFileSync(outMdPath, md);
  console.log(`Importación exitosa. ${errors.length} URLs analizadas.`);
  console.log(`Reporte guardado en ${outMdPath}`);
}

main().catch(console.error);
