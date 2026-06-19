/**
 * Valida que ningún artículo del blog tenga fechas futuras.
 * Ejecutar: npx tsx scripts/validar-fechas-blog.ts
 * Usar en CI para evitar que fechas futuras lleguen a producción.
 *
 * La fecha máxima se calcula dinámicamente (fecha actual del sistema + 1 día
 * de tolerancia por desfases de reloj/zona horaria). Antes era una constante
 * hardcodeada (2026-06-14) que quedaba obsoleta tras cada edición legítima
 * del blog y producía falsos positivos.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

// Tolerancia de 1 día sobre la fecha actual: un post actualizado "hoy" desde
// una zona horaria adelantada no debe reportarse como futuro.
const MAX_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000);

function checkDate(label: string, date: Date | null, slug: string): string[] {
  const errors: string[] = [];
  if (!date) return errors;
  if (isNaN(date.getTime())) {
    errors.push(`  ${slug}: ${label} es inválida`);
    return errors;
  }
  if (date > MAX_DATE) {
    errors.push(`  ${slug}: ${label} es futura (${date.toISOString().split('T')[0]} > ${MAX_DATE.toISOString().split('T')[0]})`);
  }
  return errors;
}

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DB disponible. Omitiendo validación de fechas.');
    process.exit(0);
  }

  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`SELECT slug, published_at, updated_at FROM blog_posts WHERE published = true`;

  let errors: string[] = [];
  let futurePub = 0;
  let futureUpd = 0;
  let badOrder = 0;

  for (const p of posts) {
    const pub = p.published_at ? new Date(p.published_at) : null;
    const upd = p.updated_at ? new Date(p.updated_at) : null;

    errors.push(...checkDate('published_at', pub, p.slug));
    errors.push(...checkDate('updated_at', upd, p.slug));

    if (pub && upd && !isNaN(pub.getTime()) && !isNaN(upd.getTime())) {
      if (pub > upd) {
        errors.push(`  ${p.slug}: published_at (${pub.toISOString().split('T')[0]}) > updated_at (${upd.toISOString().split('T')[0]})`);
        badOrder++;
      }
    }

    if (pub && pub > MAX_DATE) futurePub++;
    if (upd && upd > MAX_DATE) futureUpd++;
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(es) de fecha encontrados:\n`);
    errors.forEach(e => console.log(e));
    console.log(`\nResumen: ${futurePub} publicaciones futuras, ${futureUpd} actualizaciones futuras, ${badOrder} con orden incorrecto`);
    console.log(`Fecha de referencia (hoy + 1d): ${MAX_DATE.toISOString()}`);
    process.exit(1);
  }

  console.log(`✅ Todas las fechas correctas: ${posts.length} posts, ninguna futura, ninguna con orden incorrecto.`);
  console.log(`Fecha de referencia (hoy + 1d): ${MAX_DATE.toISOString()}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Error en validación:', e);
  process.exit(1);
});
