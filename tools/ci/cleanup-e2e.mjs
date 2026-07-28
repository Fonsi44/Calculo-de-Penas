#!/usr/bin/env node
/**
 * Cleanup E2E — elimina únicamente el namespace sintético de staging.
 *
 * Borra las filas creadas por tools/ci/seed-e2e.mjs (identidades del fixture),
 * respetando foreign keys. No toca migraciones ni tablas del sistema.
 *
 * Mismo guard que el seed: bloquea producción y requiere ALLOW_E2E_SEED=true.
 *
 * Uso:
 *   ALLOW_E2E_SEED=true node tools/ci/cleanup-e2e.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const FIXTURE_PATH = resolve(ROOT, 'tests/e2e/fixtures/identities.json');

// ── Carga explícita de .env.e2e.local ────────────────────────────────────
// E2E_TEST_MODE=1 desactiva la carga del archivo (para tests unitarios de guards).
function loadE2EEnv() {
  if (process.env.E2E_TEST_MODE === '1') return;
  const envPath = resolve(ROOT, '.env.e2e.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch { /* el guard informará */ }
}
loadE2EEnv();

// ── Guards (idénticos al seed) ───────────────────────────────────────────
function guard() {
  if (!process.env.DATABASE_URL) {
    console.error('⛔ DATABASE_URL requerido (define .env.e2e.local).');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ BLOCKED: NODE_ENV=production.');
    process.exit(1);
  }
  if (process.env.E2E_ENVIRONMENT !== 'staging') {
    console.error('⛔ BLOCKED: E2E_ENVIRONMENT debe ser "staging".');
    process.exit(1);
  }
  if (process.env.ALLOW_E2E_SEED !== 'true') {
    console.error('⛔ BLOCKED: ALLOW_E2E_SEED=true requerido.');
    process.exit(1);
  }
  if (/prod|production/.test(process.env.DATABASE_URL.toLowerCase())) {
    console.error('⛔ BLOCKED: DATABASE_URL parece apuntar a producción.');
    process.exit(1);
  }
  console.log('✓ Environment guard passed.');
}

guard();

// ── Verificación de branch Neon (fail-closed) ─────────────────────────
const prodBranchId = process.env.NEON_PRODUCTION_BRANCH_ID;
if (!prodBranchId) {
  console.error('⛔ NEON_PRODUCTION_BRANCH_ID no definido. Abortando.');
  process.exit(1);
}

const FIXTURE = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
const { users, client, clientB, expedient, expedientB, case: caseRow } = FIXTURE;
const userIds = Object.values(users).map(u => u.id);
const expIds = [expedient.id, expedientB.id];
const clientIds = [client.id, clientB.id];

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const c = await pool.connect();
let tx = false;

// Verificar branch Neon (no producción)
try {
  const r = await c.query("SELECT current_setting('neon.branch_id', true) AS id");
  const current = r.rows[0]?.id;
  if (!current) { console.error('⛔ No se pudo obtener branch_id.'); process.exit(1); }
  if (current === prodBranchId) { console.error('⛔ BLOCKED: branch_id es producción.'); process.exit(1); }
  console.log('✓ Neon branch_id verificado (≠ producción).');
} catch (e) {
  console.error(`⛔ Error al verificar branch Neon: ${e.message}`);
  process.exit(1);
}

console.log('\n🧹 Cleanup namespace E2E sintético\n');

