import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const fixes: Record<string, string> = {
  'abogados-en-amapala-valle': 'Abogados en Amapala, Valle. Asesoria legal en derecho penal, de familia, civil y laboral. Atencion presencial en la isla y alrededores. Consulte sin compromiso.',
  'abogados-en-san-lorenzo': 'Servicios legales en San Lorenzo, Valle: derecho penal, aduanero, mercantil, laboral y civil. Cobertura en el puerto y zona comercial del sur de Honduras.',
  'abogados-en-choluteca': 'Servicios de abogados en Choluteca, Honduras: derecho penal, familia, laboral, civil y mercantil. Atencion desde Nacaome con cobertura en todo el departamento.',
};

async function main() {
  for (const [slug, desc] of Object.entries(fixes)) {
    const len = desc.length;
    const status = len >= 120 && len <= 160 ? 'OK' : len < 120 ? 'SHORT' : 'LONG';
    console.log(`${slug}: ${len}c [${status}]`);
    console.log(`  ${desc}`);

    await db.update(blogPosts)
      .set({ metaDescription: desc } as any)
      .where(eq(blogPosts.slug, slug));
  }
  console.log(`\nCorregidas ${Object.keys(fixes).length} meta descriptions`);
}

main().catch(console.error);
