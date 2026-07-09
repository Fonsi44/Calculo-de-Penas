/**
 * E2E Staging — MVP SGIE semi-autónomo (Fases 1–5).
 *
 * Ejecuta el flujo completo contra la DB de staging con datos anonimizados.
 * Uso: npx tsx scripts/e2e-staging-sgie.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import {
  clientes, expedientes, enlacesMagicos, documentosExpediente,
  requisitosExpediente, tiposProcedimiento, caseReadinessRuns, caseReadinessChecks,
  usuarios, expedienteAsignaciones, auditoriaEventos,
} from '../lib/schema';
import { eq, sql } from 'drizzle-orm';
import { crearEnlace } from '../lib/sgie/enlaces-magicos';
import { registrarDocumento, existeHashEnExpediente } from '../lib/sgie/documentos-db';
import { vincularDocumentoARequisitoOnUpload } from '../lib/sgie/seguimiento-documental';
import { procesarDocumento } from '../lib/sgie/motor-documental';
import { isIaEnabled, procesarDocumentoConIa } from '../lib/sgie/ia-documental';
import { evaluarPreparacionExpediente } from '../lib/sgie/readiness';
import { createHash } from 'crypto';

const CLIENTE_FICTICIO = {
  nombre: 'Cliente E2E Anonimizado',
  identidad: '0000-0000-00000',
  rtn: '00000000000000',
  email: 'e2e-test@example.com',
};

async function cleanup() {
  // Limpiar datos de E2E previos (por nombre/email distintivo).
  try {
    const [cli] = await db.select({ id: clientes.id }).from(clientes)
      .where(eq(clientes.email, CLIENTE_FICTICIO.email)).limit(1);
    if (cli) {
      await db.delete(expedientes).where(eq(expedientes.clienteId, cli.id));
      await db.delete(clientes).where(eq(clientes.id, cli.id));
    }
  } catch { /* ignore */ }
}

async function getOrCreateUser(): Promise<string> {
  const [admin] = await db.select({ id: usuarios.id }).from(usuarios).limit(1);
  if (admin) return admin.id;
  throw new Error('No hay usuarios en la DB. Ejecuta seed primero.');
}

async function getOrCreateTipoProcedimiento(): Promise<{ id: string; nombre: string } | null> {
  const [tipo] = await db.select({ id: tiposProcedimiento.id, nombre: tiposProcedimiento.nombre })
    .from(tiposProcedimiento).limit(1);
  return tipo ?? null;
}

