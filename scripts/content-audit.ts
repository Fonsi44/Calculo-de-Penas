/**
 * Auditoría de contenido del blog.
 * Ejecutar: npm run content:audit
 * Lista artículos próximos a vencerse para revisión trimestral.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const MAX_DATE = new Date('2026-06-14T23:59:59Z');

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DB disponible. Omitiendo auditoría.');
    process.exit(0);
  }

  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    SELECT slug, title, category, published_at, updated_at, 
           last_reviewed_at, next_review_due_at, review_status, noindex
    FROM blog_posts 
    WHERE published = true 
    ORDER BY next_review_due_at ASC NULLS FIRST
  `;

  const now = new Date();
  const overdue: typeof posts = [];
  const dueSoon: typeof posts = [];
  const ok: typeof posts = [];

  for (const p of posts) {
    const due = p.next_review_due_at ? new Date(p.next_review_due_at) : null;
    if (!due) {
      overdue.push(p);
    } else if (due <= now) {
      overdue.push(p);
    } else {
      const daysUntilDue = (due.getTime() - now.getTime()) / 86400000;
      if (daysUntilDue <= 30) {
        dueSoon.push(p);
      } else {
        ok.push(p);
      }
    }
  }

  console.log('=== AUDITORÍA DE CONTENIDO DEL BLOG ===\n');
  console.log(`Fecha: ${now.toISOString().split('T')[0]}`);
  console.log(`Total artículos publicados: ${posts.length}\n`);

  console.log(`🔴 VENCIDOS (${overdue.length}):`);
  for (const p of overdue) {
    const due = p.next_review_due_at ? new Date(p.next_review_due_at).toISOString().split('T')[0] : 'SIN FECHA';
    const last = p.last_reviewed_at ? new Date(p.last_reviewed_at).toISOString().split('T')[0] : 'NUNCA';
    console.log(`  ${p.slug} — revisión vencida: ${due}, última: ${last}`);
  }

  console.log(`\n🟡 PRÓXIMOS A VENCER (${dueSoon.length} — próximos 30 días):`);
  for (const p of dueSoon) {
    const due = new Date(p.next_review_due_at).toISOString().split('T')[0];
    console.log(`  ${p.slug} — vence: ${due}`);
  }

  console.log(`\n✅ AL DÍA (${ok.length}):`);
  console.log(`  ${ok.length} artículos con revisión vigente.`);

  // Generate report file
  const reportDir = path.join(process.cwd(), 'docs');
  if (fs.existsSync(reportDir)) {
    const reportPath = path.join(reportDir, 'content-review-schedule.md');
    const lines: string[] = [
      '# Programa de revisión de contenido',
      '',
      `**Generado:** ${now.toISOString().split('T')[0]}`,
      `**Total artículos:** ${posts.length}`,
      '',
      '## Vencidos',
      ...overdue.map(p => {
        const due = p.next_review_due_at ? new Date(p.next_review_due_at).toISOString().split('T')[0] : 'SIN FECHA';
        return `- [ ] \`${p.slug}\` — vence: ${due}`;
      }),
      '',
      overdue.length === 0 ? '_Ninguno._' : '',
      '',
      '## Próximos 30 días',
      ...dueSoon.map(p => {
        const due = new Date(p.next_review_due_at).toISOString().split('T')[0];
        return `- [ ] \`${p.slug}\` — vence: ${due}`;
      }),
      '',
      dueSoon.length === 0 ? '_Ninguno._' : '',
      '',
      '## Al día',
      `- ${ok.length} artículos con revisión vigente.`,
      '',
    ];
    fs.writeFileSync(reportPath, lines.filter(l => l !== '').join('\n') + '\n');
    console.log(`\n📄 Informe guardado: ${reportPath}`);
  }

  // Exit with error if anything is overdue
  if (overdue.length > 0) {
    console.log(`\n❌ ${overdue.length} artículo(s) vencido(s).`);
    process.exit(1);
  }
  console.log('\n✅ Todas las revisiones al día.');
}

main().catch((e) => {
  console.error('Error en auditoría:', e);
  process.exit(1);
});
