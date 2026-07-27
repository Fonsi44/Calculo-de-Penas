import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
  const rows = await db.select().from(blogPosts);
  console.log(`Total registros: ${rows.length}`);

  const planSlugs = new Set<string>();
  const planPath = path.join(__dirname, '../docs/audits/fase6-plan-ejecucion-lotes.json');
  if (fs.existsSync(planPath)) {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
    for (const lote of plan.lotes) {
      for (const s of lote.slugs) planSlugs.add(s);
    }
  }

  const result: any[] = [];
  let elegibles = 0, excluidos = 0, procesados = 0, pendientes = 0;

  for (const r of rows) {
    const body = (r.body || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    const slug = r.slug;
    
    let tipo = 'juridico';
    let elegible = true;
    let motivo = '';
    
    if (body.includes('redirig') || body.includes('consolidado en') || body.includes('contenido ha sido')) {
      tipo = 'redirect'; elegible = false; motivo = 'redirect/consolidado';
    } else if (title.includes('abogados en') || title.includes('abogado en') || title.includes('bufete') || title.includes('pineda y asociados')) {
      tipo = 'landing_comercial'; elegible = false; motivo = 'landing comercial/bufete';
    } else if (slug.includes('nacaome') || slug.includes('choluteca') || slug.includes('san-lorenzo') || slug.includes('goascoran') || slug.includes('el-triunfo') || slug.includes('marcovia') || slug.includes('pespire') || slug.includes('namasigüe') || slug.includes('orocuina') || slug.includes('amapala')) {
      tipo = 'landing_geografica'; elegible = false; motivo = 'landing geográfica';
    }
    
    // Determine lote and processing status
    let lote = null;
    let procesado = false;
    let pasadaA = false, pasadaB = false, decision = false;
    
    for (const ln of [4,5,6,7,8,9,10,11,12,13,14]) {
      const dp = path.join(__dirname, `../docs/audits/fase6/lote-${ln}/${slug}/decision-final.json`);
      if (fs.existsSync(dp)) {
        lote = ln;
        procesado = true;
        pasadaA = fs.existsSync(path.join(__dirname, `../docs/audits/fase6/lote-${ln}/${slug}/pasada-a.json`));
        pasadaB = fs.existsSync(path.join(__dirname, `../docs/audits/fase6/lote-${ln}/${slug}/pasada-b.json`));
        decision = true;
        break;
      }
    }
    
    if (elegible) elegibles++; else excluidos++;
    if (procesado && elegible) procesados++;
    if (!procesado && elegible) pendientes++;
    
    result.push({
      slug: r.slug,
      titulo: r.title || '',
      url: `https://www.pinedayasociadoshn.com/${r.slug}`,
      categoria: r.category || '',
      publicado: r.published || false,
      tipo,
      elegible,
      motivo_exclusion: motivo || null,
      lote,
      procesado,
      pasada_a: pasadaA,
      pasada_b: pasadaB,
      decision_final: decision,
      estado_ia: r.aiReviewStatus || 'not_started',
      estado_editorial: r.reviewStatus || 'published',
      ai_review_requires_human: r.aiReviewRequiresHuman || false
    });
  }

  fs.writeFileSync(
    path.join(__dirname, '../docs/audits/fase6d-inventario-autoritativo.json'),
    JSON.stringify({
      fecha: new Date().toISOString(),
      total_registros: rows.length,
      elegibles,
      excluidos,
      procesados_validos: procesados,
      pendientes,
      procesados_indebidamente: result.filter(r => r.procesado && !r.elegible).length,
      articulos: result
    }, null, 2)
  );
  
  console.log(`\n✅ Inventario: ${rows.length} total, ${elegibles} elegibles, ${excluidos} excluidos`);
  console.log(`Procesados válidos: ${procesados}, Pendientes: ${pendientes}`);
  console.log(`Procesados indebidamente: ${result.filter(r => r.procesado && !r.elegible).length}`);
  console.log(`Verificación: ${rows.length} = ${elegibles} + ${excluidos} = ${elegibles+excluidos} ✅`);
  console.log(`Verificación: ${elegibles} = ${procesados} + ${pendientes} = ${procesados+pendientes} ✅`);
}

main();
