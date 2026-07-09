import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, extraccionesIa, camposExtraidos, validaciones } from '@/lib/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

/**
 * GET /api/sgie/documentos/:id/ia
 *
 * Consulta el análisis IA de un documento: runs (con suggested_status, score,
 * provider, model), campos extraídos (con cita fuente) y checks de validación
 * (pass/warn/fail). Acceso por abogado/asistente con scope. No se expone en
 * rutas públicas ni al cliente.
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
      tipoDocumento: documentosExpediente.tipoDocumento,
      metadata: documentosExpediente.metadata,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const runs = await db.select({
      id: extraccionesIa.id,
      proveedor: extraccionesIa.proveedor,
      modelo: extraccionesIa.modelo,
      exito: extraccionesIa.exito,
      error: extraccionesIa.error,
      duracionMs: extraccionesIa.duracionMs,
      suggestedStatus: extraccionesIa.suggestedStatus,
      totalConfidence: extraccionesIa.totalConfidence,
      runStatus: extraccionesIa.runStatus,
      resultadoJson: extraccionesIa.resultadoJson,
      creadoEn: extraccionesIa.creadoEn,
    }).from(extraccionesIa).where(eq(extraccionesIa.documentoId, documentoId))
      .orderBy(desc(extraccionesIa.creadoEn)).limit(10);

    const campos = await db.select({
      clave: camposExtraidos.clave,
      valor: camposExtraidos.valor,
      tipo: camposExtraidos.tipo,
      confianza: camposExtraidos.confianza,
      citaFragmento: camposExtraidos.citaFragmento,
    }).from(camposExtraidos).where(eq(camposExtraidos.documentoId, documentoId));

    const checks = await db.select({
      reglaId: validaciones.reglaId,
      resultado: validaciones.resultado,
      severidad: validaciones.severidad,
      mensaje: validaciones.mensaje,
      evidencias: validaciones.evidencias,
    }).from(validaciones)
      .where(and(eq(validaciones.documentoId, documentoId), eq(validaciones.ejecutadoPor, 'ia')))
      .orderBy(desc(validaciones.creadoEn)).limit(30);

    const meta = (doc.metadata as Record<string, unknown> | null) ?? {};

    return Response.json({
      documento: {
        id: doc.id,
        expedienteId: doc.expedienteId,
        estado: doc.estado,
        tipoDocumento: doc.tipoDocumento,
      },
      iaConfigurada: Boolean(meta.iaExtraccionId) || runs.some((r) => r.runStatus === 'completed'),
      iaResumen: typeof meta.iaResumen === 'string' ? meta.iaResumen : null,
      iaScore: typeof meta.iaScore === 'number' ? meta.iaScore : null,
      iaSuggestedStatus: typeof meta.iaSuggestedStatus === 'string' ? meta.iaSuggestedStatus : null,
      runs,
      campos,
      checks,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
