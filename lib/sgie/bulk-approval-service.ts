/**
 * BulkApprovalService — P2-07 (Fase 4B-1).
 *
 * Aprobación documental en bloque: operación segura, explicable, idempotente,
 * auditable y parcialmente reversible. El lote NO es "todo o nada": cada
 * documento se valida y ejecuta de forma individual; un documento inválido no
 * impide aprobar los válidos.
 *
 * Flujo:
 *   selección → preview (sin mutar) → confirmación explícita →
 *   validación individual en servidor → ejecución por documento →
 *   resultado por documento → recálculo readiness/resumen/next-action →
 *   auditoría + outbox.
 *
 * Principios:
 * - Deny-by-default: flag `sgie.documents.bulk_approve` debe estar activa.
 * - Autorización real en servidor (capability `documents.approve` + canAccessCase).
 * - Nunca confiar en estados/versiones/confianza enviados por el cliente.
 * - Control optimista por documento (columna `version`).
 * - Idempotencia por (expediente, idempotencyKey).
 * - Sin llamadas externas dentro de transacciones DB.
 * - La automatización puede sugerir, pero la aprobación final es humana.
 */
import { db } from '@/lib/db';
import {
  documentosExpediente,
  documentContradictions,
  documentLinks,
  documentBulkApprovals,
  documentBulkApprovalItems,
  expedientes,
  caseSummaryCheckpoints,
} from '@/lib/schema';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { isFlagEnabled } from './feature-flags';
import { accessService } from '@/lib/access-service';
import { recalcularReadinessSiProcede } from './readiness';
import { recomendarNextAction } from './next-action';
import { logSgie, registrarHistorialExpediente } from './auditoria-sgie';
import { OUTBOX_EVENTS, encolarEvento } from './outbox';
import { getBlockingPackages } from './signature-package-service';
import type { FlagContext } from './feature-flags';

// ─── Estados aprobables ─────────────────────────────────────────────────────
const ESTADOS_APROBABLES = ['pendiente_abogado', 'clasificado', 'ia_procesada'] as const;
// Tipos críticos: nunca auto-aprobar por confianza IA sola; requieren humano.
const TIPOS_CRITICOS = ['demanda', 'poder', 'escrito_inicial', 'querella', 'sentencia'];
const UMBRAL_CONFIANZA_BAJA = 60;
const PREVIEW_TTL_MS = 10 * 60 * 1000; // 10 minutos.
const REVERSION_VENTANA_MS = 72 * 60 * 60 * 1000; // 72 horas.

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type CodigoResultado =
  | 'aprobado'
  | 'ya_aprobado'
  | 'rechazado_validacion'
  | 'conflicto_version'
  | 'no_autorizado'
  | 'no_encontrado'
  | 'bloque_contradiccion'
  | 'procesamiento_pendiente'
  | 'requiere_revision_humana'
  | 'error_tecnico'
  | 'revertido';

export interface ItemPreview {
  documentId: string;
  nombre: string;
  tipoDocumento: string | null;
  requisitoId: string | null;
  version: number;
  estadoActual: string;
  confianza: number | null;
  aprobable: boolean;
  codigoNoAprobable?: CodigoResultado;
  motivoNoAprobable?: string;
  incidencias: string[];
  contradicciones: number;
  bloqueos: string[];
  impactoChecklist: string | null;
  accion: string;
}

export interface PreviewResult {
  batchId: string;
  expedienteId: string;
  previewHash: string;
  caducidad: Date;
  items: ItemPreview[];
  totalElegibles: number;
  totalNoElegibles: number;
}

export interface ItemResultado {
  documentId: string;
  codigo: CodigoResultado;
  motivo?: string;
}

export interface ConfirmResult {
  batchId: string;
  expedienteId: string;
  estado: string;
  aprobados: string[];
  yaAprobados: string[];
  rechazados: ItemResultado[];
  correlationId: string;
}

export interface UndoItemResult {
  documentId: string;
  revertido: boolean;
  motivo?: string;
}

