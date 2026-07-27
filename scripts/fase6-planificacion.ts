import fs from 'fs';
import path from 'path';

function loadJson(p: string) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {
    return [];
  }
}

async function main() {
  const invPath = path.join(__dirname, '../docs/audits/fase6-inventario-global-restante.json');
  const inventario = loadJson(invPath);
  const elegibles = inventario.filter((i: any) => i.motivo_inclusión_o_exclusión === 'Elegible');

  const gscData = loadJson(path.join(__dirname, '../data/google/gsc-live.json'));
  const ga4Data = loadJson(path.join(__dirname, '../data/google/ga4-live.json'));

  const gscPages = gscData.pages || [];
  const ga4Pages = ga4Data.topPages || ga4Data.landingPages || [];

  const scored = elegibles.map((item: any) => {
    const slug = item.slug;
    const itemUrl = `https://www.pinedayasociadoshn.com/blog/${item.categoría}/${slug}`;
    const itemPath = `/blog/${item.categoría}/${slug}`;
    
    // Buscar en GSC
    const gsc = gscPages.find((d: any) => d.page === itemUrl || d.keys?.includes(itemUrl) || d.url === itemUrl) || {};
    const clicks = gsc.clicks || 0;
    const impressions = gsc.impressions || 0;
    
    // Buscar en GA4
    const ga4 = ga4Pages.find((d: any) => d.pagePath === itemPath || d.page === itemPath || d.url === itemPath) || {};
    const users = ga4.activeUsers || ga4.users || 0;

    // Calcular heurísticas
    // Riesgo jurídico: mayor en categorías de penal, notarial, mercantil (por multas)
    let riesgo = 0.5; 
    if (['derecho-penal', 'derecho-notarial', 'derecho-aduanero'].includes(item.categoría)) riesgo = 0.9;
    else if (['derecho-mercantil', 'derecho-laboral'].includes(item.categoría)) riesgo = 0.7;

    // Impacto orgánico: normalizado max 100
    const impacto = Math.min((clicks * 2 + impressions * 0.1 + users * 3) / 100, 1.0);

    // Desactualizacion (asumir mas desactualizado si es de 2022 o anterior)
    const year = new Date(item.fecha).getFullYear();
    const desactualizacion = year <= 2023 ? 0.9 : 0.4;

    // Importancia comercial (ej. servicios, hondureños en españa)
    let comercial = 0.5;
    if (slug.includes('espana') || slug.includes('contrato') || slug.includes('empresa')) comercial = 0.8;

    // Geo (ej. nacaome, tegucigalpa)
    const geo = slug.includes('honduras') ? 0.6 : 0.3;

    // Fórmula:
    // riesgo_jurídico × 0.30 + impacto_orgánico × 0.25 + desactualización_normativa × 0.20 + importancia_comercial × 0.15 + oportunidad_GEO × 0.10
    const score = (riesgo * 0.30) + (impacto * 0.25) + (desactualizacion * 0.20) + (comercial * 0.15) + (geo * 0.10);

    return {
      ...item,
      riesgo_jurídico: riesgo,
      impacto_orgánico: impacto,
      score,
      metrics: { clicks, impressions, users }
    };
  });

  // Ordenar determinista: 1. score, 2. riesgo_jurídico, 3. impresiones, 4. slug alfabético
  scored.sort((a: any, b: any) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    if (Math.abs(b.riesgo_jurídico - a.riesgo_jurídico) > 0.001) return b.riesgo_jurídico - a.riesgo_jurídico;
    if (b.metrics.impressions !== a.metrics.impressions) return b.metrics.impressions - a.metrics.impressions;
    return a.slug.localeCompare(b.slug);
  });

  // Agrupar en lotes de 15
  const lotes = [];
  let currentLote = [];
  for (const item of scored) {
    if (currentLote.length === 15) {
      lotes.push(currentLote);
      currentLote = [];
    }
    currentLote.push(item);
  }
  if (currentLote.length > 0) {
    lotes.push(currentLote);
  }

  // Guardar JSON
  const outputJson = {
    total_articulos: scored.length,
    total_lotes: lotes.length,
    lotes: lotes.map((l, i) => ({
      numero: i + 4, // Empieza en lote 4
      articulos: l
    }))
  };

  const jsonPath = path.join(__dirname, '../docs/audits/fase6-plan-global-lotes.json');
  fs.writeFileSync(jsonPath, JSON.stringify(outputJson, null, 2));

  // Guardar MD
  const mdLines = ['# Fase 6 - Plan Global de Lotes\n'];
  mdLines.push(`**Total artículos elegibles:** ${scored.length}`);
  mdLines.push(`**Total lotes a procesar:** ${lotes.length}\n`);

  lotes.forEach((lote, index) => {
    const num = index + 4;
    mdLines.push(`## Lote ${num} (${lote.length} artículos)`);
    lote.forEach((item: any) => {
      mdLines.push(`- **${item.slug}** (Score: ${item.score.toFixed(3)}, Riesgo: ${item.riesgo_jurídico}, Impresiones: ${item.metrics.impressions})`);
    });
    mdLines.push('');
  });

  const mdPath = path.join(__dirname, '../docs/audits/fase6-plan-global-lotes.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(`Planificacion generada. Lotes: ${lotes.length}`);
}

main().catch(console.error);
