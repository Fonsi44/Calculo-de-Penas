// Script para detectar posts con contenido plantilla automático.
// Ejecutar: npx tsx scripts/detectar-posts-plantilla.ts
//
// Clasifica cada post publicado en ALTO / MEDIO / BAJO riesgo de contenido
// plantilla (boilerplate duplicado entre artículos) y thin content.
// Reporta slugs agrupados por categoría para priorizar reescrituras.
//
// Salida dual: console.log (stdout) + archivo docs/blog-duplicidad-report.md
// (escritura a archivo para entornos donde stdout no se captura).
//
// Criterios de puntuación (sobre el body en HTML, sin tags):
//   - Marcadores de plantilla (10 strings conocidos): +1 c/u
//   - Palabras < 500 (thin content extremo): +3
//   - Palabras < 800 (contenido insuficiente): +2
//   - Palabras < 1000 (contenido bajo): +1
//   - Marcadores >= 3: clasifica ALTO automáticamente

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const REPORT_PATH = resolve(process.cwd(), 'docs/blog-duplicity-report.md');
const lines: string[] = [];
function out(s: string) {
  console.log(s);
  lines.push(s);
}
function flushReport() {
  try {
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');
    out(`\n📄 Informe guardado en: ${REPORT_PATH}`);
  } catch (e) {
    out(`\n⚠️  No se pudo escribir el informe a archivo: ${String(e).substring(0, 100)}`);
  }
}

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
  // ALTO: marcadores plantilla abundantes O thin content extremo (<500 palabras)
  if (marcadores >= 3 || palabras < 500) return 'ALTO';
  // MEDIO: algunos marcadores O contenido bajo (<800) O CTAs duplicados en body
  if (marcadores >= 1 || palabras < 800 || ctaDuplicados > 0) return 'MEDIO';
  // BAJO: >=800 palabras, sin marcadores, sin CTAs duplicados
  return 'BAJO';
}

async function main() {
  out('\n🔍 Auditoría de contenido plantilla y thin content\n');

  const allPosts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      body: blogPosts.body,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  out(`Total posts publicados analizados: ${allPosts.length}\n`);

  const audits: PostAudit[] = [];

  for (const post of allPosts) {
    if (!post.body) {
      out(`  ⊘ SIN CUERPO: ${post.slug}`);
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

  out('═══════════════════════════════════════════════');
  out('RESUMEN POR SEVERIDAD');
  out('═══════════════════════════════════════════════');
  out(`  🔴 ALTO  (${porSeveridad.ALTO.length}): reescribir urgente`);
  out(`  🟠 MEDIO (${porSeveridad.MEDIO.length}): reescribir o eliminar secciones plantilla`);
  out(`  🟢 BAJO  (${porSeveridad.BAJO.length}): revisión opcional`);
  out('');

  // Detalle ALTO
  if (porSeveridad.ALTO.length > 0) {
    out('═══════════════════════════════════════════════');
    out('🔴 ALTO RIESGO (reescribir primero)');
    out('═══════════════════════════════════════════════');
    for (const a of porSeveridad.ALTO) {
      out(`  ${a.category}/${a.slug}`);
      out(`    Marcadores: ${a.marcadores}/10 · Palabras: ${a.palabras} · CTAs duplicados: ${a.ctaDuplicados}`);
      if (a.marcadoresEncontrados.length > 0) {
        out(`    Encontrados: ${a.marcadoresEncontrados.join(' | ')}`);
      }
    }
    out('');
  }

  // Detalle MEDIO
  if (porSeveridad.MEDIO.length > 0) {
    out('═══════════════════════════════════════════════');
    out('🟠 MEDIO RIESGO');
    out('═══════════════════════════════════════════════');
    for (const a of porSeveridad.MEDIO) {
      out(`  ${a.category}/${a.slug} (${a.marcadores}/10 marcadores, ${a.palabras} palabras)`);
    }
    out('');
  }

  // Por categoría
  out('═══════════════════════════════════════════════');
  out('DISTRIBUCIÓN POR CATEGORÍA (ALTO + MEDIO)');
  out('═══════════════════════════════════════════════');
  const porCategoria: Record<string, { alto: number; medio: number; bajo: number }> = {};
  for (const a of audits) {
    if (!porCategoria[a.category]) porCategoria[a.category] = { alto: 0, medio: 0, bajo: 0 };
    porCategoria[a.category][a.severidad.toLowerCase() as 'alto' | 'medio' | 'bajo']++;
  }
  for (const [cat, counts] of Object.entries(porCategoria).sort()) {
    const totalRiesgo = counts.alto + counts.medio;
    if (totalRiesgo > 0) {
      out(`  ${cat}: ${counts.alto} alto, ${counts.medio} medio, ${counts.bajo} bajo`);
    }
  }
  out('');

  // Slugs para reescritura (ALTO primero, para copiar/pegar)
  if (porSeveridad.ALTO.length > 0) {
    out('═══════════════════════════════════════════════');
    out('SLUGS DE ALTO RIESGO (para reescritura prioritaria)');
    out('═══════════════════════════════════════════════');
    for (const a of porSeveridad.ALTO) {
      out(`  ${a.slug}`);
    }
    out('');
  }

  out('═══════════════════════════════════════════════');
  out('ACCIÓN RECOMENDADA');
  out('═══════════════════════════════════════════════');
  out('  1. Reescribir los ALTO sustituyendo secciones plantilla por contenido');
  out('     específico de cada materia (penal, familia, laboral, etc.).');
  out('  2. En los MEDIO, eliminar las secciones genéricas que no puedan');
  out('     hacerse específicas, o ampliar el contenido.');
  out('  3. Los posts con CTAs duplicados en el body deben limpiarse: el');
  out('     componente <LegalDisclaimer> ya añade el aviso legal.');
  out('');

  flushReport();
}

main().catch((e) => { console.error(e); process.exit(1); });
