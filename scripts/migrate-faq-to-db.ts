/**
 * Migra las FAQs desde el archivo TS estático a la base de datos.
 * Ejecutar con: npx tsx scripts/migrate-faq-to-db.ts
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { faqEntries } from '../lib/schema';
import { categoriasFaq } from '../data/faq';

async function migrate() {
  const existing = await db.select({ id: faqEntries.id }).from(faqEntries);
  if (existing.length > 0) {
    console.log(`Ya hay ${existing.length} FAQs en la BD. No se migrarán duplicados.`);
    process.exit(0);
  }

  let inserted = 0;
  let order = 0;

  for (const cat of categoriasFaq) {
    for (const pq of cat.preguntas) {
      await db.insert(faqEntries).values({
        category: cat.slug,
        question: pq.pregunta,
        answer: pq.respuesta,
        sortOrder: order++,
        published: true,
      });
      inserted++;
    }
    console.log(`Migrada categoría: ${cat.slug} (${cat.preguntas.length} preguntas)`);
  }

  console.log(`\nTotal FAQs migradas: ${inserted}`);
}

migrate()
  .then(() => { console.log('Migración completada.'); process.exit(0); })
  .catch(e => { console.error('Error en migración:', e); process.exit(1); });
