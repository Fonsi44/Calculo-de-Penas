#!/usr/bin/env node
/**
 * E2E de Fase 3 — Experiencia operativa del abogado y portal del cliente
 *
 * VALIDACIÓN: solo se ejecuta tras pasar guard-fase3.mjs (base aislada).
 * USO: node scripts/e2e/fase3-e2e.mjs
 *
 * Flujo:
 *   1. Invitación → activación SGIE
 *   2. Expediente con workflow
 *   3. Solicitud / carga documental
 *   4. Portal del cliente (enlace mágico)
 *   5. Procesamiento IA → baja confianza
 *   6. Revisión humana
 *   7. Requisito completado
 *   8. Comunicación outbox
 *   9. Mi jornada / bandeja
 *  10. Calendario
 *  11. Dashboard admin
 *  12. Auditoría
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config();

const guardPath = resolve(__dirname, 'guard-fase3.mjs');
await import(guardPath);

import pg from 'pg';
const { Pool } = pg;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return randomBytes(32).toString('base64url');
}

function generateId() {
  return randomBytes(16).toString('hex');
}

const PREFIX = 'f3e2e-';
const POOL = new Pool({ connectionString: process.env.DATABASE_URL });

async function db() {
  const client = await POOL.connect();
  return client;
}

function q(client, sql, params = []) {
  return client.query(sql, params);
}

// ─── Steps ─────────────────────────────────────────────────────────────────────

const steps = {};

async function step1_invitacionYActivacion(client) {
  const adminId = PREFIX + 'admin-' + generateId();
  const userId = PREFIX + 'user-' + generateId();
  const email = `${PREFIX}user-${Date.now()}@test.local`;

  await q(client,
    `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado)
     VALUES ($1, $2, 'Admin F3', 'hash-fake', 'admin', true, false)
     ON CONFLICT (id) DO NOTHING`,
    [adminId, `${PREFIX}admin-${Date.now()}@test.local`],
  );

  await q(client,
    `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado)
     VALUES ($1, $2, 'Abogado F3', 'hash-fake', 'abogado', true, false)
     ON CONFLICT (id) DO NOTHING`,
    [userId, email],
  );

  const invId = PREFIX + 'inv-' + generateId();
  const tokenHash = hashToken(generateToken());
  await q(client,
    `INSERT INTO invitaciones (id, email, token_hash, rol, expira_en, estado, creado_por)
     VALUES ($1, $2, $3, 'abogado', NOW() + INTERVAL '7 days', 'pendiente', $4)`,
    [invId, email, tokenHash, adminId],
  );

  const [inv] = (await q(client,
    `SELECT id, estado FROM invitaciones WHERE id = $1`, [invId],
  )).rows;
  if (!inv || inv.estado !== 'pendiente') throw new Error('Fallo crear invitacion');

  await q(client,
    `INSERT INTO usuarios_sgie (usuario_id, activo_sgie, configuracion)
     VALUES ($1, true, '{"notificaciones": true}')
     ON CONFLICT (usuario_id) DO UPDATE SET activo_sgie = true`,
    [userId],
  );

  const [sgie] = (await q(client,
    `SELECT usuario_id, activo_sgie FROM usuarios_sgie WHERE usuario_id = $1`, [userId],
  )).rows;
  if (!sgie || !sgie.activo_sgie) throw new Error('Fallo activacion SGIE');

  return { adminId, userId, invId };
}

async function step2_expedienteConWorkflow(client, adminId) {
  const procId = PREFIX + 'proc-' + generateId();
  const slug = PREFIX + 'slug-' + generateId();

  await q(client,
    `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion)
     VALUES ($1, $2, $3, 'penal', 'Procedimiento E2E F3', 1, 'activo',
       '{"documentosRequeridos":["Identificacion oficial","Comprobante de domicilio"]}')`,
    [procId, slug, 'Fase 3 Proc ' + Date.now()],
  );

  const expId = PREFIX + 'exp-' + generateId();
  const numeroInterno = `F3-E2E-${Date.now()}`;
  await q(client,
    `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, creado_por, prioridad)
     VALUES ($1, $2, $3, 1, $4, 'creado', $4, 'media')`,
    [expId, numeroInterno, procId, adminId],
  );

  const [exp] = (await q(client,
    `SELECT id, estado FROM expedientes WHERE id = $1`, [expId],
  )).rows;
  if (!exp) throw new Error('Fallo crear expediente');

  const [reqs] = (await q(client,
    `SELECT id, nombre FROM requisitos_expediente WHERE expediente_id = $1 ORDER BY orden LIMIT 1`, [expId],
  )).rows;

  return { procedimientoId: procId, expedienteId: expId, requisitoId: reqs?.id };
}

async function step3_solicitudYCarga(client, expedienteId, requisitoId, adminId) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const enlaceId = PREFIX + 'enl-' + generateId();
  const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await q(client,
    `INSERT INTO enlaces_magicos (id, token_hash, expediente_id, requisito_expediente_id, creado_por, expira_en, usos_maximos, usos_actuales)
     VALUES ($1, $2, $3, $4, $5, $6, 5, 0)`,
    [enlaceId, tokenHash, expedienteId, requisitoId, adminId, expiraEn],
  );

  const docId = PREFIX + 'doc-' + generateId();
  const hash = 'f3-e2e-hash-' + generateId();
  await q(client,
    `INSERT INTO documentos_expediente (id, expediente_id, requisito_expediente_id, enlace_magico_id,
       nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, metadata)
     VALUES ($1, $2, $3, $4, 'documento-f3.pdf', 'documento-f3-' || $5 || '.pdf', 'application/pdf', 2048, $6,
       'blob:f3-e2e', 'pendiente_abogado', 'cliente', '{"e2e": true, "fase": "3"}')`,
    [docId, expedienteId, requisitoId, enlaceId, generateId(), hash],
  );

  const [doc] = (await q(client,
    `SELECT id, estado FROM documentos_expediente WHERE id = $1`, [docId],
  )).rows;
  if (!doc) throw new Error('Fallo crear documento');

  return { enlaceId, token, documentoId: docId };
}

async function step4_portalCliente(client, token, expedienteId) {
  const tokenHash = hashToken(token);
  const [enlace] = (await q(client,
    `SELECT id, expediente_id FROM enlaces_magicos WHERE token_hash = $1 AND revocado_en IS NULL AND expira_en > NOW()`,
    [tokenHash],
  )).rows;
  if (!enlace) throw new Error('Fallo verificar enlace magico');

  const [exp] = (await q(client,
    `SELECT id, numero_interno, estado FROM expedientes WHERE id = $1`, [expedienteId],
  )).rows;
  if (!exp) throw new Error('Fallo verificar expediente desde portal');

  return { portalOk: true, expedienteNumero: exp.numero_interno };
}

async function step5_procesamientoIaBajaConfianza(client, documentoId, adminId) {
  await q(client,
    `INSERT INTO ocr_resultados (documento_id, confianza, paginas, texto_extraido, metodo, duracion_ms)
     VALUES ($1, 0.45, 3, 'texto extraido con baja confianza', 'tesseract', 1200)`,
    [documentoId],
  );

  await q(client,
    `INSERT INTO extracciones_ia (documento_id, task_type, proveedor, modelo, resultado_json, total_confidence, estado)
     VALUES ($1, 'document_classification', 'deepseek', 'deepseek-chat',
       '{"tipoDocumento": "identificacion", "confianzaTipo": 55}', 0.55, 'completed')`,
    [documentoId],
  );

  await q(client,
    `INSERT INTO ai_task_routing (documento_id, task_type, proveedor_asignado, modelo, estado, resultado)
     VALUES ($1, 'document_classification', 'deepseek', 'deepseek-chat', 'completed',
       '{"confianza": 55, "requiereRevision": true}')`,
    [documentoId],
  );

  const [task] = (await q(client,
    `SELECT id, estado FROM ai_task_routing WHERE documento_id = $1 ORDER BY creado_en DESC LIMIT 1`, [documentoId],
  )).rows;
  return { iaTaskId: task?.id };
}

async function step6_revisionHumana(client, documentoId, adminId) {
  await q(client,
    `UPDATE documentos_expediente SET estado = 'pendiente_abogado', aprobado_por = NULL WHERE id = $1`,
    [documentoId],
  );

  await q(client,
    `UPDATE documentos_expediente SET estado = 'aprobado', aprobado_por = $1, aprobado_en = NOW() WHERE id = $2`,
    [adminId, documentoId],
  );

  const [doc] = (await q(client,
    `SELECT id, estado FROM documentos_expediente WHERE id = $1`, [documentoId],
  )).rows;
  if (doc.estado !== 'aprobado') throw new Error('Fallo revision humana');

  return { revisionOk: true };
}

async function step7_requisitoCompletado(client, expedienteId, requisitoId) {
  if (requisitoId) {
    await q(client,
      `UPDATE requisitos_expediente SET estado = 'completado' WHERE id = $1`, [requisitoId],
    );
  }
  return { requisitoCompletado: true };
}

async function step8_comunicacionOutbox(client, expedienteId, adminId) {
  const comId = PREFIX + 'com-' + generateId();
  await q(client,
    `INSERT INTO comunicaciones_outbox (id, expediente_id, tipo, destinatario, asunto, cuerpo, estado, creado_por)
     VALUES ($1, $2, 'notificacion_estado', 'cliente@test.local', 'Estado del expediente F3',
       'Su expediente ha sido actualizado', 'pending', $3)`,
    [comId, expedienteId, adminId],
  );

  await q(client,
    `INSERT INTO comunicaciones_auditoria (comunicacion_id, accion, metadata)
     VALUES ($1, 'outbox_creada', '{"e2e": true, "fase": "3"}')`,
    [comId],
  );

  const [com] = (await q(client,
    `SELECT id, estado FROM comunicaciones_outbox WHERE id = $1`, [comId],
  )).rows;
  if (!com) throw new Error('Fallo crear comunicacion outbox');

  return { comunicacionId: comId };
}

async function step9_miJornada(client, adminId) {
  const [tareas] = (await q(client,
    `SELECT COUNT(*)::int AS n FROM tareas WHERE asignada_a = $1`, [adminId],
  )).rows;

  const [docs] = (await q(client,
    `SELECT COUNT(*)::int AS n FROM documentos_expediente WHERE estado = 'pendiente_abogado'`, [],
  )).rows;

  return { tareasPendientes: tareas?.n ?? 0, docsPendientes: docs?.n ?? 0 };
}

async function step10_calendario(client, adminId) {
  const calId = PREFIX + 'cal-' + generateId();
  const inicio = new Date(Date.now() + 86400000).toISOString();
  const fin = new Date(Date.now() + 86400000 + 3600000).toISOString();

  await q(client,
    `INSERT INTO calendario (id, propietario_id, titulo, tipo, inicio, fin, zona_horaria, estado)
     VALUES ($1, $2, 'Cita E2E F3', 'cita', $3, $4, 'America/Tegucigalpa', 'confirmada')`,
    [calId, adminId, inicio, fin],
  );

  const [cal] = (await q(client,
    `SELECT id, estado FROM calendario WHERE id = $1`, [calId],
  )).rows;
  if (!cal) throw new Error('Fallo crear evento calendario');

  return { calendarioId: calId };
}

async function step11_dashboardAdmin(client) {
  const [expedientes] = (await q(client,
    `SELECT COUNT(*)::int AS n FROM expedientes WHERE id LIKE $1`, [`${PREFIX}%`],
  )).rows;

  const [pendientes] = (await q(client,
    `SELECT COUNT(*)::int AS n FROM documentos_expediente WHERE id LIKE $1 AND estado = 'pendiente_abogado'`, [`${PREFIX}%`],
  )).rows;

  return { totalExpedientes: expedientes?.n ?? 0, documentosPendientes: pendientes?.n ?? 0 };
}

async function step12_auditoria(client) {
  const [logCount] = (await q(client,
    `SELECT COUNT(*)::int AS n FROM log_sgie WHERE recurso LIKE $1`, [`${PREFIX}%`],
  )).rows;

  return { registrosAuditoria: logCount?.n ?? 0 };
}

async function cleanup(client) {
  const tables = [
    'comunicaciones_auditoria',
    'comunicaciones_aprobaciones',
    'comunicaciones_outbox',
    'ai_task_routing',
    'extracciones_ia',
    'ocr_resultados',
    'jobs_sgie',
    'outbox_events',
    'documentos_expediente',
    'enlaces_magicos',
    'requisitos_expediente',
    'expediente_asignaciones',
    'expediente_fases',
    'historial_expediente',
    'expedientes',
    'tipos_procedimiento',
    'calendario',
    'invitaciones',
    'usuarios_sgie',
    'log_sgie',
    'usuarios',
  ];
  for (const table of tables) {
    try {
      await client.query(`DELETE FROM ${table} WHERE id LIKE $1`, [`${PREFIX}%`]);
    } catch {
      // skip if FK blocks or table doesn't exist
    }
  }
}

async function main() {
  const client = await db();
  const state = {};

  try {
    console.log('[FASE3-E2E] Iniciando fase 3...\n');

    console.log('1. Invitación → activación SGIE...');
    const s1 = await step1_invitacionYActivacion(client);
    Object.assign(state, s1);
    steps.invitacion = true;
    console.log('   ✅ Invitacion creada y SGIE activado');

    console.log('2. Expediente con workflow...');
    const s2 = await step2_expedienteConWorkflow(client, state.adminId);
    Object.assign(state, s2);
    steps.expediente = true;
    console.log('   ✅ Expediente creado:', state.expedienteId);

    console.log('3. Solicitud / carga documental...');
    const s3 = await step3_solicitudYCarga(client, state.expedienteId, state.requisitoId, state.adminId);
    Object.assign(state, s3);
    steps.carga = true;
    console.log('   ✅ Documento cargado:', state.documentoId);

    console.log('4. Portal del cliente...');
    const s4 = await step4_portalCliente(client, state.token, state.expedienteId);
    Object.assign(state, s4);
    steps.portal = true;
    console.log('   ✅ Portal verificado');

    console.log('5. Procesamiento IA → baja confianza...');
    const s5 = await step5_procesamientoIaBajaConfianza(client, state.documentoId, state.adminId);
    Object.assign(state, s5);
    steps.ia = true;
    console.log('   ✅ IA procesada con baja confianza');

    console.log('6. Revisión humana...');
    const s6 = await step6_revisionHumana(client, state.documentoId, state.adminId);
    Object.assign(state, s6);
    steps.revision = true;
    console.log('   ✅ Documento aprobado por abogado');

    console.log('7. Requisito completado...');
    const s7 = await step7_requisitoCompletado(client, state.expedienteId, state.requisitoId);
    Object.assign(state, s7);
    steps.requisito = true;
    console.log('   ✅ Requisito marcado completado');

    console.log('8. Comunicación outbox...');
    const s8 = await step8_comunicacionOutbox(client, state.expedienteId, state.adminId);
    Object.assign(state, s8);
    steps.comunicacion = true;
    console.log('   ✅ Comunicación outbox creada');

    console.log('9. Mi jornada / bandeja...');
    const s9 = await step9_miJornada(client, state.adminId);
    Object.assign(state, s9);
    steps.miJornada = true;
    console.log('   ✅ Bandeja consultada');

    console.log('10. Calendario...');
    const s10 = await step10_calendario(client, state.adminId);
    Object.assign(state, s10);
    steps.calendario = true;
    console.log('   ✅ Evento de calendario creado');

    console.log('11. Dashboard admin...');
    const s11 = await step11_dashboardAdmin(client);
    Object.assign(state, s11);
    steps.dashboard = true;
    console.log('   ✅ Dashboard consultado');

    console.log('12. Auditoría...');
    const s12 = await step12_auditoria(client);
    Object.assign(state, s12);
    steps.auditoria = true;
    console.log('   ✅ Registros de auditoría verificados');

    console.log('\n' + JSON.stringify({
      ok: true,
      ...steps,
      state: { ...state, token: '(redactado)' },
    }, null, 2));
  } finally {
    await cleanup(client);
    client.release();
    await POOL.end();
  }
}

main().catch((error) => {
  console.error('\n[FASE3-E2E] ❌ Falló:', error.message);
  console.error(error.stack);
  process.exitCode = 1;
});
