/**
 * SGIE — operaciones atómicas de carga documental (Fase 2).
 *
 * Previene race conditions en la reserva de enlaces mágicos y envuelve el
 * registro documental en una transacción DB que garantiza consistencia entre
 * inserción de documento, outbox event y encolado de job.
 *
 * Ver docs/architecture/ §12.6, §23.2.
 */
import { db } from '@/lib/db';
import {
  enlacesMagicos,
  documentosExpediente,
  outboxEvents,
  jobsSgie,
} from '@/lib/schema';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { hashToken } from './util';
import type { RegistrarDocumentoInput } from './documentos-db';

export interface EnlaceReservado {
  id: string;
  expedienteId: string;
  requisitoExpedienteId: string | null;
  clienteEmail: string | null;
  usosMaximos: number | null;
  usosActuales: number;
}

/**
 * Reserva un uso de enlace mágico ATÓMICAMENTE.
 *
 * UPDATE con condición + RETURNING: si dos requests llegan simultáneamente,
 * sólo una gana porque la cláusula WHERE incluye `usos_actuales < usos_maximos`
 * y el incremento es atómico en la misma sentencia.
 *
 * Devuelve null si el enlace está agotado, revocado, expirado o no existe.
 */
export async function reservarEnlaceAtomicamente(
  token: string,
  _requestId: string,
): Promise<EnlaceReservado | null> {
  const tokenHash = hashToken(token);

  const [enlace] = await db
    .update(enlacesMagicos)
    .set({
      usosActuales: sql`${enlacesMagicos.usosActuales} + 1`,
    })
    .where(
      and(
        eq(enlacesMagicos.tokenHash, tokenHash),
        or(
          isNull(enlacesMagicos.usosMaximos),
          ltColumna(sql`${enlacesMagicos.usosActuales}`, enlacesMagicos.usosMaximos),
        ),
        isNull(enlacesMagicos.revocadoEn),
        gt(enlacesMagicos.expiraEn, sql`NOW()`),
      ),
    )
    .returning({
      id: enlacesMagicos.id,
      expedienteId: enlacesMagicos.expedienteId,
      requisitoExpedienteId: enlacesMagicos.requisitoExpedienteId,
      clienteEmail: enlacesMagicos.clienteEmail,
      usosMaximos: enlacesMagicos.usosMaximos,
      usosActuales: enlacesMagicos.usosActuales,
    });

  if (!enlace) return null;
  return {
    ...enlace,
    usosActuales: enlace.usosActuales ?? 0,
  };
}

function ltColumna(left: unknown, right: unknown) {
  return sql`${left} < ${right}`;
}

export interface RegistrarDocumentoAtomicoInput extends RegistrarDocumentoInput {
  requestId: string;
}

export interface DocumentoRegistrado {
  id: string;
  estado: string;
  duplicado: boolean;
  hashSha256: string;
  blobUrl: string;
}

/**
 * Registra un documento con garantías atómicas dentro de una transacción.
 *
 * Flujo:
 *  1. Verifica duplicado por hash intra-expediente.
 *  2. Si duplicado mismo expediente → retorna el existente.
 *  3. Si duplicado distinto expediente → marca 'duplicado'.
 *  4. Inserta el documento.
 *  5. Crea outbox event 'document.uploaded'.
 *  6. Encola job extraccion_texto.
 *  7. Consume uso del enlace mágico (ya reservado en paso anterior).
 */
export async function registrarDocumentoAtomico(
  input: RegistrarDocumentoAtomicoInput,
): Promise<DocumentoRegistrado> {
  const {
    expedienteId,
    requisitoExpedienteId,
    enlaceMagicoId,
    hashSha256,
    requestId,
  } = input;

  return db.transaction(async (tx) => {
    const existente = await tx
      .select({
        id: documentosExpediente.id,
        expedienteId: documentosExpediente.expedienteId,
        estado: documentosExpediente.estado,
      })
      .from(documentosExpediente)
      .where(
        and(
          eq(documentosExpediente.hashSha256, hashSha256),
          eq(documentosExpediente.expedienteId, expedienteId),
        ),
      )
      .limit(1);

    if (existente.length > 0) {
      return {
        id: existente[0].id,
        estado: existente[0].estado,
        duplicado: true,
        hashSha256,
        blobUrl: input.blobUrl,
      };
    }

    const [otroExpediente] = await tx
      .select({ id: documentosExpediente.id })
      .from(documentosExpediente)
      .where(
        and(
          eq(documentosExpediente.hashSha256, hashSha256),
          sql`${documentosExpediente.expedienteId} != ${expedienteId}`,
        ),
      )
      .limit(1);

    const esDuplicadoGlobal = Boolean(otroExpediente);

    const [doc] = await tx
      .insert(documentosExpediente)
      .values({
        expedienteId,
        requisitoExpedienteId: requisitoExpedienteId ?? null,
        enlaceMagicoId: enlaceMagicoId ?? null,
        nombreOriginal: input.nombreOriginal,
        nombreSaneado: input.nombreSaneado,
        tipoMime: input.tipoMime,
        tamañoBytes: input.tamañoBytes,
        hashSha256,
        blobUrl: input.blobUrl,
        blobTextoUrl: input.blobTextoUrl ?? null,
        estado: esDuplicadoGlobal ? 'duplicado' : 'subido',
        origen: input.origen ?? 'cliente',
        subidoPor: input.subidoPor ?? null,
        subidoIp: input.subidoIp ?? null,
        subidoUserAgent: input.subidoUserAgent ?? null,
        metadata: {
          ...input.metadata,
          duplicadoDetectado: esDuplicadoGlobal,
          requestId,
        },
      })
      .returning({ id: documentosExpediente.id, estado: documentosExpediente.estado });

    if (!doc) throw new Error('No se pudo registrar el documento');

    await tx.insert(outboxEvents).values({
      eventType: 'document.uploaded',
      aggregateId: doc.id,
      aggregateType: 'document',
      payload: {
        documentoId: doc.id,
        expedienteId,
        hashSha256,
        nombreOriginal: input.nombreOriginal,
        tamañoBytes: input.tamañoBytes,
        origen: input.origen ?? 'cliente',
        duplicado: esDuplicadoGlobal,
        requestId,
      },
    });

    if (!esDuplicadoGlobal) {
      await tx
        .insert(jobsSgie)
        .values({
          tipo: 'extraccion_texto',
          refId: doc.id,
          payload: {
            documentoId: doc.id,
            blobUrl: input.blobUrl,
            mime: input.tipoMime,
            requestId,
          },
        })
        .onConflictDoNothing({
          target: [jobsSgie.tipo, jobsSgie.refId, jobsSgie.ventanaTemporal],
        });
    }

    return {
      id: doc.id,
      estado: doc.estado,
      duplicado: esDuplicadoGlobal,
      hashSha256,
      blobUrl: input.blobUrl,
    };
  });
}

/**
 * Marca un blob huérfano para limpieza asíncrona.
 * Llámese en error handlers cuando el blob se subió pero el registro DB falló.
 */
export async function compensarBlobHuerfano(blobUrl: string): Promise<void> {
  try {
    await db.insert(outboxEvents).values({
      eventType: 'blob.cleanup',
      aggregateId: blobUrl,
      aggregateType: 'blob',
      payload: { blobUrl, motivo: 'huérfano', timestamp: new Date().toISOString() },
    });
  } catch {
    console.warn('[upload-atomico] no se pudo encolar limpieza de blob huérfano:', blobUrl);
  }
}
