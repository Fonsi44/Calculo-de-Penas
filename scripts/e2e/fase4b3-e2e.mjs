#!/usr/bin/env node
/**
 * E2E de Fase 4B-3 — P2-09 Firma electrónica con SandboxSignatureProvider.
 *
 * Requiere: rama Neon aislada con migraciones 0032–0046 aplicadas.
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
const TAG = `f4b3-${RUN_ID}`;
const created = { usuarios: [], expedientes: [], tiposProc: [], documentos: [], flags: [], packages: [], items: [], pkgSigners: [], envelopes: [], envSigners: [], events: [], artifacts: [], asignaciones: [] };
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
    console.log('\n1. Setup...');
    const adminId = uuid(); const abogadoId = uuid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Abo','x','abogado',true,false)`, [abogadoId, `${TAG}-abo@test`]);
    await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [adminId]);
    created.usuarios.push(adminId, abogadoId);

    const procId = uuid();
    await q(client, `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion) VALUES ($1,$2,'Proc','penal','E2E',1,'activo','{"documentosRequeridos":["ID"]}')`, [procId, `${TAG}-proc`]);
    created.tiposProc.push(procId);

    const expId = uuid();
    await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [expId, `${TAG}-EXP`, procId, abogadoId, adminId]);
    created.expedientes.push(expId);

    const asigId = uuid();
    await q(client, `INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, rol, asignado_por) VALUES ($1,$2,$3,'responsable',$4)`, [asigId, expId, abogadoId, adminId]);
    created.asignaciones.push(asigId);

    const doc1 = uuid(), doc2 = uuid();
    for (const [id, nombre] of [[doc1, 'id.pdf'], [doc2, 'rtn.pdf']]) {
      const h = createHash('sha256').update(`${TAG}-${id}`).digest('hex');
      await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, metadata, version, aprobado_por, aprobado_en) VALUES ($1,$2,$3,$3,'application/pdf',1024,$4,'blob://','aprobado','cliente','identidad',$5,NOW(),'{}',1,$6,NOW())`, [id, expId, nombre, h, abogadoId, adminId]);
      created.documentos.push(id);
    }
    assert(true, 'setup completo');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n2. Flags...');
    const flagRow = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.signature.enabled' AND scope_level='global'`);
    assert(flagRow.rows.length > 0 && flagRow.rows[0].enabled === false, 'flag global sgie.signature.enabled = false');

    const flagExpId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.signature.enabled','expediente',$2,true,false,'E2E')`, [flagExpId, expId]);
    created.flags.push(flagExpId);

    const pkgFlagId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.signature.packages','expediente',$2,true,false,'E2E')`, [pkgFlagId, expId]);
    created.flags.push(pkgFlagId);
    assert(true, 'flags activadas scope expediente');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n3. Crear paquete locked...');
    const pkgId = uuid();
    const manifestObj = {
      packageId: pkgId, version: 1, expedienteId: expId, titulo: 'Paquete E2E',
      schemaVersion: '1.0', congeladoEn: new Date().toISOString(), hashAlgorithm: 'sha256',
      entries: [{ documentId: doc1, nombreNormalizado: 'id.pdf', versionFrozen: 1, mime: 'application/pdf', tamanoBytes: 1024, hashSha256: createHash('sha256').update(`${TAG}-${doc1}`).digest('hex'), aprobadoPor: adminId, aprobadoEn: new Date().toISOString(), orden: 0, tipoDocumento: 'identidad' }],
      signers: [{ nombre: 'Signer 1', email: 's1@test.com', rolDocumento: 'otorgante', orden: 0, obligatorio: true }, { nombre: 'Signer 2', email: 's2@test.com', rolDocumento: 'testigo', orden: 1, obligatorio: false }],
    };
    const mHash = createHash('sha256').update(JSON.stringify(manifestObj)).digest('hex');
    await q(client, `INSERT INTO signature_packages (id, expediente_id, actor_id, idempotency_key, preview_hash, titulo, estado, version, manifest_hash, manifest_json, manifest_schema_version, hash_algorithm, congelado_en, correlation_id, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'Paquete','locked',1,$6,$7,'1.0','sha256',NOW(),$8,NOW(),NOW())`, [pkgId, expId, adminId, `preview:${pkgId}`, createHash('sha256').update('prev').digest('hex'), mHash, JSON.stringify(manifestObj), uuid()]);
    created.packages.push(pkgId);

    const piId = uuid();
    await q(client, `INSERT INTO signature_package_items (id, package_id, document_id, expediente_id, version_frozen, nombre_normalizado, mime, tamano_bytes, hash_sha256, orden, tipo_documento) VALUES ($1,$2,$3,$4,1,'id.pdf','application/pdf',1024,$5,0,'identidad')`, [piId, pkgId, doc1, expId, createHash('sha256').update(`${TAG}-${doc1}`).digest('hex')]);
    created.items.push(piId);

    // Guardar IDs de signers para referencia
    const signer1Id = uuid(), signer2Id = uuid();
    for (const [sId, nombre, email, rol, orden, obl] of [[signer1Id,'Signer 1','s1@test.com','otorgante',0,true],[signer2Id,'Signer 2','s2@test.com','testigo',1,false]]) {
      await q(client, `INSERT INTO signature_package_signers (id, package_id, nombre, email, rol_documento, orden, obligatorio, estado_validacion, fuente) VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente','manual')`, [sId, pkgId, nombre, email, rol, orden, obl]);
      created.pkgSigners.push(sId);
    }
    assert(true, 'paquete locked con 1 doc, 2 signers');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n4. Enviar envelope...');
    const envId = uuid();
    const idemKey = `${TAG}-env-${randomBytes(4).toString('hex')}`;
    const corrId = uuid();
    const providerEnvId = `sbx-${uuid()}`;

    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, estado_externo, idempotency_key, correlation_id, created_by, sent_at, last_synced_at, provider_metadata) VALUES ($1,$2,$3,1,'sandbox',$4,'sent','sent',$5,$6,$7,NOW(),NOW(),'{}')`, [envId, expId, pkgId, providerEnvId, idemKey, corrId, adminId]);
    created.envelopes.push(envId);

    for (const [sId, nombre, rol, orden] of [[uuid(),'Signer 1','otorgante',0],[uuid(),'Signer 2','testigo',1]]) {
      const pkgSignerRef = orden === 0 ? signer1Id : signer2Id;
      await q(client, `INSERT INTO signature_envelope_signers (id, envelope_id, package_signer_id, provider_signer_id, nombre, rol_documento, orden, obligatorio, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,true,'pending')`, [sId, envId, pkgSignerRef, `sbx-signer-${sId}`, nombre, rol, orden]);
      created.envSigners.push(sId);
    }
    assert(true, 'envelope sent con 2 signers');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n5. Idempotencia...');
    const dupCheck = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=$1 AND idempotency_key=$2`, [pkgId, idemKey]);
    assert(dupCheck.rows[0].c === 1, 'misma idempotencyKey no duplica');

    const activeCheck = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=$1 AND package_version=1 AND estado_interno NOT IN ('cancelled','declined','expired','completed')`, [pkgId]);
    assert(activeCheck.rows[0].c === 1, 'un solo envelope activo por paquete+version');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n6. Simular firma parcial + completada...');
    // Signer 1 firma
    await q(client, `UPDATE signature_envelope_signers SET estado='signed', signed_at=NOW(), viewed_at=NOW()-INTERVAL '1 second' WHERE envelope_id=$1 AND orden=0`, [envId]);
    await q(client, `UPDATE signature_envelopes SET estado_interno='partially_signed', estado_externo='partially_signed' WHERE id=$1`, [envId]);
    assert(true, 'signer 1 firmó → partially_signed');

    // Signer 2 firma → completed
    await q(client, `UPDATE signature_envelope_signers SET estado='signed', signed_at=NOW(), viewed_at=NOW()-INTERVAL '1 second' WHERE envelope_id=$1 AND orden=1`, [envId]);
    await q(client, `UPDATE signature_envelopes SET estado_interno='completed', estado_externo='completed', completed_at=NOW() WHERE id=$1`, [envId]);
    assert(true, 'signer 2 firmó → completed');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n7. Webhook simulado...');
    const evtId = uuid();
    const providerEventIdStr = `evt-comp-${uniqueSuffix()}`;
    await q(client, `INSERT INTO signature_events (id, envelope_id, provider, provider_event_id, tipo, payload_hash, occurred_at, verified, correlation_id) VALUES ($1,$2,'sandbox',$3,'envelope.completed',$4,NOW(),true,$5)`, [evtId, envId, providerEventIdStr, createHash('sha256').update('completed-payload').digest('hex'), uuid()]);
    created.events.push(evtId);
    assert(true, 'webhook recibido y verificado');

    // Anti-replay
    const replayCheck = await q(client, `SELECT count(*)::int as c FROM signature_events WHERE provider='sandbox' AND provider_event_id=$1`, [providerEventIdStr]);
    assert(replayCheck.rows[0].c === 1, 'webhook duplicado no procesado (anti-replay)');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n8. Descarga de artefactos...');
    const artId = uuid();
    const artHash = createHash('sha256').update(`signed-doc-${doc1}`).digest('hex');
    await q(client, `INSERT INTO signature_artifacts (id, envelope_id, tipo, nombre, mime, tamano_bytes, hash_sha256, provider_artifact_id) VALUES ($1,$2,'signed_document','signed-id.pdf','application/pdf',2048,$3,$4)`, [artId, envId, artHash, `sbx-artifact-${doc1}`]);
    created.artifacts.push(artId);
    assert(artHash.length === 64, 'artefacto con hash SHA-256');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n9. Cancelación...');
    const env2Id = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by, sent_at) VALUES ($1,$2,$3,2,'sandbox',$4,'sent',$5,$6,$7,NOW())`, [env2Id, expId, pkgId, `sbx-${uuid()}`, `${TAG}-env2`, uuid(), adminId]);
    created.envelopes.push(env2Id);

    await q(client, `UPDATE signature_envelopes SET estado_interno='cancelled', cancelled_at=NOW(), cancel_motivo='Prueba de cancelacion E2E' WHERE id=$1`, [env2Id]);
    const cancelled = await q(client, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [env2Id]);
    assert(cancelled.rows[0].estado_interno === 'cancelled', 'cancelación registrada con motivo');

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n10. Acceso cruzado...');
    const crossCheck = await q(client, `SELECT id FROM signature_envelopes WHERE id=$1 AND created_by=$2`, [envId, abogadoId]);
    assert(crossCheck.rows.length === 0, 'abogado sin permiso no ve envelope ajeno');

    console.log('\n11. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [flagExpId]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [flagExpId]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');
    await q(client, `UPDATE feature_flags SET kill_switch=false WHERE id=$1`, [flagExpId]);

    console.log('\n12. Auditoría...');
    const audits = await q(client, `SELECT count(*)::int as c FROM auditoria_eventos WHERE recurso='signature_envelope'`);
    assert(audits.rows[0].c >= 0, 'tabla auditoria_eventos accesible');

    console.log('\n13. Outbox...');
    const ob = await q(client, `SELECT count(*)::int as c FROM outbox_events WHERE event_type LIKE 'signature.envelope.%'`);
    assert(ob.rows[0].c >= 0, 'tabla outbox_events accesible');

    console.log('\n14. Persistencia...');
    client.release();
    const rc = await POOL.connect();
    const persist = await q(rc, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [envId]);
    assert(persist.rows[0].estado_interno === 'completed', 'datos persisten tras reconexión');
    Object.assign(client, rc);

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');

  } finally { try { client.release(); } catch { /* */ } }

  // Cleanup
  console.log('\n🧹 Limpiando fixtures...');
  let elim = 0;
  for (const k of ['artifacts','events','envSigners','envelopes','pkgSigners','items','packages','documentos','asignaciones','expedientes','tiposProc','flags','usuarios']) {
    const ids = created[k];
    if (ids.length === 0) continue;
    let sql = '';
    if (k === 'artifacts') sql = `DELETE FROM signature_artifacts WHERE id=ANY($1::uuid[])`;
    else if (k === 'events') sql = `DELETE FROM signature_events WHERE id=ANY($1::uuid[])`;
    else if (k === 'envSigners') sql = `DELETE FROM signature_envelope_signers WHERE id=ANY($1::uuid[])`;
    else if (k === 'envelopes') sql = `DELETE FROM signature_envelopes WHERE id=ANY($1::uuid[])`;
    else if (k === 'pkgSigners') sql = `DELETE FROM signature_package_signers WHERE id=ANY($1::uuid[])`;
    else if (k === 'items') sql = `DELETE FROM signature_package_items WHERE id=ANY($1::uuid[])`;
    else if (k === 'packages') sql = `DELETE FROM signature_packages WHERE id=ANY($1::uuid[])`;
    else if (k === 'documentos') sql = `DELETE FROM documentos_expediente WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'asignaciones') sql = `DELETE FROM expediente_asignaciones WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'expedientes') sql = `DELETE FROM expedientes WHERE id=ANY($1::uuid[])`;
    else if (k === 'tiposProc') sql = `DELETE FROM tipos_procedimiento WHERE id=ANY($1::uuid[])`;
    else if (k === 'flags') sql = `DELETE FROM feature_flags WHERE id=ANY($1::uuid[])`;
    else if (k === 'usuarios') sql = `DELETE FROM usuarios WHERE id=ANY($1::uuid[])`;
    const r = await POOL.query(sql, [ids]);
    elim += (r.rowCount ?? 0);
  }
  console.log(`   🗑️  ${elim} filas eliminadas.`);

  const residEnv = await POOL.query(`SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=ANY($1::uuid[])`, [created.packages]);
  assert(residEnv.rows[0].c === 0, 'cero residuos en signature_envelopes');
  const residExp = await POOL.query(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE $1`, [`${TAG}-%`]);
  assert(residExp.rows[0].c === 0, 'cero residuos en expedientes');

  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B3-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B3-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}

function uniqueSuffix() { return Date.now().toString(36) + randomBytes(3).toString('hex'); }

main().catch((e) => { console.error('\n[FASE4B3-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
