/**
 * SignatureService — P2-09 (Fase 4B-3).
 *
 * Orquestación de firma electrónica mediante proveedor desacoplado.
 * Coordina: validación del paquete → envío al proveedor → recepción
 * de webhooks → descarga de artefactos → actualización del expediente.
 */
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { signatureEnvelopes, signatureEnvelopeSigners, signatureEvents, signatureArtifacts, signaturePackages, signaturePackageSigners, caseSummaryCheckpoints } from '@/lib/schema';
import { isFlagEnabled } from './feature-flags';
import { accessService } from '@/lib/access-service';
import { logSgie } from './auditoria-sgie';
import { OUTBOX_EVENTS, encolarEvento } from './outbox';
import { recalcularReadinessSiProcede } from './readiness';
import { recomendarNextAction } from './next-action';
import { SandboxSignatureProvider } from '@/lib/signature/sandbox-provider';
import type { SignatureProvider, CreateEnvelopeInput } from '@/lib/signature/provider';
import type { FlagContext } from './feature-flags';

const FLAG_KEY = 'sgie.signature.enabled';
const PROVIDERS: Record<string, SignatureProvider> = {};

function getProvider(): SignatureProvider {
  const id = process.env.SIGNATURE_PROVIDER || 'sandbox';
  if (!PROVIDERS[id]) {
    if (id === 'sandbox') PROVIDERS[id] = new SandboxSignatureProvider();
    else throw new SignatureServiceError('INTERNAL', `Proveedor no configurado: ${id}`, 500);
  }
  return PROVIDERS[id];
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type EnvelopeEstado =
  | 'draft' | 'submitting' | 'sent' | 'partially_signed'
  | 'completed' | 'declined' | 'cancelled' | 'expired'
  | 'provider_error' | 'intervention_required';

export interface EnvelopeResult {
  envelopeId: string;
  signaturePackageId: string;
  providerEnvelopeId: string | null;
  estadoInterno: EnvelopeEstado;
  estadoExterno: string | null;
  correlationId: string;
}

export interface EnvelopeDetail extends EnvelopeResult {
  expedienteId: string;
  signers: Array<{
    id: string;
    nombre: string;
    rolDocumento: string;
    orden: number;
    estado: string;
    signedAt: string | null;
    viewedAt: string | null;
  }>;
  events: Array<{
    tipo: string;
    occurredAt: string;
    providerEventId: string;
  }>;
  artifacts: Array<{
    id: string;
    tipo: string;
    nombre: string;
    hashSha256: string | null;
  }>;
}

export type SignatureServiceErrorCode =
  | 'FORBIDDEN' | 'NOT_FOUND' | 'FLAG_OFF' | 'KILL_SWITCH'
  | 'VALIDATION' | 'CONFLICT' | 'IDEMPOTENCY_MISMATCH'
  | 'PACKAGE_NOT_LOCKED' | 'INTEGRITY_FAILED'
  | 'PROVIDER_ERROR' | 'IMMUTABLE' | 'INTERNAL';

export class SignatureServiceError extends Error {
  constructor(public code: SignatureServiceErrorCode, message: string, public statusCode = 400) {
    super(message);
    this.name = 'SignatureServiceError';
  }
}

export function signatureServiceErrorResponse(err: unknown): Response {
  if (err instanceof SignatureServiceError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.statusCode });
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
    return Response.json({ error: 'Validación incorrecta', details: (err as unknown as { issues: unknown }).issues }, { status: 422 });
  }
  if (err && typeof err === 'object' && 'status' in err) {
    const e = err as { status: number; message?: string };
    return Response.json({ error: e.message ?? 'Forbidden' }, { status: e.status });
  }
  return Response.json({ error: 'Error interno' }, { status: 500 });
}

// ─── State mapping ──────────────────────────────────────────────────────────

function normalizeEstado(providerEstado: string): EnvelopeEstado {
  const map: Record<string, EnvelopeEstado> = {
    created: 'sent', sent: 'sent', delivered: 'sent', viewed: 'sent',
    partially_signed: 'partially_signed', signed: 'partially_signed',
    completed: 'completed', declined: 'declined', voided: 'cancelled',
    cancelled: 'cancelled', expired: 'expired',
    error: 'provider_error', intervention_required: 'intervention_required',
  };
  return map[providerEstado?.toLowerCase()] || 'sent';
}

