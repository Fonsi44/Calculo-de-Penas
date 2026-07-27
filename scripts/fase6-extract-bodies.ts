import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const lote4 = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/audits/fase6-lote4-seleccion.json'), 'utf-8'));
  const slugs = lote4.seleccionados.map((s: any) => s.slug);
  
  const posts = await db.select().from(blogPosts).where(inArray(blogPosts.slug, slugs));
  
  fs.writeFileSync(path.join(__dirname, '../docs/audits/fase6-lote4-bodies.json'), JSON.stringify(posts, null, 2));
  console.log(`Guardados ${posts.length} posts en fase6-lote4-bodies.json`);
}

main().catch(console.error);