export interface UndoResult {
  batchId: string;
  expedienteId: string;
  revertidos: string[];
  denegados: UndoItemResult[];
}

export type BulkApprovalErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PREVIEW_EXPIRED'
  | 'PREVIEW_STALE'
  | 'IDEMPOTENCY_MISMATCH'
  | 'FLAG_OFF'
  | 'KILL_SWITCH'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'INTERNAL';

export class BulkApprovalError extends Error {
  constructor(public code: BulkApprovalErrorCode, message: string, public statusCode = 400) {
    super(message);
    this.name = 'BulkApprovalError';
  }
}

/** Mapea un error del servicio (o Zod) a una Response JSON con código HTTP coherente. */
export function bulkApprovalErrorResponse(err: unknown): Response {
  if (err instanceof BulkApprovalError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.statusCode });
  }
  // Zod validation.
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
    return Response.json({ error: 'Validación incorrecta', details: (err as unknown as { issues: unknown }).issues }, { status: 422 });
  }
  // ForbiddenError del access-service (HttpError).
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: number }).status === 'number') {
    const e = err as { status: number; message?: string };
    return Response.json({ error: e.message ?? 'Forbidden' }, { status: e.status });
  }
  return Response.json({ error: 'Error interno' }, { status: 500 });
}

export interface BulkApprovalContext {
  actorId: string;
  flagContext?: FlagContext;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function nowPlus(ms: number): Date {
  return new Date(Date.now() + ms);
}

// Lee la confianza IA del documento (metadata.confianzaIa o clasificación vigente).
function extraerConfianza(doc: { metadata: unknown }): number | null {
  const m = doc.metadata as Record<string, unknown> | null;
  const c = m?.confianzaIa;
  return typeof c === 'number' ? c : null;
}

// ─── 1. PREVIEW (sin mutar datos) ───────────────────────────────────────────
export async function generarPreview(
  input: { expedienteId: string; documentIds: string[] },
  ctx: BulkApprovalContext,
): Promise<PreviewResult> {
  // Flag deny-by-default.
  const flagOn = await isFlagEnabled('sgie.documents.bulk_approve', ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new BulkApprovalError('FLAG_OFF', 'Aprobación en bloque desactivada', 403);

  if (input.documentIds.length === 0) {
    throw new BulkApprovalError('VALIDATION', 'Se requiere al menos un documento', 422);
  }

  // Autorización: capability + acceso al expediente.
  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: input.expedienteId,
    capability: 'documents.approve',
  });