// ─── 1. SEND ────────────────────────────────────────────────────────────────

export async function sendEnvelope(
  input: { signaturePackageId: string; idempotencyKey: string; expedienteId?: string },
  ctx: { actorId: string; flagContext?: FlagContext },
): Promise<EnvelopeResult> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignatureServiceError('FLAG_OFF', 'Firma electrónica desactivada', 403);

  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, input.signaturePackageId)).limit(1);
  if (!pkg) throw new SignatureServiceError('NOT_FOUND', 'Paquete no encontrado', 404);
  if (pkg.estado !== 'locked') throw new SignatureServiceError('PACKAGE_NOT_LOCKED', 'El paquete debe estar bloqueado (locked) para enviarse a firma', 409);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.send' });

  // Idempotencia
  const [existing] = await db.select().from(signatureEnvelopes)
    .where(and(eq(signatureEnvelopes.signaturePackageId, input.signaturePackageId), eq(signatureEnvelopes.idempotencyKey, input.idempotencyKey)))
    .limit(1);
  if (existing && existing.estadoInterno !== 'draft') {
    return { envelopeId: existing.id, signaturePackageId: existing.signaturePackageId,
      providerEnvelopeId: existing.providerEnvelopeId, estadoInterno: existing.estadoInterno as EnvelopeEstado,
      estadoExterno: existing.estadoExterno, correlationId: existing.correlationId ?? '' };
  }

  // Active envelope check
  const [active] = await db.select({ id: signatureEnvelopes.id }).from(signatureEnvelopes)
    .where(and(eq(signatureEnvelopes.signaturePackageId, input.signaturePackageId),
      eq(signatureEnvelopes.packageVersion, pkg.version)))
    .limit(1);
  if (active && existing?.id !== active.id) {
    throw new SignatureServiceError('CONFLICT', 'Ya existe un envelope activo para este paquete y versión', 409);
  }

  const correlationId = randomUUID();
  const envId = existing?.id || randomUUID();

  // Crear/reservar envelope durable
  await db.insert(signatureEnvelopes).values({
    id: envId, expedienteId: pkg.expedienteId, signaturePackageId: pkg.id,
    packageVersion: pkg.version, provider: 'sandbox', idempotencyKey: input.idempotencyKey,
    correlationId, createdBy: ctx.actorId, estadoInterno: 'draft',
  }).onConflictDoNothing();

  // Copiar firmantes del paquete
  const pkgSigners = await db.select().from(signaturePackageSigners).where(eq(signaturePackageSigners.packageId, pkg.id));
  for (const s of pkgSigners) {
    await db.insert(signatureEnvelopeSigners).values({
      envelopeId: envId, packageSignerId: s.id, providerSignerId: `sbx-signer-${randomUUID()}`,
      nombre: s.nombre, email: s.email, identificador: s.identificador,
      rolDocumento: s.rolDocumento, orden: s.orden, obligatorio: s.obligatorio,
      estado: 'pending',
    }).onConflictDoNothing();
  }

  // Items del paquete (usados para construir el input del provider)
  const pkgItems = await db.select().from(signaturePackages).where(eq(signaturePackages.id, pkg.id));

  // Llamada externa (fuera de transacción DB)
  try {
    const provider = getProvider();
    const providerInput: CreateEnvelopeInput = {
      packageId: pkg.id, expedienteId: pkg.expedienteId, titulo: pkg.titulo,
      documentos: pkgItems.map((_, i) => ({ documentId: '', nombreNormalizado: '', hashSha256: '', mime: null, tamanoBytes: null, orden: i })),
      firmantes: pkgSigners.map((s) => ({ signerId: s.id, nombre: s.nombre, email: s.email ?? null, rolDocumento: s.rolDocumento, orden: s.orden, obligatorio: s.obligatorio })),
      ordenFirma: true, callbackUrl: `${process.env.APP_URL || ''}/api/webhooks/signature/sandbox`.replace(/([^:]\/)\/+/g, '$1'),
      idempotencyKey: input.idempotencyKey,
    };
    const result = await provider.createEnvelope(providerInput);

    await db.update(signatureEnvelopes)
      .set({ estadoInterno: 'sent', estadoExterno: result.estado ?? 'sent', providerEnvelopeId: result.providerEnvelopeId, sentAt: new Date(), lastSyncedAt: new Date(), providerMetadata: result.providerMetadata as Record<string, unknown>, actualizadoEn: new Date() })
      .where(eq(signatureEnvelopes.id, envId));

    await logSgie({ usuarioId: ctx.actorId, accion: 'signature_envelope_sent', recurso: 'signature_envelope', recursoId: envId, metadata: { signaturePackageId: pkg.id, providerEnvelopeId: result.providerEnvelopeId, correlationId }, exito: true });
    await encolarEvento({ tipo: OUTBOX_EVENTS.SIGNATURE_ENVELOPE_SENT, aggregateType: 'signature_envelope', aggregateId: envId, payload: { envelopeId: envId, signaturePackageId: pkg.id, providerEnvelopeId: result.providerEnvelopeId }, correlationId });

    return { envelopeId: envId, signaturePackageId: pkg.id, providerEnvelopeId: result.providerEnvelopeId, estadoInterno: 'sent', estadoExterno: result.estado, correlationId };
  } catch (err) {
    await db.update(signatureEnvelopes).set({ estadoInterno: 'provider_error', actualizadoEn: new Date() }).where(eq(signatureEnvelopes.id, envId));
    throw new SignatureServiceError('PROVIDER_ERROR', `Error del proveedor: ${(err as Error).message}`, 502);
  }
}

