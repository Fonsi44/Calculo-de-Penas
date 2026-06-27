import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { encolarJob } from '@/lib/sgie/jobs-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

/**
 * POST /api/sgie/documentos/[id]/procesar
 *
 * Encola un job de procesamiento documental (extracción de texto +
 * clasificación heurística) para un documento ya persistido.
 * No ejecuta trabajo pesado en el route handler.
 *
 * Idempotencia: si ya existe un job pendiente/en_proceso para el mismo
 * documento, no duplica.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id: documentoId } = await params;

    const rl = await rateLimit(`sgie:doc:procesar:${auth.userId}`, {
      max: 30,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);

    // Verificar acceso al documento
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

    // Verificar scope: admin ve todo; abogado solo sus expedientes
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

    // Validar que el documento esté en un estado procesable
    const estadosProcesables = new Set(['subido', 'clasificando']);
    if (!estadosProcesables.has(doc.estado)) {
      return Response.json({
        ok: false,
        mensaje: `El documento ya está en estado "${doc.estado}". No es necesario reprocesarlo.`,
      }, { status: 200 });
    }

    // Encolar job (idempotente: no duplica por tipo+refId+ventanaTemporal)
    const resultado = await encolarJob({
      tipo: 'extraccion_texto',
      refId: documentoId,
      payload: {
        documentoId,
        hashSha256: doc.hashSha256,
        reencolado: false,
      },
    });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'documento_updated', // Reutilizamos acción existente
      recurso: 'documento',
      recursoId: documentoId,
      metadata: { jobId: resultado.id, duplicado: resultado.duplicado },
      request,
    });

    return Response.json({
      ok: true,
      jobId: resultado.id,
      duplicado: resultado.duplicado,
      mensaje: resultado.duplicado
        ? 'El documento ya tiene un job de procesamiento pendiente.'
        : 'Job de procesamiento encolado correctamente.',
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
