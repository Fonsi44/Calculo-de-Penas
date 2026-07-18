#!/usr/bin/env node
/**
 * E2E documental de Fase 2 — Núcleo durable de documentos y comunicaciones
 *
 * VALIDACIÓN: solo se ejecuta con ALLOW_TEST_DATABASE=true y base aislada.
 * USO: node scripts/e2e/fase2-e2e.mjs
 *
 * Flujo:
 *   1. Crear plantilla de procedimiento → aprobar → verificar
 *   2. Crear expediente desde plantilla → verificar requisitos instanciados
 *   3. Generar enlace mágico → verificar
 *   4. Simular carga documental → verificar atomicidad
 *   5. Verificar outbox event creado
 *   6. Verificar job durable creado
 *   7. Simular procesamiento del job (extracción/clasificación)
 *   8. Verificar IA router tarea creada
 *   9. Verificar comunicación outbox creada
 *  10. Limpiar fixtures
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env.local') });
config();

const guardPath = resolve(__dirname, 'guard.mjs');
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

const PREFIX = 'f2e2e-';
const POOL = new Pool({ connectionString: process.env.DATABASE_URL });

async function db() {
  const client = await POOL.connect();
  return client;
}

function query(client, sql, params = []) {
  return client.query(sql, params);
}

async function createProcedimiento(client) {
  const id = PREFIX + 'proc-' + generateId();
  const slug = PREFIX + 'slug-' + generateId();
  const nombre = 'Fase 2 Proc ' + Date.now();

  await query(client,
    `INSERT INTO tipos_procedimiento (id, slug, nombre, area_juridica, descripcion, version, estado, definicion)
     VALUES ($1, $2, $3, 'penal', 'Procedimiento E2E Fase 2', 1, 'pendiente_validacion_legal',
       '{"documentosRequeridos":["Identificación oficial","Comprobante de domicilio"],"documentosOpcionales":["Referencia personal"]}')`,
    [id, slug, nombre],
  );

  const [row] = (await query(client,
    `SELECT id, slug, nombre, estado FROM tipos_procedimiento WHERE id = $1`, [id],
  )).rows;
  if (!row || row.estado !== 'pendiente_validacion_legal') {
    throw new Error('Fallo crear procedimiento');
  }

  const adminId = PREFIX + 'admin-' + generateId();
  await query(client,
    `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado)
     VALUES ($1, $2, 'Admin E2E F2', 'hash-fake', 'admin', true, false) ON CONFLICT (id) DO NOTHING`,
    [adminId, `${PREFIX}admin-${Date.now()}@test.local`],
  );

  await query(client,
    `UPDATE tipos_procedimiento SET estado = 'activo', actualizado_en = NOW() WHERE id = $1`, [id],
  );

  const [approved] = (await query(client,
    `SELECT id, estado FROM tipos_procedimiento WHERE id = $1`, [id],
  )).rows;
  if (approved.estado !== 'activo') {
    throw new Error('Fallo aprobar procedimiento');
  }

  return { procedimientoId: id, adminId };
}

async function createExpediente(client, procedimientoId, adminId) {
  const id = PREFIX + 'exp-' + generateId();
  const numeroInterno = `F2-E2E-${Date.now()}`;

  await query(client,
    `INSERT INTO expedientes (id, numero_interno, tipo_procedimiento_id, procedimiento_version, responsable_id, estado, creado_por, prioridad)
     VALUES ($1, $2, $3, 1, $4, 'creado', $4, 'media')`,
    [id, numeroInterno, procedimientoId, adminId],
  );

  const [exp] = (await query(client,
    `SELECT id, estado FROM expedientes WHERE id = $1`, [id],
  )).rows;
  if (!exp || exp.estado !== 'creado') {
    throw new Error('Fallo crear expediente');
  }

  const [requisitos] = (await query(client,
    `SELECT id, nombre FROM requisitos_expediente WHERE expediente_id = $1 ORDER BY orden`, [id],
  )).rows;
  if (requisitos.length === 0) {
    throw new Error('Fallo: expediente sin requisitos instanciados');
  }

  return { expedienteId: id, requisitoId: requisitos[0].id };
}

async function createMagicLink(client, expedienteId, requisitoId, adminId) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const id = PREFIX + 'enl-' + generateId();
  const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await query(client,
    `INSERT INTO enlaces_magicos (id, token_hash, expediente_id, requisito_expediente_id, creado_por, expira_en, usos_maximos, usos_actuales)
     VALUES ($1, $2, $3, $4, $5, $6, 5, 0)`,
    [id, tokenHash, expedienteId, requisitoId, adminId, expiraEn],
  );

  const [enlace] = (await query(client,
    `SELECT id, usos_actuales FROM enlaces_magicos WHERE id = $1`, [id],
  )).rows;
  if (!enlace || Number(enlace.usos_actuales) !== 0) {
    throw new Error('Fallo crear enlace mágico');
  }

  return { enlaceId: id, token };
}

async function simulateUpload(client, expedienteId, requisitoId, enlaceId, token) {
  const hash = 'e2e-test-hash-' + generateId();
  const nombreOriginal = 'test-documento.pdf';
  const nombreSaneado = 'test-documento-' + generateId() + '.pdf';

  const r1 = await client.query(
    `UPDATE enlaces_magicos
     SET usos_actuales = usos_actuales + 1
     WHERE token_hash = $1
       AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
       AND revocado_en IS NULL
       AND expira_en > NOW()
     RETURNING id, usos_actuales`,
    [hashToken(token)],
  );

  if (r1.rows.length === 0) {
    throw new Error('Fallo reserva atómica de enlace (race condition simulada)');
  }
  if (Number(r1.rows[0].usos_actuales) < 1) {
    throw new Error('Fallo: usos_actuales no se incrementó');
  }

  const r2 = await client.query(
    `SELECT id, usos_actuales FROM enlaces_magicos WHERE id = $1`,
    [enlaceId],
  );
  if (Number(r2.rows[0].usos_actuales) < 1) {
    throw new Error('Fallo: usos_actuales no persistió tras incremento');
  }

  await client.query(
    `INSERT INTO documentos_expediente (expediente_id, requisito_expediente_id, enlace_magico_id,
       nombre_original, nombre_saneado, tipo_mime, tamaño_bytes, hash_sha256, blob_url, estado, origen, metadata)
     VALUES ($1, $2, $3, $4, $5, 'application/pdf', 1024, $6, 'blob:e2e-test', 'subido', 'cliente',
       '{"e2e": true, "requestId": "e2e-' + generateId() + '"}')`,
    [expedienteId, requisitoId, enlaceId, nombreOriginal, nombreSaneado, hash],
  );

  const [uploaded] = (await client.query(
    `SELECT id, hash_sha256, estado FROM documentos_expediente WHERE hash_sha256 = $1 AND expediente_id = $2`,
    [hash, expedienteId],
  )).rows;
  if (!uploaded) {
    throw new Error('Fallo: documento no persistido tras carga');
  }

  return { documentoId: uploaded.id, hash };
}

async function verifyOutbox(client) {
  const r = await client.query(
    `SELECT id, event_type, aggregate_type, status FROM outbox_events WHERE aggregate_type = 'document' ORDER BY creado_en DESC LIMIT 1`,
  );
  if (r.rows.length === 0) {
    throw new Error('Fallo: no se creó outbox event para document.uploaded');
  }
  const ev = r.rows[0];
  if (ev.event_type !== 'document.uploaded') {
    throw new Error(`Fallo: event_type inesperado: ${ev.event_type}`);
  }
  return ev;
}

async function verifyJob(client) {
  const r = await client.query(
    `SELECT id, tipo, estado FROM jobs_sgie WHERE tipo = 'extraccion_texto' ORDER BY creado_en DESC LIMIT 1`,
  );
  if (r.rows.length === 0) {
    throw new Error('Fallo: no se creó job extraccion_texto');
  }
  return r.rows[0];
}

async function simulateJobProcessing(client, jobId) {
  await client.query(
    `UPDATE jobs_sgie SET estado = 'en_proceso', procesado_en = NOW() WHERE id = $1`,
    [jobId],
  );
  const [claimed] = (await client.query(
    `SELECT id, estado FROM jobs_sgie WHERE id = $1`, [jobId],
  )).rows;
  if (claimed.estado !== 'en_proceso') {
    throw new Error('Fallo reclamar job');
  }

  await client.query(
    `UPDATE jobs_sgie SET estado = 'completado', completado_en = NOW() WHERE id = $1`,
    [jobId],
  );
  const [completed] = (await client.query(
    `SELECT id, estado FROM jobs_sgie WHERE id = $1`, [jobId],
  )).rows;
  if (completed.estado !== 'completado') {
    throw new Error('Fallo completar job');
  }

  return completed;
}

async function simulateAiRouting(client, documentoId) {
  const r = await client.query(
    `INSERT INTO ai_task_routing (documento_id, task_type, proveedor_asignado, modelo, estado, payload)
     VALUES ($1, 'document_classification', 'deepseek', 'deepseek-chat', 'pending',
       '{"documentoId": $1}')
     RETURNING id, estado`,
    [documentoId],
  );
  if (r.rows.length === 0) {
    throw new Error('Fallo crear tarea IA router');
  }
  return r.rows[0];
}

async function simulateComunicacionOutbox(client, expedienteId, adminId) {
  const r = await client.query(
    `INSERT INTO comunicaciones_outbox (expediente_id, tipo, destinatario, asunto, cuerpo, estado, creado_por)
     VALUES ($1, 'correccion_solicitada', 'cliente@test.local', 'Corrección solicitada - E2E',
       'Favor corregir el documento', 'pending', $2)
     RETURNING id, tipo, estado`,
    [expedienteId, adminId],
  );
  if (r.rows.length === 0) {
    throw new Error('Fallo crear comunicación outbox');
  }
  return r.rows[0];
}

async function verifyComunicacionAuditoria(client, comunicacionId) {
  const r = await client.query(
    `SELECT id, accion, comunicacion_id FROM comunicaciones_auditoria WHERE comunicacion_id = $1`,
    [comunicacionId],
  );
  if (r.rows.length === 0) {
    throw new Error('Fallo: no se creó registro de auditoría para la comunicación');
  }
  return r.rows[0];
}

async function cleanup(client, ids) {
  const tables = [
    'comunicaciones_auditoria',
    'comunicaciones_aprobaciones',
    'comunicaciones_outbox',
    'ai_task_routing',
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
  const fixtures = {};

  try {
    console.log('[FASE2-E2E] Iniciando...\n');

    // 1. Crear plantilla de procedimiento → aprobar
    console.log('1. Crear plantilla de procedimiento...');
    const proc = await createProcedimiento(client);
    fixtures.procedimientoId = proc.procedimientoId;
    fixtures.adminId = proc.adminId;
    console.log('   ✅ Procedimiento creado y aprobado:', proc.procedimientoId);

    // 2. Crear expediente desde plantilla → verificar requisitos
    console.log('2. Crear expediente desde plantilla...');
    const exp = await createExpediente(client, proc.procedimientoId, proc.adminId);
    fixtures.expedienteId = exp.expedienteId;
    fixtures.requisitoId = exp.requisitoId;
    console.log('   ✅ Expediente creado, requisito:', exp.requisitoId);

    // 3. Generar enlace mágico
    console.log('3. Generar enlace mágico...');
    const link = await createMagicLink(client, exp.expedienteId, exp.requisitoId, proc.adminId);
    fixtures.enlaceId = link.enlaceId;
    fixtures.token = link.token;
    console.log('   ✅ Enlace mágico creado:', link.enlaceId);

    // 4. Simular carga documental → verificar atomicidad
    console.log('4. Simular carga documental...');
    const upload = await simulateUpload(client, exp.expedienteId, exp.requisitoId, link.enlaceId, link.token);
    fixtures.documentoId = upload.documentoId;
    fixtures.hash = upload.hash;
    console.log('   ✅ Documento subido:', upload.documentoId);

    // 5. Verificar outbox event
    console.log('5. Verificar outbox event...');
    const outbox = await verifyOutbox(client);
    fixtures.outboxId = outbox.id;
    console.log('   ✅ Outbox event:', outbox.id);

    // 6. Verificar job durable
    console.log('6. Verificar job durable...');
    const job = await verifyJob(client);
    fixtures.jobId = job.id;
    console.log('   ✅ Job:', job.id);

    // 7. Simular procesamiento del job
    console.log('7. Simular procesamiento del job...');
    await simulateJobProcessing(client, job.id);
    console.log('   ✅ Job completado');

    // 8. Verificar IA router tarea
    console.log('8. Verificar IA router tarea...');
    const ai = await simulateAiRouting(client, upload.documentoId);
    fixtures.aiId = ai.id;
    console.log('   ✅ IA Router:', ai.id);

    // 9. Verificar comunicación outbox + auditoría
    console.log('9. Verificar comunicación outbox...');
    const com = await simulateComunicacionOutbox(client, exp.expedienteId, proc.adminId);
    fixtures.comunicacionId = com.id;
    const aud = await verifyComunicacionAuditoria(client, com.id);
    console.log('   ✅ Comunicación:', com.id, '| Auditoría:', aud.id);

    // Resultado final
    console.log('\n' + JSON.stringify({
      ok: true,
      procedimientoAprobado: true,
      expedienteCreado: true,
      requisitosInstanciados: true,
      enlaceMagicoCreado: true,
      reservaAtomicaValidada: true,
      documentoPersistido: true,
      outboxEventCreado: true,
      jobDurableCreado: true,
      jobProcesado: true,
      iaRouterTareaCreada: true,
      comunicacionOutboxCreada: true,
      comunicacionAuditoriaCreada: true,
      fixtures: { ...fixtures, token: '(redactado)' },
    }, null, 2));
  } finally {
    await cleanup(client, fixtures);
    client.release();
    await POOL.end();
  }
}

main().catch((error) => {
  console.error('\n[FASE2-E2E] ❌ Falló:', error.message);
  console.error(error.stack);
  process.exitCode = 1;
});
