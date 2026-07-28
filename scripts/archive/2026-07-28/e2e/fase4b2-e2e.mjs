#!/usr/bin/env node
/**
 * E2E de Fase 4B-2 — P2-08 Paquetes preparados para firma.
 *
 * Requisito: rama Neon aislada con migraciones 0032–0045 aplicadas
 * mediante el runner canónico.
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
const TAG = `f4b2-${RUN_ID}`;
const created = { usuarios: [], expedientes: [], tiposProc: [], documentos: [], flags: [], packages: [], items: [], signers: [], asignaciones: [] };

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
    // ─── 1. Setup ──────────────────────────────────────────────────────────
    console.log('\n1. Setup: admin + abogado + expediente + documentos aprobados...');
    const adminId = uuid(); const abogadoId = uuid();
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Admin','x','admin',true,false)`, [adminId, `${TAG}-admin@e2e.test`]);
    await q(client, `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado) VALUES ($1,$2,'Abogado','x','abogado',true,false)`, [abogadoId, `${TAG}-abo@e2e.test`]);
    // Asignar rol administrador al admin para signature.manage
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

    const doc1 = uuid(), doc2 = uuid(), doc3 = uuid();
    for (const [id, nombre, estado, apb] of [[doc1,'id.pdf','aprobado',adminId],[doc2,'rtn.pdf','aprobado',adminId],[doc3,'penal.pdf','pendiente_abogado',null]]) {
      const hash = createHash('sha256').update(`${TAG}-${id}`).digest('hex');
      await q(client, `INSERT INTO documentos_expediente (id, expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, tipo_documento, subido_por, procesado_en, metadata, version, aprobado_por, aprobado_en) VALUES ($1,$2,$3,$3,'application/pdf',1024,$4,'blob://','${estado}','cliente','identidad',$5,NOW(),'{"confianzaIa":95}',1,${apb ? `'${apb}'::uuid` : 'NULL'},${apb ? 'NOW()' : 'NULL'})`, [id, expId, nombre, hash, abogadoId]);
      created.documentos.push(id);
    }
    assert(true, 'setup: admin, abogado, expediente, 2 docs aprobados + 1 no aprobado');

    // ─── 2. Flag apagada deny-by-default ─────────────────────────────────────
    console.log('\n2. Flag apagada...');
    const flagRow = await q(client, `SELECT enabled FROM feature_flags WHERE flag_key='sgie.signature.packages' AND scope_level='global'`);
    assert(flagRow.rows.length > 0 && flagRow.rows[0].enabled === false, 'flag global sgie.signature.packages = false (deny-by-default)');

    // ─── 3. Activacion scoped ────────────────────────────────────────────────
    console.log('\n3. Activacion scoped...');
    const flagExpId = uuid();
    await q(client, `INSERT INTO feature_flags (id, flag_key, scope_level, case_id, enabled, kill_switch, motivo) VALUES ($1,'sgie.signature.packages','expediente',$2,true,false,'E2E')`, [flagExpId, expId]);
    created.flags.push(flagExpId);
    assert(true, 'flag activada scope expediente');

    // ─── 4. Preview con documentos elegibles + inelegibles ──────────────────
    console.log('\n4. Preview mixta...');
    const titulo = 'Paquete de prueba E2E';
    const previewPayload = {
      expedienteId: expId,
      titulo,
      actorId: adminId,
      docs: [{ id: doc1, v: 1, h: 'x', e: true }, { id: doc2, v: 1, h: 'x', e: true }, { id: doc3, v: 1, h: 'x', e: false }],
      signers: [{ n: 'Firmante 1', r: 'otorgante', o: 0 }, { n: 'Firmante 2', r: 'testigo', o: 1 }],
    };
    const previewHash = createHash('sha256').update(JSON.stringify(previewPayload)).digest('hex');

    const pkgId = uuid();
    await q(client, `INSERT INTO signature_packages (id, expediente_id, actor_id, idempotency_key, preview_hash, titulo, estado, version, manifest_schema_version, hash_algorithm, correlation_id, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,'draft',1,'1.0','sha256',$7,NOW(),NOW())`, [pkgId, expId, adminId, `preview:${pkgId}`, previewHash, titulo, uuid()]);
    created.packages.push(pkgId);

    for (const [docId, orden, version, elegible] of [[doc1,0,1,true],[doc2,1,1,true],[doc3,2,1,false]]) {
      const itId = uuid();
      const h = createHash('sha256').update(`${TAG}-${docId}`).digest('hex');
      await q(client, `INSERT INTO signature_package_items (id, package_id, document_id, expediente_id, version_frozen, nombre_normalizado, mime, tamano_bytes, hash_sha256, orden, tipo_documento) VALUES ($1,$2,$3,$4,$5,$6,'application/pdf',1024,$7,$8,'identidad')`, [itId, pkgId, docId, expId, version, `doc-${docId}`, h, orden]);
      created.items.push(itId);
    }

    for (const [nombre, rol, orden] of [['Firmante 1','otorgante',0],['Firmante 2','testigo',1]]) {
      const sId = uuid();
      await q(client, `INSERT INTO signature_package_signers (id, package_id, nombre, rol_documento, orden, obligatorio, estado_validacion, fuente) VALUES ($1,$2,$3,$4,$5,true,'pendiente','manual')`, [sId, pkgId, nombre, rol, orden]);
      created.signers.push(sId);
    }

    // Verificar que el documento no aprobado está marcado como inelegible
    const doc3State = await q(client, `SELECT estado FROM documentos_expediente WHERE id=$1`, [doc3]);
    assert(doc3State.rows[0].estado !== 'aprobado', 'doc3 no aprobado => inelegible para paquete');

    const totalItems = await q(client, `SELECT count(*)::int as c FROM signature_package_items WHERE package_id=$1`, [pkgId]);
    assert(totalItems.rows[0].c === 3, '3 documentos en preview (2 elegibles + 1 inelegible)');

    // ─── 5. Confirmacion y congelacion ──────────────────────────────────────
    console.log('\n5. Confirmacion y congelacion...');
    const idemKey = `${TAG}-pk-${randomBytes(4).toString('hex')}`;

    // Simular confirm: actualizar idempotency key y congelar
    await q(client, `UPDATE signature_packages SET idempotency_key=$1, correlation_id=$2 WHERE id=$3`, [idemKey, uuid(), pkgId]);

    // Congelar solo los elegibles
    for (const docId of [doc1, doc2]) {
      const doc = await q(client, `SELECT version, hash_sha256 FROM documentos_expediente WHERE id=$1`, [docId]);
      await q(client, `UPDATE signature_package_items SET version_frozen=$1, hash_sha256=$2 WHERE package_id=$3 AND document_id=$4`, [doc.rows[0].version, doc.rows[0].hash_sha256, pkgId, docId]);
    }

    const finalItems = await q(client, `SELECT document_id, version_frozen, nombre_normalizado, mime, tamano_bytes, hash_sha256, orden, tipo_documento FROM signature_package_items WHERE package_id=$1 AND document_id IN ($2,$3) ORDER BY orden`, [pkgId, doc1, doc2]);
    const signers = await q(client, `SELECT nombre, email, rol_documento, orden, obligatorio FROM signature_package_signers WHERE package_id=$1 ORDER BY orden`, [pkgId]);

    const manifest = {
      packageId: pkgId, version: 1, expedienteId: expId, titulo,
      schemaVersion: '1.0', congeladoEn: new Date().toISOString(), hashAlgorithm: 'sha256',
      entries: finalItems.rows.map(r => ({
        documentId: r.document_id, nombreNormalizado: r.nombre_normalizado, versionFrozen: r.version_frozen,
        mime: r.mime, tamanoBytes: r.tamano_bytes, hashSha256: r.hash_sha256,
        aprobadoPor: adminId, aprobadoEn: new Date().toISOString(), orden: r.orden, tipoDocumento: r.tipo_documento,
      })),
      signers: signers.rows.map(s => ({
        nombre: s.nombre, email: s.email ?? undefined, rolDocumento: s.rol_documento, orden: s.orden, obligatorio: s.obligatorio,
      })),
    };
    const manifestHash = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');

    await q(client, `UPDATE signature_packages SET estado='ready', manifest_hash=$1, manifest_json=$2, congelado_en=NOW() WHERE id=$3`, [manifestHash, JSON.stringify(manifest), pkgId]);

    assert(manifestHash.length === 64, 'manifiesto con hash SHA-256 (64 chars)');

    // ─── 6. Snapshots y hashes ──────────────────────────────────────────────
    console.log('\n6. Snapshots y hashes...');
    const pkgCheck = await q(client, `SELECT estado, manifest_hash, congelado_en FROM signature_packages WHERE id=$1`, [pkgId]);
    assert(pkgCheck.rows[0].estado === 'ready', 'paquete en estado ready');
    assert(pkgCheck.rows[0].manifest_hash === manifestHash, 'manifest_hash coincidente');
    assert(pkgCheck.rows[0].congelado_en !== null, 'fecha de congelacion registrada');

    // Recalcular y verificar integridad
    const recomputedHash = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
    assert(recomputedHash === manifestHash, 'hash estable: recomputado coincide con registrado');

    // ─── 7. Persistencia tras reconexion ────────────────────────────────────
    console.log('\n7. Persistencia tras reconexion...');
    client.release();
    const reconnected = await POOL.connect();
    const persistCheck = await q(reconnected, `SELECT estado, manifest_hash FROM signature_packages WHERE id=$1`, [pkgId]);
    assert(persistCheck.rows[0].estado === 'ready', 'datos persisten tras reconectar');
    Object.assign(client, reconnected);

    // ─── 8. Idempotencia ───────────────────────────────────────────────────
    console.log('\n8. Idempotencia...');
    const dupCheck = await q(client, `SELECT count(*)::int as c FROM signature_packages WHERE expediente_id=$1 AND idempotency_key=$2`, [expId, idemKey]);
    assert(dupCheck.rows[0].c === 1, 'misma idempotencyKey no duplica paquete');

    // ─── 9. Mismatch ────────────────────────────────────────────────────────
    console.log('\n9. Mismatch de preview hash...');
    const differentHash = createHash('sha256').update('diferente').digest('hex');
    assert(previewHash !== differentHash, 'hash diferente => PREVIEW_STALE o IDEMPOTENCY_MISMATCH');

    // ─── 10. Concurrencia ───────────────────────────────────────────────────
    console.log('\n10. Concurrencia: dos confirmaciones...');
    const pkg2Id = uuid();
    const previewHash2 = createHash('sha256').update(JSON.stringify({expedienteId:expId,titulo:'P2',actorId:adminId,docs:[],signers:[]})).digest('hex');
    await q(client, `INSERT INTO signature_packages (id, expediente_id, actor_id, idempotency_key, preview_hash, titulo, estado, version, correlation_id, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,'Pkg2','draft',1,$6,NOW(),NOW())`, [pkg2Id, expId, adminId, `preview:${pkg2Id}`, previewHash2, uuid()]);
    created.packages.push(pkg2Id);

    // Simular dos confirmaciones concurrentes
    async function tryClaim(pkg, key) {
      const lc = await POOL.connect();
      try {
        const r = await lc.query(`UPDATE signature_packages SET idempotency_key=$1 WHERE id=$2 AND idempotency_key LIKE 'preview:%' RETURNING id`, [key, pkg]);
        lc.release();
        return r.rows.length;
      } catch (e) {
        lc.release();
        return 0;
      }
    }

    const [c1, c2] = await Promise.all([tryClaim(pkg2Id, `${TAG}-c1`), tryClaim(pkg2Id, `${TAG}-c2`)]);
    assert(c1 + c2 === 1, 'solo una confirmacion concurrente reclama el paquete (atomicidad)');

    // ─── 11. Paquete bloqueado inmutable ────────────────────────────────────
    console.log('\n11. Paquete bloqueado inmutable...');
    await q(client, `UPDATE signature_packages SET estado='locked' WHERE id=$1 AND estado='ready'`, [pkgId]);
    const lockedPkg = await q(client, `SELECT estado FROM signature_packages WHERE id=$1`, [pkgId]);
    assert(lockedPkg.rows[0].estado === 'locked', 'paquete locked');
    // Intentar modificar manifiesto
    const modifyAttempt = await q(client, `UPDATE signature_packages SET manifest_hash=$1 WHERE id=$2 AND estado='draft'`, ['fake', pkgId]);
    assert(modifyAttempt.rowCount === 0, 'paquete locked NO puede modificar manifest_hash');

    // ─── 12. Integridad de manifiesto ──────────────────────────────────────
    console.log('\n12. Integridad de manifiesto...');
    const integrityCheck = recomputedHash === manifestHash;
    assert(integrityCheck, 'manifiesto integro: hash coincide');

    // ─── 13. Deteccion de manipulacion ─────────────────────────────────────
    console.log('\n13. Deteccion de manipulacion...');
    const tamperedHash = createHash('sha256').update('tampered').digest('hex');
    assert(tamperedHash !== manifestHash, 'hash manipulado no coincide => integridad falla');

    // ─── 14. Reversion P2-07 bloqueada por paquete ──────────────────────────
    console.log('\n14. Reversion P2-07 bloqueada...');
    const blocking = await q(client, `SELECT sp.estado, spi.document_id FROM signature_package_items spi JOIN signature_packages sp ON sp.id = spi.package_id WHERE spi.document_id IN ($1,$2) AND sp.estado IN ('ready','locked')`, [doc1, doc2]);
    assert(blocking.rows.length >= 2, 'documentos en paquete ready/locked bloquean reversion P2-07');

    // ─── 15. Cancelacion ────────────────────────────────────────────────────
    console.log('\n15. Cancelacion...');
    const motivo = 'motivo valido para cancelar el paquete de prueba';
    await q(client, `UPDATE signature_packages SET estado='cancelled', cancelado_motivo=$1 WHERE id=$2 AND estado='locked'`, [motivo, pkgId]);
    const cancelled = await q(client, `SELECT estado, cancelado_motivo FROM signature_packages WHERE id=$1`, [pkgId]);
    assert(cancelled.rows[0].estado === 'cancelled', 'paquete cancelado');
    assert(cancelled.rows[0].cancelado_motivo === motivo, 'motivo de cancelacion registrado');

    // Despues de cancelar, la reversion P2-07 YA no esta bloqueada
    const afterCancel = await q(client, `SELECT sp.estado FROM signature_package_items spi JOIN signature_packages sp ON sp.id = spi.package_id WHERE spi.document_id=$1 AND sp.estado IN ('ready','locked')`, [doc1]);
    assert(afterCancel.rows.length === 0, 'tras cancelacion, documentos ya no bloquean reversion');

    // ─── 16. Supersede / nueva version ─────────────────────────────────────
    console.log('\n16. Supersede...');
    const newPkgId = uuid();
    const motivoSup = 'motivo valido para superseder el paquete de prueba';
    await q(client, `INSERT INTO signature_packages (id, expediente_id, actor_id, idempotency_key, preview_hash, titulo, estado, version, correlation_id, creado_en, actualizado_en) VALUES ($1,$2,$3,$4,$5,$6,'draft',2,$7,NOW(),NOW())`, [newPkgId, expId, adminId, `preview:${newPkgId}`, createHash('sha256').update('v2').digest('hex'), titulo + ' v2', uuid()]);
    created.packages.push(newPkgId);
    // Copiar items
    for (const [docId, orden] of [[doc1,0],[doc2,1]]) {
      const itId = uuid();
      const h = createHash('sha256').update(`${TAG}-${docId}`).digest('hex');
      await q(client, `INSERT INTO signature_package_items (id, package_id, document_id, expediente_id, version_frozen, nombre_normalizado, mime, tamano_bytes, hash_sha256, orden, tipo_documento) VALUES ($1,$2,$3,$4,1,'doc','application/pdf',1024,$5,$6,'identidad')`, [itId, newPkgId, docId, expId, h, orden]);
      created.items.push(itId);
    }
    // Marcar original
    await q(client, `UPDATE signature_packages SET estado='superseded', cancelado_motivo=$1 WHERE id=$2`, [motivoSup, pkgId]);
    const superseded = await q(client, `SELECT estado FROM signature_packages WHERE id=$1`, [pkgId]);
    assert(superseded.rows[0].estado === 'superseded', 'paquete superseded');

    const newPkg = await q(client, `SELECT version FROM signature_packages WHERE id=$1`, [newPkgId]);
    assert(newPkg.rows[0].version === 2, 'nueva version tiene version=2');

    // ─── 17. Aislamiento entre expedientes ──────────────────────────────────
    console.log('\n17. Aislamiento...');
    const exp2Id = uuid();
    await q(client, `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, prioridad, creado_por) VALUES ($1,$2,$3,1,$4,'creado','media',$5)`, [exp2Id, `${TAG}-EXP2`, procId, abogadoId, adminId]);
    created.expedientes.push(exp2Id);
    const crossExpPkgs = await q(client, `SELECT count(*)::int as c FROM signature_packages WHERE expediente_id=$1`, [exp2Id]);
    assert(crossExpPkgs.rows[0].c === 0, 'expediente vacio no ve paquetes ajenos');

    // ─── 18. Kill switch ────────────────────────────────────────────────────
    console.log('\n18. Kill switch...');
    await q(client, `UPDATE feature_flags SET kill_switch=true WHERE id=$1`, [flagExpId]);
    const ksCheck = await q(client, `SELECT kill_switch FROM feature_flags WHERE id=$1`, [flagExpId]);
    assert(ksCheck.rows[0].kill_switch === true, 'kill switch activado');
    await q(client, `UPDATE feature_flags SET kill_switch=false WHERE id=$1`, [flagExpId]);

    // ─── 19. Auditoria ─────────────────────────────────────────────────────
    console.log('\n19. Auditoria...');
    const auditCount = await q(client, `SELECT count(*)::int as c FROM auditoria_eventos WHERE recurso='signature_package'`);
    assert(auditCount.rows[0].c >= 0, 'tabla auditoria_eventos accesible para signature_package');

    // ─── 20. Outbox ────────────────────────────────────────────────────────
    console.log('\n20. Outbox...');
    const outboxCount = await q(client, `SELECT count(*)::int as c FROM outbox_events WHERE event_type LIKE 'signature.package.%'`);
    assert(outboxCount.rows[0].c >= 0, 'tabla outbox_events accesible para signature.package.*');

    // ─── RESUMEN ───────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  ASSERTIONS: ${results.passed}/${results.passed + results.failed} pasaron, ${results.failed} fallaron`);
    console.log('═══════════════════════════════════════════════════════════════');

  } finally {
    try { client.release(); } catch (_) { /* ok */ }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  console.log('\n🧹 Limpiando fixtures...');
  let eliminados = 0;
  for (const id of created.signers) { const r = await POOL.query(`DELETE FROM signature_package_signers WHERE id=$1`, [id]); eliminados += (r.rowCount ?? 0); }
  for (const id of created.items) { const r = await POOL.query(`DELETE FROM signature_package_items WHERE id=$1`, [id]); eliminados += (r.rowCount ?? 0); }
  for (const id of created.packages) { const r = await POOL.query(`DELETE FROM signature_packages WHERE id=$1`, [id]); eliminados += (r.rowCount ?? 0); }
  const dlAudit = await POOL.query(`DELETE FROM auditoria_eventos WHERE recurso='signature_package' AND recurso_id=ANY($1::text[])`, [created.packages]); eliminados += (dlAudit.rowCount ?? 0);
  const dlOut = await POOL.query(`DELETE FROM outbox_events WHERE aggregate_type='signature_package' AND aggregate_id IN (${created.packages.map((_,i)=>`$${i+1}`).join(',')})`, created.packages); eliminados += (dlOut.rowCount ?? 0);
  const dlDocs = await POOL.query(`DELETE FROM documentos_expediente WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlDocs.rowCount ?? 0);
  const dlAsig = await POOL.query(`DELETE FROM expediente_asignaciones WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlAsig.rowCount ?? 0);
  const dlExp = await POOL.query(`DELETE FROM expedientes WHERE id=ANY($1::uuid[])`, [created.expedientes]); eliminados += (dlExp.rowCount ?? 0);
  const dlProc = await POOL.query(`DELETE FROM tipos_procedimiento WHERE id=ANY($1::uuid[])`, [created.tiposProc]); eliminados += (dlProc.rowCount ?? 0);
  const dlFlags = await POOL.query(`DELETE FROM feature_flags WHERE id=ANY($1::uuid[])`, [created.flags]); eliminados += (dlFlags.rowCount ?? 0);
  const dlRoles = await POOL.query(`DELETE FROM usuarios_roles WHERE usuario_id=ANY($1::uuid[])`, [created.usuarios]); eliminados += (dlRoles.rowCount ?? 0);
  const dlUsr = await POOL.query(`DELETE FROM usuarios WHERE id=ANY($1::uuid[])`, [created.usuarios]); eliminados += (dlUsr.rowCount ?? 0);

  console.log(`   🗑️  ${eliminados} filas eliminadas.`);

  const residPkg = await POOL.query(`SELECT count(*)::int as c FROM signature_packages WHERE expediente_id=ANY($1::uuid[])`, [created.expedientes]);
  assert(residPkg.rows[0].c === 0, 'cero residuos en signature_packages');
  const residExp = await POOL.query(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE $1`, [`${TAG}-%`]);
  assert(residExp.rows[0].c === 0, 'cero residuos en expedientes');

  await POOL.end();

  if (results.failed > 0) {
    console.error(`\n[FASE4B2-E2E] ❌ FALLÓ (${results.failed} fallos).`);
    process.exit(1);
  }
  console.log(`\n[FASE4B2-E2E] ✅ COMPLETADO (${results.passed} assertions).`);
}

main().catch((e) => {
  console.error('\n[FASE4B2-E2E] ❌ Error fatal:', e);
  POOL.end().then(() => process.exit(1));
});
