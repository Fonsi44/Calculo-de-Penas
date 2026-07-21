/**
 * SignaturePackageService — P2-08 (Fase 4B-2).
 *
 * Paquetes preparados para firma: selección de documentos aprobados,
 * congelación de versiones, generación de manifiesto verificable y
 * preparación para P2-09 (proveedor de firma).
 *
 * No implementa firma electrónica ni integración con proveedores.
 *
 * Flujo:
 *   selección → preview (sin mutar) → confirmación → congelación →
 *   paquete ready/locked.
 *
 * Principios:
 * - Deny-by-default: flag sgie.signature.packages.
 * - Autorización real en servidor (signature.manage + canAccessCase).
 * - Nunca confiar en hashes/versiones/estados/firmantes del cliente.
 * - Control optimista por versión de paquete.
 * - Idempotencia por (expediente, idempotencyKey).
 * - Sin llamadas externas dentro de transacciones DB.
 * - Manifiesto inmutable tras congelación.
 */
import { db } from '@/lib/db';
import {
  documentosExpediente,
  documentContradictions,
  signaturePackages,
  signaturePackageItems,
  signaturePackageSigners,
  caseSummaryCheckpoints,
} from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { isFlagEnabled } from './feature-flags';
import { accessService } from '@/lib/access-service';
import { recalcularReadinessSiProcede } from './readiness';
import { recomendarNextAction } from './next-action';
import { logSgie, registrarHistorialExpediente } from './auditoria-sgie';
import { OUTBOX_EVENTS, encolarEvento } from './outbox';
import type { FlagContext } from './feature-flags';

const FLAG_KEY = 'sgie.signature.packages';
const PREVIEW_TTL_MS = 15 * 60 * 1000;
const ESTADOS_APROBADOS = ['aprobado'] as const;
const ESTADOS_NO_REVERSIBLES: readonly string[] = ['ready', 'locked'];

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type PackageEstado = 'draft' | 'ready' | 'locked' | 'cancelled' | 'superseded';

export interface SignerInput {
  nombre: string;
  email?: string;
  identificador?: string;
  rolDocumento: string;
  orden?: number;
  obligatorio?: boolean;
  metodoFuturo?: string;
}

export interface DocumentPreview {
  documentId: string;
  nombre: string;
  tipoDocumento: string | null;
  version: number;
  hashSha256: string;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
  estado: string;
  requisitoId: string | null;
  elegible: boolean;
  codigoNoElegible?: string;
  motivoNoElegible?: string;
  incidencias: string[];
}

export interface PackagePreview {
  packageId: string;
  expedienteId: string;
  previewHash: string;
  titulo: string;
  proposito?: string;
  caducidad: Date;
  documentos: DocumentPreview[];
  signers: SignerInput[];
  totalElegibles: number;
  totalNoElegibles: number;
  readinessScore: number | null;
  advertencias: string[];
}

export interface ManifestEntry {
  documentId: string;
  nombreNormalizado: string;
  versionFrozen: number;
  mime: string | null;
  tamanoBytes: number | null;
  hashSha256: string;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
  orden: number;
  tipoDocumento: string | null;
}

export interface PackageManifest {
  packageId: string;
  version: number;
  expedienteId: string;
  titulo: string;
  proposito?: string;
  schemaVersion: string;
  congeladoEn: string;
  hashAlgorithm: string;
  entries: ManifestEntry[];
  signers: SignerInput[];
}

export interface PackageResult {
  packageId: string;
  expedienteId: string;
  estado: PackageEstado;
  version: number;
  titulo: string;
  manifestHash: string | null;
  correlationId: string;
}

export interface IntegrityResult {
  packageId: string;
  valido: boolean;
  manifestHash: string;
  computedHash: string;
  entriesOk: number;
  entriesFail: number;
  detalles: Array<{ documentId: string; ok: boolean; motivo?: string }>;
}

export type SignaturePackageErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PREVIEW_EXPIRED'
  | 'PREVIEW_STALE'
  | 'IDEMPOTENCY_MISMATCH'
  | 'FLAG_OFF'
  | 'KILL_SWITCH'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'IMMUTABLE'
  | 'INTERNAL';

export class SignaturePackageError extends Error {
  constructor(public code: SignaturePackageErrorCode, message: string, public statusCode = 400) {
    super(message);
    this.name = 'SignaturePackageError';
  }
}

