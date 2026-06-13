// FASE 4: Insertar guías pilar faltantes (Aduanero, Ambiental)
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { sanitizeHtml } from '../lib/sanitize';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) { console.error('Falta DATABASE_URL'); process.exit(1); }

const db = drizzle(neon(process.env.DATABASE_URL));

const pilares = [
  {
    slug: 'guia-aduanera-importaciones-honduras',
    title: 'Guía Aduanera de Importaciones en Honduras: Todo lo que Debe Saber para Importar Legalmente',
    description: 'Guía completa de importaciones en Honduras: clasificación arancelaria, DUA, impuestos DAI e ISV, permisos, agente aduanero y despacho. Puerto San Lorenzo y más.',
    category: 'derecho-aduanero',
    tags: ['guía aduanera Honduras', 'importaciones', 'CAC', 'agente aduanero', 'San Lorenzo', 'comercio exterior'],
    readingTime: '10 min',
    file: 'P1-guia-aduanera-importaciones.html',
  },
  {
    slug: 'derecho-ambiental-honduras',
    title: 'Derecho Ambiental en Honduras: Guía Completa de Normativa, Licencias y Responsabilidades',
    description: 'Guía completa de derecho ambiental en Honduras: licencias, evaluación de impacto, delitos ambientales, SERNA, categorización y sanciones. Para empresas y desarrolladores.',
    category: 'derecho-ambiental',
    tags: ['derecho ambiental Honduras', 'licencia ambiental', 'EIA', 'SERNA', 'delitos ambientales', 'evaluación de impacto'],
    readingTime: '9 min',
    file: 'P2-derecho-ambiental-honduras.html',
  },
];

async function main() {
  console.log('=== Insertando guías pilar ===\n');
  for (const p of pilares) {
    try {
      const fp = path.join('auditoria-blog', p.file);
      if (!fs.existsSync(fp)) { console.log(`  ✗ No encontrado: ${fp}`); continue; }
      const body = sanitizeHtml(fs.readFileSync(fp, 'utf-8'));
      const wc = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;
      const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, p.slug));
      if (existing) {
        await db.update(blogPosts).set({ title: p.title, description: p.description, body, category: p.category, tags: p.tags, readingTime: p.readingTime, coverImage: `/images/blog/${p.slug}.webp`, updatedAt: new Date() }).where(eq(blogPosts.id, existing.id));
        console.log(`  ✓ ACTUALIZADO: ${p.slug} (${wc} palabras)`);
      } else {
        await db.insert(blogPosts).values({ slug: p.slug, title: p.title, description: p.description, body, publishedAt: new Date(), category: p.category, tags: p.tags, author: 'Pineda y Asociados', readingTime: p.readingTime, coverImage: `/images/blog/${p.slug}.webp`, featured: false, published: true });
        console.log(`  ✓ INSERTADO: ${p.slug} (${wc} palabras)`);
      }
    } catch (e: any) { console.error(`  ✗ ${p.slug}: ${e.message}`); }
  }
  console.log('\n--- OK ---');
}
main().catch(console.error);