  // Cargar documentos del expediente solicitados.
  const docs = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoDocumento: documentosExpediente.tipoDocumento,
      estado: documentosExpediente.estado,
      version: documentosExpediente.version,
      aprobadoPor: documentosExpediente.aprobadoPor,
      procesadoEn: documentosExpediente.procesadoEn,
      requisitoExpedienteId: documentosExpediente.requisitoExpedienteId,
      metadata: documentosExpediente.metadata,
    })
    .from(documentosExpediente)
    .where(
      and(
        eq(documentosExpediente.expedienteId, input.expedienteId),
        inArray(documentosExpediente.id, input.documentIds),
      ),
    );

  // Contradicciones bloqueantes activas del expediente.
  const bloqueantes = await db
    .select({
      id: documentContradictions.id,
      documentAId: documentContradictions.documentAId,
      documentBId: documentContradictions.documentBId,
    })
    .from(documentContradictions)
    .where(
      and(
        eq(documentContradictions.expedienteId, input.expedienteId),
        eq(documentContradictions.bloqueante, true),
        inArray(documentContradictions.estado, ['propuesta', 'confirmada']),
      ),
    );
  const docsEnContradiccion = new Set<string>();
  for (const c of bloqueantes) {
    if (c.documentAId) docsEnContradiccion.add(c.documentAId);
    if (c.documentBId) docsEnContradiccion.add(c.documentBId);
  }

  // Vínculos activos a requisitos (para impacto checklist).
  const vinculos = await db
    .select({ documentId: documentLinks.documentId, requisitoId: documentLinks.requisitoId })
    .from(documentLinks)
    .where(
      and(
        eq(documentLinks.expedienteId, input.expedienteId),
        eq(documentLinks.estado, 'aceptada'),
        inArray(documentLinks.documentId, input.documentIds),
      ),
    );
  const vinculoPorDoc = new Map<string, string | null>();
  for (const v of vinculos) vinculoPorDoc.set(v.documentId, v.requisitoId);

  // Construir items de preview (preservando el orden solicitado).
  const docsById = new Map(docs.map((d) => [d.id, d]));
  const items: ItemPreview[] = [];
  for (const docId of input.documentIds) {
    const doc = docsById.get(docId);
    if (!doc) {
      items.push({
        documentId: docId,
        nombre: '(no encontrado)',
        tipoDocumento: null,
        requisitoId: null,
        version: 0,
        estadoActual: 'desconocido',
        confianza: null,
        aprobable: false,
        codigoNoAprobable: 'no_encontrado',
        motivoNoAprobable: 'El documento no existe o no pertenece al expediente.',
        incidencias: [],
        contradicciones: 0,
        bloqueos: [],
        impactoChecklist: null,
        accion: 'omitir',
      });
      continue;
    }

    const confianza = extraerConfianza(doc);
    const enContradiccion = docsEnContradiccion.has(docId);
    const procesamientoPendiente =
      doc.procesadoEn === null || ['clasificando', 'ocr_pendiente'].includes(doc.estado);
    const yaAprobado = doc.estado === 'aprobado' || doc.aprobadoPor !== null;
    const esCritico = TIPOS_CRITICOS.includes(doc.tipoDocumento ?? '');
    const confianzaBajaCritica = esCritico && confianza !== null && confianza < UMBRAL_CONFIANZA_BAJA;

    let aprobable = ESTADOS_APROBABLES.includes(doc.estado as (typeof ESTADOS_APROBABLES)[number]) || yaAprobado;
    let codigoNoAprobable: CodigoResultado | undefined;
    let motivoNoAprobable: string | undefined;
    const incidencias: string[] = [];
    const bloqueos: string[] = [];

    if (enContradiccion) {
      aprobable = false;
      codigoNoAprobable = 'bloque_contradiccion';
      motivoNoAprobable = 'El documento está implicado en una contradicción bloqueante activa.';
      bloqueos.push('contradiccion_bloqueante');
    }
    if (procesamientoPendiente && !yaAprobado) {
      aprobable = false;
      codigoNoAprobable = 'procesamiento_pendiente';
      motivoNoAprobable = 'El documento tiene procesamiento pendiente o fallido.';
      incidencias.push('procesamiento_pendiente');
    }
    if (confianzaBajaCritica) {
      aprobable = false;
      codigoNoAprobable = 'requiere_revision_humana';
      motivoNoAprobable = `Tipo crítico (${doc.tipoDocumento}) con confianza IA baja (${confianza}); requiere revisión humana obligatoria.`;
      incidencias.push('baja_confianza_critica');
    }

    const requisitoVinculado = vinculoPorDoc.get(docId) ?? null;

    items.push({
      documentId: docId,
      nombre: doc.nombreOriginal,
      tipoDocumento: doc.tipoDocumento,
      requisitoId: requisitoVinculado,
      version: doc.version,
      estadoActual: doc.estado,
      confianza,
      aprobable,
      codigoNoAprobable,
      motivoNoAprobable,
      incidencias,
      contradicciones: enContradiccion ? 1 : 0,
      bloqueos,
      impactoChecklist: requisitoVinculado ? `Cubre requisito ${requisitoVinculado}` : null,
      accion: !aprobable ? 'omitir' : yaAprobado ? 'ya_aprobado' : 'aprobar',
    });
  }

  // Hash de preview estable (idempotencia + detección de cambios).
  const previewHash = sha256(
    JSON.stringify({
      expedienteId: input.expedienteId,
      actorId: ctx.actorId,
      items: items.map((i) => ({ id: i.documentId, v: i.version, e: i.estadoActual, a: i.aprobable })),
    }),
  );
  const caducidad = nowPlus(PREVIEW_TTL_MS);
  const batchId = randomUUID();

  // Persistir la cabecera del lote + items (sin mutar documentos).
  await db
    .insert(documentBulkApprovals)
    .values({
      id: batchId,
      expedienteId: input.expedienteId,
      actorId: ctx.actorId,
      idempotencyKey: `preview:${batchId}`, // clave temporal única; se reemplaza en confirmar.
      previewHash,
      estado: 'pendiente',
      previewCaducidad: caducidad,
      total: items.length,
      resultados: { items: items.map((i) => ({ documentId: i.documentId, aprobable: i.aprobable })) },
    })
    .onConflictDoNothing();

  await db.insert(documentBulkApprovalItems).values(
    items.map((i) => ({
      bulkApprovalId: batchId,
      documentId: i.documentId,
      expedienteId: input.expedienteId,
      versionSnapshot: i.version,
      tipoDocumento: i.tipoDocumento,
      requisitoId: i.requisitoId,
      estadoPrevio: i.estadoActual,
      resultado: 'pendiente',
      motivo: i.motivoNoAprobable ?? null,
    })),
  );

  const totalElegibles = items.filter((i) => i.aprobable && i.accion !== 'ya_aprobado').length;
  const totalNoElegibles = items.filter((i) => !i.aprobable).length;

  return {
    batchId,
    expedienteId: input.expedienteId,
    previewHash,
    caducidad,
    items,
    totalElegibles,
    totalNoElegibles,
  };
}