export function signaturePackageErrorResponse(err: unknown): Response {
  if (err instanceof SignaturePackageError) {
    return Response.json({ error: err.message, code: err.code }, { status: err.statusCode });
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
    return Response.json({ error: 'Validación incorrecta', details: (err as unknown as { issues: unknown }).issues }, { status: 422 });
  }
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: number }).status === 'number') {
    const e = err as { status: number; message?: string };
    return Response.json({ error: e.message ?? 'Forbidden' }, { status: e.status });
  }
  return Response.json({ error: 'Error interno' }, { status: 500 });
}

export interface SignaturePackageContext {
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

// ─── Build Manifest ─────────────────────────────────────────────────────────

function buildManifest(pkg: {
  id: string; version: number; expedienteId: string; titulo: string;
  proposito?: string | null; manifestSchemaVersion: string; hashAlgorithm: string;
  congeladoEn?: Date | null;
}, items: Array<{
  documentId: string; nombreNormalizado: string; versionFrozen: number;
  mime?: string | null; tamanoBytes?: number | null; hashSha256: string;
  aprobadoPor?: string | null; aprobadoEn?: Date | null;
  orden: number; tipoDocumento?: string | null;
}>, signers: Array<{
  nombre: string; email?: string | null; rolDocumento: string;
  orden: number; obligatorio: boolean;
}>): { manifest: PackageManifest; hash: string } {
  const entries: ManifestEntry[] = items.map((i) => ({
    documentId: i.documentId,
    nombreNormalizado: i.nombreNormalizado,
    versionFrozen: i.versionFrozen,
    mime: i.mime ?? null,
    tamanoBytes: i.tamanoBytes ?? null,
    hashSha256: i.hashSha256,
    aprobadoPor: i.aprobadoPor ?? null,
    aprobadoEn: i.aprobadoEn?.toISOString() ?? null,
    orden: i.orden,
    tipoDocumento: i.tipoDocumento ?? null,
  }));

  const signersCanonical = signers.map((s) => ({
    nombre: s.nombre,
    email: s.email ?? undefined,
    rolDocumento: s.rolDocumento,
    orden: s.orden,
    obligatorio: s.obligatorio,
  }));

  const manifest: PackageManifest = {
    packageId: pkg.id,
    version: pkg.version,
    expedienteId: pkg.expedienteId,
    titulo: pkg.titulo,
    proposito: pkg.proposito ?? undefined,
    schemaVersion: pkg.manifestSchemaVersion,
    congeladoEn: pkg.congeladoEn?.toISOString() ?? new Date().toISOString(),
    hashAlgorithm: pkg.hashAlgorithm,
    entries,
    signers: signersCanonical,
  };

  const hash = sha256(JSON.stringify(manifest));
  return { manifest, hash };
}

// ─── 1. PREVIEW ─────────────────────────────────────────────────────────────

export async function generatePackagePreview(
  input: {
    expedienteId: string;
    documentIds: string[];
    titulo: string;
    proposito?: string;
    signers?: SignerInput[];
  },
  ctx: SignaturePackageContext,
): Promise<PackagePreview> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignaturePackageError('FLAG_OFF', 'Paquetes de firma desactivados', 403);