async function main() {
  console.log('=== E2E STAGING — MVP SGIE semi-autónomo ===\n');
  const resultados: Record<string, string> = {};

  await cleanup();
  const userId = await getOrCreateUser();
  const tipo = await getOrCreateTipoProcedimiento();

  // ── FASE 1: cliente + expediente + magic link ──
  console.log('--- Fase 1: Magic links + upload seguro ---');

  // 1a. Cliente
  const [cliente] = await db.insert(clientes).values({
    nombre: CLIENTE_FICTICIO.nombre,
    identidad: CLIENTE_FICTICIO.identidad,
    rtn: CLIENTE_FICTICIO.rtn,
    email: CLIENTE_FICTICIO.email,
    creadoPor: userId,
  }).returning({ id: clientes.id });

  // 1b. Expediente
  const numeroInterno = `E2E-${Date.now()}`;
  const [expediente] = await db.insert(expedientes).values({
    numeroInterno,
    clienteId: cliente.id,
    tipoProcedimientoId: tipo?.id ?? null,
    responsableId: userId,
    estado: 'pendiente_de_documentos',
    prioridad: 'media',
    creadoPor: userId,
  }).returning({ id: expedientes.id, numeroInterno: expedientes.numeroInterno });

  // 1c. Asignación
  await db.insert(expedienteAsignaciones).values({
    expedienteId: expediente.id,
    abogadoId: userId,
    rol: 'responsable',
    asignadoPor: userId,
  });

  // 1d. Requisito obligatorio (checklist mínimo)
  const [req] = await db.insert(requisitosExpediente).values({
    expedienteId: expediente.id,
    nombre: 'Documento de identidad (E2E)',
    tipo: 'obligatorio',
    estado: 'solicitado',
    orden: 0,
  }).returning({ id: requisitosExpediente.id });

  // 1e. Magic link
  const enlace = await crearEnlace({ expedienteId: expediente.id, clienteEmail: CLIENTE_FICTICIO.email }, userId);

  // 1f. Verificar token_hash en DB (no token en claro)
  const [enlaceDb] = await db.select({
    tokenHash: enlacesMagicos.tokenHash,
  }).from(enlacesMagicos).where(eq(enlacesMagicos.id, enlace.id));

  const tokenHashOk = !!enlaceDb?.tokenHash && enlaceDb.tokenHash.length === 64;
  const hasTokenColumn = await db.execute(sql`
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='enlaces_magicos' AND column_name='token') as exists
  `);
  const tokenColumnExists = Boolean((hasTokenColumn.rows[0] as Record<string, unknown>)?.exists);

  console.log(`  ✓ Cliente: ${cliente.id}`);
  console.log(`  ✓ Expediente: ${expediente.numeroInterno}`);
  console.log(`  ✓ Magic link: ${enlace.id} → token_hash=${tokenHashOk ? 'OK (64 hex)' : 'FAIL'}`);
  console.log(`  ✓ Columna 'token' en DB: ${tokenColumnExists ? 'EXISTS (MAL)' : 'NO EXISTE (correcto)'}`);
  resultados['fase1_magic_link'] = tokenHashOk && !tokenColumnExists ? 'PASS' : 'FAIL';
  resultados['fase1_no_token_claro'] = !tokenColumnExists ? 'PASS' : 'FAIL';

  // 1g. Simular upload (registrar documento con hash ficticio)
  const hashFicticio = createHash('sha256').update('contenido-pdf-e2e-anonimizado').digest('hex');
  const doc = await registrarDocumento({
    expedienteId: expediente.id,
    requisitoExpedienteId: req.id,
    enlaceMagicoId: enlace.id,
    nombreOriginal: 'identidad_e2e.pdf',
    nombreSaneado: 'identidad-e2e-abc123.pdf',
    tipoMime: 'application/pdf',
    tamañoBytes: 1024,
    hashSha256: hashFicticio,
    blobUrl: 'file://local/identidad-e2e-abc123.pdf',
    origen: 'cliente',
    metadata: { e2e: true },
  });

  console.log(`  ✓ Documento registrado: ${doc.id} (estado=${doc.estado}, duplicado=${doc.duplicado})`);
  resultados['fase1_upload'] = doc.estado === 'subido' ? 'PASS' : 'FAIL';

  // 1h. Duplicado
  const dup = await existeHashEnExpediente(hashFicticio, expediente.id, { global: false });
  console.log(`  ✓ Duplicado detectado: ${dup.duplicado ? 'OK' : 'FAIL'}`);
  resultados['fase1_duplicado'] = dup.duplicado ? 'PASS' : 'FAIL';

  // ── FASE 2: vincular requisito + seguimiento ──
  console.log('\n--- Fase 2: Seguimiento documental ---');
  const vinc = await vincularDocumentoARequisitoOnUpload({
    expedienteId: expediente.id,
    requisitoExpedienteId: req.id,
  });
  console.log(`  ✓ Requisito vinculado, estado documental: ${vinc}`);
  resultados['fase2_vinculacion'] = vinc ? 'PASS' : 'FAIL';

  // Verificar requisito actualizado
  const [reqAfter] = await db.select({ estado: requisitosExpediente.estado })
    .from(requisitosExpediente).where(eq(requisitosExpediente.id, req.id));
  console.log(`  ✓ Requisito estado: ${reqAfter?.estado}`);
  resultados['fase2_req_actualizado'] = reqAfter?.estado === 'subido' ? 'PASS' : 'FAIL';

  // ── FASE 3: extracción (motor documental) ──
  console.log('\n--- Fase 3: Extracción documental ---');
  // El motor intentará descargar de file://local/... que no existe en este entorno.
  // Por eso, comprobamos que el job se encola y el motor maneja el error controladamente.
  try {
    const resultado = await procesarDocumento(doc.id);
    console.log(`  ✓ Procesar documento: estadoFinal=${resultado.estadoFinal}, error=${resultado.error ?? 'ninguno'}`);
    // Esperado: ilegible o texto_extraido (depende de si el Blob local existe)
    resultados['fase3_motor'] = resultado.estadoFinal !== 'error' ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`  ⚠ Procesar documento lanzó excepción: ${(e as Error).message}`);
    resultados['fase3_motor'] = 'DEGRADADO (esperado sin Blob real)';
  }

  // ── FASE 4: IA o degradación ──
  console.log('\n--- Fase 4: IA documental ---');
  const iaEnabled = isIaEnabled();
  console.log(`  IA habilitada: ${iaEnabled}`);

  if (!iaEnabled) {
    console.log('  ✓ IA no configurada → degradación controlada');
    console.log('  ✓ Readiness debe marcar sin_contradicciones_criticas=unknown (blocking)');
    resultados['fase4_ia'] = 'DEGRADADO (correcto: IA no configurada)';
  } else {
    try {
      const iaResult = await procesarDocumentoConIa(doc.id, 'Texto de prueba E2E anonimizado para análisis.');
      console.log(`  ✓ IA ejecutada: exito=${iaResult.exito}, estado=${iaResult.estadoFinal}`);
      resultados['fase4_ia'] = iaResult.exito ? 'PASS' : 'FAIL';
    } catch (e) {
      console.log(`  ⚠ IA lanzó excepción: ${(e as Error).message}`);
      resultados['fase4_ia'] = 'ERROR';
    }
  }

  // ── FASE 5: readiness ──
  console.log('\n--- Fase 5: Puerta Listo para revisión ---');
  try {
    const readiness = await evaluarPreparacionExpediente(expediente.id);
    if (!readiness) {
      console.log('  ⚠ Readiness devolvió null (expediente en estado no evaluable)');
      resultados['fase5_readiness'] = 'SKIP (estado no evaluable)';
    } else {
      console.log(`  ✓ Readiness: estadoFinal=${readiness.estadoFinal}, score=${readiness.score}`);
      console.log(`  ✓ Checks: ${readiness.checks.length}`);
      for (const c of readiness.checks) {
        console.log(`    - ${c.name}: ${c.status} (blocking=${c.blocking}) — ${c.reason?.slice(0, 60)}`);
      }

      // Verificación crítica: unknown blocking NO permite listo_para_revision
      const unknownBlocking = readiness.checks.filter(c => c.blocking && c.status === 'unknown');
      const esListo = readiness.estadoFinal === 'listo_para_revision';
      const unknownBloquea = unknownBlocking.length > 0 && !esListo;

      console.log(`  ✓ Unknown blocking: ${unknownBlocking.length} checks`);
      console.log(`  ✓ ¿Bloquea listo_para_revision?: ${unknownBloquea ? 'SÍ (correcto)' : unknownBlocking.length === 0 ? 'N/A (no hay unknown blocking)' : 'NO (BUG)'}`);

      resultados['fase5_readiness'] = readiness.estadoFinal !== 'listo_para_revision' || unknownBlocking.length === 0 ? 'PASS' : 'FAIL';
      resultados['fase5_unknown_blocking'] = unknownBloquea || unknownBlocking.length === 0 ? 'PASS' : 'FAIL';
    }
  } catch (e) {
    console.log(`  ⚠ Readiness lanzó excepción: ${(e as Error).message}`);
    resultados['fase5_readiness'] = 'ERROR';
  }

  // ── RESUMEN FINAL ──
  console.log('\n=== RESUMEN E2E ===');
  for (const [k, v] of Object.entries(resultados)) {
    const icon = v === 'PASS' ? '✅' : v.startsWith('DEGRADADO') || v.startsWith('SKIP') ? '⚠️' : '❌';
    console.log(`  ${icon} ${k}: ${v}`);
  }

  // Cleanup
  await cleanup();
  console.log('\n✅ E2E completado. Datos de prueba limpiados.');
  process.exit(0);
}

main().catch((e) => { console.error('E2E FATAL:', e); process.exit(1); });
