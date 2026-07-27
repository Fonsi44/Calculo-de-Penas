import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

const CORRECCIONES: Array<{slug: string; title_nuevo: string}> = [
  { slug: 'zonas-libres-zoli-beneficios-fiscales-honduras', title_nuevo: 'Zonas Libres en Honduras (ZOLI): Beneficios Fiscales y Requisitos Legales' },
  { slug: 'derechos-de-autor-proteccion-registro-honduras', title_nuevo: 'Derechos de Autor en Honduras: Protección y Registro de Obras' },
  { slug: 'refugio-asilo-solicitarlo', title_nuevo: 'Refugio y Asilo en Honduras: Proceso y Requisitos para Solicitarlo' },
  { slug: 'habeas-corpus-cuando-interponer-honduras', title_nuevo: 'Hábeas Corpus en Honduras: Cómo Interponerlo y Cuándo Procede' },
  { slug: 'banco-demanda-deuda-defensa-opciones-honduras', title_nuevo: 'Demanda Bancaria en Honduras: 6 Defensas y Opciones Legales Frente al Banco' },
  { slug: 'acoso-laboral-mobbing-honduras', title_nuevo: 'Acoso Laboral en Honduras: Cómo Identificarlo y Denunciarlo Legalmente' },
  { slug: 'recurso-de-amparo-honduras-guia-completa', title_nuevo: 'Recurso de Amparo en Honduras: Guía Completa y Procedimiento Actualizado' },
];

async function main() {
  console.log('[fase7b] Corrigiendo titles truncados...\n');
  let corregidos = 0;
  
  for (const c of CORRECCIONES) {
    const [post] = await db.select({ title: blogPosts.title, slug: blogPosts.slug })
      .from(blogPosts).where(eq(blogPosts.slug, c.slug));
    
    if (!post) { console.log(`  ❌ ${c.slug}: NOT FOUND`); continue; }
    
    console.log(`  📝 ${c.slug}`);
    console.log(`    antes: "${post.title}" (${post.title.length} chars)`);
    console.log(`    nuevo: "${c.title_nuevo}" (${c.title_nuevo.length} chars)`);
    
    await db.update(blogPosts)
      .set({ title: c.title_nuevo, updatedAt: new Date() })
      .where(eq(blogPosts.slug, c.slug));
    
    // Verificar
    const [v] = await db.select({ title: blogPosts.title })
      .from(blogPosts).where(eq(blogPosts.slug, c.slug));
    
    if (v?.title === c.title_nuevo) {
      console.log(`    ✅ verificado`);
      corregidos++;
    } else {
      console.log(`    ❌ verificación fallida: ${v?.title}`);
    }
  }
  
  console.log(`\n[fase7b] ✅ ${corregidos}/${CORRECCIONES.length} titles corregidos`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
