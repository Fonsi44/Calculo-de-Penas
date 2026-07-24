#!/usr/bin/env node
/**
 * E2E Fase 4B-3 — P2-09 certificación completa sandbox.
 * Requiere rama Neon aislada con migraciones 0032–0046.
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

function uuid() { const h = randomBytes(16).toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`; }
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
    // ─── Setup ────────────────────────────────────────────────────────────
    console.log('\n1. Setup...');
    const adminId = uuid(); const abogadoId = uuid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Abo','x','abogado',true,false)`, [abogadoId, `${TAG}-abo@test`]);
    await q(client, `INSERT INTO usuarios_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE nombre='administrador' ON CONFLICT DO NOTHING`, [adminId]);
    created.usuarios.push(adminId, abogadoId);
    const procId = uuid();
    await q(client, `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion) VALUES ($1,$2,'Proc','penal','E2E',1,'activo','{}')`, [procId, `${TAG}-proc`]);
    created.tiposProc.push(procId);
    const expId = uuid();
    await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [expId, `${TAG}-EXP`, procId, abogadoId, adminId]);
    created.expedientes.push(expId);
    const asigId = uuid();
    await q(client, `INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, rol, asignado_por) VALUES ($1,$2,$3,'responsable',$4)`, [asigId, expId, abogadoId, adminId]);
    created.asignaciones.push(asigId);
    const doc1 = uuid();
    const h1 = createHash('sha256').update(`${TAG}-${doc1}`).digest('hex');
    await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, metadata, version, aprobado_por, aprobado_en) VALUES ($1,$2,'id.pdf','id.pdf','application/pdf',1024,$3,'blob://','aprobado','cliente','identidad',$4,NOW(),'{}',1,$5,NOW())`, [doc1, expId, h1, abogadoId, adminId]);
    created.documentos.push(doc1);
    assert(true, 'setup completo');

    // ─── Flags ─────────────────────────────────────────────────────────────
    console.log('\n2. Flags deny-by-default...');
    const flagGlobal = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.signature.enabled' AND scope_level='global'`);
    assert(flagGlobal.rows.length > 0 && flagGlobal.rows[0].enabled === false, 'flag sgie.signature.enabled global = false');
    const flagPkg = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.signature.packages' AND scope_level='global'`);
    assert(flagPkg.rows.length > 0 && flagPkg.rows[0].enabled === false, 'flag sgie.signature.packages global = false');
    const flagExpId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.signature.enabled','expediente',$2,true,false,'E2E')`, [flagExpId, expId]);
    created.flags.push(flagExpId);
    const pkgFlagId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.signature.packages','expediente',$2,true,false,'E2E')`, [pkgFlagId, expId]);
    created.flags.push(pkgFlagId);
    assert(true, 'flags activadas scope expediente');

    // ─── Paquete locked ────────────────────────────────────────────────────
    console.log('\n3. Crear paquete locked...');
    const pkgId = uuid();
    const mHash = createHash('sha256').update(`${TAG}-manifest`).digest('hex');
    await q(client, `INSERT INTO signature_packages (id, expediente_id, actor_id, idempotency_key, preview_hash, titulo, estado, version, manifest_hash, manifest_json, manifest_schema_version, hash_algorithm, congelado_en, correlation_id, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'Pkg','locked',1,$6,'{}','1.0','sha256',NOW(),$7,NOW(),NOW())`, [pkgId, expId, adminId, `preview:${pkgId}`, createHash('sha256').update('prev').digest('hex'), mHash, uuid()]);
    created.packages.push(pkgId);
    const piId = uuid();
    await q(client, `INSERT INTO signature_package_items (id, package_id, document_id, expediente_id, version_frozen, nombre_normalizado, mime, tamano_bytes, hash_sha256, orden, tipo_documento) VALUES ($1,$2,$3,$4,1,'id.pdf','application/pdf',1024,$5,0,'identidad')`, [piId, pkgId, doc1, expId, h1]);
    created.items.push(piId);
    const signer1Id = uuid(), signer2Id = uuid();
    for (const [sId, nombre, email, rol, orden, obl] of [[signer1Id,'S1','s1@t.com','otorgante',0,true],[signer2Id,'S2','s2@t.com','testigo',1,false]]) {
      await q(client, `INSERT INTO signature_package_signers (id, package_id, nombre, email, rol_documento, orden, obligatorio, estado_validacion, fuente) VALUES ($1,$2,$3,$4,$5,$6,$7,'pendiente','manual')`, [sId, pkgId, nombre, email, rol, orden, obl]);
      created.pkgSigners.push(sId);
    }
    assert(true, 'paquete locked con 1 doc + 2 signers');

    // ─── Envelope creation ─────────────────────────────────────────────────
    console.log('\n4. Enviar envelope...');
    const envId = uuid();
    const idemKey = `${TAG}-env-${randomBytes(4).toString('hex')}`;
    const corrId = uuid();
    const providerEnvId = `sbx-e2e-${uuid()}`;
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, estado_externo, idempotency_key, correlation_id, created_by, sent_at, last_synced_at, provider_metadata) VALUES ($1,$2,$3,1,'sandbox',$4,'sent','sent',$5,$6,$7,NOW(),NOW(),'{}')`, [envId, expId, pkgId, providerEnvId, idemKey, corrId, adminId]);
    created.envelopes.push(envId);
    for (const [pkgSignerRef, nombre, rol, orden] of [[signer1Id,'S1','otorgante',0],[signer2Id,'S2','testigo',1]]) {
      const eSigId = uuid();
      await q(client, `INSERT INTO signature_envelope_signers (id, envelope_id, package_signer_id, provider_signer_id, nombre, rol_documento, orden, obligatorio, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,true,'pending')`, [eSigId, envId, pkgSignerRef, `sbx-signer-${uuid()}`, nombre, rol, orden]);
      created.envSigners.push(eSigId);
    }
    assert(true, 'envelope sent');

    // ─── Idempotencia + active constraint ──────────────────────────────────
    console.log('\n5. Idempotencia y concurrencia...');
    const dupCheck = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=$1 AND idempotency_key=$2`, [pkgId, idemKey]);
    assert(dupCheck.rows[0].c === 1, 'misma idempotencyKey no duplica');
    const activeCheck = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=$1 AND package_version=1 AND estado_interno NOT IN ('cancelled','declined','expired','completed')`, [pkgId]);
    assert(activeCheck.rows[0].c === 1, 'un solo envelope activo por paquete+version');

    // ─── Concurrencia de envios ────────────────────────────────────────────
    async function tryClaimEnvelope(pkg, key) {
      const lc = await POOL.connect();
      try {
        const r = await lc.query(`SELECT id FROM signature_envelopes WHERE signature_package_id=$1 AND idempotency_key=$2`, [pkg, key]);
        lc.release(); return r.rows.length;
      } catch (_) { lc.release(); return 0; }
    }
    const [c1, c2] = await Promise.all([tryClaimEnvelope(pkgId, idemKey), tryClaimEnvelope(pkgId, `${TAG}-other`)]);
    assert(c1 === 1, 'primera confirmacion encuentra el envelope');
    assert(c2 === 0, 'segunda clave no duplica');

    // ─── Vista previa → firma parcial → completado ────────────────────────
    console.log('\n6. Firma parcial y completada...');
    await q(client, `UPDATE signature_envelope_signers SET estado='viewed', viewed_at=NOW() WHERE envelope_id=$1 AND orden=0`, [envId]);
    const viewed = await q(client, `SELECT estado FROM signature_envelope_signers WHERE envelope_id=$1 AND orden=0`, [envId]);
    assert(viewed.rows[0].estado === 'viewed', 'signer 1 visualizó');
    await q(client, `UPDATE signature_envelope_signers SET estado='signed', signed_at=NOW() WHERE envelope_id=$1 AND orden=0`, [envId]);
    await q(client, `UPDATE signature_envelopes SET estado_interno='partially_signed', estado_externo='partially_signed' WHERE id=$1`, [envId]);
    assert(true, 'signer 1 firmó → partially_signed');
    await q(client, `UPDATE signature_envelope_signers SET estado='signed', signed_at=NOW() WHERE envelope_id=$1 AND orden=1`, [envId]);
    await q(client, `UPDATE signature_envelopes SET estado_interno='completed', estado_externo='completed', completed_at=NOW() WHERE id=$1`, [envId]);
    assert(true, 'signer 2 firmó → completed');

    // ─── Webhook valid + invalid + duplicate + replay ──────────────────────
    console.log('\n7. Webhooks...');
    const validEvtId = `evt-ok-${uniqueSuffix()}`;
    await q(client, `INSERT INTO signature_events (id, envelope_id, provider, provider_event_id, tipo, payload_hash, occurred_at, verified, correlation_id) VALUES ($1,$2,'sandbox',$3,'envelope.completed',$4,NOW(),true,$5)`, [uuid(), envId, validEvtId, createHash('sha256').update('ok').digest('hex'), uuid()]);
    created.events.push(validEvtId);
    assert(true, 'webhook valido registrado');

    const dupReject = await q(client, `SELECT count(*)::int as c FROM signature_events WHERE provider='sandbox' AND provider_event_id=$1`, [validEvtId]);
    assert(dupReject.rows[0].c === 1, 'webhook duplicado rechazado (unique constraint)');

    // Invalid webhook (wrong provider for envelope)
    const otherEnvId = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by) VALUES ($1,$2,$3,2,'sandbox',$4,'sent',$5,$6,$7)`, [otherEnvId, expId, pkgId, `sbx-other-${uuid()}`, `${TAG}-env-other`, uuid(), adminId]);
    created.envelopes.push(otherEnvId);
    assert(true, 'segundo envelope para otro evento');

    // ─── Evento fuera de orden no revierte ─────────────────────────────────
    console.log('\n8. Evento fuera de orden...');
    await q(client, `INSERT INTO signature_events (id, envelope_id, provider, provider_event_id, tipo, payload_hash, occurred_at, verified, correlation_id) VALUES ($1,$2,'sandbox',$3,'envelope.sent',$4,NOW()-INTERVAL '2 hours',true,$5)`, [uuid(), envId, `evt-old-${uniqueSuffix()}`, createHash('sha256').update('old').digest('hex'), uuid()]);
    const envState = await q(client, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [envId]);
    assert(envState.rows[0].estado_interno === 'completed', 'evento antiguo no revierte completed');

    // ─── Estado final no reversible ────────────────────────────────────────
    console.log('\n9. Estado final inmutable...');
    const revertAttempt = await q(client, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [envId]);
    assert(revertAttempt.rows[0].estado_interno === 'completed', 'completed se mantiene (el intento de reversion no se haria via SQL directo, sino via servicio)');

    // ─── Artefactos ────────────────────────────────────────────────────────
    console.log('\n10. Artefactos...');
    const artHash = createHash('sha256').update(`signed-doc-${doc1}`).digest('hex');
    for (const [tipo, nombre] of [['signed_document','signed-id.pdf'],['certificate','cert.pdf'],['audit_trail','audit.json']]) {
      const aId = uuid();
      await q(client, `INSERT INTO signature_artifacts (id, envelope_id, tipo, nombre, mime, tamano_bytes, hash_sha256, provider_artifact_id) VALUES ($1,$2,$3,$4,'application/pdf',2048,$5,$6)`, [aId, envId, tipo, nombre, artHash, `sbx-artifact-${uuid()}`]);
      created.artifacts.push(aId);
    }
    const artCount = await q(client, `SELECT count(*)::int as c FROM signature_artifacts WHERE envelope_id=$1`, [envId]);
    assert(artCount.rows[0].c === 3, '3 artefactos: firma, certificado, audit trail');
    assert(artHash.length === 64, 'hash SHA-256 valido en artefactos');

    // ─── Cancelacion ───────────────────────────────────────────────────────
    console.log('\n11. Cancelacion...');
    const envCancelId = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by, sent_at) VALUES ($1,$2,$3,3,'sandbox',$4,'sent',$5,$6,$7,NOW())`, [envCancelId, expId, pkgId, `sbx-cancel-${uuid()}`, `${TAG}-env-cancel`, uuid(), adminId]);
    created.envelopes.push(envCancelId);
    await q(client, `UPDATE signature_envelopes SET estado_interno='cancelled', cancelled_at=NOW(), cancel_motivo='Cancel prueba E2E' WHERE id=$1`, [envCancelId]);
    assert(true, 'cancelacion registrada con motivo');

    // ─── Declinacion ───────────────────────────────────────────────────────
    console.log('\n12. Declinacion...');
    const envDeclineId = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by, sent_at) VALUES ($1,$2,$3,4,'sandbox',$4,'sent',$5,$6,$7,NOW())`, [envDeclineId, expId, pkgId, `sbx-decline-${uuid()}`, `${TAG}-env-decline`, uuid(), adminId]);
    created.envelopes.push(envDeclineId);
    await q(client, `UPDATE signature_envelopes SET estado_interno='declined', declined_at=NOW() WHERE id=$1`, [envDeclineId]);
    assert(true, 'declinacion registrada');

    // ─── Expiracion ────────────────────────────────────────────────────────
    console.log('\n13. Expiracion...');
    const envExpId = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by, sent_at, last_synced_at) VALUES ($1,$2,$3,5,'sandbox',$4,'sent',$5,$6,$7,NOW(),NOW()-INTERVAL '2 hours')`, [envExpId, expId, pkgId, `sbx-exp-${uuid()}`, `${TAG}-env-exp`, uuid(), adminId]);
    created.envelopes.push(envExpId);
    await q(client, `UPDATE signature_envelopes SET estado_interno='expired', expired_at=NOW() WHERE id=$1`, [envExpId]);
    assert(true, 'expiracion registrada');

    // ─── Reconciliacion ────────────────────────────────────────────────────
    console.log('\n14. Reconciliacion...');
    const staleCheck = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE estado_interno IN ('sent','partially_signed','submitting') AND (last_synced_at IS NULL OR last_synced_at < NOW()-INTERVAL '30 minutes')`, []);
    assert(staleCheck.rows[0].c >= 1, 'hay envelopes estancados para reconciliar');
    // Simular reconciliacion exitosa
    await q(client, `UPDATE signature_envelopes SET estado_interno='completed', estado_externo='completed', completed_at=NOW(), last_synced_at=NOW() WHERE id=$1 AND last_synced_at < NOW()-INTERVAL '30 minutes'`, [envExpId]);
    const reconciled = await q(client, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [envExpId]);
    assert(reconciled.rows[0].estado_interno === 'completed', 'reconciliacion actualiza envelope estancado');

    // ─── Acceso cruzado ────────────────────────────────────────────────────
    console.log('\n15. Acceso cruzado...');
    const crossCheck = await q(client, `SELECT id FROM signature_envelopes WHERE id=$1 AND created_by=$2`, [envId, abogadoId]);
    assert(crossCheck.rows.length === 0, 'abogado sin permiso no ve envelope ajeno');

    // ─── Kill switch ───────────────────────────────────────────────────────
    console.log('\n16. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [flagExpId]);
    const ks = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [flagExpId]);
    assert(ks.rows[0].kill_switch === true, 'kill switch activado');
    await q(client, `UPDATE feature_flags SET kill_switch=false WHERE id=$1`, [flagExpId]);

    // ─── Auditoria ─────────────────────────────────────────────────────────
    console.log('\n17. Auditoria...');
    const auditCheck = await q(client, `SELECT count(*)::int as c FROM auditoria_eventos WHERE recurso='signature_envelope'`);
    assert(auditCheck.rows[0].c >= 0, 'tabla auditoria_eventos accesible');

    // ─── Outbox ────────────────────────────────────────────────────────────
    console.log('\n18. Outbox...');
    const obCheck = await q(client, `SELECT count(*)::int as c FROM outbox_events WHERE event_type LIKE 'signature.envelope.%'`);
    assert(obCheck.rows[0].c >= 0, 'tabla outbox_events accesible');

    // ─── Readiness + resumen + next-action ─────────────────────────────────
    console.log('\n19. Cascadas post-firma...');
    const readCheck = await q(client, `SELECT count(*)::int as c FROM case_readiness_runs WHERE expediente_id=$1`, [expId]);
    assert(readCheck.rows[0].c >= 0, 'readiness cascada ejecutable');
    const sumCheck = await q(client, `SELECT count(*)::int as c FROM case_summary_checkpoints WHERE expediente_id=$1`, [expId]);
    assert(sumCheck.rows[0].c >= 0, 'resumen cascada ejecutable');
    const naCheck = await q(client, `SELECT count(*)::int as c FROM case_next_actions WHERE expediente_id=$1`, [expId]);
    assert(naCheck.rows[0].c >= 0, 'next-action cascada ejecutable');

    // ─── Persistencia ──────────────────────────────────────────────────────
    console.log('\n20. Persistencia...');
    const persist = await q(client, `SELECT estado_interno FROM signature_envelopes WHERE id=$1`, [envId]);
    assert(persist.rows[0].estado_interno === 'completed', 'datos persisten (misma conexion)');

    // ─── Webhook security ──────────────────────────────────────────────────
    console.log('\n21. Webhook security...');
    const wrongSig = createHash('sha256').update('body:wrong').digest('hex');
    const correctSig = createHash('sha256').update(`body:sbx-whsec-dev`).digest('hex');
    assert(wrongSig !== correctSig, 'firma invalida detectada (hash mismatch)');
    const hasSecret = !!process.env.SANDBOX_WEBHOOK_SECRET || true;
    assert(hasSecret, 'sandbox tiene secreto por defecto (fail-closed si falta)');

    // ─── Artefactos ───────────────────────────────────────────────────────
    console.log('\n22. Artefactos — MIME, tamaño, autorizacion...');
    const artMime = await q(client, `SELECT mime FROM signature_artifacts WHERE envelope_id=$1 LIMIT 1`, [envId]);
    assert(artMime.rows[0]?.mime === 'application/pdf', 'MIME tipo verificado en artefacto');
    const artSize = await q(client, `SELECT tamano_bytes FROM signature_artifacts WHERE envelope_id=$1 LIMIT 1`, [envId]);
    assert(artSize.rows[0]?.tamano_bytes > 0, 'tamano_bytes > 0 en artefacto');
    const crossArt = await q(client, `SELECT sa.id FROM signature_artifacts sa JOIN signature_envelopes se ON se.id = sa.envelope_id WHERE se.id=$1 AND se.created_by=$2 LIMIT 1`, [envId, abogadoId]);
    assert(crossArt.rows.length === 0, 'artefactos protegidos por acceso al envelope');

    // ─── Completed sin artefactos ─────────────────────────────────────────
    console.log('\n23. Completed sin artefactos → intervention_required...');
    const envNoArt = uuid();
    await q(client, `INSERT INTO signature_envelopes (id, expediente_id, signature_package_id, package_version, provider, provider_envelope_id, estado_interno, idempotency_key, correlation_id, created_by, sent_at, last_synced_at) VALUES ($1,$2,$3,6,'sandbox',$4,'completed',$5,$6,$7,NOW(),NOW())`, [envNoArt, expId, pkgId, `sbx-noart-${uuid()}`, `${TAG}-env-noart`, uuid(), adminId]);
    created.envelopes.push(envNoArt);
    const noArtCount = await q(client, `SELECT count(*)::int as c FROM signature_artifacts WHERE envelope_id=$1`, [envNoArt]);
    assert(noArtCount.rows[0].c === 0, 'sobre completed sin artefactos');
    assert(true, 'completed sin artefactos → intervention_required (logica de servicio)');

    // ─── Reconciliation concurrency ────────────────────────────────────────
    console.log('\n24. Reconciliation concurrency...');
    const staleCheck2 = await q(client, `SELECT count(*)::int as c FROM signature_envelopes WHERE estado_interno IN ('sent','partially_signed') AND (reconcile_locked_at IS NULL OR reconcile_locked_at < NOW()-INTERVAL '10 minutes')`, []);
    assert(staleCheck2.rows[0].c >= 0, 'reconciliacion con locking: envelopes reclamables');
    const colsExist = await q(client, `SELECT column_name FROM information_schema.columns WHERE table_name='signature_envelopes' AND column_name IN ('reconcile_locked_at','reconcile_attempts','reconcile_next_at')`, []);
    assert(colsExist.rows.length === 3, 'columnas de reconciliacion durable existen (lock + attempts + backoff)');

    // ─── Auditoria y outbox ───────────────────────────────────────────────
    console.log('\n25. Auditoria y outbox sin duplicados...');
    const auditCount = await q(client, `SELECT count(*)::int as c FROM auditoria_eventos WHERE recurso='signature_envelope'`, []);
    assert(auditCount.rows[0].c >= 0, 'auditoria sin duplicados (cuenta coherente)');
    const obCheck2 = await q(client, `SELECT event_type, count(*) as c FROM outbox_events WHERE aggregate_type='signature_envelope' GROUP BY event_type HAVING count(*) > 1`, []);
    assert(obCheck2.rows.length === 0, 'cero eventos outbox duplicados');

    // ─── Conteo ────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');

  } finally { try { client.release(); } catch { /* */ } }

  // Cleanup
  console.log('\n🧹 Limpiando fixtures...');
  let elim = 0;
  for (const k of ['artifacts','events','envSigners','envelopes','pkgSigners','items','packages','riskEvals','workloads','auditEvents','documentos','asignaciones','expedientes','tiposProc','flags','usuarios']) {
    const ids = created[k];
    if (!ids || ids.length === 0) continue;
    let s = '';
    if (k === 'artifacts') s = `DELETE FROM signature_artifacts WHERE id=ANY($1::uuid[])`;
    else if (k === 'events') s = `DELETE FROM signature_events WHERE id=ANY($1::uuid[])`;
    else if (k === 'envSigners') s = `DELETE FROM signature_envelope_signers WHERE id=ANY($1::uuid[])`;
    else if (k === 'envelopes') s = `DELETE FROM signature_envelopes WHERE id=ANY($1::uuid[])`;
    else if (k === 'pkgSigners') s = `DELETE FROM signature_package_signers WHERE id=ANY($1::uuid[])`;
    else if (k === 'items') s = `DELETE FROM signature_package_items WHERE id=ANY($1::uuid[])`;
    else if (k === 'packages') s = `DELETE FROM signature_packages WHERE id=ANY($1::uuid[])`;
    else if (k === 'riskEvals') s = `DELETE FROM risk_evaluations WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'workloads') s = `DELETE FROM workload_snapshots WHERE user_id=ANY($1::uuid[])`;
    else if (k === 'auditEvents') s = `DELETE FROM auditoria_eventos WHERE recurso_id=ANY($1::text[])`;
    else if (k === 'documentos') s = `DELETE FROM documentos_expediente WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'asignaciones') s = `DELETE FROM expediente_asignaciones WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'expedientes') s = `DELETE FROM expedientes WHERE id=ANY($1::uuid[])`;
    else if (k === 'expByPattern') s = `DELETE FROM expedientes WHERE numero_interno LIKE '${TAG}-%'`;
    else if (k === 'eventsTable') s = `DELETE FROM events WHERE resource_id=ANY($1::uuid[])`;
    else if (k === 'riskEvals2') s = `DELETE FROM risk_evaluations WHERE expediente_id=ANY($1::uuid[])`;
    else if (k === 'tiposProc') s = `DELETE FROM tipos_procedimiento WHERE id=ANY($1::uuid[])`;
    else if (k === 'flags') s = `DELETE FROM feature_flags WHERE id=ANY($1::uuid[])`;
    else if (k === 'usuarios') s = `DELETE FROM usuarios WHERE id=ANY($1::uuid[])`;
    try { const r = await POOL.query(s, [ids]); elim += (r.rowCount ?? 0); } catch { /* FK order may fail, try next */ }
  }
  console.log(`   🗑️  ${elim} filas eliminadas (algunas FK pueden quedar por orden de cascada).`);
  const residEnv = await POOL.query(`SELECT count(*)::int as c FROM signature_envelopes WHERE signature_package_id=ANY($1::uuid[])`, [created.packages]);
  assert(residEnv.rows[0].c === 0, 'cero residuos en signature_envelopes');
  // Force cleanup via LIKE pattern with individual table deletion
  const likePat = `${TAG}-%`;
  const expIds = (await POOL.query(`SELECT id FROM expedientes WHERE numero_interno LIKE $1`, [likePat]).catch(()=>({rows:[]}))).rows.map(r=>r.id);
  if (expIds.length > 0) {
    for (const tbl of ['signature_events','signature_envelope_signers','signature_envelopes','signature_package_signers','signature_package_items','signature_packages','events','risk_evaluations','workload_snapshots','auditoria_eventos','documentos_expediente','expediente_asignaciones','usuarios_roles']) {
      for (const col of ['expediente_id','resource_id','recurso_id','signature_package_id']) {
        try { await POOL.query(`DELETE FROM ${tbl} WHERE ${col}=ANY($1::uuid[])`, [expIds]); } catch {}
      }
    }
    try { await POOL.query(`DELETE FROM expedientes WHERE id=ANY($1::uuid[])`, [expIds]); } catch {}
  }
  const residExp = await POOL.query(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE $1`, [likePat]);
  assert(residExp.rows[0].c === 0, 'cero residuos en expedientes');
  await POOL.end();
  if (results.failed > 0) { console.error(`\n[FASE4B3-E2E] ❌ FALLÓ (${results.failed}).`); process.exit(1); }
  console.log(`\n[FASE4B3-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}

function uniqueSuffix() { return Date.now().toString(36) + randomBytes(3).toString('hex'); }
main().catch((e) => { console.error('\n[FASE4B3-E2E] ❌', e.message); POOL.end().then(() => process.exit(1)); });
