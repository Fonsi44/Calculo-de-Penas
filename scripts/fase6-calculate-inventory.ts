import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const all = await db.select().from(blogPosts);
  
  const pendientes = all.filter(p => p.reviewStatus !== 'published' && p.reviewStatus !== 'reviewed' && p.slug !== 'test-slug-ignore');
  
  // Also include those explicitly marked as needs_human_review
  const reales = pendientes.map(p => p.slug);
  
  const inventario = {
    total: all.length,
    publicados: all.filter(p => p.reviewStatus === 'published').length,
    revisados: all.filter(p => p.reviewStatus === 'reviewed').length,
    pendientes_reales: reales.length,
    pendientes_slugs: reales
  };
  
  const docsDir = path.join(__dirname, '../docs/audits');
  fs.writeFileSync(path.join(docsDir, 'fase6-inventario-corregido.json'), JSON.stringify(inventario, null, 2));
  
  // Plan de lotes
  const lotes = [];
  let currentLote = [];
  
  for (const slug of reales) {
    currentLote.push(slug);
    if (currentLote.length === 15) {
      lotes.push([...currentLote]);
      currentLote = [];
    }
  }
  if (currentLote.length > 0) {
    lotes.push([...currentLote]);
  }
  
  const plan = {
    total_lotes: lotes.length,
    tamano_maximo_lote: 15,
    lotes: lotes.map((lote, index) => ({
      numero: index + 1, // Let's not call it Lote 4, we just start fresh or just map them to arrays
      cantidad: lote.length,
      slugs: lote
    }))
  };
  
  fs.writeFileSync(path.join(docsDir, 'fase6-plan-lotes-corregido.json'), JSON.stringify(plan, null, 2));
  console.log(`Inventario y plan corregido generado. Pendientes reales: ${reales.length}`);
}
main().catch(console.error);
