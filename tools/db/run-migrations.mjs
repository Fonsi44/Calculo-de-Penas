#!/usr/bin/env node
/**
 * Runner unificado de migraciones — Drizzle journal + manifiesto manual.
 *
 * Comandos:
 *   node tools/db/run-migrations.mjs status     — estado de migraciones
 *   node tools/db/run-migrations.mjs validate   — validar integridad (sin ejecutar)
 *   node tools/db/run-migrations.mjs apply      — aplicar migraciones pendientes
 *   node tools/db/run-migrations.mjs checksums  — recalcular checksums del manifiesto
 *
 * Protección de producción:
 *   Si DATABASE_URL contiene 'prod' o NODE_ENV=production, requiere
 *   MIGRATE_PRODUCTION=true para apply. Status/validate siempre funcionan.
 *
 * Principios:
 *   - No modifica el journal de Drizzle
 *   - Las migraciones manuales se registran en tabla sgie_schema_migrations
 *   - Checksum SHA-256 para detectar modificaciones post-aplicación
 *   - Modo transaccional cuando el SQL lo permite
 *   - Salida no interactiva para CI
 */

import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const MANIFEST_PATH = resolve(ROOT, 'tools/db/manual-migrations.json');
const JOURNAL_PATH = resolve(ROOT, 'drizzle/migrations/meta/_journal.json');

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function loadJson(path) {
  if (!existsSync(path)) throw new Error(`Archivo no encontrado: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readSql(filePath) {
  const abs = resolve(ROOT, filePath);
  if (!existsSync(abs)) throw new Error(`SQL no encontrado: ${abs}`);
  return readFileSync(abs, 'utf8');
}

/**
 * Extrae solo la sección UP de un SQL.
 *
 * Algunas migraciones (0030, 0031) incluyen la reversión DOWN en el mismo
 * archivo tras el marcador `--> >><down>`. Aplicar todo el SQL ejecutaría UP
 * y luego DOWN, dejando las tablas borradas. Esta función devuelve solo UP.
 *
 * Si no hay marcador DOWN, devuelve el SQL completo sin cambios.
 */
const DOWN_MARKER = '>><down>';

function readSqlUpOnly(filePath) {
  const raw = readSql(filePath);
  const idx = raw.indexOf(DOWN_MARKER);
  if (idx === -1) return raw;
  // Tomar todo hasta el marcador DOWN (excluyendo la línea que lo contiene).
  return raw.slice(0, idx).replace(/-->\s*$/, '').trimEnd();
}

function isProductionEnv() {
  const dbUrl = process.env.DATABASE_URL || '';
  return process.env.NODE_ENV === 'production' || dbUrl.includes('prod');
}

function productionGuard(mode) {
  if (mode === 'apply' && isProductionEnv() && !process.env.MIGRATE_PRODUCTION) {
    console.error('⛔ PRODUCTION GUARD: Para aplicar migraciones en producción, establece MIGRATE_PRODUCTION=true');
    console.error('   Status y validate funcionan sin esta variable.');
    process.exit(1);
  }
}

// ── Status ───────────────────────────────────────────────────────────────

async function status() {
  const journal = loadJson(JOURNAL_PATH);
  const manifest = loadJson(MANIFEST_PATH);
  
  console.log('═══ Drizzle Journal ═══');
  console.log(`  Entradas: ${journal.entries.length}`);
  console.log(`  Último tag: ${journal.entries[journal.entries.length - 1].tag}`);
  console.log(`  Snapshots: ${existsSync(resolve(ROOT, 'drizzle/migrations/meta/0000_snapshot.json')) ? 'presentes' : 'ausentes'}`);
  
  // Verificar SQL en journal
  const journalTags = new Set(journal.entries.map(e => e.tag));
  const sqlDir = resolve(ROOT, 'drizzle/migrations');
  const sqlFiles = readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
  
  const registered = sqlFiles.filter(f => journalTags.has(f.replace('.sql', '')));
  const unregistered = sqlFiles.filter(f => !journalTags.has(f.replace('.sql', '')));
  
  console.log(`  SQL registrados: ${registered.length}/${sqlFiles.length}`);
  
  console.log('\n═══ Migraciones Manuales ═══');
  console.log(`  Entradas en manifiesto: ${manifest.entries.length}`);
  
  for (const entry of manifest.entries) {
    const sql = readSql(entry.file);
    const hash = sha256(sql);
    const checksumOk = entry.checksum ? (entry.checksum === hash ? '✓' : '✗ MODIFICADO') : '(no calculado)';
    const padId = entry.id.padEnd(16);
    const padDesc = entry.description.padEnd(50);
    console.log(`  ${padId} [${checksumOk}] ${padDesc} → ${entry.file}`);
  }
  
  // Colisiones
  const prefixes = {};
  for (const f of sqlFiles) {
    const prefix = f.match(/^(\d+)/)?.[1];
    if (prefix) {
      prefixes[prefix] = (prefixes[prefix] || 0) + 1;
    }
  }
  const collisions = Object.entries(prefixes).filter(([,c]) => c > 1);
  if (collisions.length > 0) {
    console.log('\n⚠️  COLISIONES DE PREFIJOS:');
    for (const [p, c] of collisions) {
      const files = sqlFiles.filter(f => f.startsWith(p + '_'));
      console.log(`  Prefijo ${p}: ${c} archivos — ${files.join(', ')}`);
    }
  }
  
  console.log(`\n  Total SQL en disco: ${sqlFiles.length}`);
  console.log(`  Journal + Manifiesto: ${journal.entries.length + manifest.entries.length}`);
  console.log(`  Sin tracking: ${unregistered.length - manifest.entries.length}`);
}

// ── Validate ─────────────────────────────────────────────────────────────

async function validate() {
  const manifest = loadJson(MANIFEST_PATH);
  let errors = 0;

  console.log('═══ Validación de Integridad ═══\n');

  // 1. Verificar que todos los SQL del manifiesto existen
  console.log('1. Archivos SQL referenciados:');
  for (const entry of manifest.entries) {
    const abs = resolve(ROOT, entry.file);
    if (!existsSync(abs)) {
      console.log(`  ✗ FALTA: ${entry.file}`);
      errors++;
    }
  }

  // 2. Verificar IDs duplicados
  console.log('\n2. IDs duplicados:');
  const ids = new Set();
  for (const entry of manifest.entries) {
    if (ids.has(entry.id)) {
      console.log(`  ✗ DUPLICADO: ${entry.id}`);
      errors++;
    } else ids.add(entry.id);
  }

  // 3. Verificar dependencias existentes
  console.log('\n3. Dependencias:');
  for (const entry of manifest.entries) {
    for (const dep of entry.dependsOn) {
      if (!manifest.entries.some(e => e.id === dep) && !dep.match(/^\d{4}_/)) {
        console.log(`  ✗ ${entry.id} depende de ${dep} (no existe en el manifiesto ni en el journal)`);
        errors++;
      }
    }
  }

  // 4. Verificar checksums
  console.log('\n4. Checksums:');
  let checksumsOk = 0, checksumsMissing = 0, checksumsChanged = 0;
  for (const entry of manifest.entries) {
    const sql = readSql(entry.file);
    const hash = sha256(sql);
    if (!entry.checksum) {
      checksumsMissing++;
    } else if (entry.checksum !== hash) {
      console.log(`  ✗ ${entry.id}: checksum cambiado (¿SQL modificado después de aplicar?)`);
      checksumsChanged++;
    } else {
      checksumsOk++;
    }
  }
  console.log(`  OK: ${checksumsOk}, Sin calcular: ${checksumsMissing}, Modificados: ${checksumsChanged}`);

  // 5. Verificar journal de Drizzle
  console.log('\n5. Journal Drizzle:');
  const journal = loadJson(JOURNAL_PATH);
  const sqlDir = resolve(ROOT, 'drizzle/migrations');
  const sqlFiles = readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
  const journalTags = new Set(journal.entries.map(e => e.tag));
  const unregisteredInManifest = new Set(manifest.entries.map(e => basename(e.file, '.sql')));
  const orphanSql = sqlFiles.filter(f => {
    const tag = f.replace('.sql', '');
    return !journalTags.has(tag) && !unregisteredInManifest.has(tag);
  });
  if (orphanSql.length > 0) {
    console.log(`  ✗ ${orphanSql.length} SQL sin tracking: ${orphanSql.join(', ')}`);
    errors++;
  } else {
    console.log('  ✓ Todos los SQL están en el journal o en el manifiesto');
  }

  // 6. Verificar colisiones de nombres entre journal y manifiesto
  console.log('\n6. Colisiones journal/manifiesto:');
  let collisionCount = 0;
  for (const tag of journalTags) {
    if (unregisteredInManifest.has(tag)) {
      console.log(`  ✗ Colisión: ${tag} está en el journal Y en el manifiesto`);
      collisionCount++;
    }
  }
  if (collisionCount === 0) console.log('  ✓ Sin colisiones');

  // 7. Dependencias circulares
  console.log('\n7. Dependencias circulares:');
  const visited = new Set();
  const visiting = new Set();
  function hasCycle(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const entry = manifest.entries.find(e => e.id === id);
    if (entry) {
      for (const dep of entry.dependsOn) {
        if (hasCycle(dep)) return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  let cycleFound = false;
  for (const entry of manifest.entries) {
    if (hasCycle(entry.id)) {
      console.log(`  ✗ Ciclo detectado en ${entry.id}`);
      cycleFound = true;
      errors++;
      break;
    }
  }
  if (!cycleFound) console.log('  ✓ Sin ciclos');

  console.log(`\n═══ Resultado: ${errors === 0 ? '✓ VÁLIDO' : '✗ ' + errors + ' ERRORES'} ═══`);
  return errors === 0;
}

// ── Checksums ────────────────────────────────────────────────────────────

async function checksums() {
  const manifest = loadJson(MANIFEST_PATH);
  for (const entry of manifest.entries) {
    const sql = readSql(entry.file);
    entry.checksum = sha256(sql);
    console.log(`  ${entry.id}: ${entry.checksum}`);
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✓ ${manifest.entries.length} checksums actualizados en ${MANIFEST_PATH}`);
}