// ─── 2. CONFIRMAR (validación individual + ejecución por documento) ─────────
export async function confirmarAprobacion(
  input: { batchId: string; idempotencyKey: string; previewHash: string; expedienteId?: string },
  ctx: BulkApprovalContext,
): Promise<ConfirmResult> {
  const flagOn = await isFlagEnabled('sgie.documents.bulk_approve', ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new BulkApprovalError('FLAG_OFF', 'Aprobación en bloque desactivada', 403);

  // Cargar lote con campos necesarios para idempotencia.
  const [batch] = await db
    .select({
      id: documentBulkApprovals.id,
      expedienteId: documentBulkApprovals.expedienteId,
      actorId: documentBulkApprovals.actorId,
      idempotencyKey: documentBulkApprovals.idempotencyKey,
      previewHash: documentBulkApprovals.previewHash,
      estado: documentBulkApprovals.estado,
      previewCaducidad: documentBulkApprovals.previewCaducidad,
      resultados: documentBulkApprovals.resultados,
      correlationId: documentBulkApprovals.correlationId,
    })
    .from(documentBulkApprovals)
    .where(eq(documentBulkApprovals.id, input.batchId))
    .limit(1);
  if (!batch) throw new BulkApprovalError('NOT_FOUND', 'Lote no encontrado', 404);

  // Defensa en profundidad: expediente del URL debe coincidir con el del lote.
  if (input.expedienteId && batch.expedienteId !== input.expedienteId) {
    throw new BulkApprovalError('VALIDATION', 'El expediente no coincide con el lote', 422);
  }

  // Idempotencia: si ya fue confirmado con misma key (no en estado preview).
  const isPreviewState = batch.idempotencyKey.startsWith('preview:');
  if (!isPreviewState && batch.idempotencyKey === input.idempotencyKey && batch.estado !== 'pendiente') {
    if (batch.previewHash !== input.previewHash) {
      throw new BulkApprovalError('IDEMPOTENCY_MISMATCH', 'IdempotencyKey reutilizada con preview distinta', 409);
    }
    return reconstruirResultado(batch);
  }

  // Si ya fue confirmado por otro actor (key distinta, ya no en preview).
  if (!isPreviewState && batch.idempotencyKey !== input.idempotencyKey) {
    throw new BulkApprovalError('CONFLICT', 'El lote ya fue confirmado con otra clave de idempotencia', 409);
  }

  // Validar preview hash.
  if (batch.previewHash !== input.previewHash) {
    throw new BulkApprovalError('PREVIEW_STALE', 'La preview ha cambiado; regenerar', 409);
  }
  // Validar caducidad.
  if (new Date(batch.previewCaducidad).getTime() < Date.now()) {
    await db
      .update(documentBulkApprovals)
      .set({ estado: 'expirada', actualizadoEn: new Date() })
      .where(eq(documentBulkApprovals.id, input.batchId));
    throw new BulkApprovalError('PREVIEW_EXPIRED', 'La preview ha caducado', 409);
  }

  // Re-autorización.
  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: batch.expedienteId,
    capability: 'documents.approve',
  });

  // Asignación atómica de idempotencyKey + correlationId (solo si aún en preview).
  const correlationId = randomUUID();
  const claimResult = await db
    .update(documentBulkApprovals)
    .set({ idempotencyKey: input.idempotencyKey, correlationId, actualizadoEn: new Date() })
    .where(
      and(
        eq(documentBulkApprovals.id, input.batchId),
        eq(documentBulkApprovals.idempotencyKey, `preview:${input.batchId}`),
      ),
    )
    .returning({ id: documentBulkApprovals.id });

  if (claimResult.length === 0) {
    // Otro proceso reclamó el lote primero. Re-leer para determinar la respuesta.
    const [actual] = await db
      .select({ id: documentBulkApprovals.id, expedienteId: documentBulkApprovals.expedienteId, idempotencyKey: documentBulkApprovals.idempotencyKey, estado: documentBulkApprovals.estado, resultados: documentBulkApprovals.resultados, correlationId: documentBulkApprovals.correlationId, previewHash: documentBulkApprovals.previewHash })
      .from(documentBulkApprovals)
      .where(eq(documentBulkApprovals.id, input.batchId));
    if (!actual) throw new BulkApprovalError('NOT_FOUND', 'Lote eliminado concurrentemente', 404);
    if (actual.idempotencyKey === input.idempotencyKey) {
      if (actual.previewHash !== input.previewHash) {
        throw new BulkApprovalError('IDEMPOTENCY_MISMATCH', 'IdempotencyKey reutilizada con preview distinta', 409);
      }
      return reconstruirResultado(actual);
    }
    throw new BulkApprovalError('CONFLICT', 'El lote fue confirmado por otro proceso concurrente', 409);
  }

  // Cargar items del lote.
  const itemsBatch = await db
    .select()
    .from(documentBulkApprovalItems)
    .where(eq(documentBulkApprovalItems.bulkApprovalId, input.batchId));

  const aprobados: string[] = [];
  const yaAprobados: string[] = [];
  const rechazados: ItemResultado[] = [];

  // Ejecución por documento (cada uno en su propia transacción/UPDATE atómico).
  for (const item of itemsBatch) {
    // Re-leer estado actual del documento.
    const [docActual] = await db
      .select({
        id: documentosExpediente.id,
        estado: documentosExpediente.estado,
        version: documentosExpediente.version,
        aprobadoPor: documentosExpediente.aprobadoPor,
      })
      .from(documentosExpediente)
      .where(eq(documentosExpediente.id, item.documentId))
      .limit(1);

    if (!docActual) {
      rechazados.push({ documentId: item.documentId, codigo: 'no_encontrado', motivo: 'Documento eliminado' });
      await marcarItem(item.id, 'no_encontrado', 'Documento eliminado');
      continue;
    }

    // Si ya estaba aprobado (por otra vía).
    if (docActual.estado === 'aprobado' || docActual.aprobadoPor !== null) {
      yaAprobados.push(item.documentId);
      await marcarItem(item.id, 'ya_aprobado', 'Ya aprobado');
      continue;
    }

    // Re-validar estado aprobable.
    if (!ESTADOS_APROBABLES.includes(docActual.estado as (typeof ESTADOS_APROBABLES)[number])) {
      rechazados.push({
        documentId: item.documentId,
        codigo: 'rechazado_validacion',
        motivo: `Estado no aprobable: ${docActual.estado}`,
      });
      await marcarItem(item.id, 'rechazado_validacion', `Estado no aprobable: ${docActual.estado}`);
      continue;
    }

    // Control optimista: UPDATE condicional por versión.
    const resultado = await db
      .update(documentosExpediente)
      .set({
        estado: 'aprobado',
        aprobadoPor: ctx.actorId,
        aprobadoEn: new Date(),
        version: sql`${documentosExpediente.version} + 1`,
      })
      .where(
        and(
          eq(documentosExpediente.id, item.documentId),
          eq(documentosExpediente.version, item.versionSnapshot),
        ),
      )
      .returning({ id: documentosExpediente.id });

    if (resultado.length === 0) {
      // Conflicto de versión: otra mutación concurrente.
      rechazados.push({
        documentId: item.documentId,
        codigo: 'conflicto_version',
        motivo: 'Otra mutación concurrente modificó el documento',
      });
      await marcarItem(item.id, 'conflicto_version', 'Conflicto de versión concurrente');
      continue;
    }

    aprobados.push(item.documentId);
    await marcarItem(item.id, 'aprobado', null);

    // Historial + outbox por documento aprobado.
    await registrarHistorialExpediente({
      expedienteId: batch.expedienteId,
      accion: 'documento_aprobado',
      estadoAnterior: item.estadoPrevio,
      estadoNuevo: 'aprobado',
      actorId: ctx.actorId,
      actorTipo: 'abogado',
      metadata: { documentId: item.documentId, batchId: input.batchId, bulk: true },
      mensaje: `Documento ${item.documentId} aprobado en lote ${input.batchId}`,
    });
    await encolarEvento({
      tipo: OUTBOX_EVENTS.DOCUMENT_APPROVED,
      aggregateType: 'documento',
      aggregateId: item.documentId,
      payload: { documentId: item.documentId, expedienteId: batch.expedienteId, batchId: input.batchId, actorId: ctx.actorId },
      correlationId,
    });
  }

  // Auditoría del lote (una sola fila, sin duplicar por doc).
  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'documento_bulk_approved',
    recurso: 'expediente',
    recursoId: batch.expedienteId,
    metadata: {
      batchId: input.batchId,
      expedienteId: batch.expedienteId,
      aprobados: aprobados.length,
      yaAprobados: yaAprobados.length,
      rechazados: rechazados.length,
      ids: { aprobados, yaAprobados, rechazados: rechazados.map((r) => r.documentId) },
      correlationId,
    },
    exito: true,
  });

  // Estado final del lote.
  const estadoFinal = rechazados.length === 0 ? 'confirmada' : 'parcial';
  await db
    .update(documentBulkApprovals)
    .set({
      estado: estadoFinal,
      confirmadaEn: new Date(),
      aprobados: aprobados.length,
      yaAprobados: yaAprobados.length,
      rechazados: rechazados.length,
      resultados: { aprobados, yaAprobados, rechazados },
      correlationId,
      actualizadoEn: new Date(),
    })
    .where(eq(documentBulkApprovals.id, input.batchId));

  // Cascadas post-aprobación (fuera de transacción de documentos).
  await ejecutarCascadas(batch.expedienteId, ctx);

  return {
    batchId: input.batchId,
    expedienteId: batch.expedienteId,
    estado: estadoFinal,
    aprobados,
    yaAprobados,
    rechazados,
    correlationId,
  };
}