  if (input.documentIds.length === 0) {
    throw new SignaturePackageError('VALIDATION', 'Se requiere al menos un documento', 422);
  }

  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: input.expedienteId,
    capability: 'signature.manage',
  });

  const docs = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoDocumento: documentosExpediente.tipoDocumento,
      estado: documentosExpediente.estado,
      version: documentosExpediente.version,
      aprobadoPor: documentosExpediente.aprobadoPor,
      aprobadoEn: documentosExpediente.aprobadoEn,
      hashSha256: documentosExpediente.hashSha256,
      tipoMime: documentosExpediente.tipoMime,
      tamañoBytes: documentosExpediente.tamañoBytes,
      requisitoExpedienteId: documentosExpediente.requisitoExpedienteId,
      procesadoEn: documentosExpediente.procesadoEn,
    })
    .from(documentosExpediente)
    .where(
      and(
        eq(documentosExpediente.expedienteId, input.expedienteId),
        inArray(documentosExpediente.id, input.documentIds),
      ),
    );

  const bloqueantes = await db
    .select({ documentAId: documentContradictions.documentAId, documentBId: documentContradictions.documentBId })
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

  const docsById = new Map(docs.map((d) => [d.id, d]));
  const documentos: DocumentPreview[] = [];
  const advertencias: string[] = [];

  for (const docId of input.documentIds) {
    const doc = docsById.get(docId);
    if (!doc) {
      documentos.push({
        documentId: docId, nombre: '(no encontrado)', tipoDocumento: null,
        version: 0, hashSha256: '', aprobadoPor: null, aprobadoEn: null,
        estado: 'desconocido', requisitoId: null, elegible: false,
        codigoNoElegible: 'no_encontrado',
        motivoNoElegible: 'El documento no existe o no pertenece al expediente.',
        incidencias: [],
      });
      continue;
    }

    const incidencias: string[] = [];
    let elegible = true;
    let codigoNoElegible: string | undefined;
    let motivoNoElegible: string | undefined;

    if (!ESTADOS_APROBADOS.includes(doc.estado as 'aprobado')) {
      elegible = false;
      codigoNoElegible = 'no_aprobado';
      motivoNoElegible = `El documento no está aprobado (estado: ${doc.estado})`;
    }
    if (elegible && !doc.aprobadoPor) {
      elegible = false;
      codigoNoElegible = 'no_aprobado';
      motivoNoElegible = 'El documento carece de aprobación humana registrada';
    }
    if (docsEnContradiccion.has(docId)) {
      elegible = false;
      codigoNoElegible = 'contradiccion_bloqueante';
      motivoNoElegible = 'Contradicción bloqueante activa';
      incidencias.push('contradiccion_bloqueante');
    }
    if (doc.procesadoEn === null) {
      elegible = false;
      codigoNoElegible = 'procesamiento_pendiente';
      motivoNoElegible = 'Procesamiento IA pendiente o fallido';
      incidencias.push('procesamiento_pendiente');
    }

    documentos.push({
      documentId: docId,
      nombre: doc.nombreOriginal,
      tipoDocumento: doc.tipoDocumento,
      version: doc.version,
      hashSha256: doc.hashSha256 ?? '',
      aprobadoPor: doc.aprobadoPor,
      aprobadoEn: doc.aprobadoEn?.toISOString() ?? null,
      estado: doc.estado,
      requisitoId: doc.requisitoExpedienteId,
      elegible,
      codigoNoElegible,
      motivoNoElegible,
      incidencias,
    });
  }

  const totalElegibles = documentos.filter((d) => d.elegible).length;
  const totalNoElegibles = documentos.filter((d) => !d.elegible).length;

  const signers = input.signers ?? [];

  const previewHash = sha256(JSON.stringify({
    expedienteId: input.expedienteId,
    titulo: input.titulo,
    proposito: input.proposito,
    actorId: ctx.actorId,
    docs: documentos.map((d) => ({ id: d.documentId, v: d.version, h: d.hashSha256, e: d.elegible })),
    signers: signers.map((s) => ({ n: s.nombre, r: s.rolDocumento, o: s.orden })),
  }));

  const caducidad = nowPlus(PREVIEW_TTL_MS);
  const packageId = randomUUID();

  await db
    .insert(signaturePackages)
    .values({
      id: packageId,
      expedienteId: input.expedienteId,
      actorId: ctx.actorId,
      idempotencyKey: `preview:${packageId}`,
      previewHash,
      titulo: input.titulo,
      proposito: input.proposito,
      estado: 'draft',
      version: 1,
      manifestSchemaVersion: '1.0',
      hashAlgorithm: 'sha256',
      correlationId: randomUUID(),
    })
    .onConflictDoNothing();

  await db.insert(signaturePackageItems).values(
    documentos.map((d, idx) => ({
      packageId,
      documentId: d.documentId,
      expedienteId: input.expedienteId,
      versionFrozen: d.version,
      nombreNormalizado: d.nombre,
      mime: docsById.get(d.documentId)?.tipoMime,
      tamanoBytes: docsById.get(d.documentId)?.tamañoBytes,
      hashSha256: d.hashSha256,
      aprobadoPor: d.aprobadoPor,
      aprobadoEn: d.aprobadoEn ? new Date(d.aprobadoEn) : null,
      orden: idx,
      requisitoId: d.requisitoId,
      tipoDocumento: d.tipoDocumento,
    })),
  );

  if (signers.length > 0) {
    await db.insert(signaturePackageSigners).values(
      signers.map((s, idx) => ({
        packageId,
        nombre: s.nombre,
        email: s.email,
        identificador: s.identificador,
        rolDocumento: s.rolDocumento,
        orden: s.orden ?? idx,
        obligatorio: s.obligatorio ?? true,
        metodoFuturo: s.metodoFuturo,
        estadoValidacion: 'pendiente',
        fuente: 'manual',
      })),
    );
  }

  return {
    packageId,
    expedienteId: input.expedienteId,
    previewHash,
    titulo: input.titulo,
    proposito: input.proposito,
    caducidad,
    documentos,
    signers,
    totalElegibles,
    totalNoElegibles,
    readinessScore: null,
    advertencias,
  };
}

