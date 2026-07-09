import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, documentTextPages, extraccionesIa } from '@/lib/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';

/**
 * GET /api/sgie/documentos/:id/extraccion
 *
 * Consulta el estado de extracción de un documento: estado, método, páginas
 * (texto por página), error y confianza. Acceso por abogado/asistente con
 * scope sobre el expediente. No expone nada en rutas públicas.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id: documentoId } = await params;

    const [doc] = await db.select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      estado: documentosExpediente.estado,
      tipoMime: documentosExpediente.tipoMime,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoDocumento: documentosExpediente.tipoDocumento,
      metadata: documentosExpediente.metadata,
      procesadoEn: documentosExpediente.procesadoEn,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const paginas = await db.select({
      pageNumber: documentTextPages.pageNumber,
      text: documentTextPages.text,
      method: documentTextPages.method,
      confidence: documentTextPages.confidence,
    }).from(documentTextPages)
      .where(eq(documentTextPages.documentoId, documentoId))
      .orderBy(asc(documentTextPages.pageNumber));

    const meta = (doc.metadata as Record<string, unknown> | null) ?? {};

    const [extraccion] = await db.select({
      proveedor: extraccionesIa.proveedor,
      modelo: extraccionesIa.modelo,
      exito: extraccionesIa.exito,
      error: extraccionesIa.error,
      creadoEn: extraccionesIa.creadoEn,
    }).from(extraccionesIa).where(eq(extraccionesIa.documentoId, documentoId))
      .orderBy(extraccionesIa.creadoEn).limit(1);

    return Response.json({
      documento: {
        id: doc.id,
        expedienteId: doc.expedienteId,
        estado: doc.estado,
        tipoMime: doc.tipoMime,
        nombreOriginal: doc.nombreOriginal,
        tipoDocumento: doc.tipoDocumento,
        procesadoEn: doc.procesadoEn,
      },
      metodo: typeof meta.extraccionMetodo === 'string' ? meta.extraccionMetodo : null,
      paginasDetectadas: typeof meta.paginasDetectadas === 'number' ? meta.paginasDetectadas : paginas.length,
      confianza: typeof meta.confianzaClasificacion === 'number' ? meta.confianzaClasificacion : null,
      ocrConfigurado: meta.ocrConfigurado === true,
      error: typeof meta.errorExtraccion === 'string' ? meta.errorExtraccion : (extraccion?.error ?? null),
      paginas,
      extraccion: extraccion ?? null,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
