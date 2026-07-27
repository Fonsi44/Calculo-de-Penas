import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
  const loteNum = parseInt(process.argv[2] || '12');
  const planPath = path.join(__dirname, '../docs/audits/fase6d-lotes-12-14.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  const lote = plan.lotes.find((l: any) => l.numero === loteNum);
  if (!lote) { console.error(`Lote ${loteNum} not found`); process.exit(1); }

  console.log(`Preparing Lote ${loteNum} with ${lote.cantidad} articles...`);
  const posts = await db.select().from(blogPosts).where(inArray(blogPosts.slug, lote.slugs));
  
  const backupDir = path.join(__dirname, '../.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, `fase6d-lote-${loteNum}-backup.json`), JSON.stringify(posts, null, 2));

  const loteDir = path.join(__dirname, `../docs/audits/fase6/lote-${loteNum}`);
  if (!fs.existsSync(loteDir)) fs.mkdirSync(loteDir, { recursive: true });

  for (const post of posts) {
    const postDir = path.join(loteDir, post.slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    const entrada = {
      id: post.id, slug: post.slug, title: post.title,
      description: post.description, body: post.body,
      publishedAt: post.publishedAt, updatedAt: post.updatedAt,
      category: post.category, tags: post.tags, author: post.author,
      metaTitle: post.metaTitle, metaDescription: post.metaDescription,
      canonicalUrl: post.canonicalUrl,
      reviewStatus: post.reviewStatus, aiReviewStatus: post.aiReviewStatus
    };
    fs.writeFileSync(path.join(postDir, 'entrada.json'), JSON.stringify(entrada, null, 2));
  }
  console.log(`Successfully prepared Lote ${loteNum}.`);
}
main();
