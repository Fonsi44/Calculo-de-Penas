import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, documentTextPages } from '@/lib/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { encolarJob } from '@/lib/sgie/jobs-db';
import { isIaEnabled } from '@/lib/sgie/ia-documental';

/**
 * POST /api/sgie/documentos/:id/ia/reintentar
 *
 * Reintenta el análisis IA de un documento: recupera el texto extraído por
 * página, y si la IA está configurada, crea un nuevo job `ia_extraccion`.
 * Conserva los runs anteriores (no los borra). Audita `ai_analysis_started`.
 * Acción del abogado/asistente con acceso al expediente.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:ia:reintentar:${auth.userId}`, {
      max: 20, windowMs: 60_000, keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id: documentoId } = await params;

    if (!isIaEnabled()) {
      return Response.json({ error: 'IA no configurada' }, { status: 409 });
    }

    const [doc] = await db.select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      estado: documentosExpediente.estado,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    // No analizar documentos sin texto extraído.
    if (doc.estado === 'ocr_pendiente' || doc.estado === 'ilegible') {
      return Response.json({ error: 'El documento no tiene texto extraído para analizar' }, { status: 409 });
    }

    // Recuperar texto por página (Fase 3).
    const paginas = await db.select({ text: documentTextPages.text }).from(documentTextPages)
      .where(eq(documentTextPages.documentoId, documentoId)).orderBy(asc(documentTextPages.pageNumber));
    const textoExtraido = paginas.map((p) => p.text).join('\n').slice(0, 8000);
    if (textoExtraido.trim().length < 10) {
      return Response.json({ error: 'El documento no tiene texto útil' }, { status: 409 });
    }

    await encolarJob({
      tipo: 'ia_extraccion',
      refId: documentoId,
      payload: { documentoId, textoExtraido, reintento: true },
    });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'ai_analysis_started',
      recurso: 'documento_expediente',
      recursoId: documentoId,
      metadata: { expedienteId: doc.expedienteId, motivo: 'reintento_manual' },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