async function marcarItem(itemId: string, resultado: CodigoResultado, motivo: string | null): Promise<void> {
  await db
    .update(documentBulkApprovalItems)
    .set({ resultado, motivo, decididoEn: new Date() })
    .where(eq(documentBulkApprovalItems.id, itemId));
}

async function reconstruirResultado(batch: { id?: string; expedienteId?: string; estado: string; resultados: unknown; correlationId: string | null; batchId?: string }): Promise<ConfirmResult> {
  const r = (batch.resultados as { aprobados?: string[]; yaAprobados?: string[]; rechazados?: ItemResultado[] }) ?? {};
  return {
    batchId: (batch.batchId ?? batch.id)!,
    expedienteId: batch.expedienteId!,
    estado: batch.estado,
    aprobados: r.aprobados ?? [],
    yaAprobados: r.yaAprobados ?? [],
    rechazados: r.rechazados ?? [],
    correlationId: batch.correlationId ?? '',
  };
}

// Recálculo de readiness, invalidación de resumen y next-action.
async function ejecutarCascadas(expedienteId: string, ctx: BulkApprovalContext): Promise<void> {
  // 1. Readiness: recalcular (idempotente, traga errores).
  await recalcularReadinessSiProcede(expedienteId).catch(() => undefined);

  // 2. Resumen incremental: invalidar checkpoint vigente (sin llamar a IA aquí).
  await db
    .update(caseSummaryCheckpoints)
    .set({ estado: 'invalidado' })
    .where(
      and(
        eq(caseSummaryCheckpoints.expedienteId, expedienteId),
        eq(caseSummaryCheckpoints.estado, 'vigente'),
      ),
    );

  // 3. Next-action: recalcular (respeta su propia flag + kill switch).
  await recomendarNextAction({ expedienteId, flagContext: ctx.flagContext }).catch(() => undefined);
}

