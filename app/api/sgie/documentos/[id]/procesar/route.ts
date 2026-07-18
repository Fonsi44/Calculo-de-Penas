import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { encolarJob } from '@/lib/sgie/jobs-db';
import { encolarEvento, OUTBOX_EVENTS } from '@/lib/sgie/outbox';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { validateCsrf } from '@/lib/csrf';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const { id: documentoId } = await params;

    const correlationId = randomUUID();

    const rl = await rateLimit(`sgie:doc:procesar:${auth.userId}`, {
      max: 30,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const [doc] = await db
      .select({
        id: documentosExpediente.id,
        expedienteId: documentosExpediente.expedienteId,
        estado: documentosExpediente.estado,
        hashSha256: documentosExpediente.hashSha256,
      })
      .from(documentosExpediente)
      .where(eq(documentosExpediente.id, documentoId));

    if (!doc) {
      return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (auth.rol !== 'admin') {
      const [asignado] = await db
        .select({ id: expedienteAsignaciones.id })
        .from(expedienteAsignaciones)
        .where(
          and(
            eq(expedienteAsignaciones.expedienteId, doc.expedienteId),
            eq(expedienteAsignaciones.abogadoId, auth.userId),
            isNull(expedienteAsignaciones.revocadaEn),
          ),
        );

      if (!asignado) {
        const [permiso] = await db
          .select({ id: expedientePermisos.id })
          .from(expedientePermisos)
          .where(
            and(
              eq(expedientePermisos.expedienteId, doc.expedienteId),
              eq(expedientePermisos.abogadoId, auth.userId),
              isNull(expedientePermisos.revocadoEn),
            ),
          );
        if (!permiso) {
          return Response.json({ error: 'Sin acceso al expediente de este documento' }, { status: 403 });
        }
      }
    }

    const estadosProcesables = new Set(['subido', 'clasificando']);
    if (!estadosProcesables.has(doc.estado)) {
      return Response.json({
        ok: false,
        mensaje: `El documento ya está en estado "${doc.estado}". No es necesario reprocesarlo.`,
      }, { status: 200 });
    }

    const resultado = await encolarJob({
      tipo: 'extraccion_texto',
      refId: documentoId,
      payload: {
        documentoId,
        hashSha256: doc.hashSha256,
        reencolado: false,
        correlationId,
      },
      correlationId,
    });

    await encolarEvento({
      tipo: OUTBOX_EVENTS.DOCUMENT_PROCESSING_REQUESTED,
      aggregateType: 'documento_expediente',
      aggregateId: documentoId,
      payload: {
        documentoId,
        expedienteId: doc.expedienteId,
        hashSha256: doc.hashSha256,
        jobId: resultado.id,
      },
      correlationId,
    });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'documento_updated',
      recurso: 'documento',
      recursoId: documentoId,
      metadata: { jobId: resultado.id, duplicado: resultado.duplicado, correlationId },
      request,
    });

    return Response.json({
      ok: true,
      jobId: resultado.id,
      duplicado: resultado.duplicado,
      correlationId,
      mensaje: resultado.duplicado
        ? 'El documento ya tiene un job de procesamiento pendiente.'
        : 'Job de procesamiento encolado correctamente.',
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
