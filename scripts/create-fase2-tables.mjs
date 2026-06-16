// Crea las tablas Fase 2 (supuestos_penales, agravantes_especificas, remisiones_normativas)
// directamente en Neon usando SQL DDL. Basado en lib/schema.ts líneas 587-646.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
const sql = neon(match[1]);

console.log('🔧 Creando tablas Fase 2...\n');

// 1. Verificar si el enum tipo_pena existe, si no crearlo.
const enumExiste = await sql`
  SELECT 1 FROM pg_type WHERE typname = 'tipo_pena' LIMIT 1
`;
if (enumExiste.length === 0) {
  console.log('📝 Creando enum tipo_pena...');
  await sql`CREATE TYPE tipo_pena AS ENUM ('prision', 'multa', 'perpetuidad')`;
  console.log('   ✅ Enum tipo_pena creado\n');
} else {
  console.log('   ℹ️  Enum tipo_pena ya existe\n');
}

// 2. Crear tabla supuestos_penales (si no existe).
console.log('📝 Creando tabla supuestos_penales...');
await sql`
  CREATE TABLE IF NOT EXISTS supuestos_penales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delito_id UUID NOT NULL REFERENCES delitos(id),
    numeral VARCHAR(50),
    literal VARCHAR(50),
    inciso VARCHAR(50),
    texto_modalidad TEXT,
    pena_min_meses INTEGER NOT NULL,
    pena_max_meses INTEGER NOT NULL,
    tipo_pena tipo_pena NOT NULL DEFAULT 'prision',
    tiene_agravantes_especificas BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ
  )
`;
await sql`CREATE INDEX IF NOT EXISTS supuestos_penales_delito_idx ON supuestos_penales(delito_id)`;
await sql`CREATE INDEX IF NOT EXISTS supuestos_penales_numeral_literal_inciso_idx ON supuestos_penales(numeral, literal, inciso)`;
console.log('   ✅ Tabla supuestos_penales creada\n');

// 3. Crear tabla agravantes_especificas (si no existe).
console.log('📝 Creando tabla agravantes_especificas...');
await sql`
  CREATE TABLE IF NOT EXISTS agravantes_especificas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supuesto_penal_id UUID NOT NULL REFERENCES supuestos_penales(id),
    articulo_cp VARCHAR(100) NOT NULL,
    numeral VARCHAR(50),
    literal VARCHAR(50),
    texto_agravante TEXT NOT NULL,
    fraccion_aumento VARCHAR(20) NOT NULL,
    obligatoria BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS agravantes_especificas_supuesto_idx ON agravantes_especificas(supuesto_penal_id)`;
await sql`CREATE INDEX IF NOT EXISTS agravantes_especificas_articulo_idx ON agravantes_especificas(articulo_cp)`;
console.log('   ✅ Tabla agravantes_especificas creada\n');

// 4. Crear tabla remisiones_normativas (si no existe).
console.log('📝 Creando tabla remisiones_normativas...');
await sql`
  CREATE TABLE IF NOT EXISTS remisiones_normativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    articulo_origen VARCHAR(100) NOT NULL,
    numeral_origen VARCHAR(50),
    articulo_destino VARCHAR(100) NOT NULL,
    numeral_destino VARCHAR(50),
    texto_remision TEXT NOT NULL,
    condicion_aplicacion TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS remisiones_articulo_origen_idx ON remisiones_normativas(articulo_origen)`;
await sql`CREATE INDEX IF NOT EXISTS remisiones_articulo_destino_idx ON remisiones_normativas(articulo_destino)`;
console.log('   ✅ Tabla remisiones_normativas creada\n');

// 5. Verificación final.
const tablas = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('supuestos_penales', 'agravantes_especificas', 'remisiones_normativas')
`;
console.log('📊 Verificación:');
for (const t of tablas) console.log(`   ✅ ${t.table_name}`);
console.log('\n🎉 Tablas Fase 2 creadas correctamente');