// ─── 2. CONFIRMAR (validación + congelación + manifiesto) ──────────────────

export async function confirmPackage(
  input: { packageId: string; idempotencyKey: string; previewHash: string; expedienteId?: string },
  ctx: SignaturePackageContext,
): Promise<PackageResult> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignaturePackageError('FLAG_OFF', 'Paquetes de firma desactivados', 403);

  const [pkg] = await db
    .select()
    .from(signaturePackages)
    .where(eq(signaturePackages.id, input.packageId))
    .limit(1);

  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  if (input.expedienteId && pkg.expedienteId !== input.expedienteId) {
    throw new SignaturePackageError('VALIDATION', 'El expediente no coincide con el paquete', 422);
  }

  const isPreview = pkg.idempotencyKey.startsWith('preview:');

  if (!isPreview && pkg.idempotencyKey === input.idempotencyKey && pkg.estado !== 'draft') {
    if (pkg.previewHash !== input.previewHash) {
      throw new SignaturePackageError('IDEMPOTENCY_MISMATCH', 'IdempotencyKey reutilizada con preview distinta', 409);
    }
    return { packageId: pkg.id, expedienteId: pkg.expedienteId, estado: pkg.estado as PackageEstado, version: pkg.version, titulo: pkg.titulo, manifestHash: pkg.manifestHash, correlationId: pkg.correlationId ?? '' };
  }

  if (!isPreview && pkg.idempotencyKey !== input.idempotencyKey) {
    throw new SignaturePackageError('CONFLICT', 'El paquete ya fue confirmado con otra clave', 409);
  }

  if (pkg.previewHash !== input.previewHash) {
    throw new SignaturePackageError('PREVIEW_STALE', 'La preview ha cambiado; regenerar', 409);
  }

  if (pkg.estado !== 'draft') {
    throw new SignaturePackageError('IMMUTABLE', 'El paquete ya no está en estado draft', 409);
  }

  await accessService.assertCaseAccess({
    userId: ctx.actorId,
    caseId: pkg.expedienteId,
    capability: 'signature.manage',
  });

  const correlationId = randomUUID();

  const claimResult = await db
    .update(signaturePackages)
    .set({ idempotencyKey: input.idempotencyKey, correlationId, actualizadoEn: new Date() })
    .where(
      and(
        eq(signaturePackages.id, input.packageId),
        eq(signaturePackages.idempotencyKey, `preview:${input.packageId}`),
      ),
    )
    .returning({ id: signaturePackages.id });

  if (claimResult.length === 0) {
    const [actual] = await db.select({ idempotencyKey: signaturePackages.idempotencyKey, estado: signaturePackages.estado, previewHash: signaturePackages.previewHash, manifestHash: signaturePackages.manifestHash, correlationId: signaturePackages.correlationId, version: signaturePackages.version, titulo: signaturePackages.titulo })
      .from(signaturePackages).where(eq(signaturePackages.id, input.packageId));
    if (!actual) throw new SignaturePackageError('NOT_FOUND', 'Paquete eliminado concurrentemente', 404);
    if (actual.idempotencyKey === input.idempotencyKey) {
      if (actual.previewHash !== input.previewHash) {
        throw new SignaturePackageError('IDEMPOTENCY_MISMATCH', 'IdempotencyKey reutilizada con preview distinta', 409);
      }
      return { packageId: input.packageId, expedienteId: pkg.expedienteId, estado: actual.estado as PackageEstado, version: actual.version, titulo: actual.titulo, manifestHash: actual.manifestHash, correlationId: actual.correlationId ?? '' };
    }
    throw new SignaturePackageError('CONFLICT', 'Confirmado por otro proceso concurrente', 409);
  }

  // Re-validar documentos elegibles
  const items = await db.select().from(signaturePackageItems).where(eq(signaturePackageItems.packageId, input.packageId));

  const elegibles: typeof items = [];
  for (const item of items) {
    const [doc] = await db
      .select({ id: documentosExpediente.id, estado: documentosExpediente.estado, version: documentosExpediente.version, hashSha256: documentosExpediente.hashSha256, aprobadoPor: documentosExpediente.aprobadoPor, aprobadoEn: documentosExpediente.aprobadoEn })
      .from(documentosExpediente)
      .where(eq(documentosExpediente.id, item.documentId))
      .limit(1);

    if (!doc || !ESTADOS_APROBADOS.includes(doc.estado as 'aprobado') || !doc.aprobadoPor) continue;

    const frozen = await db
      .update(signaturePackageItems)
      .set({ versionFrozen: doc.version, hashSha256: doc.hashSha256 ?? '', aprobadoPor: doc.aprobadoPor, aprobadoEn: doc.aprobadoEn } as never)
      .where(eq(signaturePackageItems.id, item.id))
      .returning({ id: signaturePackageItems.id });

    if (frozen.length > 0) elegibles.push(item);
  }

  // Construir manifiesto
  const signers = await db.select().from(signaturePackageSigners).where(eq(signaturePackageSigners.packageId, input.packageId));

  const finalItems = await db.select().from(signaturePackageItems).where(eq(signaturePackageItems.packageId, input.packageId));

  const { manifest, hash } = buildManifest(
    { id: pkg.id, version: pkg.version, expedienteId: pkg.expedienteId, titulo: pkg.titulo, proposito: pkg.proposito, manifestSchemaVersion: pkg.manifestSchemaVersion, hashAlgorithm: pkg.hashAlgorithm, congeladoEn: new Date() },
    finalItems.map((i) => ({ documentId: i.documentId, nombreNormalizado: i.nombreNormalizado, versionFrozen: i.versionFrozen, mime: i.mime, tamanoBytes: i.tamanoBytes, hashSha256: i.hashSha256, aprobadoPor: i.aprobadoPor, aprobadoEn: i.aprobadoEn, orden: i.orden, tipoDocumento: i.tipoDocumento })),
    signers.map((s) => ({ nombre: s.nombre, email: s.email, rolDocumento: s.rolDocumento, orden: s.orden, obligatorio: s.obligatorio })),
  );

  await db
    .update(signaturePackages)
    .set({ estado: 'ready', manifestHash: hash, manifestJson: manifest as unknown as Record<string, unknown>, congeladoEn: new Date(), actualizadoEn: new Date() })
    .where(eq(signaturePackages.id, input.packageId));

  await logSgie({
    usuarioId: ctx.actorId,
    accion: 'signature_package_created',
    recurso: 'signature_package',
    recursoId: input.packageId,
    metadata: { expedienteId: pkg.expedienteId, manifestHash: hash, correlationId },
    exito: true,
  });

  await registrarHistorialExpediente({
    expedienteId: pkg.expedienteId,
    accion: 'paquete_firma_creado',
    actorId: ctx.actorId,
    actorTipo: 'abogado',
    metadata: { packageId: input.packageId, manifestHash: hash },
    mensaje: `Paquete de firma "${pkg.titulo}" creado`,
  });

  await encolarEvento({
    tipo: OUTBOX_EVENTS.SIGNATURE_PACKAGE_CREATED,
    aggregateType: 'signature_package',
    aggregateId: input.packageId,
    payload: { packageId: input.packageId, expedienteId: pkg.expedienteId, manifestHash: hash },
    correlationId,
  });

  await ejecutarCascadas(pkg.expedienteId, ctx);

  return { packageId: input.packageId, expedienteId: pkg.expedienteId, estado: 'ready', version: pkg.version, titulo: pkg.titulo, manifestHash: hash, correlationId };
}

