import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const args = process.argv.slice(2);
  const loteNumStr = args.find(a => a.startsWith('--lote='))?.split('=')[1];
  if (!loteNumStr) {
    console.error("Missing --lote=N parameter");
    process.exit(1);
  }
  const loteNum = parseInt(loteNumStr);

  const planPath = path.join(__dirname, '../docs/audits/fase6-plan-ejecucion-lotes.json');
  if (!fs.existsSync(planPath)) {
    console.error("Plan file not found: run calculate inventories first");
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  const lote = plan.lotes.find((l: any) => l.numero === loteNum);
  if (!lote) {
    console.error(`Lote ${loteNum} not found in plan`);
    process.exit(1);
  }

  console.log(`Preparing Lote ${loteNum} with ${lote.cantidad} articles...`);

  const posts = await db.select().from(blogPosts).where(inArray(blogPosts.slug, lote.slugs));
  
  // Save backup
  const backupDir = path.join(__dirname, '../.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, `fase6-lote-${loteNum}-backup.json`), JSON.stringify(posts, null, 2));

  // Write entrance files
  const loteDir = path.join(__dirname, `../docs/audits/fase6/lote-${loteNum}`);
  if (!fs.existsSync(loteDir)) fs.mkdirSync(loteDir, { recursive: true });

  for (const post of posts) {
    const postDir = path.join(loteDir, post.slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    const entrada = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      category: post.category,
      tags: post.tags,
      author: post.author,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      canonicalUrl: post.canonicalUrl,
      reviewStatus: post.reviewStatus,
      aiReviewStatus: post.aiReviewStatus
    };

    fs.writeFileSync(path.join(postDir, 'entrada.json'), JSON.stringify(entrada, null, 2));
  }

  console.log(`Successfully prepared Lote ${loteNum}.`);
}

main().catch(console.error);
