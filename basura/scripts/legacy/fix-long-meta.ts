/**
 * Corrige meta_title >60c y meta_description >160c en posts publicados
 */
import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { blogCategories } from '@/data/blog/categories';

const BRAND = 'Pineda y Asociados';

function fixMetaTitle(title: string, current: string): string {
  // Try to shorten smartly
  let t = current.trim();
  if (t.length <= 60) return t;

  // Remove "| Pineda y Asociados" suffix if present
  t = t.replace(/\s*\|\s*Pineda\s+y\s+Asociados\s*$/i, '');
  // Remove "— Pineda y Asociados"
  t = t.replace(/\s*[—–-]\s*Pineda\s+y\s+Asociados\s*$/i, '');

  if (t.length <= 60) return t;

  // More aggressive: remove parenthetical clarifications
  t = t.replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= 60) return t;

  // Use the post title as base if shorter
  if (title.length <= 60 && title.length >= 20) return title;

  return t.substring(0, 57).trim() + '...';
}

function fixMetaDesc(desc: string): string {
  let d = desc.trim();
  if (d.length <= 160) return d;

  // Cut at last sentence boundary before 157
  const cut = d.substring(0, 157);
  const lastDot = cut.lastIndexOf('.');
  const lastSpace = cut.lastIndexOf(' ');
  const boundary = lastDot > 80 ? lastDot : lastSpace;
  if (boundary > 80) {
    d = d.substring(0, boundary + 1).trim();
    if (!d.endsWith('.')) d += '.';
  } else {
    d = cut.trim() + '...';
  }
  return d;
}

async function main() {
  const posts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    title: blogPosts.title,
    metaTitle: blogPosts.metaTitle,
    metaDescription: blogPosts.metaDescription,
  }).from(blogPosts)
    .where(eq(blogPosts.published, true));

  console.log(`Total: ${posts.length}\n`);

  let fixedTitle = 0;
  let fixedDesc = 0;

  for (const p of posts) {
    const needsTitle = p.metaTitle && p.metaTitle.length > 60;
    const needsDesc = p.metaDescription && p.metaDescription.length > 160;

    if (!needsTitle && !needsDesc) continue;

    const newTitle = needsTitle ? fixMetaTitle(p.title, p.metaTitle!) : p.metaTitle!;
    const newDesc = needsDesc ? fixMetaDesc(p.metaDescription!) : p.metaDescription!;

    if (newTitle.length <= 60 && newDesc.length <= 160) {
      await db.update(blogPosts)
        .set({
          metaTitle: newTitle,
          metaDescription: newDesc,
        } as any)
        .where(eq(blogPosts.id, p.id));

      if (needsTitle) {
        console.log(`  ${p.slug}: meta_title ${p.metaTitle!.length}c → ${newTitle.length}c`);
        fixedTitle++;
      }
      if (needsDesc) {
        console.log(`  ${p.slug}: meta_desc ${p.metaDescription!.length}c → ${newDesc.length}c`);
        fixedDesc++;
      }
    } else {
      // Still out of range, log for manual review
      if (newTitle.length > 60) console.log(`  ⚠ ${p.slug}: title STILL ${newTitle.length}c: ${newTitle.substring(0, 60)}`);
      if (newDesc.length > 160) console.log(`  ⚠ ${p.slug}: desc STILL ${newDesc.length}c`);
    }
  }

  console.log(`\n✓ Fixed: ${fixedTitle} titles, ${fixedDesc} descriptions`);
  await db.$client?.end?.();
}

main().catch(console.error);
