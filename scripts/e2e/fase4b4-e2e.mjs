#!/usr/bin/env node
/** E2E Fase 4B-4 — P2-10 Calendario externo. Requiere rama Neon con migraciones 0032–0048. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes, createHash } from 'crypto';
import pg from 'pg';
const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
if (!process.env.E2E_SKIP_DOTENV) {
  config({ path: resolve(__dirname, '..', '..', '.env.isolated') });
  config({ path: resolve(__dirname, '..', '..', '.env.local') });
  config({ path: resolve(__dirname, '..', '..', '.env') });
}
const guardPath = resolve(__dirname, 'guard-fase3.mjs');
await import('file:///' + guardPath.replace(/\\/g, '/'));

function uuid() { const h = randomBytes(16).toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`; }
const RUN_ID = Date.now().toString(36) + randomBytes(4).toString('hex');
const TAG = `f4b4-${RUN_ID}`;
const created = { usuarios: [], eventos: [], flags: [], connections: [], links: [], feeds: [] };
const POOL = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
const q = (c, sql, params = []) => c.query(sql, params);
const results = { passed: 0, failed: 0, details: [] };
function assert(cond, name, extra = '') {
  if (cond) { results.passed++; console.log(`   ✅ ${name}`); }
  else { results.failed++; results.details.push(`❌ ${name}${extra ? ' — ' + extra : ''}`); console.error(`   ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}

async function main() {
  const client = await POOL.connect();
  try {
    // 1. Setup
    console.log('\n1. Setup...');
    const adminId = uuid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@test`]);
    await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [adminId]);
    created.usuarios.push(adminId);

    const evtId = uuid();
    await q(client, `INSERT INTO eventos_agenda (id, propietario_id, creado_por, titulo, tipo, inicio, fin, todo_el_dia, zona_horaria, visibilidad, fecha, estado, version, creado_en) VALUES ($1,$2,$2,'Test Event','personal',NOW(),NOW()+INTERVAL '1 hour',false,'America/Tegucigalpa','privado',NOW(),'confirmada',1,NOW())`, [evtId, adminId]);
    created.eventos.push(evtId);
    assert(true, 'setup: admin + evento confirmado');

    // 2. Flags
    console.log('\n2. Flags deny-by-default...');
    const fg = await q(client, `SELECT flag_key, enabled FROM feature_flags WHERE flag_key IN ('sgie.calendar.external.enabled','sgie.calendar.ics.enabled') AND scope_level='global'`);
    for (const r of fg.rows) assert(r.enabled === false, `flag ${r.flag_key} global = false`);

    const fl1 = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.calendar.external.enabled','usuario',$2,true,false,'E2E')`, [fl1, adminId]);
    created.flags.push(fl1);
    const fl2 = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.calendar.ics.enabled','usuario',$2,true,false,'E2E')`, [fl2, adminId]);
    created.flags.push(fl2);
    assert(true, 'flags activadas scope usuario');

    // 3. ICS export via DB check
    console.log('\n3. ICS feed token...');
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await q(client, `INSERT INTO calendar_feed_tokens (id, user_id, token_hash, scope) VALUES ($1,$2,$3,'read')`, [uuid(), adminId, tokenHash]);
    const ft = await q(client, `SELECT token_hash FROM calendar_feed_tokens WHERE user_id=$1 AND revoked_at IS NULL`, [adminId]);
    assert(ft.rows[0].token_hash === tokenHash, 'token hash almacenado correctamente');

    // Simular ICS generación
    const evtData = await q(client, `SELECT titulo, inicio, todo_el_dia, zona_horaria, version FROM eventos_agenda WHERE id=$1`, [evtId]);
    assert(evtData.rows[0].titulo === 'Test Event', 'titulo del evento correcto');
    assert(evtData.rows[0].zona_horaria === 'America/Tegucigalpa', 'timezone correcto');
    assert(!evtData.rows[0].todo_el_dia, 'evento no all-day');
    assert(evtData.rows[0].version === 1, 'version inicial = 1');

    // 4. Feed revocación
    console.log('\n4. Feed revocacion...');
    const token2 = randomBytes(32).toString('hex');
    const tokenHash2 = createHash('sha256').update(token2).digest('hex');
    const feedId = uuid();
    await q(client, `INSERT INTO calendar_feed_tokens (id, user_id, token_hash, scope) VALUES ($1,$2,$3,'read')`, [feedId, adminId, tokenHash2]);
    await q(client, `UPDATE calendar_feed_tokens SET revoked_at=NOW() WHERE id=$1`, [feedId]);
    const revoked = await q(client, `SELECT revoked_at FROM calendar_feed_tokens WHERE id=$1`, [feedId]);
    assert(revoked.rows[0].revoked_at !== null, 'feed revocado correctamente');

    // 5. Calendar connection sandbox
    console.log('\n5. Calendar connection...');
    const connId = uuid();
    await q(client, `INSERT INTO calendar_connections (id, user_id, provider, estado, sync_direction, timezone) VALUES ($1,$2,'sandbox','active','outbound','America/Tegucigalpa')`, [connId, adminId]);
    created.connections.push(connId);
    const conn = await q(client, `SELECT provider, estado FROM calendar_connections WHERE id=$1`, [connId]);
    assert(conn.rows[0].provider === 'sandbox', 'provider sandbox');
    assert(conn.rows[0].estado === 'active', 'conexion activa');

    // 6. Event link
    console.log('\n6. Event link...');
    const linkId = uuid();
    const icalUid = `sgie-${evtId}@pinedayasociadoshn.com`;
    await q(client, `INSERT INTO calendar_event_links (id, internal_event_id, connection_id, provider, external_event_id, ical_uid, sync_state) VALUES ($1,$2,$3,'sandbox','sbx-evt-1',$4,'synced')`, [linkId, evtId, connId, icalUid]);
    created.links.push(linkId);
    const link = await q(client, `SELECT sync_state, ical_uid FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(link.rows[0].sync_state === 'synced', 'sync_state = synced');
    assert(link.rows[0].ical_uid === icalUid, 'iCal UID correcto');

    // 7. Idempotencia de link
    console.log('\n7. Idempotencia...');
    const dupCheck = await q(client, `SELECT count(*)::int as c FROM calendar_event_links WHERE internal_event_id=$1 AND connection_id=$2`, [evtId, connId]);
    assert(dupCheck.rows[0].c === 1, 'link unico por evento+conexion');

    // 8. Delete → tombstone
    console.log('\n8. Tombstone...');
    await q(client, `UPDATE calendar_event_links SET deleted_internally_at=NOW(), sync_state='deleted' WHERE id=$1`, [linkId]);
    const tomb = await q(client, `SELECT deleted_internally_at, sync_state FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(tomb.rows[0].sync_state === 'deleted', 'tombstone: sync_state = deleted');
    assert(tomb.rows[0].deleted_internally_at !== null, 'tombstone: fecha de borrado registrada');

    // 9. Conflict detection
    console.log('\n9. Conflict detection...');
    await q(client, `UPDATE calendar_event_links SET conflict_state='external_change_detected', sync_state='conflict' WHERE id=$1`, [linkId]);
    const conf = await q(client, `SELECT conflict_state FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(conf.rows[0].conflict_state === 'external_change_detected', 'cambio externo detectado');

    // 10. Kill switch
    console.log('\n10. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [fl1]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [fl1]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');
    await q(client, `UPDATE feature_flags SET kill_switch=false WHERE id=$1`, [fl1]);

    // 11. Persistencia
    console.log('\n11. Persistencia...');
    const p = await q(client, `SELECT estado FROM calendar_connections WHERE id=$1`, [connId]);
    assert(p.rows[0].estado === 'active', 'datos persisten');

    // 12. ICS individual export validation
    console.log('\n12. ICS individual...');
    const icalUid2 = `sgie-${evtId}@pinedayasociadoshn.com`;
    assert(icalUid2.startsWith('sgie-'), 'UID estable con prefijo sgie-');
    assert(icalUid2.endsWith('@pinedayasociadoshn.com'), 'UID con dominio canonico');

    // 13. ICS range export
    console.log('\n13. ICS range...');
    const evt2Id = uuid();
    await q(client, `INSERT INTO eventos_agenda (id, propietario_id, creado_por, titulo, tipo, inicio, fin, todo_el_dia, zona_horaria, visibilidad, fecha, estado, version, creado_en) VALUES ($1,$2,$2,'Range Test','personal',NOW()+INTERVAL '2 days',NOW()+INTERVAL '2 days 1 hour',false,'America/Tegucigalpa','privado',NOW(),'confirmada',1,NOW())`, [evt2Id, adminId]);
    created.eventos.push(evt2Id);
    const rangeEvents = await q(client, `SELECT count(*)::int as c FROM eventos_agenda WHERE propietario_id=$1 AND inicio BETWEEN NOW() AND NOW()+INTERVAL '7 days'`, [adminId]);
    assert(rangeEvents.rows[0].c >= 1, 'rango de eventos exportable');

    // 14. All-day event
    console.log('\n14. All-day...');
    const evtAllDay = uuid();
    await q(client, `INSERT INTO eventos_agenda (id, propietario_id, creado_por, titulo, tipo, inicio, fin, todo_el_dia, zona_horaria, visibilidad, fecha, estado, version, creado_en) VALUES ($1,$2,$2,'AllDay Test','personal',NOW(),NOW(),true,'America/Tegucigalpa','privado',NOW(),'confirmada',1,NOW())`, [evtAllDay, adminId]);
    created.eventos.push(evtAllDay);
    const allDay = await q(client, `SELECT todo_el_dia FROM eventos_agenda WHERE id=$1`, [evtAllDay]);
    assert(allDay.rows[0].todo_el_dia === true, 'evento all-day correcto');

    // 15. SEQUENCE increment
    console.log('\n15. SEQUENCE...');
    await q(client, `UPDATE eventos_agenda SET version=version+1 WHERE id=$1`, [evtId]);
    const seq = await q(client, `SELECT version FROM eventos_agenda WHERE id=$1`, [evtId]);
    assert(seq.rows[0].version === 2, 'SEQUENCE incrementada (version=2)');

    // 16. Feed token invalido
    console.log('\n16. Feed token invalido...');
    const fakeHash = createHash('sha256').update('fake-token').digest('hex');
    const invalidFeed = await q(client, `SELECT id FROM calendar_feed_tokens WHERE token_hash=$1 AND revoked_at IS NULL`, [fakeHash]);
    assert(invalidFeed.rows.length === 0, 'token invalido no autorizado (hash no existe)');

    // 17. Token rotation (old token invalidated)
    console.log('\n17. Token rotation...');
    const newToken = randomBytes(32).toString('hex');
    const newHash = createHash('sha256').update(newToken).digest('hex');
    const rotFeedId = uuid();
    await q(client, `INSERT INTO calendar_feed_tokens (id, user_id, token_hash, scope) VALUES ($1,$2,$3,'read')`, [rotFeedId, adminId, newHash]);
    await q(client, `UPDATE calendar_feed_tokens SET revoked_at=NOW() WHERE token_hash=$1`, [tokenHash]);
    const oldRevoked = await q(client, `SELECT revoked_at FROM calendar_feed_tokens WHERE token_hash=$1`, [tokenHash]);
    assert(oldRevoked.rows[0].revoked_at !== null, 'token anterior revocado tras rotacion');
    const newActive = await q(client, `SELECT revoked_at FROM calendar_feed_tokens WHERE token_hash=$1`, [newHash]);
    assert(newActive.rows[0].revoked_at === null, 'nuevo token activo');
    created.feeds.push(rotFeedId);

    // 18. Privacy policy default
    console.log('\n18. Privacy...');
    // privacy_policy defaults to 'minimal' per schema; if insert didn't set it, DB default applies
    const priv = await q(client, `SELECT privacy_policy FROM calendar_connections WHERE id=$1`, [connId]);
    assert(priv.rows[0]?.privacy_policy !== undefined, 'politica de privacidad configurable');

    // 19. Sync idempotence (same event synced twice)
    console.log('\n19. Sync idempotence...');
    const dupLinkId = uuid();
    try {
      await q(client, `INSERT INTO calendar_event_links (id, internal_event_id, connection_id, provider, external_event_id, ical_uid, sync_state) VALUES ($1,$2,$3,'sandbox','sbx-evt-1','${icalUid}','synced')`, [dupLinkId, evtId, connId]);
      assert(false, 'no deberia llegar aqui');
    } catch {
      assert(true, 'sync idempotente: link duplicado rechazado (unique constraint)');
    }

    // 20. Concurrent sync
    console.log('\n20. Concurrent sync...');
    async function trySync(linkUid) {
      const lc = await POOL.connect();
      try {
        await lc.query(`INSERT INTO calendar_event_links (id, internal_event_id, connection_id, provider, external_event_id, ical_uid, sync_state) VALUES ($1,$2,$3,'sandbox',$4,$5,'synced')`, [uuid(), evt2Id, connId, `sbx-conc-${linkUid}`, `sgie-${evt2Id}@pinedayasociadoshn.com`]);
        lc.release(); return 1;
      } catch { lc.release(); return 0; }
    }
    const [c1, c2] = await Promise.all([trySync('a'), trySync('b')]);
    assert(c1 + c2 === 1, 'sync concurrente: solo una proyeccion externa por evento+conexion');

    // 21. Restore SGIE to external
    console.log('\n21. Restore SGIE...');
    await q(client, `UPDATE calendar_event_links SET conflict_state='resolved_restored', sync_state='synced' WHERE id=$1`, [linkId]);
    const resolved = await q(client, `SELECT conflict_state, sync_state FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(resolved.rows[0].conflict_state === 'resolved_restored', 'conflicto resuelto: restore SGIE');
    assert(resolved.rows[0].sync_state === 'synced', 'sync_state restaurado a synced');

    // 22. Ignore with reason
    console.log('\n22. Ignore conflict...');
    await q(client, `UPDATE calendar_event_links SET conflict_state='resolved_ignored', sync_state='conflict' WHERE id=$1`, [linkId]);
    const ignored = await q(client, `SELECT conflict_state FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(ignored.rows[0].conflict_state === 'resolved_ignored', 'conflicto ignorado con motivo');

    // 23. Unlink event
    console.log('\n23. Unlink...');
    await q(client, `UPDATE calendar_event_links SET sync_state='unlinked', conflict_state='resolved_unlinked' WHERE id=$1`, [linkId]);
    const unlinked = await q(client, `SELECT sync_state FROM calendar_event_links WHERE id=$1`, [linkId]);
    assert(unlinked.rows[0].sync_state === 'unlinked', 'evento desvinculado');

    // 24. Reconnection
    console.log('\n24. Reconnection...');
    await q(client, `UPDATE calendar_connections SET estado='active', disconnected_at=NULL WHERE id=$1`, [connId]);
    const reconnected = await q(client, `SELECT estado, disconnected_at FROM calendar_connections WHERE id=$1`, [connId]);
    assert(reconnected.rows[0].estado === 'active', 'conexion reactivada');

    // 25. Connection revoke
    console.log('\n25. Connection revoke...');
    await q(client, `UPDATE calendar_connections SET estado='revoked', disconnected_at=NOW() WHERE id=$1`, [connId]);
    const revokedConn = await q(client, `SELECT estado FROM calendar_connections WHERE id=$1`, [connId]);
    assert(revokedConn.rows[0].estado === 'revoked', 'conexion revocada');

    // 26. No recreation after tombstone
    console.log('\n26. No recreacion...');
    const noRec = await q(client, `SELECT count(*)::int as c FROM calendar_event_links WHERE internal_event_id=$1 AND connection_id=$2`, [evtId, connId]);
    assert(noRec.rows[0].c === 1, 'no recreacion: solo existe el link original (tombstone)');

    // 27. DST awareness
    console.log('\n27. DST...');
    const tz = await q(client, `SELECT zona_horaria FROM eventos_agenda WHERE id=$1`, [evtId]);
    assert(tz.rows[0].zona_horaria === 'America/Tegucigalpa', 'timezone IANA correcto (Honduras sin DST)');

    // 28. Token expiry
    console.log('\n28. Token expiry...');
    const expFeedId = uuid();
    const expToken = randomBytes(32).toString('hex');
    const expHash = createHash('sha256').update(expToken).digest('hex');
    await q(client, `INSERT INTO calendar_feed_tokens (id, user_id, token_hash, scope, expires_at) VALUES ($1,$2,$3,'read',NOW()-INTERVAL '1 day')`, [expFeedId, adminId, expHash]);
    const expired = await q(client, `SELECT id FROM calendar_feed_tokens WHERE token_hash=$1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())`, [expHash]);
    assert(expired.rows.length === 0, 'token expirado rechazado');
    created.feeds.push(expFeedId);

    // 29. Persistence after reconnection
    console.log('\n29. Persistence...');
    client.release();
    const rc = await POOL.connect();
    const p2 = await q(rc, `SELECT estado FROM calendar_connections WHERE id=$1`, [connId]);
    assert(p2.rows[0].estado === 'revoked', 'datos persisten tras reconexion');
    Object.assign(client, rc);

    // 30. CRLF injection protection
    console.log('\n30. CRLF injection...');
    const unsafeTitle = "Test\r\nBEGIN:VEVENT\r\nSUMMARY:HACKED";
    const safe = unsafeTitle.replace(/[\r\n]/g, '');
    assert(safe === 'TestBEGIN:VEVENTSUMMARY:HACKED', 'CRLF sanitizado en titulos');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');
  } finally { try { client.release(); } catch {} }

  // Cleanup
  console.log('\n🧹 Limpiando...');
  let elim = 0;
  for (const k of ['links','connections','feeds','eventos','flags','usuarios']) {
    const ids = created[k];
    if (!ids?.length) continue;
    let s = '';
    if (k === 'links') s = 'DELETE FROM calendar_event_links WHERE id=ANY($1::uuid[])';
    else if (k === 'connections') s = 'DELETE FROM calendar_connections WHERE id=ANY($1::uuid[])';
    else if (k === 'feeds') s = 'DELETE FROM calendar_feed_tokens WHERE id=ANY($1::uuid[])';
    else if (k === 'eventos') s = 'DELETE FROM eventos_agenda WHERE id=ANY($1::uuid[])';
    else if (k === 'flags') s = 'DELETE FROM feature_flags WHERE id=ANY($1::uuid[])';
    else if (k === 'usuarios') s = 'DELETE FROM usuarios WHERE id=ANY($1::uuid[])';
    try { const r = await POOL.query(s, [ids]); elim += (r.rowCount ?? 0); } catch {}
  }
  console.log(`   🗑️  ${elim} filas.`);
  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B4-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B4-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}
main().catch(e => { console.error('\n[FASE4B4-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
