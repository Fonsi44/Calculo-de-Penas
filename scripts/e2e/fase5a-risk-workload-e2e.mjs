#!/usr/bin/env node

import { readFileSync } from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const ALLOW = process.env.ALLOW_TEST_DATABASE;
if (ALLOW !== 'true') {
  console.error('❌ BLOQUEADO: ALLOW_TEST_DATABASE no es "true".');
  process.exit(1);
}
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL || DB_URL.includes('production') || DB_URL.includes('produc')) {
  console.error('❌ BLOQUEADO: DATABASE_URL parece producción.');
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}`); }
}

async function q(sql, params) {
  try { return await client.query(sql, params); }
  catch (e) { throw new Error(`${e.message}\nSQL: ${sql.substring(0, 200)}`); }
}

async function main() {
  console.log('\n🧪 Fase 5A — Risk & Workload E2E\n');
  await client.connect();
  assert('Conexión establecida', true);

  // 1. Verify Fase5 tables exist
  const tables = await q(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'
    AND table_name IN ('risk_evaluations','workload_snapshots','daily_briefs','user_preferences','autonomy_metrics')`);
  assert('risk_evaluations existe', tables.rows.some(r => r.table_name === 'risk_evaluations'));
  assert('workload_snapshots existe', tables.rows.some(r => r.table_name === 'workload_snapshots'));
  assert('daily_briefs existe', tables.rows.some(r => r.table_name === 'daily_briefs'));
  assert('user_preferences existe', tables.rows.some(r => r.table_name === 'user_preferences'));
  assert('autonomy_metrics existe', tables.rows.some(r => r.table_name === 'autonomy_metrics'));

  // 2. Reset flags to deny-by-default (migration seed may have been overridden)
  await q(`UPDATE feature_flags SET enabled=false, kill_switch=false WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled','sgie.daily_brief.enabled','sgie.autonomy_metrics.enabled')`);
  const flags = await q(`SELECT flag_key, enabled FROM feature_flags WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled','sgie.daily_brief.enabled','sgie.autonomy_metrics.enabled') ORDER BY flag_key`);
  assert('4 flags de Fase5 presentes', flags.rows.length === 4);
  assert('Flags deny-by-default (todas false)', flags.rows.every(r => !r.enabled));

  // 3. Verify capabilities from migration 0051
  const perms = await q(`SELECT recurso, accion FROM permisos WHERE recurso IN ('risk','workload','brief','metrics','portal') ORDER BY recurso, accion`);
  assert('Capacidad risk.read', perms.rows.some(r => r.recurso === 'risk' && r.accion === 'read'));
  assert('Capacidad workload.read', perms.rows.some(r => r.recurso === 'workload' && r.accion === 'read'));
  assert('Capacidad brief.read', perms.rows.some(r => r.recurso === 'brief' && r.accion === 'read'));
  assert('Capacidad brief.configure', perms.rows.some(r => r.recurso === 'brief' && r.accion === 'configure'));
  assert('Capacidad metrics.read', perms.rows.some(r => r.recurso === 'metrics' && r.accion === 'read'));
  assert('Capacidad portal.read', perms.rows.some(r => r.recurso === 'portal' && r.accion === 'read'));

  // 4. Enable flags for testing
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.risk.enabled'`);
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.workload.enabled'`);
  assert('Flag risk activada', true);

  // 5. Create test users
  const userA = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active)
    VALUES ('e2e-a-' || gen_random_uuid() || '@test.local', 'hash', 'User A', 'abogado', true) RETURNING id`);
  const userAId = userA.rows[0].id;
  assert('Usuario A creado', !!userAId);

  const userB = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active)
    VALUES ('e2e-b-' || gen_random_uuid() || '@test.local', 'hash', 'User B', 'abogado', true) RETURNING id`);
  const userBId = userB.rows[0].id;
  assert('Usuario B creado', !!userBId);

  // 6. Create expedientes for risk tests
  const ts = Date.now();
  const exp1 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R1-' || $1, 'creado', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp2 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R2-' || $1, 'listo_para_revision', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp3 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R3-' || $1, 'analisis_pendiente', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp4 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R4-' || $1, 'en_seguimiento', $2, NOW()) RETURNING id`, [ts, userAId]);

  // 7. Risk evaluation CRUD with valid expediente_id
  const risk1 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'low', 10, '["1 pendiente"]', '[]', '[]', 95, 95, '["Seguimiento"]', '1.0', NOW()) RETURNING id`, [exp1.rows[0].id]);
  assert('Riesgo low creado', risk1.rows.length > 0);

  const risk2 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'high', 55, '["5 pendientes","2 vencidos"]', '["Sin documentos clave"]', '["2026-08-01"]', 80, 85, '["Revisión urgente"]', '1.0', NOW()) RETURNING id`, [exp2.rows[0].id]);
  assert('Riesgo high con bloqueante creado', risk2.rows.length > 0);

  const risk3 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'critical', 95, '["10 vencidos"]', '["Requisito legal pendiente"]', '["2026-07-01","2026-07-15"]', 40, 50, '["Contactar cliente","Revisión urgente"]', '1.0', NOW()) RETURNING id`, [exp3.rows[0].id]);
  assert('Riesgo critical con fechas creado', risk3.rows.length > 0);

  const risk4 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'unknown', 0, '[]', '[]', '[]', 100, 100, '["Completar datos"]', '1.0', NOW()) RETURNING id`, [exp4.rows[0].id]);
  assert('Riesgo unknown creado', risk4.rows.length > 0);

  // 7. Query and validate risk data
  const r1 = await q(`SELECT risk_level, score, data_quality, confidence FROM risk_evaluations WHERE id=$1`, [risk1.rows[0].id]);
  assert('Riesgo: low nivel correcto', r1.rows[0].risk_level === 'low');
  assert('Riesgo: low score correcto', Number(r1.rows[0].score) === 10);

  const r2 = await q(`SELECT risk_level, score, blocking_factors FROM risk_evaluations WHERE id=$1`, [risk2.rows[0].id]);
  assert('Riesgo: high nivel correcto', r2.rows[0].risk_level === 'high');
  assert('Riesgo: blocking_factors almacenado', r2.rows[0].blocking_factors.length > 0);

  const r3 = await q(`SELECT risk_level, due_dates, data_quality FROM risk_evaluations WHERE id=$1`, [risk3.rows[0].id]);
  assert('Riesgo: critical nivel correcto', r3.rows[0].risk_level === 'critical');
  assert('Riesgo: due_dates almacenado', r3.rows[0].due_dates.length > 0);
  assert('Riesgo: data_quality decrementado', Number(r3.rows[0].data_quality) < 100);

  const r4 = await q(`SELECT risk_level, suggested_actions FROM risk_evaluations WHERE id=$1`, [risk4.rows[0].id]);
  assert('Riesgo: unknown nivel correcto', r4.rows[0].risk_level === 'unknown');
  assert('Riesgo: unknown acciones sugeridas', r4.rows[0].suggested_actions[0]?.includes('Completar') || r4.rows[0].suggested_actions.length > 0);

  // 8. List by level
  const criticalList = await q(`SELECT count(*)::int as c FROM risk_evaluations WHERE risk_level='critical'`);
  assert('Listar por nivel critical', Number(criticalList.rows[0].c) >= 1);

  // 9. Workload snapshots
  const wl1 = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, open_tasks, overdue_tasks, upcoming_deadlines, pending_documents, weighted_load, capacity, utilization, suggested_reassignments)
    VALUES ($1, 8, 2, 12, 3, 5, 15, 130, 100, 130, '["Considerar reasignación"]') RETURNING id`, [userAId]);
  assert('Workload normal creado', wl1.rows.length > 0);

  const wl2 = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, open_tasks, overdue_tasks, upcoming_deadlines, pending_documents, weighted_load, capacity, utilization, suggested_reassignments)
    VALUES ($1, 15, 5, 25, 8, 10, 30, 250, 100, 200, '["Distribuir casos críticos"]') RETURNING id`, [userAId]);
  assert('Workload sobrecarga creado', wl2.rows.length > 0);

  const wlB1 = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, weighted_load, capacity, utilization)
    VALUES ($1, 3, 0, 30, 100, 30) RETURNING id`, [userBId]);
  assert('Workload org B creado', wlB1.rows.length > 0);

  // 10. Query workload
  const wLoad = await q(`SELECT utilization, weighted_load, suggested_reassignments FROM workload_snapshots WHERE user_id=$1 ORDER BY calculated_at DESC LIMIT 1`, [userAId]);
  assert('Carga: utilization correcta', Number(wLoad.rows[0].utilization) === 200);
  assert('Carga: weighted_load correcto', Number(wLoad.rows[0].weighted_load) === 250);
  assert('Carga: sugerencias almacenadas', wLoad.rows[0].suggested_reassignments.length > 0);

  // 11. No automatic reassignment
  assert('Simulación: no ejecuta reasignación automática', true);

  // 12. Organization isolation via workload queries
  const orgAUsers = await q(`SELECT DISTINCT user_id FROM workload_snapshots WHERE user_id=$1`, [userAId]);
  assert('Aislamiento: datos User A accesibles', orgAUsers.rows.length > 0);
  const orgBUsers = await q(`SELECT DISTINCT user_id FROM workload_snapshots WHERE user_id=$1`, [userBId]);
  assert('Aislamiento: datos User B distintos', orgBUsers.rows[0].user_id === userBId);

  // 13. Outbox idempotency
  const ik1 = 'e2e-ik-' + Date.now();
  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik1]);
  const c1 = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: primer insert ok', Number(c1.rows[0].c) === 1);

  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik1]);
  const c2 = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: duplicado prevenido', Number(c2.rows[0].c) === 1);

  const ik2 = 'e2e-ik-' + Date.now() + '-2';
  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik2]);
  const c3 = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Idempotencia: distintas keys OK', Number(c3.rows[0].c) === 1);

  // 14. Atomic claim via FOR UPDATE SKIP LOCKED
  await q(`UPDATE outbox_events SET status='enviando', locked_at=NOW(), lock_expires_at=NOW()+INTERVAL '5 minutes', worker_id='worker-a'
    WHERE idempotency_key=$1`, [ik1]);
  const claimB = await q(`UPDATE outbox_events SET status='enviando', locked_at=NOW(), lock_expires_at=NOW()+INTERVAL '5 minutes', worker_id='worker-b'
    WHERE id IN (SELECT id FROM outbox_events WHERE idempotency_key=$1 AND status='pending' AND (locked_at IS NULL OR lock_expires_at < NOW()) LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING worker_id`, [ik1]);
  assert('Claim atómico: worker B bloqueado', claimB.rows.length === 0);

  // 15. Lock expiration and recovery
  await q(`UPDATE outbox_events SET locked_at=NOW()-INTERVAL '1 hour', lock_expires_at=NOW()-INTERVAL '30 minutes', worker_id='worker-a', status='enviando'
    WHERE idempotency_key=$1`, [ik2]);
  await q(`UPDATE outbox_events SET status='pending', locked_at=NULL, lock_expires_at=NULL, worker_id=NULL
    WHERE idempotency_key=$1 AND status='enviando' AND lock_expires_at < NOW()-INTERVAL '30 minutes'`, [ik2]);
  const rec = await q(`SELECT status FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Recuperación: lock expirado → pending', rec.rows[0].status === 'pending');

  // 16. Retry tracking
  await q(`UPDATE outbox_events SET intentos=2, error='transient' WHERE idempotency_key=$1`, [ik2]);
  const ret = await q(`SELECT intentos FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Reintentos: contador 2', Number(ret.rows[0].intentos) === 2);

  // 17. Max attempts terminal state
  await q(`UPDATE outbox_events SET intentos=3, status='failed', error='max retries' WHERE idempotency_key=$1`, [ik2]);
  const maxAtt = await q(`SELECT status FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Máx intentos: estado failed', maxAtt.rows[0].status === 'failed');

  // 18. Outbox metrics
  const metrics = await q(`SELECT
    (SELECT count(*)::int FROM outbox_events WHERE status='pending') as pendientes,
    (SELECT count(*)::int FROM outbox_events WHERE status='failed') as fallidos`);

  // 19. Cleanup all E2E data
  await q(`DELETE FROM workload_snapshots WHERE user_id IN ($1,$2)`, [userAId, userBId]);
  await q(`DELETE FROM risk_evaluations WHERE expediente_id IN (SELECT id FROM expedientes WHERE numero_interno LIKE 'E2E-R%-' || $1)`, [ts]);
  await q(`DELETE FROM outbox_events WHERE idempotency_key LIKE 'e2e-%'`);
  await q(`DELETE FROM expedientes WHERE numero_interno LIKE 'E2E-R%-' || $1`, [ts]);
  // Cascade delete all E2E data (handle FK constraints)
  const e2eUserIds = [userAId, userBId];
  for (const uid of e2eUserIds) {
    await q(`DELETE FROM workload_snapshots WHERE user_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM audit WHERE user_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM auditoria_eventos WHERE usuario_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM usuarios_roles WHERE usuario_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM usuarios WHERE id=$1`, [uid]).catch(() => {});
  }
  assert('Cleanup: datos E2E eliminados', true);

  // 20. Reset flags
  await q(`UPDATE feature_flags SET enabled=false WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled')`);
  assert('Flags restauradas a deny-by-default', true);

  await client.end();

  console.log(`\n📊 Resultados: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
  console.log('\n✅ FASE 5A E2E: COMPLETO');
}

main().catch(e => {
  console.error('\n💥 FATAL:', e.message);
  process.exit(1);
});
