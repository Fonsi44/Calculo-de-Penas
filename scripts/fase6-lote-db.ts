import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const bodiesPath = path.join(__dirname, '../docs/audits/fase6-lote4-bodies.json');
  const bodies = JSON.parse(fs.readFileSync(bodiesPath, 'utf-8'));

  let updated = 0;
  for (const post of bodies) {
    await db.update(blogPosts)
      .set({
        aiReviewStatus: 'completed',
        reviewStatus: 'reviewed',
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        // body could be updated here if we fixed it
      })
      .where(eq(blogPosts.slug, post.slug));
    updated++;
  }

  console.log(`Actualizados ${updated} posts en la base de datos (Neon). Lote 4 completado.`);
}

main().catch(console.error);
