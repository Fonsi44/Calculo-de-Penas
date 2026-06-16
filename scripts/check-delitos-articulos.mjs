// Verifica qué artículos existen en la tabla delitos y muestra muestra los primeros.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
const sql = neon(match[1]);

const total = await sql`SELECT COUNT(*)::int as c FROM delitos`;
console.log(`📊 Total delitos en BD: ${total[0].c}\n`);

// Mostrar los primeros 15 delitos para ver el formato del artículo.
console.log('📋 Primeros 15 delitos (formato de artículo):');
const muestra = await sql`SELECT articulo, nombre FROM delitos ORDER BY articulo LIMIT 15`;
for (const d of muestra) {
  console.log(`   "${d.articulo}" — ${d.nombre}`);
}

// Buscar delitos que contengan los artículos objetivo.
console.log('\n🔍 Buscando delitos por artículo (parcial):');
const objetivos = ['200', '240', '312', '363', '366'];
for (const obj of objetivos) {
  const found = await sql`SELECT articulo, nombre FROM delitos WHERE articulo = ${obj} OR articulo LIKE ${'%' + obj + '%'} LIMIT 3`;
  console.log(`   Art. ${obj}: ${found.length} resultado(s)`);
  for (const f of found) console.log(`      "${f.articulo}" — ${f.nombre}`);
}
