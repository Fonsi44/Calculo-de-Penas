/**
 * Despublica (published=false) los posts del blog cuyas rutas están redirigidas
 * (301/308) hacia URLs consolidadas, para que no aparezcan en sitemap, ni sean
 * enlazados desde BlogHighlights, navegación prev/next, landings o CTA mid-article.
 *
 * Contexto: auditoría Ahrefs 2026-07-10 detectó 114 enlaces internos hacia 3xx
 * originados porque estos posts siguen publicados aunque su ruta esté redirigida
 * en next.config.ts. Despublicar elimina los enlaces internos a 3xx de raíz.
 *
 * NO elimina los registros: solo marca published=false (trazabilidad).
 * NO toca slugs, body ni metadatos editoriales.
 * Mantiene los redirects 301 existentes como red de seguridad.
 *
 * Uso:
 *   npx tsx scripts/seo-unpublish-consolidated-posts.ts             # dry-run
 *   npx tsx scripts/seo-unpublish-consolidated-posts.ts --aplicar   # escribe DB
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Target = {
  slug: string;
  rutaVieja: string;
  urlFinal: string;
  motivo: string;
};

// 8 posts consolidados cuyas rutas están redirigidas en next.config.ts.
// Fuente: cruce de CSV links_to_3xx (Ahrefs 2026-07-10) + next.config.ts redirects.
const TARGETS: Target[] = [
  {
    slug: 'abogado-penalista-choluteca',
    rutaVieja: '/blog/derecho-penal/abogado-penalista-choluteca',
    urlFinal: '/abogado-penalista-choluteca',
    motivo: 'Consolidado en landing comercial propia (next.config.ts:284).',
  },
  {
    slug: 'despido-injustificado-honduras-derechos-trabajador',
    rutaVieja: '/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador',
    urlFinal: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
    motivo: 'Cluster despido laboral (next.config.ts:211).',
  },
  {
    slug: 'empleador-no-paga-salario-honduras',
    rutaVieja: '/blog/derecho-laboral/empleador-no-paga-salario-honduras',
    urlFinal: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
    motivo: 'Cluster despido laboral (next.config.ts:212).',
  },
  {
    slug: 'calcular-prestaciones-laborales-honduras',
    rutaVieja: '/blog/derecho-laboral/calcular-prestaciones-laborales-honduras',
    urlFinal: '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras',
    motivo: 'Cluster prestaciones/liquidación (next.config.ts:187).',
  },
  {
    slug: 'despido-laboral-honduras-derechos',
    rutaVieja: '/blog/derecho-laboral/despido-laboral-honduras-derechos',
    urlFinal: '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
    motivo: 'Cluster despido laboral (next.config.ts:186).',
  },
  {
    slug: 'tramites-notariales-frecuentes-honduras',
    rutaVieja: '/blog/derecho-notarial/tramites-notariales-frecuentes-honduras',
    urlFinal: '/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita',
    motivo: 'Cluster notarial (next.config.ts:196).',
  },
  {
    slug: 'elegir-bufete-abogados-nacaome',
    rutaVieja: '/blog/practica-legal/elegir-bufete-abogados-nacaome',
    urlFinal: '/blog/practica-legal/como-elegir-abogado-honduras',
    motivo: 'Cluster elegir abogado (next.config.ts:208).',
  },
  {
    slug: 'elegir-bufete-multidisciplinario-ventajas-honduras',
    rutaVieja: '/blog/practica-legal/elegir-bufete-multidisciplinario-ventajas-honduras',
    urlFinal: '/blog/practica-legal/como-elegir-abogado-honduras',
    motivo: 'Cluster elegir abogado (next.config.ts:209).',
  },
];

function checkRecentBackup(): boolean {
  const dir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('backup-') && f.endsWith('.json'));
  if (files.length === 0) return false;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const f of files) {
    const stat = fs.statSync(path.join(dir, f));
    if (stat.mtimeMs > twoHoursAgo) return true;
  }
  return false;
}

async function main() {
  const aplicar = process.argv.includes('--aplicar');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.error('❌ No hay DATABASE_URL configurada.');
    process.exit(1);
  }

  if (aplicar && !checkRecentBackup()) {
    console.error('❌ ABORTADO: no hay backup reciente (<2h). Ejecuta primero:');
    console.error('   npx tsx scripts/backup-blog.ts');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const slugs = TARGETS.map((t) => t.slug);

  console.log(`\n${aplicar ? '🔒 APLICAR' : '🔍 DRY-RUN'} — Despublicación de ${slugs.length} posts consolidados\n`);

  // Consultar estado actual de los 8 posts.
  const posts = await sql`
    SELECT id, slug, title, category, published, noindex
    FROM blog_posts
    WHERE slug = ANY(${slugs})
    ORDER BY slug
  `;

  console.log(`Posts encontrados en DB: ${posts.length} de ${slugs.length}\n`);
  console.log('slug'.padEnd(58), 'pub', 'noindex', '  ruta');
  console.log('-'.repeat(110));
  for (const p of posts) {
    const t = TARGETS.find((x) => x.slug === p.slug);
    console.log(
      String(p.slug).padEnd(58),
      p.published ? '✓' : '✗',
      p.noindex ? '✓' : '✗',
      '  ',
      t?.rutaVieja ?? '',
    );
  }

  const faltantes = slugs.filter((s) => !posts.some((p) => p.slug === s));
  if (faltantes.length > 0) {
    console.log(`\n⚠️  Slugs NO encontrados en DB (${faltantes.length}): ${faltantes.join(', ')}`);
    console.log('   (Si ya están despublicados/eliminados, no requieren acción.)');
  }

  const aDespublicar = posts.filter((p) => p.published === true || p.published === null);
  console.log(`\nPosts a despublicar (published=true): ${aDespublicar.length}`);
  console.log(`Posts ya despublicados: ${posts.length - aDespublicar.length}`);

  if (aDespublicar.length === 0) {
    console.log('\n✅ Nada que hacer: todos los posts objetivo ya están despublicados.');
    process.exit(0);
  }

  if (!aplicar) {
    console.log('\n--- DRY-RUN: no se escribió nada. Ejecuta con --aplicar para despublicar. ---');
    console.log('\nDetalle de URLs finales (200 OK objetivo):');
    for (const t of TARGETS) {
      console.log(`  ${t.rutaVieja}\n    → ${t.urlFinal}  (${t.motivo})`);
    }
    process.exit(0);
  }

  // APLICAR: marcar published=false en los posts que están publicados.
  const slugsADespublicar = aDespublicar.map((p) => p.slug);
  const result = await sql`
    UPDATE blog_posts
    SET published = false
    WHERE slug = ANY(${slugsADespublicar}) AND (published = true OR published IS NULL)
    RETURNING id, slug, title, published
  `;

  console.log(`\n✅ ${result.length} posts despublicados:`);
  for (const r of result) {
    console.log(`   • ${r.slug}  (id: ${r.id})  published=${r.published}`);
  }

  // Verificación post-escritura.
  const check = await sql`
    SELECT slug, published FROM blog_posts WHERE slug = ANY(${slugs})
  `;
  const aunPublicados = check.filter((p) => p.published === true || p.published === null);
  if (aunPublicados.length > 0) {
    console.error(`\n⚠️  VERIFICACIÓN: ${aunPublicados.length} posts siguen publicados:`);
    aunPublicados.forEach((p) => console.error(`   • ${p.slug}`));
    process.exit(1);
  }
  console.log(`\n✔️  Verificación OK: los ${check.length} posts objetivo están published=false.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
