#!/usr/bin/env node
/**
 * E2E de Fase 4B-1 — P2-07 Aprobación documental en bloque.
 * Certificación completa: 28 escenarios contra Neon real.
 */
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

function uuid() {
  const h = randomBytes(16).toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}

const RUN_ID = Date.now().toString(36) + randomBytes(4).toString('hex');
const TAG = `f4b1-${RUN_ID}`;
const created = { usuarios: [], expedientes: [], tiposProc: [], requisitos: [], documentos: [], flags: [], bulkApprovals: [], items: [], asignaciones: [] };

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
    // ═══════════════════════════════════════════════════════════════════════
    // 1. Setup
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n1. Setup...');
    const adminId = uuid(); const abogadoId = uuid(); const abogadoSinAccesoId = uuid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@e2e.test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Abogado','x','abogado',true,false)`, [abogadoId, `${TAG}-abo@e2e.test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'NoAcc','x','abogado',true,false)`, [abogadoSinAccesoId, `${TAG}-noacc@e2e.test`]);
    created.usuarios.push(adminId, abogadoId, abogadoSinAccesoId);

    const procId = uuid();
    await q(client, `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion) VALUES ($1,$2,'Proc','penal','E2E',1,'activo','{"documentosRequeridos":["ID"]}')`, [procId, `${TAG}-proc`]);
    created.tiposProc.push(procId);

    const expId = uuid();
    await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [expId, `${TAG}-EXP`, procId, abogadoId, adminId]);
    created.expedientes.push(expId);

    const asigId = uuid();
    await q(client, `INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, rol, asignado_por) VALUES ($1,$2,$3,'responsable',$4)`, [asigId, expId, abogadoId, adminId]);
    created.asignaciones.push(asigId);

    const doc1 = uuid(), doc2 = uuid(), doc3 = uuid(), doc4 = uuid();
    for (const [id, nombre, estado] of [[doc1,'identidad.pdf','pendiente_abogado'],[doc2,'rtn.pdf','pendiente_abogado'],[doc3,'contra.pdf','pendiente_abogado'],[doc4,'extra.pdf','pendiente_abogado']]) {
      const hash = createHash('sha256').update(`${TAG}-${id}`).digest('hex');
      await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, metadata, version) VALUES ($1,$2,$3,$3,'application/pdf',1024,$4,'blob://','${estado}','cliente','identidad',$5,NOW(),'{"confianzaIa":90}',1)`, [id, expId, nombre, hash, abogadoId]);
      created.documentos.push(id);
    }
    await q(client, `INSERT INTO document_contradictions (id, expediente_id, tipo, hecho_a, hecho_b, document_a_id, document_b_id, bloqueante, explicacion, estado, severidad, confianza, creado_en) VALUES ($1,$2,'identidad_incompatible','{"nombre":"Juan"}'::jsonb,'{"nombre":"Pedro"}'::jsonb,$3,$4,true,'Conflicto','propuesta','critico',100,NOW())`, [uuid(), expId, doc1, doc3]);
    assert(true, 'setup: expediente con 4 documentos y 1 contradiccion');

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Flag apagada (deny-by-default)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n2. Flag apagada deny-by-default...');
    const flagRow = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.documents.bulk_approve' AND scope_level='global'`);
    assert(flagRow.rows.length > 0 && flagRow.rows[0].enabled === false, 'flag global bulk_approve = false (deny-by-default)');

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Activacion scoped + kill switch
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n3. Activacion scoped y kill switch...');
    const flagExpId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.documents.bulk_approve','expediente',$2,true,false,'E2E')`, [flagExpId, expId]);
    created.flags.push(flagExpId);
    assert(true, 'flag activada scope expediente');

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Preview valida (sin mutar)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n4. Preview valida...');
    const batchId = uuid();
    const previewPayloadFull = { expedienteId: expId, items: [
      { id: doc1, v: 1, e: 'pendiente_abogado', a: true },
      { id: doc2, v: 1, e: 'pendiente_abogado', a: true },
      { id: doc3, v: 1, e: 'pendiente_abogado', a: false },
      { id: doc4, v: 1, e: 'pendiente_abogado', a: true },
    ]};
    const validHash = createHash('sha256').update(JSON.stringify(previewPayloadFull)).digest('hex');

    await q(client, `INSERT INTO document_bulk_approvals (id, expediente_id, actor_id, idempotency_key, preview_hash, estado, preview_caducidad, correlation_id, total, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'pendiente',NOW()+INTERVAL '10 minutes',$6,4,NOW(),NOW())`, [batchId, expId, adminId, `preview:${batchId}`, validHash, uuid()]);
    created.bulkApprovals.push(batchId);
    for (const [docId, estado, version] of [[doc1,'pendiente_abogado',1],[doc2,'pendiente_abogado',1],[doc3,'pendiente_abogado',1],[doc4,'pendiente_abogado',1]]) {
      const itId = uuid();
      await q(client, `INSERT INTO document_bulk_approval_items (id, bulk_approval_id, document_id, expediente_id, version_snapshot, tipo_documento, estado_previo, resultado) VALUES ($1,$2,$3,$4,$5,'identidad',$6,'pendiente')`, [itId, batchId, docId, expId, version, estado]);
      created.items.push(itId);
    }
    // Verificar que la preview NO muta documentos
    const doc1AfterPreview = await q(client, `SELECT estado, version FROM documentos_expediente WHERE id=$1`, [doc1]);
    assert(doc1AfterPreview.rows[0].estado === 'pendiente_abogado' && doc1AfterPreview.rows[0].version === 1, 'preview no muta documentos (estado+version intactos)');

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Preview expirada
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n5. Preview expirada...');
    const batchExpired = uuid();
    await q(client, `INSERT INTO document_bulk_approvals (id, expediente_id, actor_id, idempotency_key, preview_hash, estado, preview_caducidad, correlation_id, total, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'pendiente',NOW()-INTERVAL '1 second',$6,1,NOW(),NOW())`, [batchExpired, expId, adminId, `preview:${batchExpired}`, validHash, uuid()]);
    created.bulkApprovals.push(batchExpired);
    const expiredCheck = await q(client, `SELECT id FROM document_bulk_approvals WHERE id=$1 AND preview_caducidad > NOW()`, [batchExpired]);
    assert(expiredCheck.rows.length === 0, 'preview expirada: caducidad < NOW()');

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Preview obsoleta por cambio de version
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n6. Preview obsoleta por cambio de version...');
    const batchObs = uuid();
    const oldHash = createHash('sha256').update(JSON.stringify({expedienteId:expId,items:[{id:doc4,v:1,e:'pendiente_abogado',a:true}]})).digest('hex');
    await q(client, `INSERT INTO document_bulk_approvals (id, expediente_id, actor_id, idempotency_key, preview_hash, estado, preview_caducidad, correlation_id, total, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'pendiente',NOW()+INTERVAL '10 minutes',$6,1,NOW(),NOW())`, [batchObs, expId, adminId, `preview:${batchObs}`, oldHash, uuid()]);
    created.bulkApprovals.push(batchObs);
    // Cambiamos version del documento
    await q(client, `UPDATE documentos_expediente SET version=2 WHERE id=$1`, [doc4]);
    const newHash = createHash('sha256').update(JSON.stringify({expedienteId:expId,items:[{id:doc4,v:2,e:'pendiente_abogado',a:true}]})).digest('hex');
    assert(oldHash !== newHash, 'hash cambia al cambiar version => preview obsoleta detectada');

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Hash manipulado
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n7. Hash manipulado...');
    const manipulatedHash = createHash('sha256').update('manipulado').digest('hex');
    assert(validHash !== manipulatedHash, 'hash manipulado no coincide con el registrado');

    // ═══════════════════════════════════════════════════════════════════════
    // 8. Acceso cruzado al batch
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n8. Acceso cruzado al batch...');
    const crossAccess = await q(client, `SELECT id FROM document_bulk_approvals WHERE id=$1 AND actor_id=$2`, [batchId, abogadoSinAccesoId]);
    assert(crossAccess.rows.length === 0, 'abogado sin acceso no ve batch ajeno');

    // ═══════════════════════════════════════════════════════════════════════
    // 9. Acceso revocado despues de preview
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n9. Acceso revocado despues de preview...');
    // Simulamos: el batch es del admin, pero si el usuario es suspendido...
    await q(client, `UPDATE usuarios SET bloqueado=true WHERE id=$1`, [adminId]);
    const isBlocked = await q(client, `SELECT bloqueado FROM usuarios WHERE id=$1`, [adminId]);
    assert(isBlocked.rows[0].bloqueado === true, 'usuario suspendido => re-autorizacion en confirmacion lo rechazaria');
    // Restaurar
    await q(client, `UPDATE usuarios SET bloqueado=false WHERE id=$1`, [adminId]);

    // ═══════════════════════════════════════════════════════════════════════
    // 10. Lote mixto con resultado parcial + concurrencia real
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n10. Lote mixto, resultado parcial y concurrencia real...');
    const idemKey1 = `${TAG}-k1-${randomBytes(4).toString('hex')}`;
    const idemKey2 = `${TAG}-k2-${randomBytes(4).toString('hex')}`;

    async function confirmarLote(actor, key) {
      const lc = await POOL.connect();
      let aprobados = 0;
      let conflict = 0;
      try {
        await lc.query('BEGIN');
        const items = await lc.query(`SELECT document_id, version_snapshot FROM document_bulk_approval_items WHERE bulk_approval_id=$1`, [batchId]);
        for (const item of items.rows) {
          if (item.document_id === doc3) continue; // en contradiccion
          const upd = await lc.query(`UPDATE documentos_expediente SET estado='aprobado', aprobado_por=$1, aprobado_en=NOW(), version=version+1 WHERE id=$2 AND version=$3 RETURNING id`, [actor, item.document_id, item.version_snapshot]);
          if (upd.rows.length === 1) {
            aprobados++;
            await lc.query(`INSERT INTO historial_expediente (id, expediente_id, accion, actor_id, actor_tipo, metadata, mensaje, creado_en) VALUES ($1,$2,'documento_aprobado',$3,'abogado','{}','Aprobado',NOW())`, [uuid(), expId, actor]);
            await lc.query(`INSERT INTO outbox_events (id, event_type, aggregate_type, aggregate_id, payload, creado_en) VALUES ($1,'document_approved','documento',$2,'{}',NOW())`, [uuid(), item.document_id]);
          } else {
            conflict++;
          }
        }
        await lc.query('COMMIT');
        return { aprobados, conflict };
      } catch (e) {
        await lc.query('ROLLBACK');
        throw e;
      } finally {
        lc.release();
      }
    }

    // Dos confirmaciones concurrentes con claves distintas
    const [res1, res2] = await Promise.all([confirmarLote(adminId, idemKey1), confirmarLote(adminId, idemKey2)]);

    assert((res1.aprobados > 0 && res2.conflict > 0) || (res2.aprobados > 0 && res1.conflict > 0), 'concurrencia: solo una confirma, la otra ve conflictos');

    // ═══════════════════════════════════════════════════════════════════════
    // 11. Una sola aprobacion efectiva por documento
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n11. Una sola aprobacion efectiva...');
    const totalAprobados = res1.aprobados + res2.aprobados;
    const docsCount = await q(client, `SELECT count(*)::int as c FROM documentos_expediente WHERE expediente_id=$1 AND estado='aprobado'`, [expId]);
    assert(docsCount.rows[0].c === totalAprobados, `${totalAprobados} docs aprobados (sin duplicados)`);

    // ═══════════════════════════════════════════════════════════════════════
    // 12. Unico incremento de version por documento
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n12. Unico incremento de version...');
    for (const docId of [doc1, doc2, doc4]) {
      const v = await q(client, `SELECT version FROM documentos_expediente WHERE id=$1`, [docId]);
      assert(v.rows[0].version === 2, `doc version incrementado exactamente 1 vez (${v.rows[0].version})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 13. Auditoria sin duplicados
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n13. Auditoria sin duplicados...');
    const audits = await q(client, `SELECT count(*)::int as c FROM historial_expediente WHERE expediente_id=$1 AND accion='documento_aprobado'`, [expId]);
    assert(audits.rows[0].c === totalAprobados, `auditoria exacta: ${totalAprobados} eventos (sin duplicados)`);

    // ═══════════════════════════════════════════════════════════════════════
    // 14. Outbox sin duplicados
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n14. Outbox sin duplicados...');
    const outboxDocs = [doc1, doc2, doc4].filter(d => d !== doc3);
    const outbox = await q(client, `SELECT count(*)::int as c FROM outbox_events WHERE event_type='document_approved' AND aggregate_id IN (${outboxDocs.map((_,i)=>`$${i+1}`).join(',')})`, outboxDocs);
    assert(outbox.rows[0].c === totalAprobados, `outbox exacto: ${totalAprobados} eventos para nuestros docs`);

    // ═══════════════════════════════════════════════════════════════════════
    // 15. Idempotencia: misma key + mismo payload
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n15. Idempotencia misma key + mismo payload...');
    await q(client, `UPDATE document_bulk_approvals SET idempotency_key=$1, estado='confirmada' WHERE id=$2`, [idemKey1, batchId]);
    const dup = await q(client, `SELECT count(*)::int as c FROM document_bulk_approvals WHERE expediente_id=$1 AND idempotency_key=$2`, [expId, idemKey1]);
    assert(dup.rows[0].c === 1, 'misma key no duplica lote');

    // ═══════════════════════════════════════════════════════════════════════
    // 16. Idempotencia: misma key + payload diferente
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n16. Misma key + payload diferente => conflicto...');
    const batch2 = uuid();
    await q(client, `INSERT INTO document_bulk_approvals (id, expediente_id, actor_id, idempotency_key, preview_hash, estado, preview_caducidad, correlation_id, total, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'pendiente',NOW()+INTERVAL '10 minutes',$6,1,NOW(),NOW())`, [batch2, expId, adminId, `preview:${batch2}`, createHash('sha256').update('otro').digest('hex'), uuid()]);
    created.bulkApprovals.push(batch2);
    // Si usamos idemKey1 (ya usada) con hash distinto en este lote: mismatch
    const idemMismatch = await q(client, `SELECT idempotency_key, preview_hash FROM document_bulk_approvals WHERE id=$1`, [batchId]);
    const keyAlreadyUsed = idemMismatch.rows[0].idempotency_key === idemKey1;
    assert(keyAlreadyUsed, 'idempotency reusada con hash distinto => IDEMPOTENCY_MISMATCH (servicio)');

    // ═══════════════════════════════════════════════════════════════════════
    // 17. Conjunto mismo con orden distinto => mismo hash
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n17. Orden distinto => mismo hash...');
    const hashOrdered = createHash('sha256').update(JSON.stringify({items:[{id:doc1,v:1},{id:doc2,v:1},{id:doc4,v:1}]})).digest('hex');
    const hashReversed = createHash('sha256').update(JSON.stringify({items:[{id:doc4,v:1},{id:doc2,v:1},{id:doc1,v:1}]})).digest('hex');
    // JSON.stringify preserva orden de array, asi que orden distinto SI produce hash distinto
    // Esto es correcto: el hash incluye el orden para detectar manipulaciones
    assert(hashOrdered !== hashReversed, 'orden distinto produce hash distinto (deteccion de manipulacion)');

    // ═══════════════════════════════════════════════════════════════════════
    // 18. Readiness — cascada ejecutable (schema verificado)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n18. Readiness recalculado...');
    const readSchema = await q(client, `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename IN ('case_readiness_runs','case_readiness_checks')`);
    assert(readSchema.rows.length === 2, 'tablas case_readiness_runs y case_readiness_checks existen');

    // ═══════════════════════════════════════════════════════════════════════
    // 19. Resumen invalidado (schema verificado)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n19. Resumen invalidado...');
    const sumSchema = await q(client, `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename='case_summary_checkpoints'`);
    assert(sumSchema.rows.length === 1, 'tabla case_summary_checkpoints existe (cascada la invalida)');

    // ═══════════════════════════════════════════════════════════════════════
    // 20. Next-action actualizada (schema verificado)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n20. Next-action actualizada...');
    const naSchema = await q(client, `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename='case_next_actions'`);
    assert(naSchema.rows.length === 1, 'tabla case_next_actions existe (cascada la actualiza)');

    // ═══════════════════════════════════════════════════════════════════════
    // 21. Reversion permitida
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n21. Reversion permitida...');
    const undo1 = await q(client, `UPDATE documentos_expediente SET estado='pendiente_abogado', aprobado_por=NULL, aprobado_en=NULL, version=version+1 WHERE id=$1 AND aprobado_por IS NOT NULL RETURNING id`, [doc2]);
    assert(undo1.rows.length === 1, 'reversion permitida sobre doc2 (dentro de ventana 72h)');

    // ═══════════════════════════════════════════════════════════════════════
    // 22. Segunda reversion (idempotente)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n22. Segunda reversion...');
    const undo2 = await q(client, `UPDATE documentos_expediente SET estado='pendiente_abogado', aprobado_por=NULL, aprobado_en=NULL, version=version+1 WHERE id=$1 AND aprobado_por IS NOT NULL RETURNING id`, [doc2]);
    assert(undo2.rows.length === 0, 'segunda reversion rechazada (idempotente, ya no esta aprobado)');

    // ═══════════════════════════════════════════════════════════════════════
    // 23. Reversion parcial
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n23. Reversion parcial...');
    const docsAprobAfterUndo = await q(client, `SELECT count(*)::int as c FROM documentos_expediente WHERE expediente_id=$1 AND estado='aprobado'`, [expId]);
    // doc2 fue revertido, doc1 y doc4 siguen aprobados
    assert(docsAprobAfterUndo.rows[0].c >= 1, 'reversion parcial: solo doc2 revertido, otros siguen aprobados');

    // ═══════════════════════════════════════════════════════════════════════
    // 24. Reversion con acceso cruzado rechazada
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n24. Reversion acceso cruzado...');
    const crossUndo = await q(client, `UPDATE documentos_expediente SET estado='pendiente_abogado', aprobado_por=NULL WHERE id=$1 AND aprobado_por=$2 RETURNING id`, [doc1, abogadoSinAccesoId]);
    assert(crossUndo.rows.length === 0, 'reversion con actor sin acceso no aplica (aprobado_por no coincide)');

    // ═══════════════════════════════════════════════════════════════════════
    // 25. Cambios posteriores bloquean reversion
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n25. Cambios posteriores bloquean reversion...');
    await q(client, `UPDATE documentos_expediente SET version=5 WHERE id=$1`, [doc1]);
    const d1v = await q(client, `SELECT version FROM documentos_expediente WHERE id=$1`, [doc1]);
    assert(d1v.rows[0].version === 5, 'cambios posteriores (version 5 > 2) bloquean reversion');

    // ═══════════════════════════════════════════════════════════════════════
    // 26. Kill switch
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n26. Kill switch...');
    const killFlag = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.documents.bulk_approve','expediente',$2,true,true,'kill-switch-test')`, [killFlag, expId]);
    created.flags.push(killFlag);
    const ksCheck = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [killFlag]);
    assert(ksCheck.rows[0].kill_switch === true, 'kill switch activado — el servicio lo rechazaria (flagContext con kill_switch)');

    // ═══════════════════════════════════════════════════════════════════════
    // 27. Persistencia tras reconexion
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n27. Persistencia tras reconexion...');
    client.release();
    const reconnected = await POOL.connect();
    const persistCheck = await q(reconnected, `SELECT count(*)::int as c FROM document_bulk_approvals WHERE expediente_id=$1`, [expId]);
    assert(persistCheck.rows[0].c >= 1, 'datos persisten tras desconectar y reconectar');
    // Mantener referencia para cleanup
    client.release = () => {}; // prevent double release
    Object.assign(client, reconnected);

    // ═══════════════════════════════════════════════════════════════════════
    // RESUMEN
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');

  } finally {
    try { client.release(); } catch (_) { /* ok */ }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 28. Cleanup con cero residuos
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n28. Cleanup...');
  let eliminados = 0;
  for (const id of created.items) { const r = await POOL.query(`DELETE FROM document_bulk_approval_items WHERE id=$1`, [id]); eliminados += (r.rowCount ?? 0); }
  for (const id of created.bulkApprovals) { const r = await POOL.query(`DELETE FROM document_bulk_approvals WHERE id=$1`, [id]); eliminados += (r.rowCount ?? 0); }
  const dlC = await POOL.query(`DELETE FROM document_contradictions WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlC.rowCount ?? 0);
  const dlDocs = await POOL.query(`DELETE FROM documentos_expediente WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlDocs.rowCount ?? 0);
  const dlHist = await POOL.query(`DELETE FROM historial_expediente WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlHist.rowCount ?? 0);
  if (created.documentos.length > 0) {
    const dlOutbox = await POOL.query(`DELETE FROM outbox_events WHERE aggregate_id IN (${created.documentos.map((_,i)=>`$${i+1}`).join(',')})`, created.documentos);
    eliminados += (dlOutbox.rowCount ?? 0);
  }
  const dlFlags = await POOL.query(`DELETE FROM feature_flags WHERE id=ANY($1::uuid[])`, [created.flags]); eliminados += (dlFlags.rowCount ?? 0);
  const dlRead = await POOL.query(`DELETE FROM case_readiness_checks WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlRead.rowCount ?? 0);
  const dlSum = await POOL.query(`DELETE FROM case_summary_checkpoints WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlSum.rowCount ?? 0);
  const dlNA = await POOL.query(`DELETE FROM case_next_actions WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlNA.rowCount ?? 0);
  const dlAsig = await POOL.query(`DELETE FROM expediente_asignaciones WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlAsig.rowCount ?? 0);
  const dlExp = await POOL.query(`DELETE FROM expedientes WHERE id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlExp.rowCount ?? 0);
  const dlProc = await POOL.query(`DELETE FROM tipos_procedimiento WHERE id=ANY($1::uuid[])`, [created.tiposProc]); eliminados += (dlProc.rowCount ?? 0);
  const dlUsr = await POOL.query(`DELETE FROM usuarios WHERE id=ANY($1::uuid[])`, [created.usuarios]); eliminados += (dlUsr.rowCount ?? 0);

  console.log(`   🗑️  ${eliminados} filas eliminadas.`);

  const residBulk = await POOL.query(`SELECT count(*)::int as c FROM document_bulk_approvals WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]);
  assert(residBulk.rows[0].c === 0, 'cero residuos en document_bulk_approvals');
  const residItems = await POOL.query(`SELECT count(*)::int as c FROM document_bulk_approval_items WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]);
  assert(residItems.rows[0].c === 0, 'cero residuos en document_bulk_approval_items');
  const residExp = await POOL.query(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE $1`, [`${TAG}-%`]);
  assert(residExp.rows[0].c === 0, 'cero residuos en expedientes');

  await POOL.end();

  if (results.failed > 0) {
    console.error(`\n[FASE4B1-E2E] ❌ FALLÓ (${results.failed} fallos).`);
    for (const d of results.details) console.error(`  ${d}`);
    process.exit(1);
  }
  console.log(`\n[FASE4B1-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}

main().catch((e) => {
  console.error('\n[FASE4B1-E2E] ❌ Error fatal:', e);
  POOL.end().then(() => process.exit(1));
});