// ─── 3. LOCK ────────────────────────────────────────────────────────────────

export async function lockPackage(
  input: { packageId: string; expedienteId?: string },
  ctx: SignaturePackageContext,
): Promise<PackageResult> {
  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignaturePackageError('FLAG_OFF', 'Paquetes de firma desactivados', 403);

  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, input.packageId)).limit(1);
  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.manage' });

  if (pkg.estado !== 'ready') {
    throw new SignaturePackageError('VALIDATION', `Solo se puede bloquear un paquete en estado ready (actual: ${pkg.estado})`, 409);
  }

  await db
    .update(signaturePackages)
    .set({ estado: 'locked', actualizadoEn: new Date() })
    .where(and(eq(signaturePackages.id, input.packageId), eq(signaturePackages.estado, 'ready')));

  const correlationId = pkg.correlationId ?? randomUUID();

  await logSgie({
    usuarioId: ctx.actorId, accion: 'signature_package_locked',
    recurso: 'signature_package', recursoId: input.packageId,
    metadata: { expedienteId: pkg.expedienteId, correlationId },
    exito: true,
  });

  await encolarEvento({
    tipo: OUTBOX_EVENTS.SIGNATURE_PACKAGE_LOCKED,
    aggregateType: 'signature_package', aggregateId: input.packageId,
    payload: { packageId: input.packageId, expedienteId: pkg.expedienteId },
    correlationId,
  });

  return { packageId: input.packageId, expedienteId: pkg.expedienteId, estado: 'locked', version: pkg.version, titulo: pkg.titulo, manifestHash: pkg.manifestHash, correlationId };
}

