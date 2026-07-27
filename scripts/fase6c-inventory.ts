import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';

async function main() {
  const rows = await db.select().from(blogPosts);
  console.log('Total registros:', rows.length);

  const categories: Record<string, string[]> = {};
  for (const r of rows) {
    const cat = r.category || 'sin-categoria';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(r.slug);
  }
  for (const [cat, slugs] of Object.entries(categories).sort()) {
    console.log(`${cat}: ${slugs.length}`);
  }

  let redirects = 0, landings = 0, comerciales = 0, geograficas = 0;
  const exclusiones: any[] = [];

  for (const r of rows) {
    const body = (r.body || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    const slug = r.slug;
    let motivo = '';
    
    if (body.includes('redirig') || body.includes('consolidado en') || body.includes('te redirigimos') || body.includes('contenido ha sido')) {
      redirects++;
      motivo = 'redirect/consolidado';
    } else if (title.includes('abogados en') || title.includes('abogado en') || title.includes('bufete') || title.includes('pineda y asociados')) {
      comerciales++;
      motivo = 'landing comercial/bufete';
    } else if (slug.includes('nacaome') || slug.includes('choluteca') || slug.includes('san-lorenzo') || slug.includes('goascoran') || slug.includes('el-triunfo') || slug.includes('marcovia') || slug.includes('pespire') || slug.includes('namasigüe') || slug.includes('orocuina')) {
      geograficas++;
      motivo = 'landing geográfica';
    }
    
    if (motivo) {
      exclusiones.push({ slug, motivo, category: r.category, title: (r.title || '').substring(0,80) });
    }
  }

  console.log(`\nRedirects: ${redirects}`);
  console.log(`Landings comerciales: ${comerciales}`);
  console.log(`Landings geográficas: ${geograficas}`);
  console.log(`Exclusiones totales: ${exclusiones.length}`);
  console.log(`Elegibles: ${rows.length - exclusiones.length}`);

  // Print all exclusiones
  for (const e of exclusiones) {
    console.log(`  [${e.motivo}] ${e.slug}`);
  }
  
  // Write to file
  const fs = await import('fs');
  fs.writeFileSync('docs/audits/fase6-inventario-final-verificado.json', JSON.stringify({
    fecha: new Date().toISOString(),
    total_registros: rows.length,
    elegibles: rows.length - exclusiones.length,
    excluidos: exclusiones.length,
    exclusiones,
    desglose: { redirects, comerciales, geograficas }
  }, null, 2));
  console.log('\n✅ Inventario escrito a docs/audits/fase6-inventario-final-verificado.json');
}

main();
