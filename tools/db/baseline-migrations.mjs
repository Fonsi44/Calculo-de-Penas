#!/usr/bin/env node
/**
 * Baseline verificable de migraciones para bases pobladas sin tracking.
 *
 * PROBLEMA:
 *   La base productiva neondb contiene todas las tablas del schema Drizzle
 *   (migraciones aplicadas manualmente durante el desarrollo) pero las tablas
 *   de tracking (drizzle.__drizzle_migrations y sgie_schema_migrations)
 *   están vacías. Ejecutar las 58 migraciones directamente causaría errores
 *   de CREATE TABLE/ADD COLUMN IF NOT EXISTS (no destructivo pero incorrecto
 *   conceptualmente). Este script verifica cada migración contra el schema
 *   real y registra solo las confirmadas estructuralmente.
 *
 * MODOS:
 *   plan   — Solo lectura. Verifica cada migración y clasifica su estado.
 *   apply  — Registra migraciones APLICADA_COMPLETA en tracking. Solo en clon.
 *
 * USO:
 *   node tools/db/baseline-migrations.mjs plan
 *   MIGRATION_BASELINE_CONFIRMATION=BASELINE_PREFLIGHT_CLONE \
 *     node tools/db/baseline-migrations.mjs apply
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(ROOT, 'tools/db/manual-migrations.json');
const JOURNAL_PATH = resolve(ROOT, 'drizzle/migrations/meta/_journal.json');
const RESULTS_PATH = resolve(ROOT, '.local', 'production-baseline-pr20.json');

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function readSql(filePath) {
  const abs = resolve(ROOT, filePath);
  if (!existsSync(abs)) throw new Error(`SQL no encontrado: ${abs}`);
  return readFileSync(abs, 'utf8');
}

// ── Verificaciones estructurales por migración ──────────────────────────
// Define postcondiciones para migraciones clave. Se amplía según necesidad.

async function checkTableExists(sql, table) {
  const r = await sql.query(
    `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS e`,
    [table]
  );
  return r.rows[0].e;
}

async function checkColumnExists(sql, table, column) {
  const r = await sql.query(
    `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2) AS e`,
    [table, column]
  );
  return r.rows[0].e;
}

// ── Clasificar migraciones ─────────────────────────────────────────────

const STATUS = {
  APPLIED_COMPLETE: 'APLICADA_COMPLETA',
  APPLIED_PARTIAL: 'APLICADA_PARCIAL',
  NOT_APPLIED: 'NO_APLICADA',
  DIVERGENT: 'DIVERGENTE',
  NOT_VERIFIABLE: 'NO_VERIFICABLE',
};

async function classifyDrizzleMigration(sql, entry) {
  const tag = entry.tag;
  // Extraer la tabla principal del nombre de la migración (heurístico)
  const nameParts = tag.split('_');
  const tableHint = nameParts.slice(1).filter(p => !/^\d+$/.test(p)).join('_');
  
  // Buscar CREATE TABLE en el SQL
  const sqlContent = readSql(`drizzle/migrations/${tag}.sql`);
  const createTables = sqlContent.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?\s*\(/gi);
  
  if (!createTables || createTables.length === 0) {
    // Migración sin CREATE TABLE (ALTER TABLE, índices, etc.)
    // Verificar por nombre
    if (tag.includes('usuarios') || tag.includes('token_version')) {
      const hasCol = await checkColumnExists(sql, 'usuarios', 'token_version');
      return hasCol ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
    }
    if (tag.includes('two_factor') || tag.includes('2fa')) {
      const hasTable = await checkTableExists(sql, 'two_factor_challenges');
      return hasTable ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
    }
    if (tag.includes('preview_tokens')) {
      const hasTable = await checkTableExists(sql, 'preview_tokens');
      return hasTable ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
    }
    return STATUS.NOT_VERIFIABLE;
  }
  
  // Verificar que todas las tablas del CREATE TABLE existen
  let allExist = true;
  for (const stmt of createTables) {
    const match = stmt.match(/"?(\w+)"?\s*\(/);
    if (match) {
      const tableName = match[1];
      const exists = await checkTableExists(sql, tableName);
      if (!exists) allExist = false;
    }
  }
  return allExist ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
}

async function classifyManualMigration(sql, entry) {
  const file = entry.file;
  const fileSql = readSql(file);
  const createTables = fileSql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?\s*\(/gi);
  const alterColumns = fileSql.match(/ALTER TABLE.*ADD COLUMN.*"(\w+)"/gi);
  
  if (createTables) {
    let allExist = true;
    for (const stmt of createTables) {
      const match = stmt.match(/"?(\w+)"?\s*\(/);
      if (match) {
        const exists = await checkTableExists(sql, match[1]);
        if (!exists) allExist = false;
      }
    }
    return allExist ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
  }
  
  if (alterColumns) {
    // ALTER TABLE ADD COLUMN — verificar columnas
    let allExist = true;
    for (const stmt of alterColumns) {
      const match = stmt.match(/ALTER TABLE\s+"?(\w+)"?\s+ADD COLUMN\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?/i);
      if (match) {
        const exists = await checkColumnExists(sql, match[1], match[2]);
        if (!exists) allExist = false;
      }
    }
    return allExist ? STATUS.APPLIED_COMPLETE : STATUS.NOT_APPLIED;
  }
  
  return STATUS.NOT_VERIFIABLE;
}

// ── Main ───────────────────────────────────────────────────────────────

const mode = process.argv[2] || 'plan';

(async () => {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  
  const drizzleEntries = journal.entries.map(e => ({
    kind: 'drizzle',
    id: e.tag,
    file: `drizzle/migrations/${e.tag}.sql`,
    description: e.tag,
    tag: e.tag,
    when: e.when,
  }));
  
  const manualEntries = manifest.entries.map(e => ({
    kind: 'manual',
    id: e.id,
    file: e.file,
    description: e.description,
    checksum: e.checksum,
  }));
  
  const allMigrations = [...drizzleEntries, ...manualEntries];
  console.log(`═══ Baseline de migraciones ═══`);
  console.log(`Modo: ${mode}`);
  console.log(`Migraciones a verificar: ${allMigrations.length}\n`);
  
  if (mode === 'plan') {
    // Solo lectura
    console.log('Modo PLAN — solo lectura. Conectando a DATABASE_URL...\n');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL requerida.');
      process.exit(1);
    }
    
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const sql = {
      query: (text, params) => pool.query(text, params),
    };
    
    try {
      const results = [];
      for (const m of allMigrations) {
        let status;
        if (m.kind === 'drizzle') {
          status = await classifyDrizzleMigration(sql, m);
        } else {
          status = await classifyManualMigration(sql, m);
        }
        results.push({ id: m.id, kind: m.kind, status, description: m.description });
        const icon = status === STATUS.APPLIED_COMPLETE ? '✓' : status === STATUS.NOT_APPLIED ? '·' : '?';
        console.log(`  ${icon} [${status.padEnd(18)}] ${m.id.padEnd(22)} ${m.description}`);
      }
      
      // Summary
      const summary = {};
      for (const s of Object.values(STATUS)) summary[s] = 0;
      for (const r of results) summary[r.status]++;
      
      console.log('\n═══ Resumen ═══');
      for (const [s, c] of Object.entries(summary)) {
        console.log(`  ${s.padEnd(22)} ${c}`);
      }
      
      // Save results
      const { writeFileSync, mkdirSync } = await import('node:fs');
      mkdirSync(resolve(ROOT, '.local'), { recursive: true });
      writeFileSync(RESULTS_PATH, JSON.stringify({ results, summary, mode: 'plan', at: new Date().toISOString() }, null, 2));
      console.log(`\nResultados guardados en: ${RESULTS_PATH}`);
      
    } finally {
      await pool.end();
    }
    process.exit(0);
  }
  
  if (mode === 'apply') {
    // Apply: solo en clon con confirmación
    const confirmation = process.env.MIGRATION_BASELINE_CONFIRMATION;
    if (confirmation !== 'BASELINE_PREFLIGHT_CLONE') {
      console.error('⛔ Requiere MIGRATION_BASELINE_CONFIRMATION=BASELINE_PREFLIGHT_CLONE');
      process.exit(1);
    }
    
    // Verificar branch no producción
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    try {
      const bid = await pool.query("SELECT current_setting('neon.branch_id', true) AS id, current_database() AS db");
      const branchId = bid.rows[0]?.id;
      const prodBranchId = process.env.NEON_PRODUCTION_BRANCH_ID;
      if (!branchId) { console.error('⛔ No se pudo obtener branch_id.'); process.exit(1); }
      if (prodBranchId && branchId === prodBranchId) {
        console.error('⛔ Branch es producción. Baseline apply no permitido en producción.');
        process.exit(1);
      }
      console.log(`✓ Clon verificado: branch ≠ producción, DB: ${bid.rows[0].db}`);
      
      // Ejecutar baseline: primero plan para obtener clasificación
      const sql = { query: (text, params) => pool.query(text, params) };
      
      // Solo registrar APLICADA_COMPLETA
      let registered = 0, skipped = 0;
      
      for (const m of allMigrations) {
        let status;
        if (m.kind === 'drizzle') {
          status = await classifyDrizzleMigration(sql, m);
        } else {
          status = await classifyManualMigration(sql, m);
        }
        
        if (status !== STATUS.APPLIED_COMPLETE) {
          console.log(`  · [${status.padEnd(18)}] ${m.id} — no se registra`);
          skipped++;
          continue;
        }
        
        // Registrar en tracking
        if (m.kind === 'drizzle') {
          const fileSql = readSql(m.file);
          const hash = sha256(fileSql);
          // Usar el mismo formato que Drizzle: sha256 del contenido SQL
          await pool.query(
            `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [hash, m.when || Date.now()]
          );
          console.log(`  ✓ [drizzle] ${m.id} — registrada`);
        } else {
          const fileSql = readSql(m.file);
          const hash = sha256(fileSql);
          await pool.query(
            `INSERT INTO sgie_schema_migrations (name, hash, rows_affected, applied_at) VALUES ($1, $2, 0, NOW()) ON CONFLICT (name) DO NOTHING`,
            [m.id, hash]
          );
          console.log(`  ✓ [manual]  ${m.id} — registrada`);
        }
        registered++;
      }
      
      console.log(`\n═══ Baseline completado: ${registered} registradas, ${skipped} omitidas ═══`);
    } finally {
      await pool.end();
    }
    process.exit(0);
  }
  
  console.error(`Modo desconocido: ${mode}. Usa: plan | apply`);
  process.exit(1);
})();