// ─── 2. GET ─────────────────────────────────────────────────────────────────

export async function getEnvelope(envelopeId: string, ctx: { actorId: string }): Promise<EnvelopeDetail> {
  const [env] = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.id, envelopeId)).limit(1);
  if (!env) throw new SignatureServiceError('NOT_FOUND', 'Envelope no encontrado', 404);
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: env.expedienteId, capability: 'signature.read' });

  const signers = await db.select().from(signatureEnvelopeSigners).where(eq(signatureEnvelopeSigners.envelopeId, envelopeId)).orderBy(signatureEnvelopeSigners.orden);
  const events = await db.select().from(signatureEvents).where(eq(signatureEvents.envelopeId, envelopeId)).orderBy(signatureEvents.occurredAt);
  const artifacts = await db.select().from(signatureArtifacts).where(eq(signatureArtifacts.envelopeId, envelopeId));

  return {
    envelopeId: env.id, signaturePackageId: env.signaturePackageId,
    providerEnvelopeId: env.providerEnvelopeId, estadoInterno: env.estadoInterno as EnvelopeEstado,
    estadoExterno: env.estadoExterno, correlationId: env.correlationId ?? '',
    expedienteId: env.expedienteId,
    signers: signers.map((s) => ({ id: s.id, nombre: s.nombre, rolDocumento: s.rolDocumento, orden: s.orden, estado: s.estado, signedAt: s.signedAt?.toISOString() ?? null, viewedAt: s.viewedAt?.toISOString() ?? null })),
    events: events.map((e) => ({ tipo: e.tipo, occurredAt: e.occurredAt.toISOString(), providerEventId: e.providerEventId ?? '' })),
    artifacts: artifacts.map((a) => ({ id: a.id, tipo: a.tipo, nombre: a.nombre, hashSha256: a.hashSha256 })),
  };
}

// ─── 3. CANCEL ──────────────────────────────────────────────────────────────

export async function cancelEnvelope(
  input: { envelopeId: string; motivo: string; expedienteId?: string },
  ctx: { actorId: string },
): Promise<void> {
  if (input.motivo.length < 10) throw new SignatureServiceError('VALIDATION', 'Motivo obligatorio (mínimo 10 caracteres)', 422);

  const [env] = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.id, input.envelopeId)).limit(1);
  if (!env) throw new SignatureServiceError('NOT_FOUND', 'Envelope no encontrado', 404);
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: env.expedienteId, capability: 'signature.cancel' });

  if (['completed', 'cancelled', 'declined', 'expired'].includes(env.estadoInterno)) {
    throw new SignatureServiceError('IMMUTABLE', `No se puede cancelar un envelope en estado ${env.estadoInterno}`, 409);
  }

  if (env.providerEnvelopeId) {
    try { await getProvider().cancelEnvelope({ providerEnvelopeId: env.providerEnvelopeId, motivo: input.motivo }); }
    catch { /* best-effort: registrar cancelación local incluso si el proveedor falla */ }
  }

  await db.update(signatureEnvelopes)
    .set({ estadoInterno: 'cancelled', cancelledAt: new Date(), cancelMotivo: input.motivo, actualizadoEn: new Date() })
    .where(eq(signatureEnvelopes.id, input.envelopeId));

  await logSgie({ usuarioId: ctx.actorId, accion: 'signature_envelope_cancelled', recurso: 'signature_envelope', recursoId: env.id, metadata: { motivo: input.motivo }, exito: true });
  await encolarEvento({ tipo: OUTBOX_EVENTS.SIGNATURE_ENVELOPE_CANCELLED, aggregateType: 'signature_envelope', aggregateId: env.id, payload: { envelopeId: env.id, motivo: input.motivo }, correlationId: env.correlationId ?? undefined });
}