// ─── 4. CANCEL ──────────────────────────────────────────────────────────────

export async function cancelPackage(
  input: { packageId: string; motivo: string; expedienteId?: string },
  ctx: SignaturePackageContext,
): Promise<PackageResult> {
  if (input.motivo.length < 10) throw new SignaturePackageError('VALIDATION', 'Motivo obligatorio (mínimo 10 caracteres)', 422);

  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignaturePackageError('FLAG_OFF', 'Paquetes de firma desactivados', 403);

  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, input.packageId)).limit(1);
  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.manage' });

  if (!['ready', 'locked'].includes(pkg.estado)) {
    throw new SignaturePackageError('VALIDATION', `Solo se puede cancelar un paquete ready/locked (actual: ${pkg.estado})`, 409);
  }

  await db
    .update(signaturePackages)
    .set({ estado: 'cancelled', canceladoMotivo: input.motivo, actualizadoEn: new Date() })
    .where(and(eq(signaturePackages.id, input.packageId), eq(signaturePackages.estado, pkg.estado)));

  const correlationId = pkg.correlationId ?? randomUUID();

  await logSgie({
    usuarioId: ctx.actorId, accion: 'signature_package_cancelled',
    recurso: 'signature_package', recursoId: input.packageId,
    metadata: { expedienteId: pkg.expedienteId, motivo: input.motivo, correlationId },
    exito: true,
  });

  await encolarEvento({
    tipo: OUTBOX_EVENTS.SIGNATURE_PACKAGE_CANCELLED,
    aggregateType: 'signature_package', aggregateId: input.packageId,
    payload: { packageId: input.packageId, expedienteId: pkg.expedienteId, motivo: input.motivo },
    correlationId,
  });

  return { packageId: input.packageId, expedienteId: pkg.expedienteId, estado: 'cancelled', version: pkg.version, titulo: pkg.titulo, manifestHash: pkg.manifestHash, correlationId };
}

// ─── 5. SUPERSEDE ───────────────────────────────────────────────────────────

