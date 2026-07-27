import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run') || !apply;

  const snapshotPath = path.join(__dirname, '../.secrets/fase6-pre-rollback-neon-snapshot.json');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

  // Load known valid Lote 4 bodies backup to check which were actually part of Lote 4
  const lote4BackupPath = path.join(__dirname, '../.backups/fase6-lote4-backup.json');
  let lote4Slugs = [];
  if (fs.existsSync(lote4BackupPath)) {
    const lote4 = JSON.parse(fs.readFileSync(lote4BackupPath, 'utf-8'));
    lote4Slugs = lote4.map((p: any) => p.slug);
  }

  const listA = []; // Modificadas con evidencia
  const listB = []; // No modificadas o Lotes 1-3
  const listC = []; // Estado incierto

  const now = new Date();

  // Query actual DB state to verify idempotency
  const currentDbRows = await db.select().from(blogPosts);
  const dbMap = new Map(currentDbRows.map(r => [r.slug, r]));

  for (const s of snapshot) {
    const updated = new Date(s.updated_at);
    const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

    // If it's published, we don't touch it (they are valid)
    if (s.estado === 'published') {
      listB.push(s);
      continue;
    }

    if (hoursSinceUpdate < 12) {
      // Updated in the last 12 hours. This is the Lote 4 + fake orchestrator window.
      // Check if it's already restored in the database
      const current = dbMap.get(s.slug);
      const isAlreadyRestored = current && 
        current.reviewStatus === 'needs_human_review' && 
        current.aiReviewStatus === null;

      if (!isAlreadyRestored) {
        listA.push(s);
      } else {
        listB.push(s); // Already restored, no longer needs action
      }
    } else {
      // Older than 12 hours, must be from Lotes 1-3 or untouched
      listB.push(s);
    }
  }

  console.log(`==== DRY RUN: ${dryRun} ====`);
  console.log(`A: Pendientes de rollback (no restauradas aún): ${listA.length}`);
  console.log(`B: Ya en estado esperado / Lotes 1-3 válidos: ${listB.length}`);
  console.log(`C: Incierto: ${listC.length}`);

  if (dryRun) {
    if (listA.length > 0) {
      console.log("\n[DRY RUN] Filas a restaurar:");
      for (const item of listA) {
        console.log(`- Slug: ${item.slug} | Estado actual en snapshot: ${item.estado} -> Esperado: needs_human_review`);
      }
    } else {
      console.log("\n0 filas pendientes de rollback");
    }
  }

  if (apply && listA.length > 0) {
    let count = 0;
    for (const item of listA) {
      await db.update(blogPosts)
        .set({ 
          reviewStatus: 'needs_human_review',
          aiReviewStatus: null
        })
        .where(eq(blogPosts.slug, item.slug));
      count++;
    }
    console.log(`\nAplicado exitosamente el rollback a ${count} filas.`);
  }
}

main().catch(console.error);
