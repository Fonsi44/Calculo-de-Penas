// Leer contenido actual de los 14 posts ALTO para referencia.
// Ejecutar: npx tsx scripts/read-alto-posts.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

const ALTO_SLUGS = [
  'registro-medicamentos-productos-farmaceuticos-honduras',
  'cuando-prescribe-delito-en-honduras',
  'proceso-consulta-legal-pineda-asociados-honduras',
  'impuestos-pequenas-empresas-guia-basica-honduras',
  'pineda-asociados-bufete-multidisciplinario-honduras',
  'nacionalidad-espanola-para-hondurenos-residencia-plazos',
  'contratos-mercantiles-esenciales-empresas-honduras',
  'despido-injustificado-honduras-derechos-trabajador',
  'derechos-trabajadora-embarazada-honduras',
  'licencia-ambiental-categorias-plazos-honduras',
  'mediacion-vs-juicio-que-conviene-mas-honduras',
  'preguntas-frecuentes-antes-contratar-abogado-honduras',
  'abogados-en-amapala-valle',
  'custodia-hijos-honduras-juez',
];

const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  for (const slug of ALTO_SLUGS) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!post) { console.log(`\n=== ${slug} NOT FOUND ===\n`); continue; }
    const words = (post.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    console.log(`\n=== ${post.slug} [${post.category}] (${words} words) ===`);
    console.log(`Title: ${post.title}`);
    console.log(`Meta Title: ${post.metaTitle || '(none)'}`);
    console.log(`Meta Desc: ${post.metaDescription || '(none)'}`);
    console.log(`---BODY---`);
    console.log((post.body || '').substring(0, 1000));
    console.log(`---END---`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