export async function supersedePackage(
  input: { packageId: string; motivo: string; documentIds?: string[]; titulo?: string; expedienteId?: string },
  ctx: SignaturePackageContext,
): Promise<PackageResult> {
  if (input.motivo.length < 10) throw new SignaturePackageError('VALIDATION', 'Motivo obligatorio (mínimo 10 caracteres)', 422);

  const flagOn = await isFlagEnabled(FLAG_KEY, ctx.flagContext ?? {}).catch(() => false);
  if (!flagOn) throw new SignaturePackageError('FLAG_OFF', 'Paquetes de firma desactivados', 403);

  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, input.packageId)).limit(1);
  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.manage' });

  if (!['ready', 'locked'].includes(pkg.estado)) {
    throw new SignaturePackageError('VALIDATION', `Solo se puede superseder un paquete ready/locked (actual: ${pkg.estado})`, 409);
  }

  const newVersion = pkg.version + 1;
  const newId = randomUUID();
  const correlationId = randomUUID();
  const newTitulo = input.titulo ?? pkg.titulo;

  // Crear nueva versión con los mismos documentos (o subconjunto)
  const oldItems = await db.select().from(signaturePackageItems).where(eq(signaturePackageItems.packageId, input.packageId));
  const oldSigners = await db.select().from(signaturePackageSigners).where(eq(signaturePackageSigners.packageId, input.packageId));

  await db.insert(signaturePackages).values({
    id: newId, expedienteId: pkg.expedienteId, actorId: ctx.actorId,
    idempotencyKey: `preview:${newId}`, titulo: newTitulo, proposito: pkg.proposito,
    estado: 'draft', version: newVersion, manifestSchemaVersion: pkg.manifestSchemaVersion,
    hashAlgorithm: pkg.hashAlgorithm, correlationId,
  });

  const filteredItems = input.documentIds
    ? oldItems.filter((i) => input.documentIds!.includes(i.documentId))
    : oldItems;

  if (filteredItems.length > 0) {
    await db.insert(signaturePackageItems).values(
      filteredItems.map((i, idx) => ({
        packageId: newId, documentId: i.documentId, expedienteId: i.expedienteId,
        versionFrozen: i.versionFrozen, nombreNormalizado: i.nombreNormalizado,
        mime: i.mime, tamanoBytes: i.tamanoBytes, hashSha256: i.hashSha256,
        aprobadoPor: i.aprobadoPor, aprobadoEn: i.aprobadoEn,
        orden: idx, requisitoId: i.requisitoId, tipoDocumento: i.tipoDocumento,
      })),
    );
  }

  if (oldSigners.length > 0) {
    await db.insert(signaturePackageSigners).values(
      oldSigners.map((s, idx) => ({
        packageId: newId, nombre: s.nombre, email: s.email, identificador: s.identificador,
        rolDocumento: s.rolDocumento, orden: idx, obligatorio: s.obligatorio,
        metodoFuturo: s.metodoFuturo, estadoValidacion: 'pendiente', fuente: 'manual',
      })),
    );
  }

  // Marcar original como superseded
  await db
    .update(signaturePackages)
    .set({ estado: 'superseded', canceladoMotivo: input.motivo, actualizadoEn: new Date() })
    .where(eq(signaturePackages.id, input.packageId));

  await logSgie({
    usuarioId: ctx.actorId, accion: 'signature_package_superseded',
    recurso: 'signature_package', recursoId: input.packageId,
    metadata: { expedienteId: pkg.expedienteId, newPackageId: newId, motivo: input.motivo, correlationId },
    exito: true,
  });

  await encolarEvento({
    tipo: OUTBOX_EVENTS.SIGNATURE_PACKAGE_SUPERSEDED,
    aggregateType: 'signature_package', aggregateId: input.packageId,
    payload: { packageId: input.packageId, newPackageId: newId, expedienteId: pkg.expedienteId, motivo: input.motivo },
    correlationId,
  });

  return { packageId: newId, expedienteId: pkg.expedienteId, estado: 'draft', version: newVersion, titulo: newTitulo, manifestHash: null, correlationId };
}

// ─── 6. GET ─────────────────────────────────────────────────────────────────

export async function getPackage(packageId: string, ctx: SignaturePackageContext): Promise<{ pkg: typeof signaturePackages.$inferSelect; items: typeof signaturePackageItems.$inferSelect[]; signers: typeof signaturePackageSigners.$inferSelect[] }> {
  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, packageId)).limit(1);
  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.manage' });

  const items = await db.select().from(signaturePackageItems).where(eq(signaturePackageItems.packageId, packageId)).orderBy(signaturePackageItems.orden);
  const signers = await db.select().from(signaturePackageSigners).where(eq(signaturePackageSigners.packageId, packageId)).orderBy(signaturePackageSigners.orden);

  return { pkg, items, signers };
}

// ─── 7. LIST ────────────────────────────────────────────────────────────────

export async function listPackages(expedienteId: string, ctx: SignaturePackageContext): Promise<typeof signaturePackages.$inferSelect[]> {
  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: expedienteId, capability: 'signature.manage' });

  return db
    .select()
    .from(signaturePackages)
    .where(eq(signaturePackages.expedienteId, expedienteId))
    .orderBy(signaturePackages.creadoEn);
}

// ─── 8. VERIFY INTEGRITY ────────────────────────────────────────────────────

