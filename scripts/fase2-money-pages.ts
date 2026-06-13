import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface PageData {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: string;
  file: string;
}

const pages: PageData[] = [
  {
    slug: 'abogados-en-nacaome',
    title: 'Abogados en Nacaome, Valle: Asesoría Legal Local con Presencia Real',
    description: 'Bufete de abogados en Nacaome, Valle con más de 15 años de experiencia. Derecho penal, laboral, familia, civil y mercantil en la zona sur de Honduras. Atención personalizada.',
    category: 'practica-legal',
    tags: ['abogados en Nacaome', 'bufete Valle', 'abogados zona sur Honduras', 'Nacaome', 'asesoría legal local'],
    readingTime: '6 min',
    file: 'M1-abogados-en-nacaome.html',
  },
  {
    slug: 'abogados-en-choluteca',
    title: 'Abogados en Choluteca: Defensa Legal en la Zona Sur de Honduras',
    description: 'Abogados en Choluteca con presencia real en los juzgados de la zona sur. Penal, laboral, familia, civil, mercantil y bancario. Atención rápida para casos urgentes.',
    category: 'practica-legal',
    tags: ['abogados en Choluteca', 'defensa penal Choluteca', 'abogado laboral Choluteca', 'abogado familia Choluteca', 'zona sur Honduras'],
    readingTime: '6 min',
    file: 'M2-abogados-en-choluteca.html',
  },
  {
    slug: 'abogados-en-san-lorenzo',
    title: 'Abogados en San Lorenzo, Valle: Asesoría Comercial y Aduanera',
    description: 'Abogados en San Lorenzo, Valle especializados en derecho aduanero, mercantil y laboral. Asesoría a importadores, empresas y particulares en el puerto de San Lorenzo.',
    category: 'practica-legal',
    tags: ['abogados en San Lorenzo', 'abogado aduanero San Lorenzo', 'asesoría legal puerto San Lorenzo', 'derecho mercantil', 'zona sur Honduras'],
    readingTime: '5 min',
    file: 'M3-abogados-en-san-lorenzo.html',
  },
];

async function main() {
  console.log('Insertando ' + pages.length + ' páginas de dinero...\n');
  for (const p of pages) {
    const filePath = path.join('auditoria-blog', p.file);
    if (!fs.existsSync(filePath)) { console.log('  ✗ No encontrado: ' + filePath); continue; }
    const body = fs.readFileSync(filePath, 'utf-8');

    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, p.slug));
    if (existing) {
      await db.update(blogPosts).set({
        title: p.title, description: p.description, body,
        category: p.category, tags: p.tags, readingTime: p.readingTime,
        coverImage: '/images/blog/' + p.slug + '.webp',
        updatedAt: new Date(),
      }).where(eq(blogPosts.id, existing.id));
      console.log('  ✓ Actualizado: ' + p.slug);
    } else {
      await db.insert(blogPosts).values({
        slug: p.slug, title: p.title, description: p.description, body,
        publishedAt: new Date(), category: p.category, tags: p.tags,
        author: 'Pineda y Asociados', readingTime: p.readingTime,
        coverImage: '/images/blog/' + p.slug + '.webp',
        featured: false, published: true,
      });
      console.log('  ✓ Insertado: ' + p.slug);
    }
  }
  console.log('\nFASE 2 completada: 3 páginas de dinero creadas.');
}
main().catch(console.error);
