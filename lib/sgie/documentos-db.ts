/**
 * SGIE — capa documental (Fase 4/6).
 *
 * Recibe archivos validados (tamaño, MIME, magic bytes, hash SHA-256), los
 * almacena en Blob privado, registra metadatos y detecta duplicados por hash.
 * Si el hash ya existe en el expediente, marca `duplicado` y NO lanza IA/OCR.
 *
 * La extracción de texto, clasificación y OCR se delegan a jobs (Fase 6/7),
 * nunca dentro del route handler de carga.
 *
 * Ver docs/architecture/ §12 (motor documental).
 */
import { db } from '@/lib/db';
import { documentosExpediente } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export interface RegistrarDocumentoInput {
  expedienteId: string;
  requisitoExpedienteId?: string | null;
  enlaceMagicoId?: string | null;
  nombreOriginal: string;
  nombreSaneado: string;
  tipoMime: string;
  tamañoBytes: number;
  hashSha256: string;
  blobUrl: string;
  blobTextoUrl?: string | null;
  origen?: 'cliente' | 'abogado' | 'admin' | 'sistema';
  subidoPor?: string | null;
  subidoIp?: string | null;
  subidoUserAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Comprueba si un hash ya existe en el expediente (duplicado intra-expediente).
 * También permite detectar duplicados globales con `global: true`.
 */
export async function existeHashEnExpediente(
  hashSha256: string,
  expedienteId: string,
  opts: { global?: boolean } = {},
): Promise<{ duplicado: boolean; documentoIdExistente?: string }> {
  const condition = opts.global
    ? eq(documentosExpediente.hashSha256, hashSha256)
    : and(
        eq(documentosExpediente.hashSha256, hashSha256),
        eq(documentosExpediente.expedienteId, expedienteId),
      );

  const [existente] = await db
    .select({ id: documentosExpediente.id, expedienteId: documentosExpediente.expedienteId })
    .from(documentosExpediente)
    .where(condition);

  return {
    duplicado: Boolean(existente),
    documentoIdExistente: existente?.id,
  };
}

/**
 * Registra un documento en la DB. Si es duplicado, lo marca con estado
 * `duplicado` y NO se procesará (IA/OCR omitidos por hash §12.5).
 */
export async function registrarDocumento(
  input: RegistrarDocumentoInput,
): Promise<{ id: string; estado: string; duplicado: boolean }> {
  const { duplicado } = await existeHashEnExpediente(input.hashSha256, input.expedienteId, { global: false });

  const [doc] = await db
    .insert(documentosExpediente)
    .values({
      expedienteId: input.expedienteId,
      requisitoExpedienteId: input.requisitoExpedienteId ?? null,
      enlaceMagicoId: input.enlaceMagicoId ?? null,
      nombreOriginal: input.nombreOriginal,
      nombreSaneado: input.nombreSaneado,
      tipoMime: input.tipoMime,
      tamañoBytes: input.tamañoBytes,
      hashSha256: input.hashSha256,
      blobUrl: input.blobUrl,
      blobTextoUrl: input.blobTextoUrl ?? null,
      estado: duplicado ? 'duplicado' : 'subido',
      origen: input.origen ?? 'cliente',
      subidoPor: input.subidoPor ?? null,
      subidoIp: input.subidoIp ?? null,
      subidoUserAgent: input.subidoUserAgent ?? null,
      metadata: { ...input.metadata, duplicadoDetectado: duplicado },
    })
    .returning({ id: documentosExpediente.id, estado: documentosExpediente.estado });

  if (!doc) throw new Error('No se pudo registrar el documento');
  return { id: doc.id, estado: doc.estado, duplicado };
}

/**
 * Actualiza el estado de un documento (clasificación, texto extraído, etc.).
 */
export async function actualizarEstadoDocumento(
  documentoId: string,
  estado: string,
  extra?: { tipoDocumento?: string; blobTextoUrl?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  await db
    .update(documentosExpediente)
    .set({
      estado: estado as typeof documentosExpediente.$inferInsert.estado,
      tipoDocumento: extra?.tipoDocumento,
      blobTextoUrl: extra?.blobTextoUrl,
      procesadoEn: new Date(),
      metadata: extra?.metadata,
    })
    .where(eq(documentosExpediente.id, documentoId));
}

/**
 * Lista documentos de un expediente (verificar scope en el caller).
 */
export async function listarDocumentosExpediente(expedienteId: string) {
  return db
    .select({
      id: documentosExpediente.id,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoMime: documentosExpediente.tipoMime,
      tamañoBytes: documentosExpediente.tamañoBytes,
      estado: documentosExpediente.estado,
      origen: documentosExpediente.origen,
      tipoDocumento: documentosExpediente.tipoDocumento,
      subidoEn: documentosExpediente.subidoEn,
      hashSha256: documentosExpediente.hashSha256,
      aprobadoEn: documentosExpediente.aprobadoEn,
      rechazadoEn: documentosExpediente.rechazadoEn,
    })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.expedienteId, expedienteId))
    .orderBy(documentosExpediente.subidoEn);
}

/**
 * Aprueba un documento (acción del abogado). Requiere verificación de scope
 * y actor abogado en el caller.
 */
export async function aprobarDocumento(documentoId: string, aprobadoPor: string): Promise<void> {
  await db
    .update(documentosExpediente)
    .set({ estado: 'aprobado', aprobadoPor, aprobadoEn: new Date() })
    .where(eq(documentosExpediente.id, documentoId));
}

/**
 * Rechaza un documento con motivo (acción del abogado).
 */
export async function rechazarDocumento(
  documentoId: string,
  rechazadoPor: string,
  motivo: string,
): Promise<void> {
  await db
    .update(documentosExpediente)
    .set({ estado: 'rechazado', rechazadoPor, rechazadoEn: new Date(), rechazoMotivo: motivo })
    .where(eq(documentosExpediente.id, documentoId));
}
