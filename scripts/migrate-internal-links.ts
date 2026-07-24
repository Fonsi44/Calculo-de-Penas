import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

/**
 * Migración editorial Fase 3 — Enlazado interno contextual
 *
 * Inserta enlaces internos en los cuerpos HTML de los posts prioritarios
 * hacia servicios relacionados y otros posts del clúster.
 *
 * Uso:
 *   npx tsx scripts/migrate-internal-links.ts          # aplicar
 *   npx tsx scripts/migrate-internal-links.ts --dry-run # solo mostrar cambios
 *   npx tsx scripts/migrate-internal-links.ts --rollback # restaurar backup
 */

interface LinkRule {
  /** Patrón de texto donde insertar (cerca de esta frase) */
  nearText: string;
  /** Texto exacto a envolver en enlace (debe aparecer en el body) */
  targetText: string;
  /** URL de destino */
  href: string;
  /** Slug del post destino (para deduplicación) */
  toSlug?: string;
}

type PostMigration = {
  slug: string;
  links: LinkRule[];
};

const MIGRATIONS: PostMigration[] = [
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    links: [
      {
        nearText: 'proceso legal',
        targetText: 'solicitar y demandar la pensión alimenticia',
        href: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
        toSlug: 'pension-alimenticia-honduras-guia-completa',
      },
      {
        nearText: 'asesoría legal',
        targetText: 'abogado de derecho de familia',
        href: '/servicios-juridicos/derecho-de-familia',
      },
    ],
  },
  {
    slug: 'pension-alimenticia-honduras-guia-completa',
    links: [
      {
        nearText: 'porcentaje',
        targetText: 'porcentajes y cálculo de la pensión según el número de hijos',
        href: '/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026',
        toSlug: 'pension-alimenticia-porcentaje-honduras-2026',
      },
      {
        nearText: 'representación',
        targetText: 'abogado especialista en derecho de familia',
        href: '/servicios-juridicos/derecho-de-familia',
      },
    ],
  },
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    links: [
      {
        nearText: 'reclamaciones civiles',
        targetText: 'demanda por daños y perjuicios',
        href: '/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras',
        toSlug: 'danos-perjuicios-indemnizacion-honduras',
      },
      {
        nearText: 'asesoría legal',
        targetText: 'servicios de derecho civil y notarial',
        href: '/servicios-juridicos/derecho-civil-y-notarial',
      },
    ],
  },
  {
    slug: 'danos-perjuicios-indemnizacion-honduras',
    links: [
      {
        nearText: 'plazos legales',
        targetText: 'prescripción de deudas en Honduras',
        href: '/blog/derecho-civil/prescripcion-deudas-plazos-honduras',
        toSlug: 'prescripcion-deudas-plazos-honduras',
      },
      {
        nearText: 'representación',
        targetText: 'abogado especialista en derecho civil en Honduras',
        href: '/servicios-juridicos/derecho-civil-y-notarial',
      },
    ],
  },
  {
    slug: 'poder-legal-honduras-cuando-se-necesita',
    links: [
      {
        nearText: 'trámites notariales',
        targetText: 'derecho civil y notarial',
        href: '/servicios-juridicos/derecho-civil-y-notarial',
      },
    ],
  },
  {
    slug: 'custodia-hijos-honduras-juez',
    links: [
      {
        nearText: 'separación',
        targetText: 'proceso de divorcio en Honduras',
        href: '/blog/derecho-de-familia/divorcio-honduras-guia-completa',
        toSlug: 'divorcio-honduras-guia-completa',
      },
      {
        nearText: 'representación',
        targetText: 'abogado de derecho de familia',
        href: '/servicios-juridicos/derecho-de-familia',
      },
    ],
  },
  {
    slug: 'divorcio-honduras-guia-completa',
    links: [
      {
        nearText: 'hijos menores',
        targetText: 'custodia de hijos en Honduras',
        href: '/blog/derecho-de-familia/custodia-hijos-honduras-juez',
        toSlug: 'custodia-hijos-honduras-juez',
      },
      {
        nearText: 'obligaciones económicas',
        targetText: 'pensión alimenticia en Honduras',
        href: '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
        toSlug: 'pension-alimenticia-honduras-guia-completa',
      },
      {
        nearText: 'asesoría legal',
        targetText: 'servicios de derecho de familia',
        href: '/servicios-juridicos/derecho-de-familia',
      },
    ],
  },
];

const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups', 'fase3-links');

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectLink(html: string, targetText: string, href: string): string {
  // Skip if link already exists
  if (html.includes(href)) return html;

  // Look for the target text not already inside an anchor
  const escaped = escapeRegex(targetText);
  const regex = new RegExp(`(?!(?:[^<]+>|[^>]+<\\/a>))${escaped}(?!\\s*<\\/a)`, 'gi');
  
  if (regex.test(html)) {
    return html.replace(regex, `<a href="${href}" class="context-link">${targetText}</a>`);
  }
  return html;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isRollback = process.argv.includes('--rollback');

  if (isRollback) {
    console.log('Rollback no implementado — los backups se guardan en', BACKUP_DIR);
    console.log('Para restaurar: copiar el backup correspondiente a la DB manualmente.');
    return;
  }

  const slugs = MIGRATIONS.map(m => m.slug);
  const posts = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    body: blogPosts.body,
    updatedAt: blogPosts.updatedAt,
  }).from(blogPosts).where(inArray(blogPosts.slug, slugs));

  if (posts.length === 0) {
    console.error('No se encontraron posts en la DB');
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  console.log(`Migración de enlaces internos — ${isDryRun ? 'DRY RUN (sin escritura)' : 'APLICACIÓN'}\n`);

  let totalModified = 0;
  let totalLinks = 0;

  for (const post of posts) {
    const migration = MIGRATIONS.find(m => m.slug === post.slug)!;
    let body = post.body || '';
    const original = body;
    let linksAdded = 0;

    for (const link of migration.links) {
      const newBody = injectLink(body, link.targetText, link.href);
      if (newBody !== body) {
        console.log(`${post.slug}: + "${link.targetText}" → ${link.href}`);
        body = newBody;
        linksAdded++;
        totalLinks++;
      }
    }

    if (linksAdded > 0) {
      totalModified++;
      // Save backup
      const backupFile = path.join(BACKUP_DIR, `${post.slug}.html`);
      if (!isDryRun) {
        fs.writeFileSync(backupFile, original);
        console.log(`  Backup guardado: ${backupFile}`);

        // Update DB
        await db.update(blogPosts)
          .set({ body, updatedAt: new Date() })
          .where(eq(blogPosts.slug, post.slug));
        console.log(`  DB actualizada: ${post.slug}`);
      }
    } else {
      console.log(`${post.slug}: sin cambios (enlaces ya existentes o texto no encontrado)`);
    }
  }

  console.log(`\nResumen:`);
  console.log(`  Posts modificados: ${totalModified}/${MIGRATIONS.length}`);
  console.log(`  Enlaces añadidos: ${totalLinks}`);
  console.log(`  Backups en: ${BACKUP_DIR}`);
  if (isDryRun) {
    console.log('  Modo: DRY RUN — no se escribió nada en DB');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
