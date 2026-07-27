import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import crypto from 'crypto';

function sha256(content: string) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}

async function main() {
  const all = await db.select().from(blogPosts);
  
  const snapshot = all.map(p => ({
    id: p.id,
    slug: p.slug,
    body: p.body,
    bodyHash: sha256(p.body || ''),
    title: p.title,
    description: p.metaDescription, // from schema or just p.description if it exists
    published: (p as any).isPublished,
    estado: p.reviewStatus,
    requires_human: (p as any).requiresHumanReview,
    claims_totales: 0, // derived from JSON if exists, but we just dump schema fields
    confirmed: 0,
    corrected: 0,
    unresolved: 0,
    fuentes: [],
    version: (p as any).version,
    created_at: (p as any).createdAt,
    updated_at: p.updatedAt,
    aiReviewStatus: p.aiReviewStatus,
    aiReviewBatch: (p as any).aiReviewBatch || null // just in case
  }));

  const secretsDir = path.join(__dirname, '../.secrets');
  if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir, { recursive: true });

  const snapshotPath = path.join(secretsDir, 'fase6-pre-rollback-neon-snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  // Summary
  const stateDistribution = snapshot.reduce((acc, curr) => {
    acc[curr.estado || 'null'] = (acc[curr.estado || 'null'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resumen = {
    total_filas: snapshot.length,
    hash_global: sha256(JSON.stringify(snapshot.map(s => s.bodyHash))),
    distribucion_estados: stateDistribution,
    items: snapshot.map(s => ({ slug: s.slug, hash: s.bodyHash, estado: s.estado, version: s.version }))
  };

  const docsDir = path.join(__dirname, '../docs/audits');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'fase6-pre-rollback-neon-resumen.json'), JSON.stringify(resumen, null, 2));

  console.log("Snapshot y resumen generados.");
}

main().catch(console.error);
