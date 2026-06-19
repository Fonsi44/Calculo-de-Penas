// Backup de los 159 posts publicados antes de reescribir.
// Ejecutar: npx tsx scripts/backup-posts.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const OUTPUT = resolve(process.cwd(), 'docs/backups/backup-pre-rewrite-19jun2026.json');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada.');
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL));

async function main() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const backup = posts.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    body: p.body,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    category: p.category,
    tags: p.tags,
    author: p.author,
    readingTime: p.readingTime,
    coverImage: p.coverImage,
    featured: p.featured,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    ogImage: p.ogImage,
    noindex: p.noindex,
    canonicalUrl: p.canonicalUrl,
    reviewStatus: p.reviewStatus,
    lastReviewedAt: p.lastReviewedAt,
  }));

  writeFileSync(OUTPUT, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`✅ Backup: ${backup.length} posts → ${OUTPUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
