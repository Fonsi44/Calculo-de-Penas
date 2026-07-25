import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

/**
 * Migración directa de enlaces internos en contenido de blog (Neon).
 *
 * Estrategia: buscar texto plano en el HTML del body y envolverlo
 * en un anchor si no está ya dentro de un enlace.
 *
 * Uso:
 *   npx tsx scripts/migrate-links-direct.ts          # aplicar
 *   npx tsx scripts/migrate-links-direct.ts --dry-run # vista previa
 */

type LinkOp = {
  slug: string;
  searchText: string;
  href: string;
  label: string;
};

const OPERATIONS: LinkOp[] = [
  // pensión-alimenticia-porcentaje → guía + servicio
  { slug: 'pension-alimenticia-porcentaje-honduras-2026', searchText: 'solicitar pensión alimenticia', href: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa', label: 'cómo solicitar y demandar la pensión alimenticia' },
  { slug: 'pension-alimenticia-porcentaje-honduras-2026', searchText: 'abogado de familia', href: '/servicios-juridicos/derecho-de-familia', label: 'abogado de derecho de familia' },
  // pensión-alimenticia-guía → porcentajes + servicio
  { slug: 'pension-alimenticia-honduras-guia-completa', searchText: 'porcentaje de la pensión alimenticia', href: '/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026', label: 'porcentajes y cálculo de la pensión' },
  { slug: 'pension-alimenticia-honduras-guia-completa', searchText: 'abogado de familia', href: '/servicios-juridicos/derecho-de-familia', label: 'abogado especialista en derecho de familia' },
  // prescripción → daños + servicio
  { slug: 'prescripcion-deudas-plazos-honduras', searchText: 'Plazos legales', href: '/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras', label: 'daños y perjuicios en Honduras' },
  { slug: 'prescripcion-deudas-plazos-honduras', searchText: 'Código Civil', href: '/servicios-juridicos/derecho-civil-y-notarial', label: 'servicios de notarial y derecho civil' },
  // daños → prescripción + servicio
  { slug: 'danos-perjuicios-indemnizacion-honduras', searchText: 'plazos legales', href: '/blog/derecho-civil/prescripcion-deudas-plazos-honduras', label: 'prescripción en Honduras' },
  { slug: 'danos-perjuicios-indemnizacion-honduras', searchText: 'representación legal', href: '/servicios-juridicos/derecho-civil-y-notarial', label: 'abogado civil en Honduras' },
  // poder-legal → servicio
  { slug: 'poder-legal-honduras-cuando-se-necesita', searchText: 'representación', href: '/servicios-juridicos/derecho-civil-y-notarial', label: 'servicios de derecho civil y notarial' },
  // custodia → divorcio + servicio
  { slug: 'custodia-hijos-honduras-juez', searchText: 'divorcio', href: '/blog/derecho-de-familia/divorcio-honduras-guia-completa', label: 'proceso de divorcio en Honduras' },
  { slug: 'custodia-hijos-honduras-juez', searchText: 'derecho de familia', href: '/servicios-juridicos/derecho-de-familia', label: 'abogado de derecho de familia' },
  // divorcio → custodia + pensión + servicio
  { slug: 'divorcio-honduras-guia-completa', searchText: 'custodia de hijos', href: '/blog/derecho-de-familia/custodia-hijos-honduras-juez', label: 'custodia de hijos en Honduras' },
  { slug: 'divorcio-honduras-guia-completa', searchText: 'pensión alimenticia', href: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa', label: 'pensión alimenticia en Honduras' },
  { slug: 'divorcio-honduras-guia-completa', searchText: 'derecho de familia', href: '/servicios-juridicos/derecho-de-familia', label: 'servicios de derecho de familia' },
];

const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups', 'fase3b-links');

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Inserta un enlace solo si el searchText aparece fuera de cualquier anchor */
function injectLink(html: string, searchText: string, href: string, label: string): string {
  if (html.includes(href)) return html; // already linked (idempotent)

  const lowerHtml = html.toLowerCase();
  const lowerSearch = searchText.toLowerCase();
  let pos = 0;
  const result: string[] = [];
  let linked = false;

  while (!linked) {
    const idx = lowerHtml.indexOf(lowerSearch, pos);
    if (idx === -1) break;

    // Check if inside an existing anchor by scanning backwards for <a or </a>
    const before = html.slice(Math.max(0, idx - 200), idx);
    const lastOpenA = before.lastIndexOf('<a');
    const lastCloseA = before.lastIndexOf('</a>');

    // If we find an <a without a preceding </a, the text is inside an anchor
    if (lastOpenA > lastCloseA) {
      pos = idx + 1; // skip and keep looking
      continue;
    }

    // Found text not in anchor — link it
    const matchedText = html.slice(idx, idx + searchText.length);
    result.push(html.slice(pos, idx));
    result.push(`<a href="${href}" class="context-link">${matchedText}</a>`);
    pos = idx + searchText.length;
    linked = true;
  }

  if (!linked) return html; // no changes

  result.push(html.slice(pos));
  return result.join('');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const slugs = [...new Set(OPERATIONS.map(op => op.slug))];
  
  const posts = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    body: blogPosts.body,
  }).from(blogPosts).where(inArray(blogPosts.slug, slugs));

  if (posts.length === 0) {
    console.error('No posts found in DB');
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Migración directa — ${isDryRun ? 'DRY RUN' : 'APLICACIÓN'}\n`);

  let totalLinks = 0;
  let totalModified = 0;

  for (const post of posts) {
    const postOps = OPERATIONS.filter(op => op.slug === post.slug);
    let body = post.body || '';
    const original = body;
    let linksAdded = 0;

    for (const op of postOps) {
      const newBody = injectLink(body, op.searchText, op.href, op.label);
      if (newBody !== body) {
        console.log(`  ${post.slug}: + "${op.label}" → ${op.href}`);
        body = newBody;
        linksAdded++;
        totalLinks++;
      }
    }

    if (linksAdded > 0) {
      totalModified++;
      const backupFile = path.join(BACKUP_DIR, `${post.slug}.html`);
      if (!isDryRun) {
        fs.writeFileSync(backupFile, original);
        await db.update(blogPosts)
          .set({ body, updatedAt: new Date() })
          .where(eq(blogPosts.slug, post.slug));
        console.log(`  ✅ ${post.slug}: backup + DB updated (${linksAdded} links)`);
      } else {
        // Show diff
        console.log(`  📋 ${post.slug}: ${linksAdded} enlaces (dry-run)`);
      }
    } else {
      const foundTexts = postOps.map(op => `"${op.searchText}"`).join(', ');
      console.log(`  ⚠️  ${post.slug}: text not found (searched: ${foundTexts})`);
    }
  }

  console.log(`\nResumen: ${totalModified}/${slugs.length} posts, ${totalLinks} enlaces`);
  if (isDryRun) console.log('DRY RUN — nada escrito en DB');
}

main().catch(e => { console.error(e); process.exit(1); });
