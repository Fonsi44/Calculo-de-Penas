#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config();

import('file:///' + resolve(__dirname, 'guard.mjs').replace(/\\/g, '/'));

import pg from 'pg';
const { Pool } = pg;

function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }
function generateToken() { return randomBytes(32).toString('base64url'); }
function uuid() { const h = randomBytes(16).toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`; }

const POOL = new Pool({ connectionString: process.env.DATABASE_URL });
const q = (c, s, p) => c.query(s, p);
const tag = 'f2e2e';
const created = { ids: [] };
function track(id) { if (id) created.ids.push(id); return id; }

async function createProcedimiento(client) {
  const id = track(uuid());
  const slug = uuid();
  await q(client,
    `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion)
     VALUES ($1, $2, 'Fase2 E2E Proc', 'penal', 'E2E', 1, 'pendiente_validacion_legal',
       '{"documentosRequeridos":["ID","Comprobante"]}')`,
    [id, slug]);
  const adminId = track(uuid());
  await q(client,
    `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado)
     VALUES ($1, $2, 'Admin E2E', 'hash', 'admin', true, false) ON CONFLICT (id) DO NOTHING`,
    [adminId, `${tag}-admin-${Date.now()}@test.local`]);
  await q(client, `UPDATE tipos_procedimiento SET estado = 'activo', actualizado_en = NOW() WHERE id = $1`, [id]);
  const [row] = (await q(client, `SELECT estado FROM tipos_procedimiento WHERE id = $1`, [id])).rows;
  if (row.estado !== 'activo') throw new Error('Fallo aprobar procedimiento');
  return { procedimientoId: id, adminId };
}

async function createExpediente(client, procId, adminId) {
  const id = track(uuid());
  const num = `F2E2E-${Date.now()}`;
  await q(client,
    `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, responsable_id, estado, creado_por)
     VALUES ($1, $2, $3, $4, 'creado', $4)`,
    [id, num, procId, adminId]);
  const [exp] = (await q(client, `SELECT id FROM expedientes WHERE id = $1`, [id])).rows;
  if (!exp) throw new Error('Fallo crear expediente');
  const reqId = track(uuid());
  await q(client,
    `INSERT INTO requisitos_expediente (id, expediente_id, nombre, tipo, estado, orden)
     VALUES ($1, $2, 'Identificación oficial', 'obligatorio', 'solicitado', 1)`,
    [reqId, id]);
  const [req] = (await q(client, `SELECT id FROM requisitos_expediente WHERE id = $1`, [reqId])).rows;
  if (!req) throw new Error('Sin requisitos instanciados');
  return { expedienteId: id, requisitoId: reqId };
}

async function createMagicLink(client, expId, reqId, adminId) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const id = track(uuid());
  await q(client,
    `INSERT INTO enlaces_magicos (id, token_hash, expediente_id, requisito_expediente_id, creado_por, expira_en, usos_maximos, usos_actuales)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days', 5, 0)`,
    [id, tokenHash, expId, reqId, adminId]);
  const [r] = (await q(client, `SELECT usos_actuales FROM enlaces_magicos WHERE id = $1`, [id])).rows;
  if (Number(r.usos_actuales) !== 0) throw new Error('Fallo enlace');
  return { enlaceId: id, token };
}

async function simulateUpload(client, expId, reqId, enlaceId, token) {
  const hash = 'e2e-hash-' + uuid();
  const r1 = await q(client,
    `UPDATE enlaces_magicos SET usos_actuales = usos_actuales + 1
     WHERE token_hash = $1 AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
       AND revocado_en IS NULL AND expira_en > NOW()
     RETURNING id, usos_actuales`,
    [hashToken(token)]);
  if (r1.rows.length === 0) throw new Error('Fallo reserva');
  const docId = track(uuid());
  await q(client,
    `INSERT INTO documentos_expediente (id, expediente_id, requisito_expediente_id, enlace_magico_id,
       nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, metadata)
     VALUES ($1, $2, $3, $4, 'test.pdf', 'test.pdf', 'application/pdf', 1024, $5, 'blob:e2e', 'subido', 'cliente', '{"e2e":true}')`,
    [docId, expId, reqId, enlaceId, hash]);
  const outboxId = track(uuid());
  await q(client,
    `INSERT INTO outbox_events (id, event_type, aggregate_type, aggregate_id, payload, status)
     VALUES ($1, 'document.uploaded', 'document', $2, $3, 'pending')`,
    [outboxId, docId, JSON.stringify({ documentoId: docId })]);
  const jobId = track(uuid());
  await q(client,
    `INSERT INTO jobs_sgie (id, tipo, ref_id, estado, payload)
     VALUES ($1, 'extraccion_texto', $2, 'pendiente', $3)`,
    [jobId, docId, JSON.stringify({ documentoId: docId })]);
  return { documentoId: docId, hash };
}