// ─── 3. CONSULTAR RESULTADO ─────────────────────────────────────────────────
export async function consultarResultado(batchId: string, ctx: BulkApprovalContext): Promise<ConfirmResult> {
  const [batch] = await db
    .select()
    .from(documentBulkApprovals)
    .where(eq(documentBulkApprovals.id, batchId))
    .limit(1);
  if (!batch) throw new BulkApprovalError('NOT_FOUND', 'Lote no encontrado', 404);

  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: batch.expedienteId,
    capability: 'documents.read',
  });

  return reconstruirResultado(batch);
}

// ─── 4. REVERTIR APROBACIÓN (solo si segura) ────────────────────────────────
export async function revertirAprobacion(
  input: { batchId: string; motivo: string; documentIds?: string[] },
  ctx: BulkApprovalContext,
): Promise<UndoResult> {
  if (input.motivo.length < 10) {
    throw new BulkApprovalError('VALIDATION', 'Motivo obligatorio (mínimo 10 caracteres)', 422);
  }

  const flagOn = await isFlagEnabled('sgie.documents.bulk_approve', ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new BulkApprovalError('FLAG_OFF', 'Aprobación en bloque desactivada', 403);

  const [batch] = await db
    .select()
    .from(documentBulkApprovals)
    .where(eq(documentBulkApprovals.id, input.batchId))
    .limit(1);
  if (!batch) throw new BulkApprovalError('NOT_FOUND', 'Lote no encontrado', 404);

  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: batch.expedienteId,
    capability: 'documents.approve',
  });

  // Items aprobados en el lote (o subconjunto solicitado).
  const items = await db
    .select()
    .from(documentBulkApprovalItems)
    .where(
      and(
        eq(documentBulkApprovalItems.bulkApprovalId, input.batchId),
        eq(documentBulkApprovalItems.resultado, 'aprobado'),
        input.documentIds ? inArray(documentBulkApprovalItems.documentId, input.documentIds) : sql`TRUE`,
      ),
    );

  // Estado del expediente: si avanzó, no se puede revertir.
  const [exp] = await db
    .select({ id: expedientes.id, estado: expedientes.estado })
    .from(expedientes)
    .where(eq(expedientes.id, batch.expedienteId))
    .limit(1);
  const expedienteAvanzado =
    exp && ['pendiente_validacion_abogado', 'listo_para_revision', 'en_revision', 'aprobado'].includes(exp.estado ?? '');

  const revertidos: string[] = [];
  const denegados: UndoItemResult[] = [];
  const correlationId = batch.correlationId ?? randomUUID();

  for (const item of items) {
    // Re-leer doc actual.
    const [docActual] = await db
      .select({
        id: documentosExpediente.id,
        version: documentosExpediente.version,
        aprobadoPor: documentosExpediente.aprobadoPor,
        aprobadoEn: documentosExpediente.aprobadoEn,
      })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, item.documentId))
    .limit(1);

    if (!docActual || docActual.aprobadoPor === null) {
      denegados.push({ documentId: item.documentId, revertido: false, motivo: 'El documento no está aprobado' });
      continue;
    }

    // Tiempo transcurrido.
    const aprobadoEnMs = docActual.aprobadoEn ? new Date(docActual.aprobadoEn).getTime() : 0;
    const fueraDeVentana = Date.now() - aprobadoEnMs > REVERSION_VENTANA_MS;
    if (fueraDeVentana) {
      denegados.push({ documentId: item.documentId, revertido: false, motivo: 'Ventana de reversión (72h) superada' });
      continue;
    }

    // Cambios posteriores: versión actual > snapshot del lote + 1 (la propia aprobación).
    if (docActual.version > item.versionSnapshot + 1) {
      denegados.push({ documentId: item.documentId, revertido: false, motivo: 'Hubo cambios posteriores a la aprobación' });
      continue;
    }

    // P2-08: verificar que ningún paquete de firma active dependa de este documento.
    const blocking = await getBlockingPackages([item.documentId]);
    if (blocking.length > 0) {
      denegados.push({
        documentId: item.documentId,
        revertido: false,
        motivo: `El documento está incluido en ${blocking.length} paquete(s) de firma activo(s): ${blocking.map(b => b.packageId).join(', ')} (estado: ${blocking.map(b => b.estado).join(', ')})`,
      });
      continue;
    }

    // Expediente avanzó: no revertir.
    if (expedienteAvanzado) {
      denegados.push({ documentId: item.documentId, revertido: false, motivo: 'El expediente avanzó de estado tras la aprobación' });
      continue;
    }

    // Reversión segura: update condicional (no borra historial).
    const resultado = await db
      .update(documentosExpediente)
      .set({
        estado: 'pendiente_abogado',
        aprobadoPor: null,
        aprobadoEn: null,
        version: sql`${documentosExpediente.version} + 1`,
      })
      .where(
        and(
          eq(documentosExpediente.id, item.documentId),
          isNotNull(documentosExpediente.aprobadoPor),
        ),
      )
      .returning({ id: documentosExpediente.id });

    if (resultado.length === 0) {
      denegados.push({ documentId: item.documentId, revertido: false, motivo: 'Conflicto al revertir (cambio concurrente)' });
      continue;
    }

    revertidos.push(item.documentId);
    await marcarItem(item.id, 'revertido', input.motivo);

    await registrarHistorialExpediente({
      expedienteId: batch.expedienteId,
      accion: 'documento_revertido',
      estadoAnterior: 'aprobado',
      estadoNuevo: 'pendiente_abogado',
      actorId: ctx.actorId,
      actorTipo: 'abogado',
      metadata: { documentId: item.documentId, batchId: input.batchId, motivo: input.motivo },
      mensaje: `Documento ${item.documentId} revertido: ${input.motivo}`,
    });
    await encolarEvento({
      tipo: OUTBOX_EVENTS.DOCUMENT_APPROVAL_REVERTED,
      aggregateType: 'documento',
      aggregateId: item.documentId,
      payload: { documentId: item.documentId, expedienteId: batch.expedienteId, batchId: input.batchId, motivo: input.motivo },
      correlationId,
    });
  }

  // Auditoría de reversión.
  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'documento_bulk_reverted',
    recurso: 'expediente',
    recursoId: batch.expedienteId,
    metadata: {
      batchId: input.batchId,
      expedienteId: batch.expedienteId,
      revertidos: revertidos.length,
      denegados: denegados.length,
      motivo: input.motivo,
      correlationId,
    },
    exito: true,
  });

  if (revertidos.length > 0) {
    await ejecutarCascadas(batch.expedienteId, ctx);
  }

  return {
    batchId: input.batchId,
    expedienteId: batch.expedienteId,
    revertidos,
    denegados,
  };
}
