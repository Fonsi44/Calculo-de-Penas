import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const fixes: Record<string, string> = {
  'testamentos-sucesiones-herencia-honduras':
    'Herencias y Sucesiones en Honduras: Del Testamento a la Adjudicación',
  'despido-empleados-publicos-honduras':
    'Despido de Empleados Públicos en Honduras: Causales, Impugnación y Diferencias con el Sector Privado',
  'evaluacion-impacto-ambiental-honduras':
    'Evaluación de Impacto Ambiental en Honduras: Categorías, Procedimiento ante la SERNA y Plazos',
  'tributar-espana-bienes-honduras-guia-fiscal':
    'Tributar en España con Bienes en Honduras: Guía del Convenio de Doble Imposición',
  'contratos-trabajo-tipos-clausulas-honduras':
    'Contratos de Trabajo en Honduras: Tipos, Cláusulas Esenciales y Qué Hacer sin Contrato Escrito',
};

async function main() {
  for (const [slug, newTitle] of Object.entries(fixes)) {
    const [p] = await db.select({ title: blogPosts.title })
      .from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!p) { console.log('Not found: ' + slug); continue; }

    console.log(`${slug}:`);
    console.log(`  ${p.title.length}c → ${newTitle.length}c`);
    console.log(`  OLD: ${p.title}`);
    console.log(`  NEW: ${newTitle}`);

    await db.update(blogPosts)
      .set({ title: newTitle } as any)
      .where(eq(blogPosts.slug, slug));
  }
  console.log(`\nCorregidos ${Object.keys(fixes).length} titulos`);
}

main().catch(console.error);
