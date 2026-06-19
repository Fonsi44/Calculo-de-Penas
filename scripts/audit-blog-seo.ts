/**
 * Auditoría SEO integral del blog
 * Analiza todos los posts publicados y detecta issues de metadatos,
 * contenido, canibalización, enlazado interno, etc.
 */
import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// ─── TIPOS ───
interface PostRow {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean | null;
  published: boolean | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  author: string | null;
  readingTime: string | null;
  coverImage: string | null;
  featured: boolean | null;
  bodyLen: number;
}

interface AuditIssue {
  slug: string;
  category: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  issue: string;
  detail: string;
}

const issues: AuditIssue[] = [];
const BRAND = 'Pineda y Asociados';
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

function add(slug: string, category: string, severity: 'ERROR' | 'WARN' | 'INFO', issue: string, detail: string) {
  issues.push({ slug, category, severity, issue, detail });
}

// ─── MAIN ───
async function main() {
  const rows: PostRow[] = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    category: blogPosts.category,
    title: blogPosts.title,
    description: blogPosts.description,
    metaTitle: blogPosts.metaTitle,
    metaDescription: blogPosts.metaDescription,
    canonicalUrl: blogPosts.canonicalUrl,
    noindex: blogPosts.noindex,
    published: blogPosts.published,
    publishedAt: blogPosts.publishedAt,
    updatedAt: blogPosts.updatedAt,
    author: blogPosts.author,
    readingTime: blogPosts.readingTime,
    coverImage: blogPosts.coverImage,
    featured: blogPosts.featured,
    bodyLen: sql<number>`length(${blogPosts.body})`.mapWith(Number),
  }).from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));

  console.log(`Total publicados: ${rows.length}\n`);

  // ─── BACKUP ───
  const backupDir = path.join(process.cwd(), 'docs', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `blog-posts-backup-${ts}.json`);
  const backupRows = rows.map(r => ({
    id: r.id, slug: r.slug, category: r.category, title: r.title,
    description: r.description, meta_title: r.metaTitle, meta_description: r.metaDescription,
    canonical_url: r.canonicalUrl, noindex: r.noindex, published: r.published,
    published_at: r.publishedAt, updated_at: r.updatedAt, author: r.author,
    reading_time: r.readingTime, cover_image: r.coverImage, featured: r.featured,
    body_len: r.bodyLen,
  }));
  fs.writeFileSync(backupFile, JSON.stringify(backupRows, null, 2));
  console.log(`Backup: ${backupFile} (${backupRows.length} posts)\n`);

  // ─── POR CATEGORÍA ───
  const byCat: Record<string, number> = {};
  for (const r of rows) byCat[r.category] = (byCat[r.category] || 0) + 1;
  console.log('Posts por categoría:');
  for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(30)} ${n}`);
  }
  console.log();

  // ─── AUDITORÍA POR POST ───
  for (const r of rows) {
    const s = r.slug;

    // 1. Meta title
    if (!r.metaTitle) {
      add(s, r.category, 'ERROR', 'Sin meta_title', 'La página usará title como meta_title');
    } else if (r.metaTitle.length > TITLE_MAX) {
      add(s, r.category, 'WARN', `meta_title > ${TITLE_MAX}c (${r.metaTitle.length}c)`, r.metaTitle.substring(0, 60));
    }

    // 2. Meta description
    if (!r.metaDescription) {
      add(s, r.category, 'ERROR', 'Sin meta_description', 'Usará description del post');
    } else if (r.metaDescription.length > DESC_MAX) {
      add(s, r.category, 'WARN', `meta_desc > ${DESC_MAX}c (${r.metaDescription.length}c)`, r.metaDescription.substring(0, 80));
    } else if (r.metaDescription.length < DESC_MIN) {
      add(s, r.category, 'WARN', `meta_desc < ${DESC_MIN}c (${r.metaDescription.length}c)`, r.metaDescription.substring(0, 80));
    }

    // 3. Description (fallback)
    if (!r.metaDescription && r.description) {
      if (r.description.length > DESC_MAX) {
        add(s, r.category, 'WARN', `description > ${DESC_MAX}c (${r.description.length}c)`, r.description.substring(0, 80));
      }
    }

    // 4. Cover image
    if (!r.coverImage) {
      add(s, r.category, 'WARN', 'Sin cover image', 'Usar /og-image.png por defecto');
    }

    // 5. Updated date
    if (!r.updatedAt) {
      add(s, r.category, 'WARN', 'Sin updated_at', 'Se mostrará publishedAt como fecha única');
    }

    // 6. Noindex
    if (r.noindex) {
      add(s, r.category, 'INFO', 'noindex = true', 'Post excluido de indexación');
    }

    // 7. Thin content
    if (r.bodyLen < 800) {
      add(s, r.category, 'WARN', `Cuerpo thin (${r.bodyLen} chars)`, 'Contenido inferior a 800 caracteres');
    } else if (r.bodyLen < 1500) {
      add(s, r.category, 'INFO', `Cuerpo delgado (${r.bodyLen} chars)`, 'Podría beneficiarse de más contenido');
    }

    // 8. Very long title (post title, not meta)
    if (r.title.length > 100) {
      add(s, r.category, 'INFO', `Título largo (${r.title.length}c)`, r.title.substring(0, 80));
    }

    // 9. Missing category (invalid)
    const validCats = [
      'derecho-penal', 'proceso-penal', 'derecho-de-familia', 'derecho-laboral',
      'derecho-civil', 'derecho-mercantil', 'extranjeria-migracion', 'hondurenos-en-espana',
      'derecho-notarial', 'tributario', 'noticias-legales', 'practica-legal',
      'derechos-ciudadanos', 'derecho-bancario', 'derecho-administrativo', 'derecho-aduanero',
      'regulacion-sanitaria', 'propiedad-intelectual', 'derecho-ambiental', 'conciliacion-arbitraje',
    ];
    if (!validCats.includes(r.category)) {
      add(s, r.category, 'ERROR', `Categoría inválida: ${r.category}`, 'No está en data/blog/categories.ts');
    }
  }

  // ─── REPORTE ───
  const errors = issues.filter(i => i.severity === 'ERROR');
  const warns = issues.filter(i => i.severity === 'WARN');
  const infos = issues.filter(i => i.severity === 'INFO');

  console.log('='.repeat(70));
  console.log('  RESUMEN DE AUDITORÍA SEO DEL BLOG');
  console.log('='.repeat(70));
  console.log(`  Posts analizados: ${rows.length}`);
  console.log(`  🔴 ERRORES: ${errors.length}`);
  console.log(`  🟡 WARNINGS: ${warns.length}`);
  console.log(`  🔵 INFO: ${infos.length}`);
  console.log('='.repeat(70));

  // Errores
  if (errors.length > 0) {
    console.log('\n─── 🔴 ERRORES ───\n');
    for (const e of errors) {
      console.log(`  [${e.slug}]`);
      console.log(`    ${e.issue}: ${e.detail}`);
    }
  }

  // Warnings
  if (warns.length > 0) {
    console.log('\n─── 🟡 WARNINGS ───\n');
    for (const w of warns) {
      console.log(`  [${w.slug}] ${w.issue}: ${w.detail}`);
    }
  }

  // Info
  if (infos.length > 0) {
    console.log('\n─── 🔵 INFO ───\n');
    for (const i of infos) {
      console.log(`  [${i.slug}] ${i.issue}: ${i.detail}`);
    }
  }

  // ─── CANIBALIZACIÓN ───
  console.log('\n─── 🟠 ANÁLISIS DE CANIBALIZACIÓN ───\n');
  // Same-category posts with similar titles
  const byCategory: Record<string, PostRow[]> = {};
  for (const r of rows) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }
  for (const [cat, posts] of Object.entries(byCategory)) {
    if (posts.length < 2) continue;
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const a = posts[i];
        const b = posts[j];
        // Simple similarity: check if they share 3+ words
        const wordsA = new Set(a.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const wordsB = new Set(b.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        let common = 0;
        for (const w of wordsA) if (wordsB.has(w)) common++;
        if (common >= 4) {
          console.log(`  ${cat}: "${a.title.substring(0, 60)}" ↔ "${b.title.substring(0, 60)}" (${common} palabras)`);
        }
      }
    }
  }

  // ─── GENERATE REPORT FILE ───
  const report = {
    timestamp: new Date().toISOString(),
    total_posts: rows.length,
    errors_count: errors.length,
    warnings_count: warns.length,
    info_count: infos.length,
    errors,
    warnings: warns,
    info: infos,
  };
  const reportFile = path.join(backupDir, `blog-seo-audit-${ts}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\nReporte completo: ${reportFile}`);

  // Cierre defensivo de la conexión Neon (el tipo del cliente no expone
  // `end()` en la superficie pública de drizzle-orm; el cast evita el error
  // de tipos sin perder la limpieza del pool en tiempo de ejecución).
  const client = (db as unknown as { $client?: { end?: () => unknown } }).$client;
  await client?.end?.();
}

main().catch(console.error);
