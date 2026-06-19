// Script para detectar posts con contenido plantilla automático.
// Ejecutar: npx tsx scripts/detectar-posts-plantilla.ts
//
// Clasifica cada post publicado en ALTO / MEDIO / BAJO riesgo de contenido
// plantilla (boilerplate duplicado entre artículos) y thin content.
// Reporta slugs agrupados por categoría para priorizar reescrituras.
//
// Criterios de puntuación (sobre el body en HTML, sin tags):
//   - Marcadores de plantilla (10 strings conocidos): +1 c/u
//   - Palabras < 300 (thin content): +2
//   - Palabras < 600 (contenido corto): +1
//   - Marcadores >= 3: clasifica ALTO automáticamente
//
// Salida: lista agrupada por severidad + por categoría.

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada. Este script requiere acceso a la DB Neon.');
  console.error('Ejecútalo en un entorno con DATABASE_URL válida (Vercel CI o local con .env.local).');
  process.exit(1);
}

const sql_conn = neon(process.env.DATABASE_URL);
const db = drizzle(sql_conn);

// Patrones que identifican contenido plantilla (encabezados y frases genéricas).
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

// CTAs y disclaimers repetidos que NO deberían estar en el body (el JSX los añade).
const DUPLICATE_CTA_MARKERS = [
  'Este artículo tiene carácter informativo y no sustituye',
  'Para obtener orientación específica sobre su caso, contacte con un abogado',
  'Solicite una consulta inicial',
];

type Severidad = 'ALTO' | 'MEDIO' | 'BAJO';

interface PostAudit {
  slug: string;
  title: string;
  category: string;
  severidad: Severidad;
  marcadores: number;
  palabras: number;
  ctaDuplicados: number;
  marcadoresEncontrados: string[];
}

function clasificar(marcadores: number, palabras: number, ctaDuplicados: number): Severidad {
  // ALTO: muchos marcadores plantilla o thin content extremo
  if (marcadores >= 3 || palabras < 300) return 'ALTO';
  // MEDIO: algunos marcadores o contenido corto + CTA duplicado en body
  if (marcadores >= 2 || palabras < 600 || ctaDuplicados > 0) return 'MEDIO';
  return 'BAJO';
}

async function main() {
  console.log('\n🔍 Auditoría de contenido plantilla y thin content\n');

  const allPosts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      body: blogPosts.body,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  console.log(`Total posts publicados analizados: ${allPosts.length}\n`);

  const audits: PostAudit[] = [];

  for (const post of allPosts) {
    if (!post.body) {
      console.log(`  ⊘ SIN CUERPO: ${post.slug}`);
      continue;
    }

    const marcadoresEncontrados: string[] = [];
    for (const marker of TEMPLATE_MARKERS) {
      if (post.body.includes(marker)) marcadoresEncontrados.push(marker);
    }

    let ctaDuplicados = 0;
    for (const marker of DUPLICATE_CTA_MARKERS) {
      if (post.body.includes(marker)) ctaDuplicados++;
    }

    const palabras = post.body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;

    const severidad = clasificar(marcadoresEncontrados.length, palabras, ctaDuplicados);

    audits.push({
      slug: post.slug,
      title: post.title,
      category: post.category || 'sin-categoria',
      severidad,
      marcadores: marcadoresEncontrados.length,
      palabras,
      ctaDuplicados,
      marcadoresEncontrados,
    });
  }

  // Reporte por severidad
  const porSeveridad: Record<Severidad, PostAudit[]> = {
    ALTO: audits.filter((a) => a.severidad === 'ALTO'),
    MEDIO: audits.filter((a) => a.severidad === 'MEDIO'),
    BAJO: audits.filter((a) => a.severidad === 'BAJO'),
  };

  console.log('═══════════════════════════════════════════════');
  console.log('RESUMEN POR SEVERIDAD');
  console.log('═══════════════════════════════════════════════');
  console.log(`  🔴 ALTO  (${porSeveridad.ALTO.length}): reescribir urgente`);
  console.log(`  🟠 MEDIO (${porSeveridad.MEDIO.length}): reescribir o eliminar secciones plantilla`);
  console.log(`  🟢 BAJO  (${porSeveridad.BAJO.length}): revisión opcional`);
  console.log('');

  // Detalle ALTO
  if (porSeveridad.ALTO.length > 0) {
    console.log('═══════════════════════════════════════════════');
    console.log('🔴 ALTO RIESGO (reescribir primero)');
    console.log('═══════════════════════════════════════════════');
    for (const a of porSeveridad.ALTO) {
      console.log(`  ${a.category}/${a.slug}`);
      console.log(`    Marcadores: ${a.marcadores}/10 · Palabras: ${a.palabras} · CTAs duplicados: ${a.ctaDuplicados}`);
      if (a.marcadoresEncontrados.length > 0) {
        console.log(`    Encontrados: ${a.marcadoresEncontrados.join(' | ')}`);
      }
    }
    console.log('');
  }

  // Detalle MEDIO
  if (porSeveridad.MEDIO.length > 0) {
    console.log('═══════════════════════════════════════════════');
    console.log('🟠 MEDIO RIESGO');
    console.log('═══════════════════════════════════════════════');
    for (const a of porSeveridad.MEDIO) {
      console.log(`  ${a.category}/${a.slug} (${a.marcadores}/10 marcadores, ${a.palabras} palabras)`);
    }
    console.log('');
  }

  // Por categoría
  console.log('═══════════════════════════════════════════════');
  console.log('DISTRIBUCIÓN POR CATEGORÍA (ALTO + MEDIO)');
  console.log('═══════════════════════════════════════════════');
  const porCategoria: Record<string, { alto: number; medio: number; bajo: number }> = {};
  for (const a of audits) {
    if (!porCategoria[a.category]) porCategoria[a.category] = { alto: 0, medio: 0, bajo: 0 };
    porCategoria[a.category][a.severidad.toLowerCase() as 'alto' | 'medio' | 'bajo']++;
  }
  for (const [cat, counts] of Object.entries(porCategoria).sort()) {
    const totalRiesgo = counts.alto + counts.medio;
    if (totalRiesgo > 0) {
      console.log(`  ${cat}: ${counts.alto} alto, ${counts.medio} medio, ${counts.bajo} bajo`);
    }
  }
  console.log('');

  // Slugs para reescritura (ALTO primero, para copiar/pegar)
  if (porSeveridad.ALTO.length > 0) {
    console.log('═══════════════════════════════════════════════');
    console.log('SLUGS DE ALTO RIESGO (para reescritura prioritaria)');
    console.log('═══════════════════════════════════════════════');
    for (const a of porSeveridad.ALTO) {
      console.log(`  ${a.slug}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('ACCIÓN RECOMENDADA');
  console.log('═══════════════════════════════════════════════');
  console.log('  1. Reescribir los ALTO sustituyendo secciones plantilla por contenido');
  console.log('     específico de cada materia (penal, familia, laboral, etc.).');
  console.log('  2. En los MEDIO, eliminar las secciones genéricas que no puedan');
  console.log('     hacerse específicas, o ampliar el contenido.');
  console.log('  3. Los posts con CTAs duplicados en el body deben limpiarse: el');
  console.log('     componente <LegalDisclaimer> ya añade el aviso legal.');
  console.log('');
}

main().catch(console.error);
