// Lista las tablas existentes en la BD Neon.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
const sql = neon(match[1]);

const tablas = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;
console.log('📋 Tablas existentes en la BD:');
for (const t of tablas) console.log(`   - ${t.table_name}`);
console.log(`\nTotal: ${tablas.length} tablas`);

// Verificar específicamente las tablas Fase 2.
const fase2 = ['supuestos_penales', 'agravantes_especificas', 'remisiones_normativas'];
console.log('\n🔍 Tablas Fase 2:');
for (const t of fase2) {
  const existe = tablas.some(x => x.table_name === t);
  console.log(`   - ${t}: ${existe ? '✅ EXISTE' : '❌ NO EXISTE'}`);
}
