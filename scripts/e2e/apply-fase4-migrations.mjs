#!/usr/bin/env node
/**
 * Aplicador canónico de migraciones SGIE para ramas Neon aisladas.
 *
 * Cumple §5.2 del prompt:
 * - Lee *.sql de drizzle/migrations/ cuyo nombre empieza por 0032+.
 * - Calcula hash SHA-256 del contenido; lo registra en sgie_schema_migrations.
 * - Idempotente: la segunda ejecución produce cero cambios.
 * - Aborta si una migración ya registrada tiene hash distinto (alguien la mutó).
 * - Aplica cada migración en una transacción de BD (cuando PG lo permite).
 * - No usa drizzle-kit push/generate/migrate.
 * - Aplica seeds, backfills y DML (drizzle-kit push solo aplica DDL).
 *
 * Uso:
 *   node scripts/e2e/apply-fase4-migrations.mjs           # aplica pendientes
 *   node scripts/e2e/apply-fase4-migrations.mjs --check   # solo reporta estado
 *
 * Requiere DATABASE_URL apuntando a la rama Neon aislada.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config({ path: resolve(__dirname, '..', '..', '.env') });

import pg from 'pg';
const { Pool } = pg;

const MIGRATIONS_DIR = resolve(__dirname, '..', '..', 'drizzle', 'migrations');
const MIN_PREFIX = '0032'; // todas las migraciones desde Fase 1 (incluye seeds/roles/permisos)
const CHECK_ONLY = process.argv.includes('--check');

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function listMigrationFiles() {
  const all = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
  const filtered = all
    .filter((f) => f.slice(0, 4) >= MIN_PREFIX)
    .sort();
  return filtered;
}

async function ensureRegistry(client) {
  // Crea la tabla de registro si no existe (migración 0038 la define también,
  // pero la necesitamos antes de aplicarla).
  await client.query(`
    CREATE TABLE IF NOT EXISTS "sgie_schema_migrations" (
      "id" serial PRIMARY KEY,
      "name" varchar(255) NOT NULL UNIQUE,
      "hash" varchar(64) NOT NULL,
      "applied_at" timestamptz NOT NULL DEFAULT now(),
      "applied_by" varchar(100),
      "rows_affected" integer NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS "sgie_schema_migrations_name_idx" ON "sgie_schema_migrations"("name");
  `);
}

async function getApplied(client) {
  const r = await client.query('SELECT name, hash FROM sgie_schema_migrations');
  const map = new Map();
  for (const row of r.rows) map.set(row.name, row.hash);
  return map;
}

async function applyOne(client, name, content, hash) {
  // Envolver en transacción. Si el SQL falla a mitad, rollback completo.
  await client.query('BEGIN');
  try {
    // Ejecutar el contenido. Nota: node-pg ejecuta una sola query string
    // multi-statement si no hay parámetros.
    const result = await client.query(content);
    // Registrar en sgie_schema_migrations (con rows_affected aproximado).
    await client.query(
      `INSERT INTO sgie_schema_migrations (name, hash, applied_by, rows_affected)
       VALUES ($1, $2, $3, $4)`,
      [name, hash, 'apply-fase4-migrations.mjs', result.rowCount || 0],
    );
    await client.query('COMMIT');
    return result.rowCount || 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL no configurada.');
    process.exit(2);
  }
  const host = (() => { try { return new URL(dbUrl).hostname; } catch { return '?'; } })();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Aplicador de migraciones SGIE (0032–0044)');
  console.log('  Host destino:', host);
  console.log('  Modo:', CHECK_ONLY ? 'CHECK (solo reporte)' : 'APLICAR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  let applied = 0;
  let skipped = 0;
  let failed = 0;

  try {
    await ensureRegistry(client);
    const appliedMap = await getApplied(client);
    const files = await listMigrationFiles();

    console.log(`Migraciones candidatas (>= ${MIN_PREFIX}): ${files.length}`);
    console.log(`Ya aplicadas: ${appliedMap.size}\n`);

    for (const file of files) {
      const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
      const hash = sha256(content);

      if (appliedMap.has(file)) {
        const registeredHash = appliedMap.get(file);
        if (registeredHash !== hash) {
          console.error(`❌ ABORTA: migración "${file}" ya aplicada con hash distinto.`);
          console.error(`   registrado: ${registeredHash}`);
          console.error(`   actual:     ${hash}`);
          console.error('   Alguien mutó una migración aplicada. Revierte o crea una nueva.');
          process.exitCode = 3;
          return;
        }
        console.log(`  ⏭️  ${file} (ya aplicada, hash OK)`);
        skipped++;
        continue;
      }

      if (CHECK_ONLY) {
        console.log(`  📋 ${file} (pendiente, NO aplicada por --check)`);
        continue;
      }

      try {
        const rows = await applyOne(client, file, content, hash);
        console.log(`  ✅ ${file} aplicada (${rows} filas afectadas) hash=${hash.slice(0, 12)}…`);
        applied++;
      } catch (err) {
        console.error(`  ❌ ${file} FALLÓ: ${err.message.slice(0, 200)}`);
        failed++;
        // Continuamos para reportar todos los fallos; el exit code será !=0.
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Resumen: ${applied} aplicadas, ${skipped} ya aplicadas, ${failed} fallidas`);
    if (CHECK_ONLY) console.log('  (modo --check: no se aplicaron cambios)');
    console.log('═══════════════════════════════════════════════════════════════');
  } finally {
    client.release();
    await pool.end();
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
