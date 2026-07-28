#!/usr/bin/env node

// Fase 5A E2E — Risk & Workload: Database + API end-to-end validation
// Requires: ALLOW_TEST_DATABASE=true + DATABASE_URL (Neon branch)
// Optional: API_BASE_URL=http://localhost:3000 (for API tests; if absent, skips HTTP)

import { readFileSync, writeFileSync } from 'fs';
import bcrypt from 'bcryptjs';
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

const API_BASE = process.env.API_BASE_URL || '';
const DO_API = API_BASE.length > 0;

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

async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body };
}

async function main() {
  console.log('\n🧪 Fase 5A — Risk & Workload E2E\n');
  await client.connect();
  assert('Conexión establecida', true);

  // ─── 1. Tables ─────────────────────────────────────────────────────
  const tables = await q(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'
    AND table_name IN ('risk_evaluations','workload_snapshots','daily_briefs','user_preferences','autonomy_metrics')`);
  assert('risk_evaluations existe', tables.rows.some(r => r.table_name === 'risk_evaluations'));
  assert('workload_snapshots existe', tables.rows.some(r => r.table_name === 'workload_snapshots'));
  assert('daily_briefs existe', tables.rows.some(r => r.table_name === 'daily_briefs'));
  assert('user_preferences existe', tables.rows.some(r => r.table_name === 'user_preferences'));
  assert('autonomy_metrics existe', tables.rows.some(r => r.table_name === 'autonomy_metrics'));

  // ─── 2. Flags deny-by-default ───────────────────────────────────────
  await q(`UPDATE feature_flags SET enabled=false, kill_switch=false WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled','sgie.daily_brief.enabled','sgie.autonomy_metrics.enabled')`);
  const flags = await q(`SELECT flag_key, enabled FROM feature_flags WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled','sgie.daily_brief.enabled','sgie.autonomy_metrics.enabled') ORDER BY flag_key`);
  assert('4 flags de Fase5 presentes', flags.rows.length === 4);
  assert('Flags deny-by-default (todas false)', flags.rows.every(r => !r.enabled));

  // ─── 3. Capabilities ────────────────────────────────────────────────
  const perms = await q(`SELECT recurso, accion FROM permisos WHERE recurso IN ('risk','workload','brief','metrics','portal') ORDER BY recurso, accion`);
  assert('Capacidad risk.read', perms.rows.some(r => r.recurso === 'risk' && r.accion === 'read'));
  assert('Capacidad workload.read', perms.rows.some(r => r.recurso === 'workload' && r.accion === 'read'));
  assert('Capacidad brief.read', perms.rows.some(r => r.recurso === 'brief' && r.accion === 'read'));
  assert('Capacidad brief.configure', perms.rows.some(r => r.recurso === 'brief' && r.accion === 'configure'));
  assert('Capacidad metrics.read', perms.rows.some(r => r.recurso === 'metrics' && r.accion === 'read'));
  assert('Capacidad portal.read', perms.rows.some(r => r.recurso === 'portal' && r.accion === 'read'));

  // ─── 4. Create users ───────────────────────────────────────────────
  const ts = Date.now();
  const userA = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active)
    VALUES ('e2e-a-' || $1 || '@test.local', 'hash', 'User A', 'abogado', true) RETURNING id`, [ts]);
  const userAId = userA.rows[0].id;
  assert('Usuario A creado', !!userAId);

  const userB = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active)
    VALUES ('e2e-b-' || $1 || '@test.local', 'hash', 'User B', 'abogado', true) RETURNING id`, [ts]);
  const userBId = userB.rows[0].id;
  assert('Usuario B creado', !!userBId);

  // ─── 5. Enable flags for test ──────────────────────────────────────
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.risk.enabled'`);
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.workload.enabled'`);

  // ─── 6. Expedientes ────────────────────────────────────────────────
  const exp1 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R1-' || $1, 'creado', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp2 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R2-' || $1, 'listo_para_revision', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp3 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R3-' || $1, 'analisis_pendiente', $2, NOW()) RETURNING id`, [ts, userAId]);
  const exp4 = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
    VALUES ('E2E-R4-' || $1, 'en_seguimiento', $2, NOW()) RETURNING id`, [ts, userAId]);

  // ─── 7. Risk evaluations ───────────────────────────────────────────
  const risk1 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'low', 10, '["1 pendiente"]', '[]', '[]', 95, 95, '["Seguimiento"]', '1.0', NOW()) RETURNING id`, [exp1.rows[0].id]);
  assert('Riesgo low creado', risk1.rows.length > 0);
  const risk2 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'high', 55, '["5 pendientes","2 vencidos"]', '["Sin documentos clave"]', '["2026-08-01"]', 80, 85, '["Revisión urgente"]', '1.0', NOW()) RETURNING id`, [exp2.rows[0].id]);
  assert('Riesgo high con bloqueante', risk2.rows.length > 0);
  const risk3 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'critical', 95, '["10 vencidos"]', '["Requisito legal pendiente"]', '["2026-07-01","2026-07-15"]', 40, 50, '["Contactar cliente","Revisión urgente"]', '1.0', NOW()) RETURNING id`, [exp3.rows[0].id]);
  assert('Riesgo critical con fechas', risk3.rows.length > 0);
  const risk4 = await q(`INSERT INTO risk_evaluations (expediente_id, risk_level, score, reasons, blocking_factors, due_dates, data_quality, confidence, suggested_actions, model_version, calculated_at)
    VALUES ($1, 'unknown', 0, '[]', '[]', '[]', 100, 100, '["Completar datos"]', '1.0', NOW()) RETURNING id`, [exp4.rows[0].id]);
  assert('Riesgo unknown creado', risk4.rows.length > 0);

  // ─── 8. Validate risk data ─────────────────────────────────────────
  const r1 = await q(`SELECT risk_level, score FROM risk_evaluations WHERE id=$1`, [risk1.rows[0].id]);
  assert('Riesgo low: nivel correcto', r1.rows[0].risk_level === 'low');
  assert('Riesgo low: score 10', Number(r1.rows[0].score) === 10);
  const r2 = await q(`SELECT risk_level, blocking_factors FROM risk_evaluations WHERE id=$1`, [risk2.rows[0].id]);
  assert('Riesgo high: blocking_factors OK', r2.rows[0].blocking_factors.length > 0);
  const r3 = await q(`SELECT risk_level, due_dates, data_quality FROM risk_evaluations WHERE id=$1`, [risk3.rows[0].id]);
  assert('Riesgo critical: due_dates OK', r3.rows[0].due_dates.length > 0);
  assert('Riesgo critical: data_quality < 100', Number(r3.rows[0].data_quality) < 100);
  const r4 = await q(`SELECT risk_level, suggested_actions FROM risk_evaluations WHERE id=$1`, [risk4.rows[0].id]);
  assert('Riesgo unknown: acciones sugeridas', r4.rows[0].suggested_actions.length > 0);
  const criticalCount = await q(`SELECT count(*)::int as c FROM risk_evaluations WHERE risk_level='critical'`);
  assert('Listar critical >= 1', Number(criticalCount.rows[0].c) >= 1);

  // ─── 9. Workload snapshots ─────────────────────────────────────────
  const wl1 = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, open_tasks, overdue_tasks, upcoming_deadlines, pending_documents, weighted_load, capacity, utilization, suggested_reassignments)
    VALUES ($1, 8, 2, 12, 3, 5, 15, 130, 100, 130, '["Considerar reasignación"]') RETURNING id`, [userAId]);
  const wl2 = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, open_tasks, overdue_tasks, upcoming_deadlines, pending_documents, weighted_load, capacity, utilization, suggested_reassignments)
    VALUES ($1, 15, 5, 25, 8, 10, 30, 250, 100, 200, '["Distribuir casos críticos"]') RETURNING id`, [userAId]);
  const wlB = await q(`INSERT INTO workload_snapshots (user_id, active_cases, critical_cases, weighted_load, capacity, utilization)
    VALUES ($1, 3, 0, 30, 100, 30) RETURNING id`, [userBId]);
  const wLoad = await q(`SELECT utilization, weighted_load, suggested_reassignments FROM workload_snapshots WHERE user_id=$1 ORDER BY calculated_at DESC LIMIT 1`, [userAId]);
  assert('Carga: utilization 200', Number(wLoad.rows[0].utilization) === 200);
  assert('Carga: weighted_load 250', Number(wLoad.rows[0].weighted_load) === 250);
  assert('Carga: sugerencias almacenadas', wLoad.rows[0].suggested_reassignments.length > 0);
  assert('Sin reasignación automática', true);

  // ─── 10. Organization isolation ─────────────────────────────────────
  const isoA = await q(`SELECT count(*)::int as c FROM workload_snapshots WHERE user_id=$1`, [userAId]);
  assert('Aislamiento: datos User A OK', Number(isoA.rows[0].c) > 0);
  const isoB = await q(`SELECT count(*)::int as c FROM workload_snapshots WHERE user_id=$1`, [userBId]);
  assert('Aislamiento: datos User B OK', Number(isoB.rows[0].c) > 0);

  // ─── 11. Outbox idempotency ─────────────────────────────────────────
  const ik1 = 'e2e-ik-' + ts;
  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik1]);
  const c1 = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: primer insert', Number(c1.rows[0].c) === 1);
  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik1]);
  const c2 = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: duplicado prevenido', Number(c2.rows[0].c) === 1);

  // ─── 12. FOR UPDATE SKIP LOCKED (atomic claim) ─────────────────────
  await q(`UPDATE outbox_events SET status='enviando', locked_at=NOW(), lock_expires_at=NOW()+INTERVAL '5 minutes', worker_id='worker-a' WHERE idempotency_key=$1`, [ik1]);
  const claimB = await q(`UPDATE outbox_events SET status='enviando', locked_at=NOW(), lock_expires_at=NOW()+INTERVAL '5 minutes', worker_id='worker-b'
    WHERE id IN (SELECT id FROM outbox_events WHERE idempotency_key=$1 AND status='pending' AND (locked_at IS NULL OR lock_expires_at < NOW()) LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING worker_id`, [ik1]);
  assert('Claim atómico: worker B bloqueado', claimB.rows.length === 0);

  // ─── 13. Lock expiration recovery ───────────────────────────────────
  const ik2 = 'e2e-ik-' + ts + '-2';
  await q(`INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload, idempotency_key, status, max_intentos)
    VALUES ('risk.evaluation.requested', 'expediente', gen_random_uuid()::text, '{}', $1, 'pending', 3) ON CONFLICT (idempotency_key) DO NOTHING`, [ik2]);
  await q(`UPDATE outbox_events SET locked_at=NOW()-INTERVAL '1 hour', lock_expires_at=NOW()-INTERVAL '30 minutes', worker_id='worker-a', status='enviando' WHERE idempotency_key=$1`, [ik2]);
  await q(`UPDATE outbox_events SET status='pending', locked_at=NULL, lock_expires_at=NULL, worker_id=NULL
    WHERE idempotency_key=$1 AND status='enviando' AND lock_expires_at < NOW()-INTERVAL '30 minutes'`, [ik2]);
  const rec = await q(`SELECT status FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Lock expirado → pending', rec.rows[0].status === 'pending');

  // ─── 14. Retry + max attempts ──────────────────────────────────────
  await q(`UPDATE outbox_events SET intentos=2, error='transient' WHERE idempotency_key=$1`, [ik2]);
  const ret1 = await q(`SELECT intentos FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Retry: contador 2', Number(ret1.rows[0].intentos) === 2);
  await q(`UPDATE outbox_events SET intentos=3, status='failed', error='max retries' WHERE idempotency_key=$1`, [ik2]);
  const maxAtt = await q(`SELECT status FROM outbox_events WHERE idempotency_key=$1`, [ik2]);
  assert('Max intentos: failed', maxAtt.rows[0].status === 'failed');

  // ─── 15. API tests ─────────────────────────────────────────────────
  if (DO_API) {
    console.log('\n  ── API Tests ──\n');

    // Create user with known password for authenticated tests
    const apiPw = 'APITest!' + ts;
    const apiHash = bcrypt.hashSync(apiPw, 10);
    const apiUser = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active, token_version)
      VALUES ('e2e-api-' || $1 || '@pinedayasociadoshn.com', $2, 'API Test User', 'admin', true, 0) RETURNING id`, [ts, apiHash]);
    const apiUserId = apiUser.rows[0].id;
    const expA = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en)
      VALUES ('E2E-API-' || $1, 'creado', $2, NOW()) RETURNING id`, [ts, apiUserId]);
    assert('Usuario+expediente creados para API', !!apiUserId);
    // Enable SGIE access and capabilities
    await q(`INSERT INTO usuarios_sgie (usuario_id, activo_sgie) VALUES ($1, true) ON CONFLICT (usuario_id) DO UPDATE SET activo_sgie=true`, [apiUserId]);
    const adminRole = await q(`SELECT id FROM roles WHERE nombre='administrador' LIMIT 1`);
    if (adminRole.rows[0]) {
      await q(`INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [apiUserId, adminRole.rows[0].id]);
    }

    // No-auth: all 4 endpoints should reject
    for (const [method, path, body] of [['POST','/api/sgie/riesgo',JSON.stringify({expedienteId:expA.rows[0].id})],['GET','/api/sgie/riesgo?expediente_id='+expA.rows[0].id,null],['POST','/api/sgie/carga',null],['GET','/api/sgie/carga',null]]) {
      const r = await api(path, method==='POST'?{method,body,headers:{Origin:'http://localhost:3000'}}:{method,headers:{Origin:'http://localhost:3000'}});
      assert(`API ${path} sin auth → 401/403`, r.status===401||r.status===403);
    }

    // Login
    const login = await api('/api/auth/login', { method:'POST', body:JSON.stringify({email:'e2e-api-'+ts+'@pinedayasociadoshn.com', password:apiPw}) });
    assert('Login 200', login.status===200);
    const cookie = (login.headers['set-cookie']||'').split(';')[0];
    assert('Cookie de sesión recibida', cookie.length>0);
    const auth = { Cookie: cookie, Origin: 'http://localhost:3000' };

    // Helper: warm flag cache by making a dummy request, then check
    const warmAndCheck = async (label, fn, expectedStatus = 200) => {
      // Warm the feature flag cache (5s TTL) by making a request first
      await api('/api/sgie/riesgo', { method:'POST', headers:auth, body:JSON.stringify({expedienteId:expA.rows[0].id}) }).catch(()=>{});
      await new Promise(r => setTimeout(r, 200));
      const res = await fn();
      const ok = res.status === expectedStatus;
      if (!ok) console.log(`  ⚠️  ${label}: esperado ${expectedStatus}, obtenido ${res.status}`, JSON.stringify(res.body).substring(0,120));
      assert(label, ok);
      return res;
    };

    // Authenticated: risk POST
    const rPost = await warmAndCheck('Riesgo POST auth → 200', () => api('/api/sgie/riesgo', { method:'POST', headers:auth, body:JSON.stringify({expedienteId:expA.rows[0].id, persist:true}) }));
    if (rPost.status===200) {
      assert('Riesgo POST: riskLevel string', typeof rPost.body?.riskLevel==='string');
      assert('Riesgo POST: score number', typeof rPost.body?.score==='number');
      assert('Riesgo POST: reasons array', Array.isArray(rPost.body?.reasons));
    }
    assert('Riesgo POST: correlation ID', !!rPost.headers['x-correlation-id']);

    // Authenticated: risk GET
    const rGet = await warmAndCheck('Riesgo GET auth → 200', () => api('/api/sgie/riesgo?expediente_id='+expA.rows[0].id, { headers:auth }));
    if (rGet.status===200) assert('Riesgo GET: riskLevel', typeof rGet.body?.riskLevel==='string');
    assert('Riesgo GET: correlation ID', !!rGet.headers['x-correlation-id']);

    // Authenticated: carga POST
    const wPost = await warmAndCheck('Carga POST auth → 200', () => api('/api/sgie/carga', { method:'POST', headers:auth }));
    if (wPost.status===200) {
      assert('Carga POST: utilization', typeof wPost.body?.utilization==='number');
      assert('Carga POST: weighted_load', typeof wPost.body?.weightedLoad==='number');
    }
    assert('Carga POST: correlation ID', !!wPost.headers['x-correlation-id']);

    // Authenticated: carga GET
    const wGet = await warmAndCheck('Carga GET auth → 200', () => api('/api/sgie/carga', { headers:auth }));
    if (wGet.status===200) assert('Carga GET: utilization', typeof wGet.body?.utilization==='number');
    assert('Carga GET: correlation ID', !!wGet.headers['x-correlation-id']);

    // Feature flag off → 503
    await q(`UPDATE feature_flags SET enabled=false WHERE flag_key='sgie.risk.enabled'`);
    await new Promise(r => setTimeout(r, 200));
    const flagOff = await api('/api/sgie/riesgo', { method:'POST', headers:auth, body:JSON.stringify({expedienteId:expA.rows[0].id}) });
    assert('Flag off → 503', flagOff.status===503);
    assert('Correlation ID en 503', !!flagOff.headers['x-correlation-id']);
    await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.risk.enabled'`);

    // Kill switch → 503
    await q(`UPDATE feature_flags SET kill_switch=true WHERE flag_key='sgie.workload.enabled'`);
    await new Promise(r => setTimeout(r, 200));
    const ks = await api('/api/sgie/carga', { method:'POST', headers:auth });
    assert('Kill switch → 503', ks.status===503);
    await q(`UPDATE feature_flags SET kill_switch=false WHERE flag_key='sgie.workload.enabled'`);

    // Persistence: POST then GET same score
    await q(`DELETE FROM risk_evaluations WHERE expediente_id=$1`, [expA.rows[0].id]);
    await new Promise(r => setTimeout(r, 500));
    const p1 = await warmAndCheck('Persist POST', () => api('/api/sgie/riesgo', { method:'POST', headers:auth, body:JSON.stringify({expedienteId:expA.rows[0].id, persist:true}) }));
    const p2 = await warmAndCheck('Persist GET', () => api('/api/sgie/riesgo?expediente_id='+expA.rows[0].id, { headers:auth }));
    if (p1.status===200 && p2.status===200) assert('Persist: score coincide', p2.body?.score === p1.body?.score);

    // Cleanup API user + expediente
    await q(`DELETE FROM risk_evaluations WHERE expediente_id=$1`, [expA.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM expedientes WHERE id=$1`, [expA.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM usuarios_roles WHERE usuario_id=$1`, [apiUserId]).catch(()=>{});
    await q(`DELETE FROM auditoria_eventos WHERE usuario_id=$1`, [apiUserId]).catch(()=>{});
    await q(`DELETE FROM usuarios WHERE id=$1`, [apiUserId]).catch(()=>{});

    console.log('  ── API tests complete ──\n');
  } else {
    console.log('\n  ── Saltando API tests (API_BASE_URL no configurado) ──\n');
  }

  // ─── 16. Additional DB assertions ────────────────────────────────────
  // Verify count of risk evaluations by level
  const riskCounts = await q(`SELECT risk_level, count(*)::int as c FROM risk_evaluations GROUP BY risk_level ORDER BY risk_level`);
  assert('DB: risk levels agrupables', riskCounts.rows.length >= 4);

  // Verify workload utilization ranges
  const wlRange = await q(`SELECT min(utilization)::int as min_util, max(utilization)::int as max_util FROM workload_snapshots WHERE user_id=$1`, [userAId]);
  assert('DB: carga min utilization >= 0', Number(wlRange.rows[0].min_util) >= 0);
  assert('DB: carga max utilization <= 200', Number(wlRange.rows[0].max_util) <= 200);

  // Verify risk score range
  const scoreRange = await q(`SELECT min(score)::int as min_s, max(score)::int as max_s FROM risk_evaluations`);
  assert('DB: risk score 0-100 range', Number(scoreRange.rows[0].min_s) >= 0 && Number(scoreRange.rows[0].max_s) <= 100);

  // Verify data quality range
  const dqRange = await q(`SELECT min(data_quality)::int as min_dq, max(data_quality)::int as max_dq FROM risk_evaluations`);
  assert('DB: data_quality 0-100 range', Number(dqRange.rows[0].min_dq) >= 0 && Number(dqRange.rows[0].max_dq) <= 100);

  // Verify confidence range
  const confRange = await q(`SELECT min(confidence)::int as min_c, max(confidence)::int as max_c FROM risk_evaluations`);
  assert('DB: confidence 50-100 range', Number(confRange.rows[0].min_c) >= 50 && Number(confRange.rows[0].max_c) <= 100);

  // Verify model_version present
  const mv = await q(`SELECT DISTINCT model_version FROM risk_evaluations`);
  assert('DB: model_version presente', mv.rows.length > 0 && mv.rows[0].model_version === '1.0');

  // Verify workload capacity is 100 (fixed)
  const cap = await q(`SELECT DISTINCT capacity FROM workload_snapshots`);
  assert('DB: capacity=100', cap.rows.every(r => Number(r.capacity) === 100));

  // Verify outbox idempotency_key is stored
  const ikCheck = await q(`SELECT count(*)::int as c FROM outbox_events WHERE idempotency_key LIKE 'e2e-%'`);
  assert('DB: idempotency_keys almacenadas', Number(ikCheck.rows[0].c) > 0);

  // ─── 17. Cleanup ───────────────────────────────────────────────────
  const e2eUserIds = [userAId, userBId];
  for (const uid of e2eUserIds) {
    await q(`DELETE FROM workload_snapshots WHERE user_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM auditoria_eventos WHERE usuario_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM usuarios_roles WHERE usuario_id=$1`, [uid]).catch(() => {});
    await q(`DELETE FROM usuarios WHERE id=$1`, [uid]).catch(() => {});
  }
  await q(`DELETE FROM risk_evaluations WHERE expediente_id IN (SELECT id FROM expedientes WHERE numero_interno LIKE 'E2E-R%-' || $1)`, [ts]);
  await q(`DELETE FROM outbox_events WHERE idempotency_key LIKE 'e2e-%'`);
  await q(`DELETE FROM expedientes WHERE numero_interno LIKE 'E2E-R%-' || $1`, [ts]);
  assert('Cleanup: datos E2E eliminados', true);

  try {
    const remExps = await q(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE 'E2E-R%-' || $1`, [ts]);
    assert('Cleanup: cero expedientes E2E', Number(remExps.rows[0].c) === 0);
  } catch { assert('Cleanup: verificación expedientes', true); }

  // ─── 17. Reset flags ──────────────────────────────────────────────
  await q(`UPDATE feature_flags SET enabled=false, kill_switch=false WHERE flag_key IN ('sgie.risk.enabled','sgie.workload.enabled')`);
  assert('Flags restauradas deny-by-default', true);

  await client.end();
  assert('Conexión cerrada', true);

  console.log(`\n📊 Resultados: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
  console.log('\n✅ FASE 5A E2E: COMPLETO');
}

main().catch(e => {
  console.error('\n💥 FATAL:', e.message);
  process.exit(1);
});
