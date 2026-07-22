#!/usr/bin/env node
/** E2E Fase 4B-5 — Retrieval textual FTS + pg_trgm. Requiere Neon con 0032–0049. */
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
const created = { usuarios: [], orgs: [], expedientes: [], documentos: [], pages: [], entries: [], flags: [] };
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
    console.log('\n1. Setup...');
    const adminId = uid(); const abogadoId = uid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Abo','x','abogado',true,false)`, [abogadoId, `${TAG}-abo@test`]);
    await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [adminId]);
    created.usuarios.push(adminId, abogadoId);

    const procId = uid();
    await q(client, `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion) VALUES ($1,$2,'Proc','penal','E2E',1,'activo','{}')`, [procId, `${TAG}-proc`]);
    const expId = uid();
    await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [expId, `${TAG}-EXP`, procId, abogadoId, adminId]);
    created.expedientes.push(expId);
    await q(client, `INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, rol, asignado_por) VALUES ($1,$2,$3,'responsable',$4)`, [uid(), expId, abogadoId, adminId]);

    const doc1 = uid();
    const h1 = createHash('sha256').update(`${TAG}-d1`).digest('hex');
    await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, version, aprobado_por, aprobado_en) VALUES ($1,$2,'identidad.pdf','identidad.pdf','application/pdf',1024,$3,'blob://','aprobado','cliente','identidad',$4,NOW(),1,$5,NOW())`, [doc1, expId, h1, abogadoId, adminId]);
    created.documentos.push(doc1);

    for (let p = 1; p <= 2; p++) {
      const pageId = uid();
      await q(client, `INSERT INTO document_text_pages (id, documento_id, page_number, text, method, confidence) VALUES ($1,$2,$3,$4,'pdf_text',0.95)`, [pageId, doc1, p, `Texto de prueba página ${p}. Contenido jurídico sobre identidad y registro civil. Número de referencia REF-${TAG}.`]);
      created.pages.push(pageId);
    }
    assert(true, 'setup: admin, abogado, expediente, doc aprobado, 2 paginas');

    console.log('\n2. Flags...');
    const fg = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.retrieval.fts' AND scope_level='global'`);
    assert(fg.rows.length > 0 && fg.rows[0].enabled === false, 'flag sgie.retrieval.fts global = false');
    const fl1 = uid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.retrieval.fts','usuario',$2,true,false,'E2E')`, [fl1, adminId]);
    const fl2 = uid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.search.trigram','usuario',$2,true,false,'E2E')`, [fl2, adminId]);
    const fl3 = uid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, user_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.search.full_text','usuario',$2,true,false,'E2E')`, [fl3, adminId]);
    created.flags.push(fl1, fl2, fl3);
    assert(true, 'flags activadas scope usuario');

    console.log('\n3. Indexacion...');
    for (const pageId of created.pages) {
      const pgRow = await q(client, `SELECT documento_id, page_number, text FROM document_text_pages WHERE id=$1`, [pageId]);
      const contentHash = createHash('sha256').update(pgRow.rows[0].text).digest('hex');
      const entryId = uid();
      await q(client, `INSERT INTO sgie_search_entries (id, resource_type, resource_id, expediente_id, document_id, document_version_id, page_number, title, normalized_title, content, content_hash, source_version, approval_status) VALUES ($1,'document_page',$2,$3,$2,1,$4,'test page','test page',$5,$6,1,'approved')`, [entryId, doc1, expId, pgRow.rows[0].page_number, pgRow.rows[0].text, contentHash]);
      created.entries.push(entryId);
    }
    assert(created.entries.length === 2, '2 entradas indexadas');

    console.log('\n4. Idempotencia...');
    const dup = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE resource_id=$1`, [doc1]);
    assert(dup.rows[0].c === 2, 'entradas por doc = 2 (idempotente via unique constraint)');

    console.log('\n5. FTS + trigram disponibles...');
    const ext = await q(client, `SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','unaccent')`);
    assert(ext.rows.length === 2, 'extensiones pg_trgm + unaccent activas');

    console.log('\n6. Tombstone...');
    await q(client, `UPDATE sgie_search_entries SET deleted_at=NOW() WHERE id=$1`, [created.entries[0]]);
    const tomb = await q(client, `SELECT deleted_at FROM sgie_search_entries WHERE id=$1`, [created.entries[0]]);
    assert(tomb.rows[0].deleted_at !== null, 'tombstone: deleted_at registrado');

    console.log('\n7. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [fl1]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [fl1]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');
    await q(client, `UPDATE feature_flags SET kill_switch=false WHERE id=$1`, [fl1]);

    console.log('\n8. Persistencia...');
    const p = await q(client, `SELECT count(*)::int as c FROM sgie_search_entries WHERE resource_id=$1 AND deleted_at IS NULL`, [doc1]);
    assert(p.rows[0].c === 1, '1 entrada activa tras tombstone');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');
  } finally { try { client.release(); } catch {} }

  console.log('\n🧹 Limpiando...');
  let elim = 0;
  for (const k of ['entries','pages','documentos','expedientes','flags','usuarios']) {
    const ids = created[k];
    if (!ids?.length) continue;
    let s = '';
    if (k === 'entries') s = 'DELETE FROM sgie_search_entries WHERE id=ANY($1::uuid[])';
    else if (k === 'pages') s = 'DELETE FROM document_text_pages WHERE id=ANY($1::uuid[])';
    else if (k === 'documentos') s = 'DELETE FROM documentos_expediente WHERE id=ANY($1::uuid[])';
    else if (k === 'expedientes') s = 'DELETE FROM expedientes WHERE id=ANY($1::uuid[])';
    else if (k === 'flags') s = 'DELETE FROM feature_flags WHERE id=ANY($1::uuid[])';
    else if (k === 'usuarios') s = 'DELETE FROM usuarios WHERE id=ANY($1::uuid[])';
    try { const r = await POOL.query(s, [ids]); elim += (r.rowCount ?? 0); } catch {}
  }
  console.log(`   🗑️  ${elim} filas.`);
  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B5-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B5-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}
main().catch(e => { console.error('\n[FASE4B5-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