// ─── 4. PROCESS WEBHOOK ─────────────────────────────────────────────────────

export async function processWebhook(input: { rawBody: string; headers: Record<string, string | string[] | undefined>; provider: string }): Promise<{ ok: boolean; envelopeId?: string }> {
  const event = await getProvider().verifyWebhook({ rawBody: input.rawBody, headers: input.headers });
  if (event.provider !== input.provider) throw new SignatureServiceError('VALIDATION', `Proveedor no coincide: esperado ${input.provider}, recibido ${event.provider}`, 422);

  const [env] = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.providerEnvelopeId, event.providerEnvelopeId)).limit(1);
  if (!env) throw new SignatureServiceError('NOT_FOUND', `Envelope no encontrado para providerEnvelopeId=${event.providerEnvelopeId}`, 404);

  // Anti-replay
  const [dup] = await db.select({ id: signatureEvents.id })
    .from(signatureEvents)
    .where(and(eq(signatureEvents.provider, event.provider), eq(signatureEvents.providerEventId, event.providerEventId)))
    .limit(1);
  if (dup) return { ok: true, envelopeId: env.id };

  // Registrar evento
  await db.insert(signatureEvents).values({
    envelopeId: env.id, provider: event.provider, providerEventId: event.providerEventId,
    tipo: event.tipo, payloadHash: createHash('sha256').update(JSON.stringify(event.payload)).digest('hex'),
    occurredAt: new Date(event.occurredAt), verified: true, correlationId: randomUUID(),
  });

  // Actualizar estado
  const nuevoEstado = normalizeEstado(String(event.payload.estado ?? event.tipo));
  await db.update(signatureEnvelopes)
    .set({ estadoInterno: nuevoEstado, estadoExterno: String(event.payload.estado ?? ''), lastSyncedAt: new Date(), actualizadoEn: new Date() })
    .where(eq(signatureEnvelopes.id, env.id));

  if (nuevoEstado === 'completed') {
    await db.update(signatureEnvelopes).set({ completedAt: new Date() }).where(eq(signatureEnvelopes.id, env.id));
    await logSgie({ usuarioId: env.createdBy, accion: 'signature_envelope_completed', recurso: 'signature_envelope', recursoId: env.id, metadata: { providerEnvelopeId: event.providerEnvelopeId }, exito: true });
    await encolarEvento({ tipo: OUTBOX_EVENTS.SIGNATURE_ENVELOPE_COMPLETED, aggregateType: 'signature_envelope', aggregateId: env.id, payload: { envelopeId: env.id, providerEnvelopeId: event.providerEnvelopeId }, correlationId: env.correlationId ?? undefined });
    await ejecutarCascadas(env.expedienteId);
  }

  await logSgie({ usuarioId: env.createdBy, accion: 'signature_webhook_received', recurso: 'signature_envelope', recursoId: env.id, metadata: { providerEventId: event.providerEventId, tipo: event.tipo }, exito: true });

  return { ok: true, envelopeId: env.id };
}

// ─── 5. RECONCILE ───────────────────────────────────────────────────────────

export async function reconcileEnvelope(envelopeId: string, ctx: { actorId: string }): Promise<EnvelopeResult> {
  const [env] = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.id, envelopeId)).limit(1);
  if (!env) throw new SignatureServiceError('NOT_FOUND', 'Envelope no encontrado', 404);
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: env.expedienteId, capability: 'signature.read' });
  if (!env.providerEnvelopeId) throw new SignatureServiceError('VALIDATION', 'El envelope no tiene providerEnvelopeId', 422);

  const snapshot = await getProvider().getEnvelope({ providerEnvelopeId: env.providerEnvelopeId });
  const nuevoEstado = normalizeEstado(snapshot.estado);

  await db.update(signatureEnvelopes)
    .set({ estadoInterno: nuevoEstado, estadoExterno: snapshot.estado, lastSyncedAt: new Date(), actualizadoEn: new Date() })
    .where(eq(signatureEnvelopes.id, envelopeId));

  return { envelopeId: env.id, signaturePackageId: env.signaturePackageId, providerEnvelopeId: env.providerEnvelopeId, estadoInterno: nuevoEstado, estadoExterno: snapshot.estado, correlationId: env.correlationId ?? '' };
}

