/**
 * Corrige las fechas de publicación del blog que están en el futuro.
 *
 * Uso: node scripts/fix-blog-dates.mjs
 *
 * Requiere DATABASE_URL en .env.local
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no configurada en .env.local');
  process.exit(1);
}

// Usar neon directamente para evitar problemas de import ESM/CJS con Drizzle
const { neon } = await import('@neondatabase/serverless');

const sql = neon(DATABASE_URL);

// Obtener todos los posts
const posts = await sql`
  SELECT id, slug, "publishedAt", title
  FROM blog_posts
  ORDER BY "publishedAt" DESC
`;

const now = new Date();
const futurePosts = posts.filter(p => new Date(p.publishedAt) > now);

console.log(`📊 Total posts: ${posts.length}`);
console.log(`⏰ Posts con fecha futura (> ${now.toISOString().split('T')[0]}): ${futurePosts.length}`);

if (futurePosts.length === 0) {
  console.log('✅ No hay posts con fechas futuras. Nada que corregir.');
  process.exit(0);
}

// Mostrar los primeros y últimos 5 posts afectados
console.log('\nPrimeros 5 posts con fecha futura:');
futurePosts.slice(0, 5).forEach(p => {
  const d = new Date(p.publishedAt);
  console.log(`  ${d.toISOString().split('T')[0]} — ${p.title.substring(0, 60)}`);
});

console.log('\nÚltimos 5 posts con fecha futura:');
futurePosts.slice(-5).forEach(p => {
  const d = new Date(p.publishedAt);
  console.log(`  ${d.toISOString().split('T')[0]} — ${p.title.substring(0, 60)}`);
});

// Calcular cuántos días restar para que la fecha más reciente sea ayer
const latestFuture = new Date(futurePosts[0].publishedAt);
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const daysToSubtract = Math.ceil((latestFuture.getTime() - yesterday.getTime()) / (1000 * 60 * 60 * 24));

console.log(`\n🔧 La fecha futura más reciente es ${latestFuture.toISOString().split('T')[0]}`);
console.log(`🔧 Restando ${daysToSubtract} días para que el post más reciente sea ${yesterday.toISOString().split('T')[0]}`);

// Preguntar confirmación
console.log(`\n⚠️  Se van a actualizar ${futurePosts.length} posts.`);
console.log('Presiona Ctrl+C para cancelar o cualquier tecla para continuar...');

// Auto-confirmar después de 5 segundos
await new Promise(resolve => {
  const timer = setTimeout(() => {
    console.log('\n⏰ Continuando automáticamente en modo no-interactivo...');
    resolve();
  }, 5000);
  // En modo interactivo, process.stdin.on('data') capturaría la entrada
  // Pero en modo no-interactivo, simplemente esperamos
});

let updated = 0;
let errors = 0;

for (const post of futurePosts) {
  const oldDate = new Date(post.publishedAt);
  const newDate = new Date(oldDate);
  newDate.setDate(newDate.getDate() - daysToSubtract);

  try {
    await sql`
      UPDATE blog_posts
      SET "publishedAt" = ${newDate.toISOString()},
          "updatedAt" = ${newDate.toISOString()}
      WHERE id = ${post.id}
    `;
    updated++;
    if (updated % 10 === 0) {
      console.log(`  ✅ ${updated}/${futurePosts.length} posts actualizados...`);
    }
  } catch (err) {
    errors++;
    console.error(`  ❌ Error actualizando ${post.slug}: ${err.message}`);
  }
}

console.log(`\n📊 Resultado:`);
console.log(`  ✅ ${updated} posts actualizados`);
console.log(`  ❌ ${errors} errores`);
console.log(`  📅 La fecha más reciente ahora debería ser ${yesterday.toISOString().split('T')[0]}`);
console.log('\n💡 Recuerda hacer deploy para que los cambios se reflejen en el sitemap y en las páginas ISR.');
