/**
 * Fase 7 — Extraer inventario autoritativo desde Neon
 * 
 * Ejecución: npx tsx scripts/fase7-extraer-inventario.ts
 * 
 * Obtiene TODOS los registros de blog_posts (publicados y no publicados)
 * y los combina con información del sitemap y artefactos previos.
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function main() {
  console.log('[fase7] Extrayendo inventario desde Neon...');

  // 1. Obtener TODOS los posts (published=true y false)
  const allPosts = await db.select().from(blogPosts).orderBy(blogPosts.publishedAt);
  
  console.log(`[fase7] Total registros en blog_posts: ${allPosts.length}`);
  
  // 2. Categorizar
  const elegibles: any[] = [];
  const excluidos: any[] = [];
  const categorias: Record<string, number> = {};
  
  for (const post of allPosts) {
    categorias[post.category] = (categorias[post.category] || 0) + 1;
    
    const slug = post.slug;
    const url = `https://www.pinedayasociadoshn.com/blog/${post.category}/${slug}`;
    
    // Calcular body hash
    const bodyHash = post.body 
      ? crypto.createHash('sha256').update(post.body).digest('hex')
      : '';
    
    const registro: any = {
      slug,
      title: post.title,
      url,
      category: post.category,
      published: post.published,
      featured: post.featured || false,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      
      // SEO
      metaTitle: post.metaTitle || null,
      metaDescription: post.metaDescription || null,
      noindex: post.noindex || false,
      canonicalUrl: post.canonicalUrl || null,
      
      // Editorial
      reviewStatus: post.reviewStatus || 'published',
      aiReviewStatus: post.aiReviewStatus || 'not_started',
      aiReviewRequiresHuman: post.aiReviewRequiresHuman || false,
      aiReviewClaimsCount: post.aiReviewClaimsCount || 0,
      aiReviewConfirmedClaims: post.aiReviewConfirmedClaims || 0,
      aiReviewCorrectedClaims: post.aiReviewCorrectedClaims || 0,
      aiReviewUnresolvedClaims: post.aiReviewUnresolvedClaims || 0,
      
      // Body
      bodyHash,
      bodyLength: post.body ? post.body.length : 0,
      readingTime: post.readingTime || null,
      author: post.author || 'Pineda y Asociados',
      tags: post.tags || [],
      
      // Clasificación
      tipo: null,
      elegible: null,
      motivo: null,
    };
    
    // Clasificación preliminar
    if (!post.published) {
      registro.tipo = 'borrador';
      registro.elegible = false;
      registro.motivo = 'No publicado (published=false)';
      excluidos.push(registro);
    } else if (post.noindex) {
      registro.tipo = 'noindex';
      registro.elegible = false;
      registro.motivo = 'Marcado como noindex';
      excluidos.push(registro);
    } else {
      registro.tipo = 'articulo_juridico';
      registro.elegible = true;
      elegibles.push(registro);
    }
  }
  
  // 3. Verificar consistencia
  const total = elegibles.length + excluidos.length;
  console.log(`[fase7] Elegibles: ${elegibles.length} | Excluidos: ${excluidos.length} | Total: ${total}`);
  console.log(`[fase7] Distribución por categoría:`, JSON.stringify(categorias, null, 2));
  
  // 4. Construir el inventario global
  const inventario = {
    metadata: {
      fecha_extraccion: new Date().toISOString(),
      fuente: 'Neon (blog_posts)',
      total_registros: total,
      elegibles: elegibles.length,
      excluidos: excluidos.length,
      hash_commit: '2fb4a2d3',
    },
    elegibles,
    excluidos,
    distribucion_categorias: categorias,
  };
  
  // 5. Escribir artefactos
  const outDir = path.resolve('docs/audits');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(outDir, 'fase7-inventario-global.json'),
    JSON.stringify(inventario, null, 2)
  );
  
  // Generar también versión markdown
  let md = `# Fase 7 — Inventario Global del Blog\n\n`;
  md += `**Fecha:** ${inventario.metadata.fecha_extraccion}\n`;
  md += `**Fuente:** Neon (blog_posts)\n`;
  md += `**Total registros:** ${total}\n`;
  md += `**Elegibles:** ${elegibles.length}\n`;
  md += `**Excluidos:** ${excluidos.length}\n\n`;
  
  md += `## Distribución por categoría\n\n`;
  md += `| Categoría | Total |\n|-----------|-------|\n`;
  for (const [cat, count] of Object.entries(categorias).sort((a,b) => b[1]-a[1])) {
    md += `| ${cat} | ${count} |\n`;
  }
  
  md += `\n## Artículos jurídicos elegibles (${elegibles.length})\n\n`;
  md += `| # | Slug | Título | Categoría | Published | Hash |\n`;
  md += `|---|------|--------|-----------|-----------|------|\n`;
  elegibles.forEach((r: any, i: number) => {
    md += `| ${i+1} | ${r.slug} | ${r.title.substring(0, 60)} | ${r.category} | ${r.publishedAt?.substring(0,10) || '?'} | ${r.bodyHash?.substring(0, 8) || '?'} |\n`;
  });
  
  md += `\n## Excluidos (${excluidos.length})\n\n`;
  md += `| Slug | Motivo |\n|------|--------|\n`;
  excluidos.forEach((r: any) => {
    md += `| ${r.slug} | ${r.motivo} |\n`;
  });
  
  fs.writeFileSync(
    path.join(outDir, 'fase7-inventario-global.md'),
    md
  );
  
  // También escribimos un archivo simplificado solo de elegibles para los lotes
  const elegiblesClean = elegibles.map((r: any) => ({
    slug: r.slug,
    title: r.title,
    url: r.url,
    category: r.category,
    bodyHash: r.bodyHash,
    aiReviewStatus: r.aiReviewStatus,
    aiReviewRequiresHuman: r.aiReviewRequiresHuman,
    reviewStatus: r.reviewStatus,
  }));
  
  fs.writeFileSync(
    path.join(outDir, 'fase7-elegibles.json'),
    JSON.stringify({ metadata: inventario.metadata, elegibles: elegiblesClean }, null, 2)
  );
  
  console.log(`[fase7] ✅ Inventario escrito:`);
  console.log(`  - docs/audits/fase7-inventario-global.json`);
  console.log(`  - docs/audits/fase7-inventario-global.md`);
  console.log(`  - docs/audits/fase7-elegibles.json`);
}

main().catch(err => {
  console.error('[fase7] ❌ Error:', err);
  process.exit(1);
});
