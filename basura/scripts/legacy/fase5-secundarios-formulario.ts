// FASE 5: Insertar posts satélite secundarios + datos restantes
// Ejecutar: npx tsx scripts/fase5-secundarios-formulario.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { sanitizeHtml } from '../lib/sanitize';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL no configurada'); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const secundarios = [
  { slug: 'abogados-en-marcovia-choluteca', title: 'Abogados en Marcovia, Choluteca: Asesoría Legal Local con Presencia en la Zona Sur', description: 'Abogados en Marcovia, Choluteca para asuntos penales, familia, laborales y civiles. Atención local y cercana en la zona sur de Honduras.', category: 'practica-legal', tags: ['abogados Marcovia', 'Marcovia Choluteca', 'zona sur Honduras', 'asesoría legal'], readingTime: '3 min', file: 'S9-marcovia-abogados.html' },
  { slug: 'abogados-en-san-marcos-de-colon-choluteca', title: 'Abogados en San Marcos de Colón, Choluteca: Defensa Legal en la Frontera', description: 'Abogados en San Marcos de Colón para comercio internacional, derecho aduanero y litigios. Presencia local en la frontera con Nicaragua.', category: 'practica-legal', tags: ['San Marcos de Colón', 'abogados frontera', 'Choluteca', 'derecho mercantil'], readingTime: '3 min', file: 'S10-san-marcos-colon-abogados.html' },
  { slug: 'abogados-en-pespire-choluteca', title: 'Abogados en Pespire, Choluteca: Asesoría Jurídica en la Zona Sur', description: 'Abogados en Pespire, Choluteca para defensa penal, familia, civil y laboral. Atención local con presencia en juzgados de la zona sur.', category: 'practica-legal', tags: ['Pespire Choluteca', 'abogados zona sur', 'asesoría legal', 'Choluteca'], readingTime: '3 min', file: 'S11-pespire-abogados.html' },
  { slug: 'abogados-en-amapala-valle', title: 'Abogados en Amapala, Valle: Asesoría Local en el Puerto Histórico', description: 'Abogados en Amapala, Valle para derecho mercantil, civil, laboral y de familia. Presencia local y atención cercana en la zona sur.', category: 'practica-legal', tags: ['Amapala Valle', 'abogados zona sur', 'puerto Amapala', 'asesoría legal'], readingTime: '3 min', file: 'S12-amapala-abogados.html' },
];

async function main() {
  console.log('=== Insertando posts satélite secundarios ===\n');
  let ok = 0; let err = 0;

  for (const p of secundarios) {
    try {
      const fp = path.join('auditoria-blog', p.file);
      if (!fs.existsSync(fp)) { console.log(`  ✗ No encontrado: ${fp}`); err++; continue; }
      const body = sanitizeHtml(fs.readFileSync(fp, 'utf-8'));
      const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, p.slug));
      if (existing) {
        await db.update(blogPosts).set({ title: p.title, description: p.description, body, category: p.category, tags: p.tags, readingTime: p.readingTime, coverImage: `/images/blog/${p.slug}.webp`, updatedAt: new Date() }).where(eq(blogPosts.id, existing.id));
        console.log(`  ✓ ACTUALIZADO: ${p.slug}`);
      } else {
        await db.insert(blogPosts).values({ slug: p.slug, title: p.title, description: p.description, body, publishedAt: new Date(), category: p.category, tags: p.tags, author: 'Pineda y Asociados', readingTime: p.readingTime, coverImage: `/images/blog/${p.slug}.webp`, featured: false, published: true });
        console.log(`  ✓ INSERTADO: ${p.slug}`);
      }
      ok++;
    } catch (e: any) { console.error(`  ✗ ${p.slug}: ${e.message}`); err++; }
  }
  console.log(`\n${ok} ok, ${err} errores`);
}

main().catch(console.error);
