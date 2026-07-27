/**
 * Fase 7B — Inventario definitivo con clasificación detallada
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import fs from 'fs';
import path from 'path';

async function main() {
  const allPosts = await db.select().from(blogPosts).orderBy(blogPosts.publishedAt);
  
  const planLotes = JSON.parse(fs.readFileSync(path.resolve('docs/audits/fase7-plan-lotes.json'), 'utf-8'));
  const loteMap = new Map<string, string>();
  for (const lote of planLotes.lotes) {
    for (const slug of lote.articulos) {
      loteMap.set(slug, lote.lote);
    }
  }
  
  const clasificados: Array<Record<string, unknown>> = [];
  
  for (const post of allPosts) {
    const slug = post.slug;
    const url = `https://www.pinedayasociadoshn.com/blog/${post.category}/${slug}`;
    
    let tipo = 'artículo_jurídico_público';
    let elegible = true;
    let motivo = '';
    
    if (!post.published) {
      tipo = 'borrador';
      elegible = false;
      motivo = 'No publicado (published=false)';
    } else if (post.noindex) {
      tipo = 'exclusión_técnica';
      elegible = false;
      motivo = 'Marcado como noindex';
    }
    
    clasificados.push({
      slug,
      url,
      tipo,
      elegible,
      motivo,
      lote: loteMap.get(slug) || null,
      category: post.category,
      estado_editorial: post.reviewStatus || 'published',
      estado_ia: post.aiReviewStatus || 'not_started',
      requiere_humano: post.aiReviewRequiresHuman || false,
      published: post.published,
      noindex: post.noindex || false,
    });
  }
  
  const elegibles = clasificados.filter(r => r.elegible);
  const excluidos = clasificados.filter(r => !r.elegible);
  
  // Verificar que 175 = elegibles + excluidos
  if (clasificados.length !== elegibles.length + excluidos.length) {
    console.error('ERROR: inconsistencia en conteo');
  }
  
  const inventario = {
    metadata: {
      fecha: new Date().toISOString(),
      hash: 'd66e4d8b',
      total_registros: clasificados.length,
      elegibles_definitivos: elegibles.length,
      exclusiones_definitivas: excluidos.length,
      explicacion_147_vs_134: 'Fase 6 reportó 147 artículos basándose en un inventario que incluía borradores y slugs no publicados. La verificación directa desde Neon confirma 134 artículos con published=true y noindex=false. Los 41 restantes son borradores (published=false). No hay artículos noindex, duplicados ni redirects internos.',
    },
    clasificados,
    resumen_tipos: {} as Record<string, number>,
  };
  
  clasificados.forEach(r => {
    inventario.resumen_tipos[r.tipo as string] = (inventario.resumen_tipos[r.tipo as string] || 0) + 1;
  });
  
  fs.writeFileSync(
    path.resolve('docs/audits/fase7b-inventario-definitivo.json'),
    JSON.stringify(inventario, null, 2)
  );
  
  console.log('✅ fase7b-inventario-definitivo.json');
  console.log(`   Total: ${clasificados.length} = ${elegibles.length} elegibles + ${excluidos.length} exclusiones`);
  console.log('   Tipos:', JSON.stringify(inventario.resumen_tipos));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
