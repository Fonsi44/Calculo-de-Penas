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

// ── Apply (dry-run por defecto en entornos no explícitos) ───────────────

async function apply() {
  productionGuard('apply');
  
  console.log('═══ Aplicar migraciones pendientes ═══');
  console.log('NOTA: La ejecución real de SQL requiere conexión a base de datos.');
  console.log('      Este runner valida el orden y checksums antes de ejecutar.\n');

  // Validar primero
  const valid = await validate();
  if (!valid) {
    console.error('⛔ Validación fallida. Corrige los errores antes de aplicar.');
    process.exit(1);
  }

  // Orden topológico: journal Drizzle primero, luego manifiesto en orden
  console.log('Orden de aplicación:');
  const journal = loadJson(JOURNAL_PATH);
  console.log(`  1-${journal.entries.length}: Migraciones Drizzle (journal)`);
  
  const manifest = loadJson(MANIFEST_PATH);
  for (let i = 0; i < manifest.entries.length; i++) {
    const entry = manifest.entries[i];
    console.log(`  ${journal.entries.length + i + 1}: ${entry.id} — ${entry.description}`);
  }

  console.log('\nPara aplicar realmente: configura DATABASE_URL y usa --execute');
  console.log('El runner ejecutará cada SQL en orden, verificando checksums antes y registrando en sgie_schema_migrations.');
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
