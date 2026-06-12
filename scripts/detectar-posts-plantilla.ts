// Script para detectar posts con contenido plantilla automático
// Ejecutar: npx tsx scripts/detectar-posts-plantilla.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, and, sql, like } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada');
  process.exit(1);
}

const sql_conn = neon(process.env.DATABASE_URL);
const db = drizzle(sql_conn);

// Patrones que identifican contenido plantilla
const TEMPLATE_MARKERS = [
  'Pasos clave que debe conocer',
  'Documentación necesaria',
  'Marco legal aplicable',
  'Nuestro enfoque en Pineda y Asociados',
  'Comparativa y plazos',
  '¿Cuándo debe buscar asesoría legal?',
  'El proceso legal en Honduras puede variar según las circunstancias',
  'como bufete multidisciplinario en Nacaome, Valle, con más de 15 años de experiencia',
  '¿Qué dice la legislación hondureña al respecto?',
  'Para cualquier gestión legal relacionada con este tema',
];

async function main() {
  console.log('\nDetectando posts con contenido plantilla automático...\n');

  // Buscar posts con marcadores de plantilla
  const allPosts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    title: blogPosts.title,
    category: blogPosts.category,
    readingTime: blogPosts.readingTime,
    body: blogPosts.body,
  })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  console.log(`Total posts publicados: ${allPosts.length}\n`);

  const templatePosts: typeof allPosts = [];
  const cleanPosts: typeof allPosts = [];

  for (const post of allPosts) {
    if (!post.body) {
      console.log(`  ⊘ SIN CUERPO: ${post.slug}`);
      continue;
    }

    let templateScore = 0;
    for (const marker of TEMPLATE_MARKERS) {
      if (post.body.includes(marker)) {
        templateScore++;
      }
    }

    const postLen = post.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

    if (templateScore >= 2) {
      templatePosts.push(post);
      console.log(`  🔴 PLANTILLA (${templateScore}/10 marcadores, ${postLen} palabras, ${post.readingTime}): ${post.slug}`);
    } else {
      cleanPosts.push(post);
    }
  }

  console.log(`\n---`);
  console.log(`RESULTADO:`);
  console.log(`  Posts con plantilla: ${templatePosts.length}`);
  console.log(`  Posts limpios: ${cleanPosts.length}`);
  
  if (templatePosts.length > 0) {
    console.log(`\nPosts plantilla por categoría:`);
    const byCategory: Record<string, number> = {};
    for (const p of templatePosts) {
      byCategory[p.category || 'sin-categoria'] = (byCategory[p.category || 'sin-categoria'] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(byCategory).sort(([,a], [,b]) => b - a)) {
      console.log(`  ${cat}: ${count}`);
    }

    console.log(`\nSlugs de posts plantilla (para referencia):`);
    for (const p of templatePosts) {
      console.log(`  - ${p.slug}`);
    }
  }

  console.log('');
}

main().catch(console.error);
