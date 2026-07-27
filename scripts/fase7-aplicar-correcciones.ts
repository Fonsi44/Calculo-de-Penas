/**
 * Fase 7 — Aplicar correcciones a la DB
 * 
 * 1. Generar metaTitle para artículos con metaTitle NULL
 * 2. Limpiar disclaimer duplicado del body
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq, sql, inArray } from 'drizzle-orm';

const SIN_METATITLE = [
  'sobreseimiento-definitivo-provisional',
  'derechos-detenido-honduras-guia-constitucional',
  'juicio-oral-etapas-que-esperar-honduras',
  'allanamiento-ilegal-violacion-domicilio-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'guia-aduanera-importaciones-honduras',
  'defensa-penal-honduras',
];

const CON_DISCLAIMER = [
  'juicio-oral-etapas-que-esperar-honduras',
  'registrar-marca-paso-a-paso-honduras',
  'antejuicio-en-honduras',
  'defensa-penal-honduras',
  'recurso-de-amparo-honduras-guia-completa',
  'despido-empleados-publicos-honduras',
];

async function main() {
  console.log('[fase7-correcciones] Iniciando...');
  let corregidos = 0;

  // 1. Generar metaTitle para artículos sin él
  console.log('\n1. Generando metaTitles...');
  for (const slug of SIN_METATITLE) {
    const [post] = await db.select({ title: blogPosts.title, metaTitle: blogPosts.metaTitle })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    
    if (!post) {
      console.log(`  ${slug}: NO ENCONTRADO`);
      continue;
    }
    
    if (post.metaTitle) {
      console.log(`  ${slug}: ya tiene metaTitle, omitiendo`);
      continue;
    }
    
    // Usar el título como metaTitle (sin la marca, que se añade en buildBlogMetaTitle)
    const metaTitle = post.title;
    
    await db.update(blogPosts)
      .set({ metaTitle, updatedAt: new Date() })
      .where(eq(blogPosts.slug, slug));
    
    console.log(`  ✅ ${slug}: metaTitle = "${metaTitle.substring(0, 50)}..."`);
    corregidos++;
  }

  // 2. Limpiar disclaimer del body
  console.log('\n2. Limpiando disclaimers del body...');
  for (const slug of CON_DISCLAIMER) {
    const [post] = await db.select({ body: blogPosts.body, title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    
    if (!post) {
      console.log(`  ${slug}: NO ENCONTRADO`);
      continue;
    }
    
    // Buscar patrones de disclaimer en el body y eliminarlos
    let newBody = post.body;
    let cleaned = false;
    
    // Patrones comunes de disclaimer en body
    const patterns = [
      /<p[^>]*>\s*(?:<em>)?\s*(?:Aviso legal|Descargo|Disclaimer|Nota legal|Este contenido tiene carácter informativo|Este artículo no constituye asesoría)[\s\S]*?<\/p>/gi,
      /<div[^>]*>\s*(?:<em>)?\s*(?:Aviso legal|Descargo|Disclaimer|Nota legal)[\s\S]*?<\/div>/gi,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(newBody)) {
        newBody = newBody.replace(pattern, '');
        cleaned = true;
      }
    }
    
    if (cleaned) {
      await db.update(blogPosts)
        .set({ body: newBody, updatedAt: new Date() })
        .where(eq(blogPosts.slug, slug));
      console.log(`  ✅ ${slug}: disclaimer eliminado del body`);
      corregidos++;
    } else {
      console.log(`  ⚠️ ${slug}: no se detectó patrón de disclaimer en body (verificar manualmente)`);
    }
  }

  console.log(`\n[fase7-correcciones] ✅ ${corregidos} correcciones aplicadas`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
