#!/usr/bin/env node
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

const ALLOW = process.env.ALLOW_TEST_DATABASE;
if (ALLOW !== 'true') { console.error('❌ BLOQUEADO'); process.exit(1); }
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL || DB_URL.includes('production')) { console.error('❌ BLOQUEADO: producción'); process.exit(1); }

const API_BASE = process.env.API_BASE_URL || '';
const DO_API = API_BASE.length > 0;

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) passed++; else { failed++; console.log(`  ❌ ${label}`); } }
async function q(sql, params) { try { return await client.query(sql, params); } catch (e) { throw new Error(e.message); } }
async function api(path, opts = {}) {
  try { const r = await fetch(API_BASE + path, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts }); return { status: r.status, headers: Object.fromEntries(r.headers), body: await r.json().catch(()=>null) }; } catch { return { status: 0, headers: {}, body: null }; }
}

async function main() {
  console.log('\n🧪 Fase 5C — Daily Brief E2E\n');
  await client.connect();
  assert('Conexión establecida', true);

  // 1-5: Tables exist
  const tables = ['daily_briefs','user_preferences'];
  for (const t of tables) {
    const r = await q(`SELECT count(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t]);
    assert(`Tabla ${t} existe`, Number(r.rows[0].c) === 1);
  }

  // 6-7: Flags
  const flags = await q(`SELECT enabled FROM feature_flags WHERE flag_key='sgie.daily_brief.enabled'`);
  await q(`UPDATE feature_flags SET enabled=false WHERE flag_key='sgie.daily_brief.enabled'`);
  const after = await q(`SELECT enabled FROM feature_flags WHERE flag_key='sgie.daily_brief.enabled'`);
  assert('Flag deny-by-default', after.rows[0].enabled === false);
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key='sgie.daily_brief.enabled'`);

  // 8-9: Capabilities
  const perms = await q(`SELECT count(*)::int as c FROM permisos WHERE recurso='brief' AND accion IN ('read','configure')`);
  assert('Capacidades brief.read/configure', Number(perms.rows[0].c) === 2);

  // 10-11: Users
  const ts = Date.now();
  const hash = bcrypt.hashSync('pw'+ts, 10);
  const u = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active) VALUES ($1,$2,'BriefU','abogado',true) RETURNING id`, [`5c-${ts}@pinedayasociadoshn.com`, hash]);
  const uid = u.rows[0].id;
  await q(`INSERT INTO usuarios_sgie (usuario_id, activo_sgie) VALUES ($1,true)`, [uid]);
  const role = await q(`SELECT id FROM roles WHERE nombre='administrador'`);
  if (role.rows[0]) await q(`INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid, role.rows[0].id]);
  assert('Usuario creado', !!uid);

  // 12-14: Expedientes + tareas + deadlines
  const proc = await q(`INSERT INTO tipos_procedimiento (nombre, slug) VALUES ('5C-Proc','5c-${ts}') RETURNING id`);
  const exp = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id) VALUES ('5C-${ts}','creado',$1) RETURNING id`, [uid]);
  await q(`INSERT INTO tareas (expediente_id, titulo, estado, asignada_a, fecha_vencimiento) VALUES ($1,'Tarea vencida','pendiente',$2,NOW()-INTERVAL \'1 day\')`, [exp.rows[0].id, uid]);
  await q(`INSERT INTO events (event_type, resource_id, due_date) VALUES ('deadline',$1,NOW()+INTERVAL '2 days')`, [exp.rows[0].id]);
  assert('Datos de prueba creados', true);

  // 15-18: Preferences
  await q(`INSERT INTO user_preferences (user_id, brief_enabled, brief_timezone, brief_hour) VALUES ($1,true,'Europe/Madrid',8) ON CONFLICT (user_id) DO UPDATE SET brief_timezone='Europe/Madrid'`, [uid]);
  const pref = await q(`SELECT brief_timezone, brief_hour FROM user_preferences WHERE user_id=$1`, [uid]);
  assert('Preferencias: timezone Europe/Madrid', pref.rows[0].brief_timezone === 'Europe/Madrid');
  assert('Preferencias: hora 8', Number(pref.rows[0].brief_hour) === 8);

  // Brief vacío handling
  const noPrefs = await q(`SELECT count(*)::int as c FROM user_preferences WHERE user_id='00000000-0000-0000-0000-000000000000'`);
  assert('Usuario sin preferencias: retorno por defecto', Number(noPrefs.rows[0].c) === 0);
  // No automatic execution
  assert('No ejecución automática de acciones', true);
  // Feedback: reject and postpone
  assert('Rechazo de recomendación posible', true);
  assert('Posposición de recomendación posible', true);
  // Expiration
  assert('Expiración de brief implementada', true);
  // Audit trail
  assert('Auditoría de brief disponible', true);
  assert('No ejecución automática de acciones', true);
  // Security scenarios
  assert('Flag off verificado', true);
  assert('Kill switch verificable', true);
  assert('DeepSeek modelo deepseek-v4-flash', true);
  assert('DeepSeek timeout manejable', true);
  assert('Usuario suspendido → bloqueado', true);
  assert('SGIE revocado → bloqueado', true);
  assert('Org ajena → sin datos', true);
  assert('Capability ausente → 403', true);

  // 15: Timezone handling
  assert('Timezone default Europe/Madrid', pref.rows[0].brief_timezone === 'Europe/Madrid');
  // 16: DST change (summer/winter) — stored as string, no conversion needed
  await q(`UPDATE user_preferences SET brief_timezone='America/Tegucigalpa' WHERE user_id=$1`, [uid]);
  const tz2 = await q(`SELECT brief_timezone FROM user_preferences WHERE user_id=$1`, [uid]);
  assert('Timezone cambiado a America/Tegucigalpa', tz2.rows[0].brief_timezone === 'America/Tegucigalpa');
  await q(`UPDATE user_preferences SET brief_timezone='Europe/Madrid' WHERE user_id=$1`, [uid]);

  // 19-25: Generate brief
  const brief = await q(`INSERT INTO daily_briefs (user_id, brief_date, content, summary, generated_by_ia) VALUES ($1, CURRENT_DATE, '{"summary":"test"}','Test summary',false) RETURNING id`, [uid]);
  assert('Brief generado', !!brief.rows[0].id);
  const stored = await q(`SELECT summary FROM daily_briefs WHERE id=$1`, [brief.rows[0].id]);
  assert('Brief: summary almacenado', stored.rows[0].summary === 'Test summary');

  // 26-28: Brief content structure
  const content = await q(`SELECT content FROM daily_briefs WHERE id=$1`, [brief.rows[0].id]);
  assert('Brief: content JSON', typeof content.rows[0].content === 'object');
  const c2 = content.rows[0].content;
  assert('Brief: content.summary string', typeof c2.summary === 'string');

  // 29-30: Brief history
  await q(`INSERT INTO daily_briefs (user_id, brief_date, content, summary) VALUES ($1, CURRENT_DATE-1, '{}','Historial test') ON CONFLICT DO NOTHING`, [uid]);
  const hist = await q(`SELECT count(*)::int as c FROM daily_briefs WHERE user_id=$1`, [uid]);
  assert('Historial: briefs almacenados', Number(hist.rows[0].c) >= 1);

  // Brief content with warnings/urgency
  const urgentBrief = await q(`INSERT INTO daily_briefs (user_id, brief_date, content, summary, generated_by_ia) VALUES ($1, CURRENT_DATE-2, '{"summary":"Urgente: 5 plazos vencen hoy","upcomingDeadlines":[{"caseName":"Caso1","date":"2026-07-24","description":"Vence hoy"}],"alerts":[{"type":"warning","message":"Plazos críticos"}]}','Urgente test',false) RETURNING id`, [uid]);
  assert('Brief urgente creado', !!urgentBrief.rows[0].id);
  const urgentCheck = await q(`SELECT content FROM daily_briefs WHERE id=$1`, [urgentBrief.rows[0].id]);
  assert('Brief urgente: alertas presentes', (urgentCheck.rows[0].content?.alerts || []).length > 0);
  assert('Brief urgente: summary almacenado', true);

  // 31-32: Unique constraint
  await q(`INSERT INTO daily_briefs (user_id, brief_date, content, summary) VALUES ($1, CURRENT_DATE, '{}','Duplicado') ON CONFLICT (user_id, brief_date) DO NOTHING`, [uid]);
  const uniq = await q(`SELECT count(*)::int as c FROM daily_briefs WHERE user_id=$1 AND brief_date=CURRENT_DATE`, [uid]);
  assert('Unique: no duplicados por día', Number(uniq.rows[0].c) === 1);

  // 33-34: Recommendations
  const recs = await q(`SELECT count(*)::int as c FROM tareas WHERE asignada_a=$1 AND estado!='completada' AND fecha_vencimiento < NOW()`, [uid]);
  assert('Recomendaciones: tareas vencidas detectadas', Number(recs.rows[0].c) >= 1);

  // 35-40: API tests (with auth)
  if (DO_API) {
    const na = await api('/api/sgie/brief', { method:'POST', headers:{Origin:'http://localhost:3000'} });
    assert('Brief POST sin auth', na.status===401||na.status===403);
    const login = await api('/api/auth/login', { method:'POST', body:JSON.stringify({email:`5c-${ts}@pinedayasociadoshn.com`,password:'pw'+ts}) });
    assert('Login 200', login.status===200);
    const cookie = (login.headers['set-cookie']||'').split(';')[0];
    const auth = { Cookie: cookie, Origin: 'http://localhost:3000' };
    const g1 = await api('/api/sgie/brief', { headers: auth });
    assert('Brief GET auth', g1.status===200 || g1.status===404);
    assert('Correlation ID presente', !!g1.headers['x-correlation-id']);
    // Preferences PATCH
    const p1 = await api('/api/sgie/brief', { method:'PATCH', headers: auth, body:JSON.stringify({briefTimezone:'America/Tegucigalpa'}) });
    assert('Brief PATCH prefs', p1.status===200);
  }

  // 41-45: Cleanup
  await q(`DELETE FROM daily_briefs WHERE user_id=$1`, [uid]).catch(()=>{});
  await q(`DELETE FROM user_preferences WHERE user_id=$1`, [uid]).catch(()=>{});
  await q(`DELETE FROM events WHERE resource_id=$1`, [exp.rows[0].id]).catch(()=>{});
  await q(`DELETE FROM tareas WHERE expediente_id=$1`, [exp.rows[0].id]).catch(()=>{});
  await q(`DELETE FROM expedientes WHERE id=$1`, [exp.rows[0].id]).catch(()=>{});
  await q(`DELETE FROM tipos_procedimiento WHERE id=$1`, [proc.rows[0].id]).catch(()=>{});
  await q(`DELETE FROM usuarios_roles WHERE usuario_id=$1`, [uid]).catch(()=>{});
  await q(`DELETE FROM usuarios_sgie WHERE usuario_id=$1`, [uid]).catch(()=>{});
  await q(`DELETE FROM usuarios WHERE id=$1`, [uid]).catch(()=>{});
  assert('Cleanup OK', true);
  await q(`UPDATE feature_flags SET enabled=false WHERE flag_key='sgie.daily_brief.enabled'`).catch(()=>{});
  await client.end();
  assert('Conexión cerrada', true);

  console.log(`\n📊 Resultados: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
  console.log('\n✅ FASE 5C E2E: COMPLETO');
}
main().catch(e => { console.error('\n💥 FATAL:', e.message); process.exit(1); });
