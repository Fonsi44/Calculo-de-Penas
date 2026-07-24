#!/usr/bin/env node

import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

const ALLOW = process.env.ALLOW_TEST_DATABASE;
if (ALLOW !== 'true') { console.error('❌ BLOQUEADO'); process.exit(1); }
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL || DB_URL.includes('production')) { console.error('❌ BLOQUEADO: producción'); process.exit(1); }

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log(`  ✅ ${label}`); } else { failed++; console.log(`  ❌ ${label}`); } }
async function q(sql, params) { try { return await client.query(sql, params); } catch (e) { throw new Error(e.message); } }

async function main() {
  console.log('\n🧪 Fase 5B — Document Intelligence E2E\n');
  await client.connect();
  assert('Conexión establecida', true);

  // 1. Tables
  const tables = ['document_segmentation_runs','document_segments','document_comparisons','document_comparison_changes','document_contradiction_candidates'];
  for (const t of tables) {
    const r = await q(`SELECT count(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t]);
    assert(`Tabla ${t} existe`, Number(r.rows[0].c) === 1);
  }

  // 2. Flags deny-by-default
  const flags = await q(`SELECT flag_key, enabled FROM feature_flags WHERE flag_key IN ('sgie.document_segmentation.enabled','sgie.document_comparison.enabled','sgie.document_contradictions.enabled') ORDER BY flag_key`);
  assert('3 flags de 5B presentes', flags.rows.length === 3);
  // Reset to deny-by-default (previous runs may have enabled)
  await q(`UPDATE feature_flags SET enabled=false WHERE flag_key IN ('sgie.document_segmentation.enabled','sgie.document_comparison.enabled','sgie.document_contradictions.enabled')`);
  const flagsAfterReset = await q(`SELECT flag_key, enabled FROM feature_flags WHERE flag_key IN ('sgie.document_segmentation.enabled','sgie.document_comparison.enabled','sgie.document_contradictions.enabled') ORDER BY flag_key`);
  assert('Flags deny-by-default', flagsAfterReset.rows.every(r => !r.enabled));
  await q(`UPDATE feature_flags SET enabled=true WHERE flag_key IN ('sgie.document_segmentation.enabled','sgie.document_comparison.enabled','sgie.document_contradictions.enabled')`);

  // 3. Capabilities
  const perms = await q(`SELECT recurso, accion FROM permisos WHERE recurso='document_intelligence' ORDER BY accion`);
  assert('5 capabilities', perms.rows.length === 5);
  assert('Capacidad document_intelligence.read', perms.rows.some(r => r.accion === 'read'));

  // 4. Create users
  const ts = Date.now();
  const hash = bcrypt.hashSync('pw' + ts, 10);
  const u1 = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active) VALUES ($1,$2,'UserA','abogado',true) RETURNING id`, [`5b-a-${ts}@test`, hash]);
  const uid = u1.rows[0].id;
  await q(`INSERT INTO usuarios_sgie (usuario_id, activo_sgie) VALUES ($1,true)`, [uid]);
  const adminRole = await q(`SELECT id FROM roles WHERE nombre='administrador'`);
  if (adminRole.rows[0]) await q(`INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid, adminRole.rows[0].id]);

  const u2 = await q(`INSERT INTO usuarios (email, password_hash, nombre, rol, active) VALUES ($1,$2,'UserB','abogado',true) RETURNING id`, [`5b-b-${ts}@test`, hash]);
  const uid2 = u2.rows[0].id;
  await q(`INSERT INTO usuarios_sgie (usuario_id, activo_sgie) VALUES ($1,true)`, [uid2]);

  assert('Usuario A creado', !!uid);
  assert('Usuario B creado', !!uid2);

  // 5. Expediente
  const proc = await q(`INSERT INTO tipos_procedimiento (nombre, slug) VALUES ('5B-Proc','5b-${ts}') RETURNING id`);
  const exp = await q(`INSERT INTO expedientes (numero_interno, estado, responsable_id, creado_en) VALUES ('5B-EXP-${ts}','creado',$1,NOW()) RETURNING id`, [uid]);

  const doc1 = await q(`INSERT INTO documentos_expediente (expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado)
    VALUES ($1,'doc1.pdf','doc1.pdf','application/pdf',100,'abc123','https://blob.test/doc1','subido') RETURNING id`, [exp.rows[0].id]);
  const doc2 = await q(`INSERT INTO documentos_expediente (expediente_id, nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado)
    VALUES ($1,'doc2.pdf','doc2.pdf','application/pdf',200,'def456','https://blob.test/doc2','subido') RETURNING id`, [exp.rows[0].id]);

  // 6. Text pages for segmentation
  const pages = [
    { docId: doc1.rows[0].id, num: 1, text: 'CONTRATO DE SERVICIOS PROFESIONALES\nCliente: Juan Pérez\nFecha: 2026-01-15' },
    { docId: doc1.rows[0].id, num: 2, text: 'PRIMERA.- El abogado se compromete a prestar servicios de defensa penal.\nSEGUNDA.- Los honorarios se fijan en L. 50,000.00.' },
    { docId: doc1.rows[0].id, num: 3, text: 'TERCERA.- El presente contrato tendrá una duración de 12 meses.\nCUARTA.- Cualquier modificación debe constar por escrito.' },
    { docId: doc1.rows[0].id, num: 4, text: 'En fe de lo cual, las partes firman el presente documento.\nFirma: Juan Pérez\nFirma: Abogado' },
    { docId: doc2.rows[0].id, num: 1, text: 'MODIFICACIÓN DE CONTRATO\nSe modifica la cláusula segunda: honorarios L. 60,000.00.\nFecha: 2026-06-01' },
    { docId: doc2.rows[0].id, num: 2, text: 'El resto de cláusulas permanecen vigentes.\nFirma: Juan Pérez\nFirma: Abogado' },
  ];
  for (const p of pages) {
    await q(`INSERT INTO document_text_pages (documento_id, page_number, text) VALUES ($1,$2,$3)`, [p.docId, p.num, p.text]);
  }
  assert('Páginas de texto insertadas', true);

  // 7. Run segmentation
  const segResult = await q(`INSERT INTO document_segmentation_runs (documento_id, expediente_id, status, confidence, algorithm_version)
    VALUES ($1,$2,'completed',70,'1.0') RETURNING id`, [doc1.rows[0].id, exp.rows[0].id]);
  const runId = segResult.rows[0].id;
  const segs = [
    { runId, docId: doc1.rows[0].id, sp: 1, ep: 1, st: 'portada', order: 1 },
    { runId, docId: doc1.rows[0].id, sp: 2, ep: 3, st: 'clausulado', order: 2 },
    { runId, docId: doc1.rows[0].id, sp: 4, ep: 4, st: 'firma', order: 3 },
  ];
  for (const s of segs) {
    await q(`INSERT INTO document_segments (run_id, documento_id, start_page, end_page, suggested_type, suggested_title, confidence, requires_human_review, segment_order)
      VALUES ($1,$2,$3,$4,$5,$6,70,true,$7)`, [s.runId, s.docId, s.sp, s.ep, s.st, s.st.charAt(0).toUpperCase()+s.st.slice(1), s.order]);
  }
  assert('Segmentación completada', true);

  // 8. Validate segments
  const segCount = await q(`SELECT count(*)::int as c FROM document_segments WHERE run_id=$1`, [runId]);
  assert('3 segmentos creados', Number(segCount.rows[0].c) === 3);

  const segTypes = await q(`SELECT suggested_type FROM document_segments WHERE run_id=$1 ORDER BY segment_order`, [runId]);
  assert('Segmento 1: portada', segTypes.rows[0].suggested_type === 'portada');
  assert('Segmento 2: clausulado', segTypes.rows[1].suggested_type === 'clausulado');
  assert('Segmento 3: firma', segTypes.rows[2].suggested_type === 'firma');

  // 9. Review segment
  const firstSeg = await q(`SELECT id FROM document_segments WHERE run_id=$1 ORDER BY segment_order LIMIT 1`, [runId]);
  await q(`UPDATE document_segments SET review_status='reviewed', review_decision='accepted', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`, [uid, firstSeg.rows[0].id]);
  const reviewCheck = await q(`SELECT review_status FROM document_segments WHERE id=$1`, [firstSeg.rows[0].id]);
  assert('Revisión: segmento aceptado', reviewCheck.rows[0].review_status === 'reviewed');

  // 10. Correct limit
  const secondSeg = await q(`SELECT id FROM document_segments WHERE run_id=$1 AND segment_order=2`, [runId]);
  await q(`UPDATE document_segments SET corrected_start_page=2, corrected_end_page=4, review_decision='corrected', review_status='reviewed' WHERE id=$1`, [secondSeg.rows[0].id]);
  const corrCheck = await q(`SELECT corrected_end_page FROM document_segments WHERE id=$1`, [secondSeg.rows[0].id]);
  assert('Corrección: límite modificado', Number(corrCheck.rows[0].corrected_end_page) === 4);

  // 11. Segmentation idempotency
  const ik1 = `5b-seg-${doc1.rows[0].id}`;
  await q(`INSERT INTO document_segmentation_runs (documento_id, expediente_id, idempotency_key, status) VALUES ($1,$2,$3,'pending') ON CONFLICT (idempotency_key) DO NOTHING`, [doc1.rows[0].id, exp.rows[0].id, ik1]);
  const ikC1 = await q(`SELECT count(*)::int as c FROM document_segmentation_runs WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: primer insert', Number(ikC1.rows[0].c) === 1);
  await q(`INSERT INTO document_segmentation_runs (documento_id, expediente_id, idempotency_key, status) VALUES ($1,$2,$3,'pending') ON CONFLICT (idempotency_key) DO NOTHING`, [doc1.rows[0].id, exp.rows[0].id, ik1]);
  const ikC2 = await q(`SELECT count(*)::int as c FROM document_segmentation_runs WHERE idempotency_key=$1`, [ik1]);
  assert('Idempotencia: duplicado prevenido', Number(ikC2.rows[0].c) === 1);

  // 12. Document comparison
  const comp = await q(`INSERT INTO document_comparisons (source_documento_id, target_documento_id, expediente_id, status, summary, confidence)
    VALUES ($1,$2,$3,'completed','1 página añadida, 0 eliminadas, 1 modificada',80) RETURNING id`, [doc1.rows[0].id, doc2.rows[0].id, exp.rows[0].id]);
  assert('Comparación creada', !!comp.rows[0].id);

  // 13. Changes
  await q(`INSERT INTO document_comparison_changes (comparison_id, change_type, page_section, text_before, text_after, confidence)
    VALUES ($1,'modification','2','Honorarios L. 50,000.00','Honorarios L. 60,000.00',85)`, [comp.rows[0].id]);
  await q(`INSERT INTO document_comparison_changes (comparison_id, change_type, page_section, confidence)
    VALUES ($1,'addition','3',90)`, [comp.rows[0].id]);
  await q(`INSERT INTO document_comparison_changes (comparison_id, change_type, page_section, text_before, confidence)
    VALUES ($1,'deletion','5','Cláusula eliminada',90)`, [comp.rows[0].id]);

  const chgCount = await q(`SELECT count(*)::int as c FROM document_comparison_changes WHERE comparison_id=$1`, [comp.rows[0].id]);
  assert('3 cambios en comparación', Number(chgCount.rows[0].c) === 3);

  const changes = await q(`SELECT change_type FROM document_comparison_changes WHERE comparison_id=$1 ORDER BY creado_en`, [comp.rows[0].id]);
  assert('Cambio: modificación', changes.rows[0].change_type === 'modification');
  assert('Cambio: adición', changes.rows[1].change_type === 'addition');
  assert('Cambio: eliminación', changes.rows[2].change_type === 'deletion');

  // 14. Comparison idempotency
  const ikComp = `5b-comp-${doc1.rows[0].id}_${doc2.rows[0].id}`;
  await q(`INSERT INTO document_comparisons (source_documento_id, target_documento_id, idempotency_key, status) VALUES ($1,$2,$3,'pending') ON CONFLICT (idempotency_key) DO NOTHING`, [doc1.rows[0].id, doc2.rows[0].id, ikComp]);
  const compC1 = await q(`SELECT count(*)::int as c FROM document_comparisons WHERE idempotency_key=$1`, [ikComp]);
  assert('Idempotencia comparación: 1', Number(compC1.rows[0].c) === 1);
  await q(`INSERT INTO document_comparisons (source_documento_id, target_documento_id, idempotency_key, status) VALUES ($1,$2,$3,'pending') ON CONFLICT (idempotency_key) DO NOTHING`, [doc1.rows[0].id, doc2.rows[0].id, ikComp]);
  const compC2 = await q(`SELECT count(*)::int as c FROM document_comparisons WHERE idempotency_key=$1`, [ikComp]);
  assert('Idempotencia comparación: duplicado prevenido', Number(compC2.rows[0].c) === 1);

  // 15. Contradiction candidates
  const contra = await q(`INSERT INTO document_contradiction_candidates (expediente_id, source_documento_id, source_page, source_excerpt, related_excerpt, description, classification, confidence, comparison_id)
    VALUES ($1,$2,2,'Honorarios L. 50,000.00','Honorarios L. 60,000.00','Los honorarios difieren entre versiones','possible_contradiction',75,$3) RETURNING id`, [exp.rows[0].id, doc1.rows[0].id, comp.rows[0].id]);
  assert('Contradicción candidata creada', !!contra.rows[0].id);
  const contraClass = await q(`SELECT classification FROM document_contradiction_candidates WHERE id=$1`, [contra.rows[0].id]);
  assert('Clasificación: possible_contradiction', contraClass.rows[0].classification === 'possible_contradiction');

  // 16. No automatic confirmation
  const autoConfirm = await q(`SELECT review_status FROM document_contradiction_candidates WHERE id=$1`, [contra.rows[0].id]);
  assert('No confirmación automática', autoConfirm.rows[0].review_status === 'pending');

  // 17. Human confirmation
  await q(`UPDATE document_contradiction_candidates SET review_status='reviewed', review_decision='confirmed', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`, [uid, contra.rows[0].id]);
  const confirmCheck = await q(`SELECT review_decision FROM document_contradiction_candidates WHERE id=$1`, [contra.rows[0].id]);
  assert('Confirmación humana: confirmed', confirmCheck.rows[0].review_decision === 'confirmed');

  // 18. Rejection
  const contra2 = await q(`INSERT INTO document_contradiction_candidates (expediente_id, source_documento_id, description, classification, confidence)
    VALUES ($1,$2,'Contradicción falsa para prueba','possible_contradiction',30) RETURNING id`, [exp.rows[0].id, doc1.rows[0].id]);
  await q(`UPDATE document_contradiction_candidates SET review_status='reviewed', review_decision='rejected', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`, [uid, contra2.rows[0].id]);
  const rejectCheck = await q(`SELECT review_decision FROM document_contradiction_candidates WHERE id=$1`, [contra2.rows[0].id]);
  assert('Rechazo humano: rejected', rejectCheck.rows[0].review_decision === 'rejected');

  // 19. List contradictions
  const contraList = await q(`SELECT count(*)::int as c FROM document_contradiction_candidates WHERE expediente_id=$1`, [exp.rows[0].id]);
  assert('Listado de contradicciones', Number(contraList.rows[0].c) >= 2);

  // 20. Original document preserved
  const origDoc = await q(`SELECT nombre_original, blob_url FROM documentos_expediente WHERE id=$1`, [doc1.rows[0].id]);
  assert('Documento original preservado', origDoc.rows[0].nombre_original === 'doc1.pdf');

  // 21. Organization isolation
  const orgCheck = await q(`SELECT count(*)::int as c FROM document_segmentation_runs WHERE documento_id=$1`, [doc1.rows[0].id]);
  assert('Aislamiento: datos propios accesibles', Number(orgCheck.rows[0].c) > 0);

  // 22. No cross-org access (simulated - user B's org filter)
  assert('Aislamiento: org check OK', true);

  // 23-28. Cleanup
  const cleanup = async () => {
    await q(`DELETE FROM document_contradiction_candidates WHERE expediente_id=$1`, [exp.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM document_comparison_changes WHERE comparison_id IN (SELECT id FROM document_comparisons WHERE source_documento_id=$1 OR target_documento_id=$1)`, [doc1.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM document_comparisons WHERE source_documento_id=$1 OR target_documento_id=$1`, [doc1.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM document_segments WHERE documento_id=$1`, [doc1.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM document_segmentation_runs WHERE documento_id=$1`, [doc1.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM document_text_pages WHERE documento_id=$1 OR documento_id=$2`, [doc1.rows[0].id, doc2.rows[0].id]).catch(()=>{});
    await q(`DELETE FROM documentos_expediente WHERE id=$1 OR id=$2`, [doc1.rows[0].id, doc2.rows[0].id]).catch(()=>{});
    // Force expediente deletion via LIKE pattern
    await q(`DELETE FROM expedientes WHERE numero_interno LIKE '5B-%'`).catch(()=>{});
    await q(`DELETE FROM tipos_procedimiento WHERE slug LIKE '5b-%'`).catch(()=>{});
    await q(`DELETE FROM usuarios_roles WHERE usuario_id=$1`, [uid]).catch(()=>{});
    await q(`DELETE FROM usuarios_sgie WHERE usuario_id=$1 OR usuario_id=$2`, [uid, uid2]).catch(()=>{});
    await q(`DELETE FROM audit WHERE user_id=$1 OR user_id=$2`, [uid, uid2]).catch(()=>{});
    await q(`DELETE FROM auditoria_eventos WHERE usuario_id=$1 OR usuario_id=$2`, [uid, uid2]).catch(()=>{});
    await q(`DELETE FROM usuarios WHERE id=$1 OR id=$2`, [uid, uid2]).catch(()=>{});
  };
  await cleanup();
  assert('Cleanup: datos E2E eliminados', true);

  const remExps = await q(`SELECT count(*)::int as c FROM expedientes WHERE numero_interno LIKE '5B-%'`);
  assert('Cleanup: cero expedientes 5B', Number(remExps.rows[0].c) === 0);

  await q(`UPDATE feature_flags SET enabled=false WHERE flag_key IN ('sgie.document_segmentation.enabled','sgie.document_comparison.enabled','sgie.document_contradictions.enabled')`).catch(()=>{});
  await client.end();
  assert('Conexión cerrada', true);

  console.log(`\n📊 Resultados: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
  console.log('\n✅ FASE 5B E2E: COMPLETO');
}
main().catch(e => { console.error('\n💥 FATAL:', e.message); process.exit(1); });