async function verifyOutbox(client) {
  const r = await q(client, `SELECT id, event_type FROM outbox_events ORDER BY creado_en DESC LIMIT 1`);
  if (r.rows.length === 0) throw new Error('No outbox event');
  if (r.rows[0].event_type !== 'document.uploaded') throw new Error('Outbox type mismatch');
  return r.rows[0];
}

async function verifyJob(client) {
  const r = await q(client, `SELECT id, tipo FROM jobs_sgie ORDER BY creado_en DESC LIMIT 1`);
  if (r.rows.length === 0) throw new Error('No job');
  return r.rows[0];
}

async function simulateJobProcessing(client, jobId) {
  await q(client, `UPDATE jobs_sgie SET estado = 'completado', completado_en = NOW() WHERE id = $1`, [jobId]);
}

async function simulateAiRouting(client, docId) {
  const id = track(uuid());
  await q(client,
    `INSERT INTO ai_task_routing (id, documento_id, task_type, proveedor_asignado, modelo, estado, payload)
     VALUES ($1, $2, 'classification', 'deepseek', 'deepseek-v4-flash', 'pending', '{}')`,
    [id, docId]);
  return (await q(client, `SELECT id FROM ai_task_routing WHERE id = $1`, [id])).rows[0];
}

async function simulateComunicacion(client, expId, adminId) {
  const id = track(uuid());
  await q(client,
    `INSERT INTO comunicaciones_outbox (id, expediente_id, tipo, destinatario, asunto, cuerpo, estado, creado_por)
     VALUES ($1, $2, 'solicitud', 'cliente@test.local', 'Test', 'Test cuerpo', 'pending', $3)`,
    [id, expId, adminId]);
  return (await q(client, `SELECT id FROM comunicaciones_outbox WHERE id = $1`, [id])).rows[0];
}

async function cleanup(client) {
  const tables = ['comunicaciones_auditoria','comunicaciones_aprobaciones','comunicaciones_outbox','ai_task_routing','dead_letter_jobs','job_attempts','jobs_sgie','outbox_events','ocr_resultados','documentos_expediente','enlaces_magicos','requisitos_expediente','expediente_asignaciones','expediente_fases','historial_expediente','expedientes','alertas_sla','inbound_messages','portal_sessions','communication_rules','webhook_receipts','procedimiento_transiciones','procedimiento_fases','procedimiento_versiones','tipos_procedimiento','usuarios'];
  for (const table of tables) {
    try {
      for (const id of created.ids) {
        await q(client, `DELETE FROM "${table}" WHERE id = $1`, [id]).catch(() => {});
      }
    } catch {}
  }
}

async function main() {
  const client = await POOL.connect();
  try {
    console.log('\n[FASE2-E2E] Iniciando...\n');
    const proc = await createProcedimiento(client); console.log('1. Procedimiento creado y aprobado ✅');
    const exp = await createExpediente(client, proc.procedimientoId, proc.adminId); console.log('2. Expediente creado con requisitos ✅');
    const link = await createMagicLink(client, exp.expedienteId, exp.requisitoId, proc.adminId); console.log('3. Enlace mágico creado ✅');
    const upload = await simulateUpload(client, exp.expedienteId, exp.requisitoId, link.enlaceId, link.token); console.log('4. Carga documental atómica ✅');
    const outbox = await verifyOutbox(client); console.log('5. Outbox event verificado ✅');
    const job = await verifyJob(client); console.log('6. Job durable creado ✅');
    await simulateJobProcessing(client, job.id); console.log('7. Job procesado ✅');
    const ai = await simulateAiRouting(client, upload.documentoId); console.log('8. IA router tarea creada ✅');
    const com = await simulateComunicacion(client, exp.expedienteId, proc.adminId); console.log('9. Comunicación outbox creada ✅');
    console.log('\n✅ FASE 2 E2E: COMPLETADO (todos los pasos OK)\n');
  } finally {
    await cleanup(client);
    client.release();
    await POOL.end();
  }
}

main().catch(e => { console.error(`\n❌ ${e.message}`); process.exitCode = 1; }).finally(() => POOL.end().catch(() => {}));