// ── Apply ────────────────────────────────────────────────────────────────
//
// Dos modos:
//   apply            → dry-run: valida y muestra el orden (no toca la DB).
//   apply --execute  → ejecuta realmente el SQL en orden, de forma idempotente.
//
// Idempotencia:
//   - Drizzle journal → registrado en drizzle.__drizzle_migrations (estándar).
//   - Manifiesto manual → registrado en sgie_schema_migrations (con checksum).
//   Una migración ya registrada se salta sin error.

const EXECUTE_FLAG = '--execute';

function buildOrderedMigrations() {
  const journal = loadJson(JOURNAL_PATH);
  const manifest = loadJson(MANIFEST_PATH);
  const list = [];
  for (const e of journal.entries) {
    list.push({
      kind: 'drizzle',
      id: e.tag,
      file: `drizzle/migrations/${e.tag}.sql`,
      description: e.tag,
      checksum: null, // Drizzle gestiona su propio hash internamente
    });
  }
  for (const entry of manifest.entries) {
    list.push({
      kind: 'manual',
      id: entry.id,
      file: entry.file,
      description: entry.description,
      checksum: entry.checksum || sha256(readSql(entry.file)),
    });
  }
  return list;
}

async function apply() {
  productionGuard('apply');
  const execute = process.argv.includes(EXECUTE_FLAG);

  console.log('═══ Aplicar migraciones ═══');
  if (!execute) {
    console.log('NOTA: Modo dry-run. Para ejecutar realmente usa --execute.');
    console.log('      El runner valida el orden y checksums antes de ejecutar.\n');
  } else {
    console.log('MODO EJECUCIÓN (--execute): se aplicará el SQL a DATABASE_URL.\n');
    if (!process.env.DATABASE_URL) {
      console.error('⛔ --execute requiere DATABASE_URL.');
      process.exit(1);
    }
  }

  // Validar primero
  const valid = await validate();
  if (!valid) {
    console.error('⛔ Validación fallida. Corrige los errores antes de aplicar.');
    process.exit(1);
  }

  const migrations = buildOrderedMigrations();
  console.log('Orden de aplicación:');
  console.log(`  1-${migrations.filter(m => m.kind === 'drizzle').length}: Migraciones Drizzle (journal)`);
  const manuals = migrations.filter(m => m.kind === 'manual');
  for (let i = 0; i < manuals.length; i++) {
    console.log(`  ${migrations.length - manuals.length + i + 1}: ${manuals[i].id} — ${manuals[i].description}`);
  }

  if (!execute) {
    console.log('\nPara aplicar realmente: configura DATABASE_URL y usa --execute');
    console.log('El runner ejecutará cada SQL en orden, verificando checksums antes y registrando en sgie_schema_migrations.');
    return;
  }

  // ── Ejecución real ──
  // Usar el driver del proyecto (@neondatabase/serverless).
  // La mayoría de migraciones Drizzle usan sentencias CREATE TABLE no
  // transaccionables; ejecutamos sentencia a sentencia sin wrapper BEGIN.
  const { Pool } = await import('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const query = (text, params) => pool.query(text, params);

  let applied = 0, skipped = 0;
  // El esquema de `sgie_schema_migrations` lo define manual-0038; no se crea
  // aquí. Hasta que esa migración se aplique, la tabla no existe y por tanto
  // no puede haber migraciones manuales "ya aplicadas".
  let manualTableExists = false;

  // Comprobar de forma perezosa si la tabla de tracking manual existe.
  async function refreshManualTableExists() {
    const r = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'sgie_schema_migrations'
          AND table_schema NOT IN ('pg_catalog','information_schema')
      ) AS exists
    `);
    manualTableExists = r.rows[0]?.exists === true;
  }

  try {
    // Tracking Drizzle (esquema dedicado, ajeno al manifiesto manual).
    await query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);

    for (const m of migrations) {
      // Para ejecución usamos solo la sección UP (readSqlUpOnly), para no
      // aplicar la reversión DOWN que algunas migraciones incluyen en el mismo
      // archivo. El checksum se calcula sobre el archivo completo (readSql).
      const fileSql = readSqlUpOnly(m.file);
      const fullSql = readSql(m.file);
      if (m.kind === 'drizzle') {
        const hash = sha256(fullSql);
        const already = await query(`SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1`, [hash]);
        if (already.rows.length > 0) { skipped++; continue; }
        await query(fileSql);
        await query(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [hash, Date.now()]);
        console.log(`  ✓ [drizzle] ${m.id}`);
        applied++;
      } else {
        // Antes de cada manual, refrescar si la tabla de tracking existe.
        await refreshManualTableExists();
        if (manualTableExists) {
          const already = await query(`SELECT 1 FROM sgie_schema_migrations WHERE name = $1`, [m.id]);
          if (already.rows.length > 0) { skipped++; continue; }
        }
        await query(fileSql);
        // Tras aplicar el SQL (que puede ser el que crea la tabla), volver a
        // comprobar y registrar si ya existe.
        await refreshManualTableExists();
        if (manualTableExists) {
          await query(
            `INSERT INTO sgie_schema_migrations (name, hash, rows_affected) VALUES ($1, $2, 0)
             ON CONFLICT (name) DO NOTHING`,
            [m.id, m.checksum]
          );
        }
        console.log(`  ✓ [manual]  ${m.id} — ${m.description}`);
        applied++;
      }
    }

    console.log(`\n═══ Aplicación completa: ${applied} aplicadas, ${skipped} omitidas (ya registradas) ═══`);
  } catch (err) {
    console.error(`\n⛔ Error aplicando migraciones: ${err.message}`);
    if (err.position) console.error(`   Posición: ${err.position}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

const mode = process.argv[2] || 'status';

(async () => {
  try {
    switch (mode) {
      case 'status': await status(); break;
      case 'validate': {
        const ok = await validate();
        process.exit(ok ? 0 : 1);
      }
      case 'checksums': await checksums(); break;
      case 'apply': await apply(); break;
      default:
        console.error(`Modo desconocido: ${mode}. Usa: status | validate | checksums | apply`);
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