export async function verifyIntegrity(packageId: string, ctx: SignaturePackageContext): Promise<IntegrityResult> {
  const [pkg] = await db.select().from(signaturePackages).where(eq(signaturePackages.id, packageId)).limit(1);
  if (!pkg) throw new SignaturePackageError('NOT_FOUND', 'Paquete no encontrado', 404);

  await accessService.assertCaseAccess({ userId: ctx.actorId, caseId: pkg.expedienteId, capability: 'signature.manage' });

  const items = await db.select().from(signaturePackageItems).where(eq(signaturePackageItems.packageId, packageId)).orderBy(signaturePackageItems.orden);
  const signers = await db.select().from(signaturePackageSigners).where(eq(signaturePackageSigners.packageId, packageId)).orderBy(signaturePackageSigners.orden);

  const { hash: computedHash } = buildManifest(
    { id: pkg.id, version: pkg.version, expedienteId: pkg.expedienteId, titulo: pkg.titulo, proposito: pkg.proposito, manifestSchemaVersion: pkg.manifestSchemaVersion, hashAlgorithm: pkg.hashAlgorithm, congeladoEn: pkg.congeladoEn },
    items.map((i) => ({ documentId: i.documentId, nombreNormalizado: i.nombreNormalizado, versionFrozen: i.versionFrozen, mime: i.mime, tamanoBytes: i.tamanoBytes, hashSha256: i.hashSha256, aprobadoPor: i.aprobadoPor, aprobadoEn: i.aprobadoEn, orden: i.orden, tipoDocumento: i.tipoDocumento })),
    signers.map((s) => ({ nombre: s.nombre, email: s.email, rolDocumento: s.rolDocumento, orden: s.orden, obligatorio: s.obligatorio })),
  );

  const registeredHash = pkg.manifestHash ?? '';
  const valido = computedHash === registeredHash;
  const detalles = items.map((i) => ({
    documentId: i.documentId,
    ok: true,
    motivo: undefined as string | undefined,
  }));

  if (!valido) {
    detalles.push({ documentId: 'manifest', ok: false, motivo: `Hash registrado: ${registeredHash.slice(0, 16)}…, computado: ${computedHash.slice(0, 16)}…` });
  }

  await logSgie({
    usuarioId: ctx.actorId, accion: 'signature_package_verified',
    recurso: 'signature_package', recursoId: packageId,
    metadata: { expedienteId: pkg.expedienteId, valido, registeredHash, computedHash },
    exito: valido,
  });

  return {
    packageId, valido,
    manifestHash: registeredHash,
    computedHash,
    entriesOk: valido ? items.length : 0,
    entriesFail: valido ? 0 : 1,
    detalles,
  };
}

// ─── 9. Check if any package blocks document reversal ───────────────────────

export async function getBlockingPackages(documentIds: string[]): Promise<Array<{ packageId: string; estado: string; documentId: string; versionFrozen: number }>> {
  if (documentIds.length === 0) return [];

  const rows = await db
    .select({
      packageId: signaturePackageItems.packageId,
      estado: signaturePackages.estado,
      documentId: signaturePackageItems.documentId,
      versionFrozen: signaturePackageItems.versionFrozen,
    })
    .from(signaturePackageItems)
    .innerJoin(signaturePackages, eq(signaturePackages.id, signaturePackageItems.packageId))
    .where(
      and(
        inArray(signaturePackageItems.documentId, documentIds),
        inArray(signaturePackages.estado, ESTADOS_NO_REVERSIBLES),
      ),
    );

  return rows.map((r) => ({
    packageId: r.packageId,
    estado: r.estado,
    documentId: r.documentId,
    versionFrozen: r.versionFrozen,
  }));
}

// ─── Cascades ───────────────────────────────────────────────────────────────

async function ejecutarCascadas(expedienteId: string, ctx: SignaturePackageContext): Promise<void> {
  await recalcularReadinessSiProcede(expedienteId).catch(() => undefined);
  await db
    .update(caseSummaryCheckpoints)
    .set({ estado: 'invalidado' })
    .where(and(eq(caseSummaryCheckpoints.expedienteId, expedienteId), eq(caseSummaryCheckpoints.estado, 'vigente')));
  await recomendarNextAction({ expedienteId, flagContext: ctx.flagContext }).catch(() => undefined);
}
