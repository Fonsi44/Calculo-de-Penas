import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, documentTextPages } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { encolarJob } from '@/lib/sgie/jobs-db';

/**
 * POST /api/sgie/documentos/:id/extraccion/reintentar
 *
 * Reintenta la extracción de un documento: limpia el estado anterior (páginas
 * y metadata de extracción), fuerza el estado a 'subido' y crea un nuevo job
 * `extraccion_texto`. Acción del abogado/asistente con acceso al expediente.
 * Audita `document_extraction_retried`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:extraccion:reintentar:${auth.userId}`, {
      max: 20, windowMs: 60_000, keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id: documentoId } = await params;

    const [doc] = await db.select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      blobUrl: documentosExpediente.blobUrl,
      tipoMime: documentosExpediente.tipoMime,
      estado: documentosExpediente.estado,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    // Verificar acceso al expediente (abogado asignado o admin).
    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    // Limpiar estado de extracción anterior y forzar reprocesable.
    await db.delete(documentTextPages).where(eq(documentTextPages.documentoId, documentoId));
    await db.update(documentosExpediente)
      .set({ estado: 'subido', procesadoEn: null, tipoDocumento: null })
      .where(eq(documentosExpediente.id, documentoId));

    // Crear nuevo job de extracción.
    await encolarJob({
      tipo: 'extraccion_texto',
      refId: documentoId,
      payload: { documentoId, blobUrl: doc.blobUrl, mime: doc.tipoMime, reintento: true },
    });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'document_extraction_retried',
      recurso: 'documento_expediente',
      recursoId: documentoId,
      metadata: { expedienteId: doc.expedienteId, estadoAnterior: doc.estado },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