try {
  await c.query('BEGIN');
  tx = true;

  // Orden inverso de dependencias (FKs).
  // Limpiamos TODAS las tablas que referencian a usuarios.id o a las entidades
  // E2E antes de borrarlas, porque muchas FK son NO ACTION y el rol de Neon no
  // es superuser (no puede usar session_replication_role).

  // 1. Agenda
  const a = await c.query(`DELETE FROM eventos_agenda WHERE propietario_id = ANY($1) OR creado_por = ANY($1) OR confirmada_por = ANY($1) RETURNING id`, [userIds]);
  console.log(`  ✓ eventos_agenda: ${a.rowCount} eliminados`);

  // 2. Casos (auth-flow)
  const cs = await c.query(`DELETE FROM casos WHERE usuario_id = ANY($1) OR id = $2 RETURNING id`, [userIds, caseRow.id]);
  console.log(`  ✓ casos: ${cs.rowCount} eliminados`);

  // 3. Asignaciones de expedientes
  const aa = await c.query(`DELETE FROM expediente_asignaciones WHERE expediente_id = ANY($1) OR abogado_id = ANY($2) OR asignado_por = ANY($2) RETURNING id`, [expIds, userIds]);
  console.log(`  ✓ expediente_asignaciones: ${aa.rowCount} eliminados`);

  // 4. Expedientes (limpiar dependientes primero)
  for (const [table, col] of [
    ['documentos_expediente', 'expediente_id'],
    ['historial_expediente', 'expediente_id'],
    ['tareas', 'expediente_id'],
  ]) {
    try {
      const r = await c.query(`DELETE FROM ${table} WHERE ${col} = ANY($1)`, [expIds]);
      if (r.rowCount > 0) console.log(`  ✓ ${table}: ${r.rowCount} eliminados`);
    } catch (e) { if (!/does not exist|column .* does not exist/i.test(e.message)) throw e; }
  }
  const e = await c.query(`DELETE FROM expedientes WHERE id = ANY($1) RETURNING id`, [expIds]);
  console.log(`  ✓ expedientes: ${e.rowCount} eliminados`);

  // 5. Clientes
  const cl = await c.query(`DELETE FROM clientes WHERE id = ANY($1) RETURNING id`, [clientIds]);
  console.log(`  ✓ clientes: ${cl.rowCount} eliminados`);

  // 6. 2FA secrets (CASCADE, pero explícito)
  const tf = await c.query(`DELETE FROM two_factor_secrets WHERE usuario_id = ANY($1) RETURNING id`, [userIds]);
  console.log(`  ✓ two_factor_secrets: ${tf.rowCount} eliminados`);

  // 7. Tablas con referencias NO ACTION a usuarios.id.
  //    Lista completa obtenida de information_schema para esta DB.
  //    Se intenta cada DELETE de forma defensiva (la tabla/columna puede no existir).
  const userRefs = [
    ['aceptaciones_legales', 'usuario_id'],
    ['ai_pipeline_runs', 'actor_id'],
    ['ai_task_routing', 'revisado_por'],
    ['alertas', 'resuelta_por'],
    ['alertas_sla', 'resuelta_por'],
    ['alertas_sla', 'propietario_id'],
    ['auditoria_eventos', 'usuario_id'],
    ['calendar_connections', 'user_id'],
    ['calendar_feed_tokens', 'user_id'],
    ['campos_extraidos', 'confirmado_por'],
    ['campos_extraidos', 'corregido_por'],
    ['case_next_actions', 'decision_por'],
    ['case_summary_history', 'creado_por'],
    ['clientes', 'desactivado_por'],
    ['clientes', 'creado_por'],
    ['communication_rules', 'creado_por'],
    ['comunicaciones_aprobaciones', 'rechazado_por'],
    ['comunicaciones_aprobaciones', 'aprobado_por'],
    ['comunicaciones_auditoria', 'actor_id'],
    ['comunicaciones_outbox', 'creado_por'],
    ['comunicaciones_outbox', 'aprobada_por'],
    ['correcciones_ia', 'abogado_id'],
    ['correos_enviados', 'enviado_por'],
    ['daily_briefs', 'user_id'],
    ['document_bulk_approvals', 'actor_id'],
    ['document_classifications', 'decision_por'],
    ['document_contradictions', 'resolucion_por'],
    ['document_extractions', 'validado_por'],
    ['document_links', 'actor_id'],
    ['document_links', 'decision_por'],
    ['documentos_expediente', 'subido_por'],
    ['documentos_expediente', 'rechazado_por'],
    ['documentos_expediente', 'aprobado_por'],
    ['enlaces_magicos', 'creado_por'],
    ['equipos_miembros', 'usuario_id'],
    ['expediente_permisos', 'concedido_por'],
    ['expediente_permisos', 'abogado_id'],
    ['extraction_schema_versions', 'creado_por'],
    ['feature_flags', 'actor_id'],
    ['feature_flags', 'user_id'],
    ['historial_expediente', 'actor_id'],
    ['invitaciones', 'creada_por'],
    ['invitaciones', 'usuario_id'],
    ['knowledge_sources', 'created_by'],
    ['knowledge_versions', 'reviewed_by'],
    ['knowledge_versions', 'approved_by'],
    ['knowledge_versions', 'created_by'],
    ['medios', 'created_by'],
    ['notificaciones_leidas', 'usuario_id'],
    ['paginas_cms', 'created_by'],
    ['password_reset_tokens', 'usuario_id'],
    ['plantilla_correo_versiones', 'creado_por'],
    ['plantillas_correo', 'creado_por'],
    ['procedimiento_versiones', 'creado_por'],
    ['reglas_config_version', 'aprobado_por'],
    ['resumenes_ia_expediente', 'generado_por'],
    ['retencion_politicas', 'aprobada_por'],
    ['signature_envelopes', 'created_by'],
    ['signature_packages', 'actor_id'],
    ['sugerencias_ajuste', 'aprobada_por'],
    ['tarea_comentarios', 'autor_id'],
    ['tareas', 'creada_por'],
    ['tareas', 'asignada_a'],
    ['two_factor_recovery_codes', 'usuario_id'],
    ['user_activity_log', 'usuario_id'],
    ['user_preferences', 'user_id'],
    ['usuarios_capacidades', 'concedido_por'],
    ['usuarios_capacidades', 'usuario_id'],
    ['usuarios_roles', 'usuario_id'],
    ['usuarios_sgie', 'usuario_id'],
    ['versiones_contenido', 'creado_por'],
    ['workload_snapshots', 'user_id'],
  ];
  let residualCount = 0;
  for (const [table, col] of userRefs) {
    try {
      const r = await c.query(`DELETE FROM ${table} WHERE ${col} = ANY($1)`, [userIds]);
      if (r.rowCount > 0) residualCount += r.rowCount;
    } catch (e) {
      if (!/does not exist|column .* does not exist/i.test(e.message)) throw e;
    }
  }
  if (residualCount > 0) console.log(`  ✓ referencias residuales a usuarios: ${residualCount} eliminadas`);

  // 8. Usuarios (ya sin referencias que lo impidan)
  const u = await c.query(`DELETE FROM usuarios WHERE id = ANY($1) RETURNING id`, [userIds]);
  console.log(`  ✓ usuarios: ${u.rowCount} eliminados`);

  await c.query('COMMIT');
  tx = false;
  console.log('\n✅ Cleanup completado. Namespace E2E eliminado.');
} catch (err) {
  if (tx) { try { await c.query('ROLLBACK'); } catch {} }
  console.error('\n⛔ Error en cleanup. Rollback ejecutado.');
  console.error('   Detalle:', err.message);
  process.exit(1);
} finally {
  c.release();
  await pool.end();
}
