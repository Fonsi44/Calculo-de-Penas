/**
 * Generador automático de meta_title y meta_description para posts del blog
 * que no tienen metadatos SEO personalizados.
 * 
 * Estrategia:
 * - meta_title: usa el title del post, truncado a ≤60c si es necesario
 * - meta_description: usa la description del post (truncada a ≤160c) o extrae del body
 * 
 * Ejecución segura: genera SQL en vez de escribir directamente.
 * Para aplicar, usar --apply.
 */
import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, sql, isNull } from 'drizzle-orm';

const BRAND = 'Pineda y Asociados';

function smartMetaTitle(title: string): string {
  let t = title.trim();
  if (t.length <= 60) return t;

  // Remove " - Guía Completa", "Guía Completa de", etc from end
  t = t.replace(/\s*[-–—]\s*Gu[aí]a\s+(Completa|Legal|Práctica)(\s+de\s+.*?)?$/gi, '');
  t = t.replace(/\s*:\s*Gu[aí]a\s+(Completa|Legal|Práctica|Definitiva)(\s+de\s+.*?)?$/gi, '');
  t = t.replace(/\s*:\s*Todo\s+lo\s+que\s+(Debe|Necesita)\s+Saber$/gi, '');

  if (t.length <= 60) return t;

  // Try truncating the last sentence before a colon or comma
  const lastColon = t.lastIndexOf(':');
  const lastComma = t.lastIndexOf(',');
  const cutPoint = Math.max(lastColon, lastComma);
  if (cutPoint > 20 && cutPoint < t.length - 5) {
    const truncated = t.substring(0, cutPoint).trim();
    if (truncated.length <= 60 && truncated.length >= 30) return truncated;
  }

  // Fallback: truncate to 57 chars and add "..."
  return t.substring(0, 57).trim() + '...';
}

function smartMetaDescription(description: string, bodyText: string): string {
  const clean = (s: string) => s
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let desc = clean(description || '');

  // If description is already 120-160, use it
  if (desc.length >= 120 && desc.length <= 160) return desc;

  // If too short, append from body
  if (desc.length < 120 && bodyText) {
    const cleanBody = clean(bodyText);
    const needed = 160 - desc.length;
    if (desc.length > 0) desc += '. ';
    const fromBody = cleanBody.substring(0, needed);
    // Cut at last sentence boundary
    const lastDot = fromBody.lastIndexOf('.');
    if (lastDot > 50) {
      desc += fromBody.substring(0, lastDot + 1);
    } else {
      desc += fromBody;
    }
  }

  // Truncate to 160 if still too long
  if (desc.length > 160) {
    const cut = desc.substring(0, 157);
    const lastSpace = cut.lastIndexOf(' ');
    const lastDot = cut.lastIndexOf('.');
    const boundary = Math.max(lastSpace, lastDot);
    if (boundary > 80) {
      desc = desc.substring(0, boundary + 1).trim();
      if (!desc.endsWith('.')) desc += '.';
    } else {
      desc = cut.trim() + '...';
    }
  }

  return desc;
}

async function main() {
  const applyFix = process.argv.includes('--apply');

  // Fetch posts without custom meta_title
  const posts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    title: blogPosts.title,
    description: blogPosts.description,
    body: blogPosts.body,
    metaTitle: blogPosts.metaTitle,
    metaDescription: blogPosts.metaDescription,
  }).from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(sql`category, published_at DESC`);

  console.log(`Total publicados: ${posts.length}\n`);
  const noMetaTitle = posts.filter(p => !p.metaTitle);
  const noMetaDesc = posts.filter(p => !p.metaDescription);
  console.log(`Sin meta_title: ${noMetaTitle.length}`);
  console.log(`Sin meta_description: ${noMetaDesc.length}`);

  const updates: { slug: string; metaTitle: string; metaDescription: string }[] = [];

  for (const p of posts) {
    const needsTitle = !p.metaTitle;
    const needsDesc = !p.metaDescription;
    if (!needsTitle && !needsDesc) continue;

    const cleanBody = (p.body || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    const newMetaTitle = needsTitle ? smartMetaTitle(p.title) : p.metaTitle!;
    const newMetaDesc = needsDesc
      ? smartMetaDescription(p.description || '', cleanBody)
      : p.metaDescription!;

    updates.push({
      slug: p.slug,
      metaTitle: newMetaTitle,
      metaDescription: newMetaDesc,
    });

    const titleChanged = needsTitle && newMetaTitle !== p.title;
    const descChanged = needsDesc;

    if (applyFix) {
      const updateData: Record<string, string> = {};
      if (needsTitle) updateData.metaTitle = newMetaTitle;
      if (needsDesc) updateData.metaDescription = newMetaDesc;

      await db.update(blogPosts)
        .set(updateData as any)
        .where(eq(blogPosts.id, p.id));
    }

    if (titleChanged || descChanged) {
      console.log(`  ${p.slug}:`);
      if (titleChanged) console.log(`    meta_title (${newMetaTitle.length}c): ${newMetaTitle}`);
      if (descChanged) console.log(`    meta_desc  (${newMetaDesc.length}c): ${newMetaDesc.substring(0, 80)}...`);
    }
  }

  if (applyFix) {
    console.log(`\n✓ Aplicados ${updates.length} cambios en la DB.`);
  } else {
    console.log(`\n⚠ Dry-run. ${updates.length} cambios pendientes. Usa --apply para aplicarlos.`);
    // Verify counts
    const badMetaTitle = updates.filter(u => u.metaTitle.length > 60);
    const badMetaDesc = updates.filter(u => u.metaDescription.length < 120 || u.metaDescription.length > 160);
    if (badMetaTitle.length > 0) {
      console.log(`\n⚠ meta_title >60c: ${badMetaTitle.length}`);
      for (const b of badMetaTitle) console.log(`  ${b.slug}: ${b.metaTitle.length}c`);
    }
    if (badMetaDesc.length > 0) {
      console.log(`\n⚠ meta_desc fuera de rango: ${badMetaDesc.length}`);
      for (const b of badMetaDesc) console.log(`  ${b.slug}: ${b.metaDescription.length}c`);
    }
  }

  await db.$client?.end?.();
}

main().catch(console.error);
