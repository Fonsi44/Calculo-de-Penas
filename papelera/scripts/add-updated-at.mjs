import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const postsDir = 'data/blog/posts';
const files = readdirSync(postsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

let count = 0;
for (const file of files) {
  const fp = join(postsDir, file);
  let content = readFileSync(fp, 'utf-8');

  if (content.includes('updatedAt:')) continue;

  const m = content.match(/publishedAt:\s*'(\d{4}-\d{2}-\d{2})'/);
  if (!m) continue;

  const pubDate = m[1];
  const d = new Date(pubDate);
  const addDays = 3 + Math.floor(Math.random() * 8);
  d.setDate(d.getDate() + addDays);

  // Clamp to max date
  const maxDate = pubDate > '2026-06-01' ? new Date('2026-07-20') : new Date('2026-06-08');
  if (d > maxDate) d.setTime(maxDate.getTime());

  const updatedAt = d.toISOString().split('T')[0];

  content = content.replace(
    `publishedAt: '${pubDate}'`,
    `publishedAt: '${pubDate}',\n  updatedAt: '${updatedAt}'`
  );

  writeFileSync(fp, content, 'utf-8');
  count++;
}

console.log(`updatedAt añadido a ${count} posts`);
