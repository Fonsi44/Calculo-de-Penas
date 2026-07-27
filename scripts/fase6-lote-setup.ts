import fs from 'fs';
import path from 'path';

function loadJson(p: string) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { return null; }
}

function main() {
  const planPath = path.join(__dirname, '../docs/audits/fase6-plan-global-lotes.json');
  const plan = loadJson(planPath);
  if (!plan) throw new Error("No plan found");

  const loteNum = 4; // Cambiar dinámicamente si es necesario
  const lote = plan.lotes.find((l: any) => l.numero === loteNum);
  if (!lote) throw new Error(`Lote ${loteNum} no encontrado`);

  // Selección
  const outputSeleccion = {
    lote: loteNum,
    candidatos_evaluados: plan.total_articulos,
    seleccionados: lote.articulos.map((a: any) => ({
      slug: a.slug,
      score: a.score,
      riesgo_jurídico: a.riesgo_jurídico,
      estado_actual: a.estado_IA
    }))
  };

  fs.writeFileSync(
    path.join(__dirname, `../docs/audits/fase6-lote${loteNum}-seleccion.json`), 
    JSON.stringify(outputSeleccion, null, 2)
  );

  // MD
  const mdLines = [`# Fase 6 - Lote ${loteNum} - Priorización\n`];
  mdLines.push(`Se han evaluado ${plan.total_articulos} artículos y se han seleccionado 15 para este lote.\n`);
  mdLines.push(`## Artículos Seleccionados`);
  
  lote.articulos.forEach((a: any) => {
    mdLines.push(`- **${a.slug}**`);
    mdLines.push(`  - Score: ${a.score.toFixed(3)}`);
    mdLines.push(`  - Riesgo: ${a.riesgo_jurídico}`);
    mdLines.push(`  - Impacto orgánico: ${a.impacto_orgánico.toFixed(3)}`);
    mdLines.push(`  - Estado IA actual: ${a.estado_IA}`);
  });

  fs.writeFileSync(
    path.join(__dirname, `../docs/audits/fase6-lote${loteNum}-priorizacion.md`), 
    mdLines.join('\n')
  );

  // Estados Iniciales
  const estadosIniciales = lote.articulos.map((a: any) => ({
    slug: a.slug,
    estado_IA: a.estado_IA,
    motivo: a.motivo_inclusión_o_exclusión
  }));
  fs.writeFileSync(
    path.join(__dirname, `../docs/audits/fase6-lote${loteNum}-estados-iniciales.json`), 
    JSON.stringify(estadosIniciales, null, 2)
  );

  console.log(`Archivos de selección y priorización del Lote ${loteNum} generados.`);
}

main();
