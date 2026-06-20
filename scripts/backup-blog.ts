/**
 * Backup completo de blog_posts antes de cualquier modificación masiva.
 *
 * Ejecutar: npx tsx scripts/backup-blog.ts
 *
 * Genera dos artefactos en auditoria-blog/:
 *   - backup-YYYY-MM-DD-HHMM.json  → dump completo (restoreable)
 *   - backup-YYYY-MM-DD-HHMM.md     → resumen legible para humanos
 *
 * El JSON contiene todas las columnas necesarias para restaurar el contenido
 * editorial (body, slug, fechas, seo, etc.) en caso de que una operación de
 * escritura produzca resultados no deseados.
 *
 * Es de SOLO LECTURA: no toca la DB. Se debe ejecutar SIEMPRE antes de
 * blog:normalizar:aplicar, blog:review:aplicar o cualquier script que
 * modifique blog_posts en masa.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'auditoria-blog');

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DATABASE_URL. No se puede generar backup.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Dump completo de todas las columnas relevantes.
  const posts = await sql`
    SELECT id, slug, title, description, body, category, tags, author,
           cover_image, meta_title, meta_description, og_image,
           published, published_at, updated_at, creado_en,
           canonical_url, noindex, featured, reading_time,
           review_status, last_reviewed_at, next_review_due_at,
           legal_review_notes, reviewed_by, reviewed_at
    FROM blog_posts
    ORDER BY creado_en ASC
  `;

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const ts = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 16);
  const jsonPath = path.join(BACKUP_DIR, `backup-${ts}.json`);
  const mdPath = path.join(BACKUP_DIR, `backup-${ts}.md`);

  const payload = {
    generatedAt: new Date().toISOString(),
    database: 'blog_posts',
    count: posts.length,
    posts,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  // Resumen legible: una línea por post con sus flags.
  const lines = posts.map((p, i) => {
    const n = String(i + 1).padStart(3, '0');
    const pub = p.published ? '✓' : '✗';
    const noix = p.noindex ? 'noindex' : '       ';
    return `${n} [${pub}] ${noix} ${p.slug}`;
  });
  const md = [
    `# Backup blog_posts — ${new Date().toISOString()}`,
    '',
    `- **Posts:** ${posts.length}`,
    `- **Publicados:** ${posts.filter((p) => p.published).length}`,
    `- **Borradores:** ${posts.filter((p) => !p.published).length}`,
    `- **noindex:** ${posts.filter((p) => p.noindex).length}`,
    `- **con canonical:** ${posts.filter((p) => p.canonical_url).length}`,
    '',
    `Archivo JSON completo: \`${path.basename(jsonPath)}\``,
    '',
    '## Listado',
    '',
    '```',
    ...lines,
    '```',
    '',
  ].join('\n');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`✅ Backup generado: ${posts.length} posts`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   MD:   ${mdPath}`);
}

main().catch((e) => {
  console.error('Error generando backup:', e);
  process.exit(1);
});
