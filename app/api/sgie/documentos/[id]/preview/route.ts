/**
 * GET /api/sgie/documentos/:id/preview
 *
 * Devuelve metadatos para previsualizar un documento de forma segura.
 *
 * Seguridad:
 *  - requireAbogado.
 *  - Verifica scope: el documento debe pertenecer a un expediente accesible
 *    por el abogado (asignación/permiso) o el admin.
 *  - Audita el acceso con `documento_updated` (no hay evento `documento_previewed`
 *    en el enum; se reutiliza con metadata explícita).
 *
 * Respuesta:
 *  - { disponible: true, url, tipoMime, nombre }  → la UI abre el modal.
 *  - { disponible: false, motivo: 'preview_not_available' }  → storage sin URL
 *    firmada o documento sin blob.
 *
 * Sprint 2 — tarea 4. El storage actual (Vercel Blob) usa URLs públicas; no
 * hay URL firmada. Si en el futuro se migra a storage privado con signed URLs,
 * este endpoint generará la URL temporal aquí. No se exponen rutas internas.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:preview:${auth.userId}`, { max: 60, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const [doc] = await db.select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoMime: documentosExpediente.tipoMime,
      blobUrl: documentosExpediente.blobUrl,
    }).from(documentosExpediente).where(eq(documentosExpediente.id, id));

    if (!doc) return Response.json({ error: 'Documento no encontrado' }, { status: 404 });

    // Verificar scope del expediente.
    if (auth.rol !== 'admin') {
      const [asig, perm] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
          .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
          .where(and(eq(expedientePermisos.expedienteId, doc.expedienteId), eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      if (asig.length === 0 && perm.length === 0) {
        return Response.json({ error: 'Sin acceso' }, { status: 403 });
      }
    }

    // Auditar acceso a preview.
    await logSgie({
      usuarioId: auth.userId,
      accion: 'documento_updated', // no hay evento preview dedicado
      recurso: 'documento',
      recursoId: doc.id,
      metadata: { evento: 'preview_accessed', documentoId: doc.id } as Record<string, unknown>,
      request,
    });

    // El storage actual guarda URLs públicas (Vercel Blob) o paths locales.
    // No hay URL firmada; devolvemos la URL existente para que la UI la muestre.
    // Si no hay blobUrl, preview no disponible.
    if (!doc.blobUrl) {
      return Response.json({ disponible: false, motivo: 'preview_not_available' });
    }

    return Response.json({
      disponible: true,
      url: doc.blobUrl,
      tipoMime: doc.tipoMime,
      nombre: doc.nombreOriginal,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
