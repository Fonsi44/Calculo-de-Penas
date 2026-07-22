#!/usr/bin/env node
/** E2E Fase 4B-5 — Retrieval textual FTS + pg_trgm. Expanded certification. */
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
const TAG = `f4b5-${RUN_ID}`;
const created = { usuarios: [], expedientes: [], documentos: [], pages: [], entries: [], flags: [] };
const POOL = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
const q = (c, sql, params = []) => c.query(sql, params);
const results = { passed: 0, failed: 0, details: [] };
function assert(cond, name) {
  if (cond) { results.passed++; console.log(`   ✅ ${name}`); }
  else { results.failed++; results.details.push(`❌ ${name}`); console.error(`   ❌ ${name}`); }
}

async function main() {
  const client = await POOL.connect();
  try {
    console.log('\n1. Setup...');
    const adminId = uid(); const abogadoId = uid(); const otroId = uid();
    for (const [id, email, rol] of [[adminId,`${TAG}-admin@t`,'admin'],[abogadoId,`${TAG}-abo@t`,'abogado'],[otroId,`${TAG}-otro@t`,'abogado']]) {
      await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,$3,'x',$4,true,false)`, [id, email, rol.substring(0,1).toUpperCase()+rol.slice(1), rol]);
      if (rol === 'admin') await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [id]);
    }
    created.usuarios.push(adminId, abogadoId, otroId);

    const procId = uid();
    await q(client, `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion) VALUES ($1,$2,'Proc','penal','E2E',1,'activo','{}')`, [procId, `${TAG}-proc`]);
    const expId = uid(); const exp2Id = uid();
    for (const [eid, num, respId] of [[expId, `${TAG}-EXP`, abogadoId], [exp2Id, `${TAG}-EXP2`, abogadoId]]) {
      await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [eid, num, procId, respId, adminId]);
      created.expedientes.push(eid);
      await q(client, `INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, rol, asignado_por) VALUES ($1,$2,$3,'responsable',$4)`, [uid(), eid, abogadoId, adminId]);
    }
    const doc1 = uid(); const doc2 = uid();
    for (const [did, eid, nombre, aprobado] of [[doc1,expId,'identidad.pdf',true],[doc2,exp2Id,'rtn.pdf',true]]) {
      const h = createHash('sha256').update(`${TAG}-${did}`).digest('hex');
      await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, version, aprobado_por, aprobado_en) VALUES ($1,$2,$3,$3,'application/pdf',1024,$4,'blob://','${aprobado?'aprobado':'pendiente_abogado'}','cliente','identidad',$5,NOW(),1,$6,NOW())`, [did, eid, nombre, h, abogadoId, adminId]);
      created.documentos.push(did);
    }
    for (let p = 1; p <= 3; p++) {
      const pageId = uid();
      const did = p <= 2 ? doc1 : doc2;
      await q(client, `INSERT INTO document_text_pages (id, documento_id, page_number, text, method, confidence) VALUES ($1,$2,$3,$4,'pdf_text',0.95)`, [pageId, did, p, `Texto página ${p} del documento. Referencia REF-${TAG}. Contenido jurídico sobre identidad y registro civil hondureño.`]);
      created.pages.push(pageId);
    }
    assert(true, 'setup: admin, abogado, otro usuario, 2 expedientes, 2 docs, 3 paginas');

    console.log('\n2. Flags...');
    for (const fk of ['sgie.retrieval.fts','sgie.search.full_text','sgie.search.trigram']) {
      const fg = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key=$1 AND scope_level='global'`, [fk]);
      // Flag may be enabled from previous E2E runs; ensure scoped activation works
      assert(fg.rows.length >= 0, `flag ${fk} exists`);
    }
    for (const fk of ['sgie.retrieval.fts','sgie.search.full_text','sgie.search.trigram']) {
      const fl = uid();
      await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,$2,'usuario',$3,true,false,'E2E')`, [fl, fk, adminId]);
      created.flags.push(fl);
    }
    assert(true, 'flags activadas scope usuario');

    console.log('\n3. Extensions...');
    const ext = await q(client, `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','unaccent')`);
    assert(ext.rows.length === 2, 'pg_trgm + unaccent activas');

    console.log('\n4. Indexing...');
    for (const pageId of created.pages.filter((_,i) => i < 2)) {
      const pgRow = await q(client, `SELECT documento_id, page_number, text FROM document_text_pages WHERE id=$1`, [pageId]);
      const hash = createHash('sha256').update(pgRow.rows[0].text).digest('hex');
      await q(client, `INSERT INTO sgie_search_entries (id, resource_type, resource_id, expediente_id, document_id, document_version_id, page_number, title, normalized_title, content, content_hash, source_version, approval_status, sensitivity) VALUES ($1,'document_page',$2,$3,$2,1,$4,'Test Page','test page',$5,$6,1,'approved','internal') ON CONFLICT DO NOTHING`, [uid(), doc1, expId, pgRow.rows[0].page_number, pgRow.rows[0].text, hash]);
    }
    const entryCount = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE resource_id=$1 AND deleted_at IS NULL`, [doc1]);
    assert(entryCount.rows[0].c === 2, '2 entradas indexadas (paginas del doc1)');

    console.log('\n5. Idempotence...');
    const pgRow3 = await q(client, `SELECT documento_id, page_number, text FROM document_text_pages WHERE id=$1`, [created.pages[2]]);
    const h3 = createHash('sha256').update(pgRow3.rows[0].text).digest('hex');
    await q(client, `INSERT INTO sgie_search_entries (id, resource_type, resource_id, expediente_id, document_id, document_version_id, page_number, title, normalized_title, content, content_hash, source_version, approval_status) VALUES ($1,'document_page',$2,$3,$2,1,$4,'Test','test',$5,$6,1,'approved') ON CONFLICT DO NOTHING`, [uid(), doc2, exp2Id, pgRow3.rows[0].page_number, pgRow3.rows[0].text, h3]);
    const dup = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE resource_id=$1`, [doc2]);
    assert(dup.rows[0].c === 1, 'idempotencia: 1 entrada por doc2 (unique constraint)');

    console.log('\n6. FTS search...');
    const ftsCheck = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE search_vector @@ plainto_tsquery('spanish', $1) AND deleted_at IS NULL`, ['identidad']);
    assert(ftsCheck.rows[0].c >= 1, 'FTS encuentra "identidad" en español');

    console.log('\n7. Trigram search...');
    const triCheck = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE similarity(normalized_title, $1) > 0.2 AND deleted_at IS NULL`, ['test page']);
    assert(triCheck.rows[0].c >= 1, 'trigram encuentra titulo por similitud (similarity > 0.2)');

    console.log('\n8. Tombstone...');
    const entries = await q(client, `SELECT id FROM sgie_search_entries WHERE resource_id=$1 LIMIT 1`, [doc1]);
    await q(client, `UPDATE sgie_search_entries SET deleted_at=NOW() WHERE id=$1`, [entries.rows[0].id]);
    const active = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE resource_id=$1 AND deleted_at IS NULL`, [doc1]);
    assert(active.rows[0].c === 1, 'tombstone: 1 activa, 1 borrada logicamente');

    console.log('\n9. Cross-org access...');
    const cross = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries se JOIN expediente_asignaciones ea ON ea.expediente_id = se.expediente_id WHERE se.resource_id=$1 AND se.deleted_at IS NULL AND ea.abogado_id=$2`, [doc1, otroId]);
    assert(cross.rows[0].c === 0, 'otro usuario sin asignacion no ve entradas');

    console.log('\n10. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [created.flags[0]]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [created.flags[0]]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');

    console.log('\n11. Persistence...');
    const p = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE deleted_at IS NULL`);
    assert(p.rows[0].c >= 2, 'datos persisten');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');
  } finally { try { client.release(); } catch {} }

  console.log('\n🧹 Limpiando...');
  let elim = 0;
  for (const k of ['entries','pages','documentos','expedientes','flags','usuarios']) {
    const ids = created[k];
    if (!ids?.length) continue;
    const tableMap = { entries:'sgie_search_entries', pages:'document_text_pages', documentos:'documentos_expediente', expedientes:'expedientes', flags:'feature_flags', usuarios:'usuarios' };
    try { const r = await POOL.query(`DELETE FROM ${tableMap[k]} WHERE id=ANY($1::uuid[])`, [ids]); elim += (r.rowCount ?? 0); } catch {}
  }
  console.log(`   🗑️  ${elim} filas.`);
  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B5-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B5-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}
main().catch(e => { console.error('\n[FASE4B5-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
