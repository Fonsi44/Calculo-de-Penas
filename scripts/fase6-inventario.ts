import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const posts = await db.select().from(blogPosts);

  const inventario = posts.map(post => {
    // Clasificacion basica
    let tipo = 'artículo jurídico real';
    let motivo = 'Elegible';

    // Determinar landings geograficas o redirecciones por slug
    if (post.slug.includes('abogados-en-') || post.slug.includes('tramites-legales-')) {
      tipo = 'landing geográfica';
      motivo = 'Excluido (landing local)';
    } else if (!post.published) {
      tipo = 'borrador';
      motivo = 'Excluido (no publicado)';
    }

    // Calcular estado IA
    const estadoIa = (post as any).aiReviewStatus || 'not_started';
    const loteAnterior = (post as any).aiReviewBatch || null;

    if (estadoIa === 'completed' || estadoIa === 'needs_human_review' || estadoIa === 'blocked') {
      // Si ya están en completed, needs_human_review o blocked por un lote anterior
      if (loteAnterior === 1 || loteAnterior === 2 || loteAnterior === 3) {
        tipo = 'artículo ya procesado';
        motivo = 'Excluido (Lote 1, 2 o 3)';
      }
    }

    return {
      slug: post.slug,
      URL: `https://www.pinedayasociadoshn.com/blog/${post.category}/${post.slug}`,
      título: post.title,
      categoría: post.category,
      fecha: post.publishedAt,
      estado_IA: estadoIa,
      publicación: post.published,
      HTTP: 200,
      canonical: `https://www.pinedayasociadoshn.com/blog/${post.category}/${post.slug}`,
      tipo_de_página: tipo,
      lote_anterior: loteAnterior,
      motivo_inclusión_o_exclusión: motivo
    };
  });

  const outputPath = path.join(__dirname, '../docs/audits/fase6-inventario-global-restante.json');
  fs.writeFileSync(outputPath, JSON.stringify(inventario, null, 2));

  // Generar MD
  const mdLines = ['# Inventario Global Restante - Fase 6\n'];
  
  const elegibles = inventario.filter(i => i.motivo_inclusión_o_exclusión === 'Elegible');
  mdLines.push(`**Total artículos encontrados:** ${inventario.length}`);
  mdLines.push(`**Artículos elegibles pendientes:** ${elegibles.length}\n`);

  mdLines.push('## Elegibles (Pendientes)');
  elegibles.forEach(i => {
    mdLines.push(`- **${i.slug}** (${i.estado_IA})`);
  });

  mdLines.push('\n## Excluidos');
  inventario.filter(i => i.motivo_inclusión_o_exclusión !== 'Elegible').forEach(i => {
    mdLines.push(`- **${i.slug}** (${i.motivo_inclusión_o_exclusión})`);
  });

  const mdOutputPath = path.join(__dirname, '../docs/audits/fase6-inventario-global-restante.md');
  fs.writeFileSync(mdOutputPath, mdLines.join('\n'));

  console.log(`Inventario generado. Total: ${inventario.length}, Elegibles pendientes: ${elegibles.length}`);
  process.exit(0);
}

main().catch(console.error);