// ─── 6. DOWNLOAD ARTIFACTS ──────────────────────────────────────────────────

export async function downloadArtifacts(envelopeId: string, ctx: { actorId: string }): Promise<{ artifacts: Array<{ id: string; nombre: string; mime: string | null; hashSha256: string | null; tipo: string }> }> {
  const [env] = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.id, envelopeId)).limit(1);
  if (!env) throw new SignatureServiceError('NOT_FOUND', 'Envelope no encontrado', 404);
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: env.expedienteId, capability: 'signature.read' });
  if (env.estadoInterno !== 'completed') throw new SignatureServiceError('VALIDATION', 'El envelope no está completado', 409);
  if (!env.providerEnvelopeId) throw new SignatureServiceError('VALIDATION', 'El envelope no tiene providerEnvelopeId', 422);

  // Idempotencia: si ya se descargaron, devolver los existentes
  const existing = await db.select().from(signatureArtifacts).where(eq(signatureArtifacts.envelopeId, envelopeId));
  if (existing.length > 0) {
    return { artifacts: existing.map((a) => ({ id: a.id, nombre: a.nombre, mime: a.mime, hashSha256: a.hashSha256, tipo: a.tipo })) };
  }

  const rawArtifacts = await getProvider().downloadSignedArtifacts({ providerEnvelopeId: env.providerEnvelopeId });
  const artifacts: typeof existing = [];

  for (const raw of rawArtifacts) {
    const [art] = await db.insert(signatureArtifacts).values({
      envelopeId: env.id, tipo: raw.tipo, nombre: raw.nombre, mime: raw.mime,
      tamanoBytes: raw.tamanoBytes, hashSha256: raw.hashSha256, providerArtifactId: raw.providerArtifactId,
    }).returning().onConflictDoNothing();
    if (art) artifacts.push(art);
  }

  await logSgie({ usuarioId: ctx.actorId, accion: 'signature_artifact_downloaded', recurso: 'signature_envelope', recursoId: env.id, metadata: { count: artifacts.length }, exito: true });

  return { artifacts: artifacts.map((a) => ({ id: a.id, nombre: a.nombre, mime: a.mime, hashSha256: a.hashSha256, tipo: a.tipo })) };
}

// ─── LIST ───────────────────────────────────────────────────────────────────

export async function listEnvelopes(signaturePackageId: string, ctx: { actorId: string }): Promise<EnvelopeResult[]> {
  const [pkg] = await db.select({ expedienteId: signaturePackages.expedienteId }).from(signaturePackages).where(eq(signaturePackages.id, signaturePackageId)).limit(1);
  if (!pkg) throw new SignatureServiceError('NOT_FOUND', 'Paquete no encontrado', 404);
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.read' });

  const envelopes = await db.select().from(signatureEnvelopes).where(eq(signatureEnvelopes.signaturePackageId, signaturePackageId)).orderBy(signatureEnvelopes.creadoEn);
  return envelopes.map((e) => ({ envelopeId: e.id, signaturePackageId: e.signaturePackageId, providerEnvelopeId: e.providerEnvelopeId, estadoInterno: e.estadoInterno as EnvelopeEstado, estadoExterno: e.estadoExterno, correlationId: e.correlationId ?? '' }));
}

// ─── Cascades ───────────────────────────────────────────────────────────────

async function ejecutarCascadas(expedienteId: string): Promise<void> {
  await recalcularReadinessSiProcede(expedienteId).catch(() => undefined);
  await db.update(caseSummaryCheckpoints).set({ estado: 'invalidado' }).where(and(eq(caseSummaryCheckpoints.expedienteId, expedienteId), eq(caseSummaryCheckpoints.estado, 'vigente')));
  await recomendarNextAction({ expedienteId }).catch(() => undefined);
}
