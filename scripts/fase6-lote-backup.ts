import fs from 'fs';
import path from 'path';

function main() {
  const bodiesPath = path.join(__dirname, '../docs/audits/fase6-lote4-bodies.json');
  const bodies = JSON.parse(fs.readFileSync(bodiesPath, 'utf-8'));

  const backupDir = path.join(__dirname, '../.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const backupData = bodies.map((post: any) => ({
    slug: post.slug,
    body: post.body,
    title: post.title,
    description: post.description,
    category: post.category,
    publishedAt: post.publishedAt,
    aiReviewStatus: post.aiReviewStatus,
    hash: 'sha256-' + Buffer.from(post.body).toString('base64').substring(0, 32) // Simulado para backup
  }));

  const backupPath = path.join(backupDir, 'fase6-lote4-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  console.log(`Backup creado en ${backupPath} con ${backupData.length} registros.`);
}

main();
