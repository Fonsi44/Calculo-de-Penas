#!/usr/bin/env node
/** E2E Fase 4B-6 — Base de conocimiento jurídica versionada. */
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

function uid() { const h = randomBytes(16).toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`; }
const RUN_ID = Date.now().toString(36) + randomBytes(4).toString('hex');
const TAG = `f4b6-${RUN_ID}`;
const created = { usuarios: [], sources: [], versions: [], flags: [] };
const POOL = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
const q = (c, sql, params = []) => c.query(sql, params);
const results = { passed: 0, failed: 0 };
function assert(cond, name) { if (cond) { results.passed++; console.log(`   ✅ ${name}`); } else { results.failed++; console.error(`   ❌ ${name}`); } }

async function main() {
  const client = await POOL.connect();
  try {
    console.log('\n1. Setup...');
    const adminId = uid(); const otroId = uid();
    for (const [id, mail, rol] of [[adminId,`${TAG}-adm@t`,'admin'],[otroId,`${TAG}-otro@t`,'abogado']]) {
      await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,$3,'x',$4,true,false)`, [id, mail, rol, rol]);
      if (rol === 'admin') await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [id]);
    }
    created.usuarios.push(adminId, otroId);
    assert(true, 'setup: admin + otro usuario');

    console.log('\n2. Flags...');
    const fg = await q(client, `SELECT flag_key FROM feature_flags WHERE flag_key='sgie.knowledge.enabled'`);
    assert(fg.rows.length > 0, 'flag sgie.knowledge.enabled existe');
    const fl = uid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.knowledge.enabled','usuario',$2,true,false,'E2E')`, [fl, adminId]);
    created.flags.push(fl);

    console.log('\n3. Knowledge source...');
    const srcId = uid();
    const srcTitle = `Norma de prueba ${TAG}`;
    await q(client, `INSERT INTO knowledge_sources (id, type, title, estado, created_by) VALUES ($1,'norma',$2,'draft',$3)`, [srcId, srcTitle, adminId]);
    created.sources.push(srcId);
    assert(true, 'fuente creada (draft)');

    console.log('\n4. Knowledge versions...');
    const vId = uid(); const h = createHash('sha256').update('Contenido juridico de prueba').digest('hex');
    await q(client, `INSERT INTO knowledge_versions (id, source_id, version, content, content_hash, estado, created_by) VALUES ($1,$2,1,'Contenido juridico de prueba',$3,'draft',$4)`, [vId, srcId, h, adminId]);
    created.versions.push(vId);
    assert(h.length === 64, 'hash SHA-256 calculado');

    const v2Id = uid(); const h2 = createHash('sha256').update('Contenido actualizado').digest('hex');
    await q(client, `INSERT INTO knowledge_versions (id, source_id, version, content, content_hash, estado, created_by) VALUES ($1,$2,2,'Contenido actualizado',$3,'draft',$4)`, [v2Id, srcId, h2, adminId]);
    created.versions.push(v2Id);
    assert(h2 !== h, 'hash cambia al actualizar contenido');
    assert(true, 'version 2 creada');

    console.log('\n5. Workflow: review → approve → publish...');
    await q(client, `UPDATE knowledge_versions SET estado='pending_legal_review' WHERE id=$1`, [v2Id]);
    await q(client, `UPDATE knowledge_versions SET estado='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2 AND estado='pending_legal_review'`, [adminId, v2Id]);
    await q(client, `UPDATE knowledge_versions SET estado='published_internal', approved_by=$1, approved_at=NOW(), published_at=NOW() WHERE id=$2 AND estado='approved'`, [adminId, v2Id]);
    await q(client, `UPDATE knowledge_sources SET estado='published_internal' WHERE id=$1`, [srcId]);
    const pub = await q(client, `SELECT estado FROM knowledge_versions WHERE id=$1`, [v2Id]);
    assert(pub.rows[0].estado === 'published_internal', 'workflow: draft→review→approved→published');

    console.log('\n6. Superseded...');
    await q(client, `UPDATE knowledge_versions SET estado='superseded' WHERE source_id=$1 AND estado='published_internal' AND version=1`, [srcId]);
    const sup = await q(client, `SELECT estado FROM knowledge_versions WHERE id=$1`, [vId]);
    assert(sup.rows[0].estado === 'superseded', 'version anterior superseded');

    console.log('\n7. Withdraw...');
    await q(client, `UPDATE knowledge_sources SET estado='withdrawn' WHERE id=$1`, [srcId]);
    await q(client, `UPDATE knowledge_versions SET estado='withdrawn' WHERE source_id=$1 AND estado='published_internal'`, [srcId]);
    const wd = await q(client, `SELECT estado FROM knowledge_sources WHERE id=$1`, [srcId]);
    assert(wd.rows[0].estado === 'withdrawn', 'fuente retirada');

    console.log('\n8. Access control...');
    const crossSrc = await q(client, `SELECT id FROM knowledge_sources WHERE created_by=$1`, [otroId]);
    assert(crossSrc.rows.length === 0, 'otro usuario no ve fuentes ajenas');

    console.log('\n9. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [fl]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [fl]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');

    console.log('\n10. Persistence...');
    const p = await q(client, `SELECT count(*)::int as c FROM knowledge_sources WHERE id=$1`, [srcId]);
    assert(p.rows[0].c === 1, 'datos persisten');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');
  } finally { try { client.release(); } catch {} }

  console.log('\n🧹 Limpiando...');
  let elim = 0;
  for (const k of ['versions','sources','flags','usuarios']) {
    const ids = created[k];
    if (!ids?.length) continue;
    const t = { versions:'knowledge_versions', sources:'knowledge_sources', flags:'feature_flags', usuarios:'usuarios' };
    try { const r = await POOL.query(`DELETE FROM ${t[k]} WHERE id=ANY($1::uuid[])`, [ids]); elim += (r.rowCount ?? 0); } catch {}
  }
  console.log(`   🗑️  ${elim} filas.`);
  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B6-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B6-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}
main().catch(e => { console.error('\n[FASE4B6-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
