import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { sql } from 'drizzle-orm';

async function main() {
  // 1. Artículos con disclaimer en el body
  const conDisclaimer = await db.select({slug: blogPosts.slug, title: blogPosts.title})
    .from(blogPosts)
    .where(sql`body ILIKE '%descargo%' OR body ILIKE '%disclaimer%' OR body ILIKE '%no constituye asesor%'`);
  console.log('Artículos con disclaimer en body:', conDisclaimer.length);
  conDisclaimer.forEach(p => console.log(' ', p.slug));

  // 2. Artículos con metaTitle NULL
  const sinMetaTitle = await db.select({slug: blogPosts.slug, title: blogPosts.title})
    .from(blogPosts)
    .where(sql`meta_title IS NULL AND published = true`);
  console.log('\nArtículos con metaTitle NULL:', sinMetaTitle.length);
  sinMetaTitle.forEach(p => console.log(' ', p.slug));

  // 3. Posibles titles truncados
  const truncados = await db.select({slug: blogPosts.slug, title: blogPosts.title})
    .from(blogPosts)
    .where(sql`published = true AND (title LIKE ${'% y'} OR title LIKE ${'% e'} OR title LIKE ${'%…'} OR title LIKE ${'%..'} OR title LIKE ${'%.'})`);
  const sospechosos = truncados.filter(p => {
    const t = p.title;
    return t.endsWith(' y') || t.endsWith(' e') || t.endsWith('…') || (t.length < 40 && t.endsWith('.'));
  });
  console.log('\nArtículos con posible title truncado:', sospechosos.length);
  sospechosos.forEach(p => console.log(' ', p.slug, '-> "', p.title, '" (', p.title.length, 'chars)'));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
