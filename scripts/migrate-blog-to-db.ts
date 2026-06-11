/**
 * Migra los posts del blog desde archivos TS estáticos a la base de datos.
 * Ejecutar con: npx tsx scripts/migrate-blog-to-db.ts
 */

import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { posts as allPosts } from '../data/blog/posts/index';

interface PostToMigrate {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  coverImage?: string;
  featured?: boolean;
}

async function migrate() {
  const existing = await db.select({ slug: blogPosts.slug }).from(blogPosts);
  const existingSlugs = new Set(existing.map(r => r.slug));
  console.log(`Posts existentes en DB: ${existingSlugs.size}`);

  let inserted = 0;
  let skipped = 0;

  for (const post of allPosts as PostToMigrate[]) {
    if (existingSlugs.has(post.slug)) {
      skipped++;
      continue;
    }

    await db.insert(blogPosts).values({
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      publishedAt: new Date(post.publishedAt),
      updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
      category: post.category,
      tags: post.tags,
      author: post.author,
      readingTime: post.readingTime,
      coverImage: post.coverImage ?? null,
      featured: post.featured ?? false,
      published: true,
    });

    inserted++;
    if (inserted % 10 === 0) console.log(`Migrados ${inserted} posts...`);
  }

  console.log(`\n--- Resultado ---`);
  console.log(`Posts migrados: ${inserted}`);
  console.log(`Posts saltados (ya existían): ${skipped}`);
  console.log(`Total posts en DB: ${existingSlugs.size + inserted}`);
}

migrate()
  .then(() => { console.log('Migración completada.'); process.exit(0); })
  .catch(e => { console.error('Error en migración:', e); process.exit(1); });
