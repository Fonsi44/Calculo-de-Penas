#!/usr/bin/env node
/**
 * Canonical migration baseline — three-step workflow:
 *
 *   1. canonical-export  → extrae tracking real de canonical_pr20
 *   2. plan              → compara schema/seeds de clone vs canonical
 *   3. apply             → aplica tracking canónico al clone (transacción)
 *
 * Principios:
 *   - NO usa regex sobre SQL para decidir si una migración fue aplicada.
 *   - NO calcula tracking manualmente desde los archivos SQL.
 *   - NO permite ON CONFLICT DO NOTHING.
 *   - La única fuente de tracking válida es canonical_pr20 (construida desde
 *     cero aplicando 39 Drizzle + 19 manuales).
 *   - El tracking solo se aplica si schema, seeds y conteos son EQUIVALENTE.
 *   - Fail-closed: cualquier diferencia → aborto con ROLLBACK total.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  beginLockedTransaction, compareRequiredSubset, insertExactTracking, signPlan,
  validateCanonicalExport, verifyPlan,
} from './baseline-safety.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PLAN_PATH = resolve(ROOT, '.local', 'production-baseline-pr20.json');
const CANONICAL_PATH = resolve(ROOT, '.local', 'canonical-tracking-pr20.json');
const SEED_MANIFEST_PATH = resolve(ROOT, 'tools', 'db', 'contractual-seeds.json');

function sha256(content) { return createHash('sha256').update(content).digest('hex'); }
const SEED_TABLES = [
  'roles', 'permisos', 'roles_permisos', 'configuracion_sitio',
  'tipos_procedimiento', 'procedimiento_fases', 'procedimiento_transiciones',
  'extraction_schema_versions', 'feature_flags',
];
function expectedTrackingCounts() {
  return {
    drizzle: JSON.parse(readFileSync(resolve(ROOT, 'drizzle/migrations/meta/_journal.json'), 'utf8')).entries.length,
    manual: JSON.parse(readFileSync(resolve(ROOT, 'tools/db/manual-migrations.json'), 'utf8')).entries.length,
  };
}

async function seedFingerprint(sql, table) {
  try {
    const result = await sql.query(
      `SELECT count(*)::int AS count,
       COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS content
       FROM "${table}" t`,
    );
    return {
      count: result.rows[0].count,
      sha256: sha256(result.rows[0].content),
    };
  } catch {
    return { status: 'NO_APLICABLE' };
  }
}

const CONTRACT_QUERIES = {
  roles: `SELECT nombre, descripcion FROM roles ORDER BY nombre`,
  permisos: `SELECT recurso, accion, descripcion FROM permisos ORDER BY recurso, accion`,
  roles_permisos: `SELECT r.nombre AS rol, p.recurso, p.accion
    FROM roles_permisos rp
    JOIN roles r ON r.id=rp.rol_id
    JOIN permisos p ON p.id=rp.permiso_id
    ORDER BY r.nombre,p.recurso,p.accion`,
  extraction_schema_versions: `SELECT tipo_documento,version,campos,activo
    FROM extraction_schema_versions ORDER BY tipo_documento,version`,
  feature_flags: `SELECT flag_key,scope_level,organization_id,team_id,user_id,case_id,
    procedure_id,enabled,config,kill_switch,valid_from,valid_until
    FROM feature_flags ORDER BY flag_key,scope_level,organization_id,team_id,user_id,case_id,procedure_id`,
};

async function seedContractRows(sql, table) {
  const query = CONTRACT_QUERIES[table];
  if (!query) return [];
  const result = await sql.query(query);
  return result.rows.map((row) => JSON.parse(JSON.stringify(row)));
}
function getGitHead() {
  try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

// ── canonical-export ── extracts real tracking from canonical_pr20 ─────

async function canonicalExport(sql) {
  console.log('═══ canonical-export desde canonical_pr20 ═══\n');
  
  const id = await sql.query("SELECT current_database() AS db, current_setting('neon.branch_id', true) AS bid");
  const db = id.rows[0]?.db;
  const branch = id.rows[0]?.bid;
  if (db !== 'canonical_pr20') { console.error('⛔ Debe conectar a canonical_pr20.'); process.exit(1); }
  console.log(`Base: ${db} | Branch: ${branch ? 'presente' : 'no disponible'}`);

  // Extract exact tracking rows
  const drizzleRows = await sql.query("SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id");
  const manualRows = await sql.query("SELECT name, hash, rows_affected, applied_at FROM sgie_schema_migrations ORDER BY name");
  const expectedTracking = expectedTrackingCounts();
  
  if (drizzleRows.rows.length !== expectedTracking.drizzle) { console.error(`⛔ Esperadas ${expectedTracking.drizzle} Drizzle, encontradas ${drizzleRows.rows.length}`); process.exit(1); }
  if (manualRows.rows.length !== expectedTracking.manual) { console.error(`⛔ Esperadas ${expectedTracking.manual} manuales, encontradas ${manualRows.rows.length}`); process.exit(1); }
  
  // Schema fingerprint
  const tableCount = (await sql.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n;
  const colCount = (await sql.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema')")).rows[0].n;
  const enumCount = (await sql.query("SELECT count(*)::int AS n FROM pg_type JOIN pg_enum ON pg_type.oid=pg_enum.enumtypid")).rows[0].n;
  const indexCount = (await sql.query("SELECT count(*)::int AS n FROM pg_indexes WHERE tablename NOT LIKE 'pg\\_%'")).rows[0].n;
  
  // Seed fingerprints for key tables
  const seeds = {};
  for (const table of SEED_TABLES) seeds[table] = await seedFingerprint(sql, table);
  
  // Journal + manifest hashes
  const journalHash = sha256(readFileSync(resolve(ROOT, 'drizzle/migrations/meta/_journal.json'), 'utf8'));
  const manifestHash = sha256(readFileSync(resolve(ROOT, 'tools/db/manual-migrations.json'), 'utf8'));
  
  const seedManifest = JSON.parse(readFileSync(SEED_MANIFEST_PATH, 'utf8'));
  const seedContracts = {};
  for (const [table, contract] of Object.entries(seedManifest.tables)) {
    seedContracts[table] = {
      classification: contract.classification,
      naturalKey: contract.naturalKey.map((key) => key.replace('rol.nombre', 'rol').replace('permiso.', '')),
      rows: contract.classification === 'contractual_required_subset'
        ? await seedContractRows(sql, table) : [],
    };
  }

  const canonical = {
    formatVersion: 3,
    exportedAt: new Date().toISOString(),
    head: getGitHead(),
    database: db,
    branchMasked: branch ? branch.slice(0, 4) + '...' : 'unknown',
    tracking: {
      drizzle: { count: drizzleRows.rows.length, rows: drizzleRows.rows },
      manual: { count: manualRows.rows.length, rows: manualRows.rows },
    },
    schema: { tables: tableCount, columns: colCount, enums: enumCount, indexes: indexCount },
    seeds,
    seedContracts,
    journalHash,
    manifestHash,
  };
  
  mkdirSync(dirname(CANONICAL_PATH), { recursive: true });
  writeFileSync(CANONICAL_PATH, JSON.stringify(canonical, null, 2));
  console.log(`\n✓ Exportado: ${CANONICAL_PATH}`);
  console.log(`  Drizzle: ${drizzleRows.rows.length} | Manual: ${manualRows.rows.length}`);
  console.log(`  Schema: ${tableCount} tables, ${colCount} cols, ${enumCount} enums, ${indexCount} idx`);
  console.log(`  Journal: ${journalHash.slice(0,12)}... | Manifest: ${manifestHash.slice(0,12)}...`);
  console.log(`  Seeds: ${JSON.stringify(seeds)}`);
  
  return canonical;
}

// ── plan ── compares clone schema/seeds vs canonical ─────────────────

async function plan(sql) {
  console.log('═══ plan: comparando schema del clon vs canonical_pr20 ═══\n');
  
  if (!existsSync(CANONICAL_PATH)) { console.error('⛔ canonical-export no se ha ejecutado. Ejecuta primero:\n   npm run db:migrations:baseline:canonical-export'); process.exit(1); }
  const canonical = JSON.parse(readFileSync(CANONICAL_PATH, 'utf8'));
  const canonicalFailures = validateCanonicalExport(canonical, SEED_TABLES, expectedTrackingCounts());
  if (canonicalFailures.length) {
    console.error(`⛔ Export canónico obsoleto o incompleto: ${canonicalFailures.join(', ')}`);
    console.error('   Regenera canonical-tracking-pr20.json desde canonical_pr20 antes de crear un plan.');
    process.exit(1);
  }
  
  const id = await sql.query("SELECT current_database() AS db, current_setting('neon.branch_id', true) AS bid");
  const cloneDb = id.rows[0]?.db;
  const cloneBranch = id.rows[0]?.bid;
  if (cloneDb !== 'neondb') { console.error(`⛔ El plan debe ejecutarse contra neondb, no ${cloneDb}`); process.exit(1); }
  console.log(`Base: ${cloneDb} | Branch: ${cloneBranch ? 'presente' : 'no disponible'}`);
  
  // Collect clone state
  const tableCount = (await sql.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n;
  const colCount = (await sql.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema')")).rows[0].n;
  const enumCount = (await sql.query("SELECT count(*)::int AS n FROM pg_type JOIN pg_enum ON pg_type.oid=pg_enum.enumtypid")).rows[0].n;
  const indexCount = (await sql.query("SELECT count(*)::int AS n FROM pg_indexes WHERE tablename NOT LIKE 'pg\\_%'")).rows[0].n;
  
  // Data counts
  const usuariosN = (await sql.query("SELECT count(*)::int AS n FROM usuarios")).rows[0].n;
  const blogN = (await sql.query("SELECT count(*)::int AS n FROM blog_posts")).rows[0].n;
  const blogPubN = (await sql.query("SELECT count(*)::int AS n FROM blog_posts WHERE published=true")).rows[0].n;
  const clientesN = (await sql.query("SELECT count(*)::int AS n FROM clientes")).rows[0].n;
  const expN = (await sql.query("SELECT count(*)::int AS n FROM expedientes")).rows[0].n;
  const drizzleTrackN = (await sql.query("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n;
  const manualTrackN = (await sql.query("SELECT count(*)::int AS n FROM sgie_schema_migrations")).rows[0].n;
  
  // Seed fingerprints
  const cloneSeeds = {};
  const seedStatus = {};
  for (const table of SEED_TABLES) {
    cloneSeeds[table] = await seedFingerprint(sql, table);
    const left = canonical.seeds[table];
    const right = cloneSeeds[table];
    if (left.status === 'NO_APLICABLE' || right.status === 'NO_APLICABLE') {
      seedStatus[table] = 'NO_APLICABLE';
    } else if (left.sha256 === right.sha256) {
      seedStatus[table] = 'EQUIVALENTE';
    } else if (left.count === 0) {
      seedStatus[table] = 'SOLO_CLON';
    } else if (right.count === 0) {
      seedStatus[table] = 'SOLO_CANÓNICA';
    } else {
      seedStatus[table] = 'DIVERGENTE';
    }
  }

  const cloneSeedContracts = {};
  for (const [table, contract] of Object.entries(canonical.seedContracts)) {
    if (contract.classification === 'contractual_required_subset') {
      const candidateRows = await seedContractRows(sql, table);
      cloneSeedContracts[table] = compareRequiredSubset(contract.rows, candidateRows, contract.naturalKey);
    } else {
      cloneSeedContracts[table] = {
        status: contract.classification === 'mutable_configuration'
          ? 'MUTABLE_CONFIGURATION' : 'OPERATIONAL_DATA',
      };
    }
  }
  const seedContractsMatch = Object.values(cloneSeedContracts)
    .every((result) => !String(result.status).startsWith('DIVERGENTE'));
  
  // Equivalencia = contrato public idéntico + tracking vacío + seeds contractuales.
  // Seeds y datos difieren (clone tiene datos productivos, canonical es vacía).
  // La equivalencia solo requiere estructura SQL idéntica y tracking 0/58.
  const schemaMatch = tableCount === canonical.schema.tables && colCount === canonical.schema.columns && enumCount === canonical.schema.enums && indexCount === canonical.schema.indexes;
  const trackingZero = drizzleTrackN === 0 && manualTrackN === 0;
  const equivalent = schemaMatch && trackingZero;
  
  const currentHead = getGitHead();
  const headMatch = currentHead === canonical.head;
  
  const schemaDiff = existsSync(resolve(ROOT, '.local', 'schema-diff-pr20.json'))
    ? JSON.parse(readFileSync(resolve(ROOT, '.local', 'schema-diff-pr20.json'), 'utf8'))
    : null;
  const publicDrift = schemaDiff ? Object.values(schemaDiff.objects).flat()
    .filter((item) => item.status !== 'IDENTICAL')
    .filter((item) => String(item.key).startsWith('public.')).length : -1;
  const inventoryFingerprint = sha256(JSON.stringify(schemaDiff));
  const planDoc = {
    generatedAt: new Date().toISOString(),
    head: currentHead,
    canonicalHead: canonical.head,
    headMatch,
    database: cloneDb,
    branchId: cloneBranch,
    inventoryFingerprint,
    publicDrift,
    equivalence: equivalent ? 'EQUIVALENTE' : 'DIVERGENTE',
    schema: { canonical: canonical.schema, clone: { tables: tableCount, columns: colCount, enums: enumCount, indexes: indexCount }, match: schemaMatch },
    seeds: {
      canonical: canonical.seeds,
      clone: cloneSeeds,
      status: seedStatus,
      contracts: cloneSeedContracts,
      match: seedContractsMatch,
    },
    tracking: { drizzleN: drizzleTrackN, manualN: manualTrackN, match: trackingZero },
    data: { usuarios: usuariosN, blog: blogN, blogPublished: blogPubN, clientes: clientesN, expedientes: expN },
    journalHash: sha256(readFileSync(resolve(ROOT, 'drizzle/migrations/meta/_journal.json'), 'utf8')),
    manifestHash: sha256(readFileSync(resolve(ROOT, 'tools/db/manual-migrations.json'), 'utf8')),
  };
  planDoc.equivalence = trackingZero && publicDrift === 0 && seedContractsMatch
    ? 'EQUIVALENTE' : 'DIVERGENTE';
  planDoc.signature = signPlan(planDoc);
  
  mkdirSync(dirname(PLAN_PATH), { recursive: true });
  writeFileSync(PLAN_PATH, JSON.stringify(planDoc, null, 2));
  
  console.log(`Schema: tables=${tableCount}/${canonical.schema.tables} cols=${colCount}/${canonical.schema.columns} enums=${enumCount}/${canonical.schema.enums} idx=${indexCount}/${canonical.schema.indexes} → ${schemaMatch ? '✓' : '✗'}`);
  console.log(`Seeds (clon condatos vs canonical vacía): ${JSON.stringify(cloneSeeds)}`);
  console.log(`Tracking: Drizzle=${drizzleTrackN}/0 Manual=${manualTrackN}/0 → ${trackingZero ? '✓ (vacío)' : '✗ (no vacío, no se puede baselinear)'}`);
  console.log(`Head: ${currentHead.slice(0,8)}... → ${headMatch ? '✓' : '✗'}`);
  console.log(`Data: u=${usuariosN} blog=${blogN}(${blogPubN}pub) cli=${clientesN} exp=${expN}`);
  console.log(`\nResultado: ${planDoc.equivalence}`);
  
  if (planDoc.equivalence === 'EQUIVALENTE') console.log(`Plan: ${PLAN_PATH}`);
  return planDoc;
}

// ── apply ── applies canonical tracking to clone ──────────────────────

async function apply(sql) {
  console.log('═══ apply: aplicar tracking canónico al clon ═══\n');
  
  // Guards
  const planPath = process.env.BASELINE_PLAN;
  if (!planPath || !existsSync(planPath)) {
    console.error('⛔ BASELINE_PLAN requerido. Apunta al JSON generado por plan.');
    process.exit(1);
  }
  const confirmation = process.env.MIGRATION_BASELINE_CONFIRMATION;
  if (confirmation !== 'BASELINE_PREFLIGHT_CLONE') {
    console.error('⛔ MIGRATION_BASELINE_CONFIRMATION=BASELINE_PREFLIGHT_CLONE requerido.');
    process.exit(1);
  }
  
  const planDoc = JSON.parse(readFileSync(planPath, 'utf8'));
  if (planDoc.equivalence !== 'EQUIVALENTE') {
    console.error('⛔ El plan NO es EQUIVALENTE. No se puede aplicar tracking.');
    process.exit(1);
  }
  
  // Verify branch
  const id = await sql.query("SELECT current_setting('neon.branch_id', true) AS bid, current_database() AS db");
  const branch = id.rows[0]?.bid;
  const db = id.rows[0]?.db;
  const prodBranchId = process.env.NEON_PRODUCTION_BRANCH_ID;
  const allowedBranchId = process.env.BASELINE_ALLOWED_BRANCH_ID;
  
  if (!branch) { console.error('⛔ No branch_id'); process.exit(1); }
  if (!prodBranchId || !allowedBranchId) { console.error('⛔ Branch IDs obligatorios.'); process.exit(1); }
  if (branch === prodBranchId) { console.error('⛔ Es producción. Abortando.'); process.exit(1); }
  if (branch !== allowedBranchId) { console.error('⛔ Branch no autorizado.'); process.exit(1); }
  if (db !== 'neondb') { console.error(`⛔ Base incorrecta: ${db}`); process.exit(1); }
  console.log(`✓ Clon: base ${db}, ≠ producción`);
  
  // Re-verify tracking zero
  const dt0 = (await sql.query("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n;
  const mt0 = (await sql.query("SELECT count(*)::int AS n FROM sgie_schema_migrations")).rows[0].n;
  if (dt0 !== 0 || mt0 !== 0) { console.error(`⛔ Tracking no vacío: ${dt0}/${mt0}`); process.exit(1); }
  
  const canonical = JSON.parse(readFileSync(CANONICAL_PATH, 'utf8'));
  const expectedTracking = expectedTrackingCounts();
  const currentDiff = JSON.parse(readFileSync(resolve(ROOT, '.local', 'schema-diff-pr20.json'), 'utf8'));
  const failures = verifyPlan(planDoc, {
    head: getGitHead(), branchId: branch, database: db,
    inventoryFingerprint: sha256(JSON.stringify(currentDiff)),
  });
  if (failures.length) {
    console.error(`⛔ Plan inválido o desactualizado: ${failures.join(', ')}`);
    process.exit(1);
  }
  
  // Transaction + advisory lock
  await beginLockedTransaction(sql, 20260728);
  
  try {
    // Insert exact canonical tracking
    await insertExactTracking(sql, canonical.tracking);
    
    // Verify
    const dt = (await sql.query("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations")).rows[0].n;
    const mt = (await sql.query("SELECT count(*)::int AS n FROM sgie_schema_migrations")).rows[0].n;
    if (dt !== expectedTracking.drizzle) throw new Error(`Drizzle: ${dt}/${expectedTracking.drizzle}`);
    if (mt !== expectedTracking.manual) throw new Error(`Manual: ${mt}/${expectedTracking.manual}`);
    
    await sql.query("COMMIT");
    console.log(`✅ Baseline canónico aplicado: ${dt}/${expectedTracking.drizzle} Drizzle + ${mt}/${expectedTracking.manual} Manual.`);
  } catch (e) {
    await sql.query("ROLLBACK");
    console.error(`\n⛔ Rollback total: ${e.message}`);
    process.exit(1);
  }
}

// ── Main ───────────────────────────────────────────────────────────────
const validModes = ['canonical-export', 'plan', 'apply'];
const mode = process.argv[2];
if (!validModes.includes(mode)) {
  console.error(`Modo: ${mode}. Usa: ${validModes.join(' | ')}`);
  process.exit(1);
}

(async () => {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL requerida.'); process.exit(1); }
  const { Pool } = await import('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 20000 });
  const sql = { query: (t, p) => pool.query(t, p) };
  
  try {
    if (mode === 'canonical-export') await canonicalExport(sql);
    else if (mode === 'plan') await plan(sql);
    else if (mode === 'apply') await apply(sql);
  } finally {
    await pool.end();
  }
  process.exit(0);
})();
