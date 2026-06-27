import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id: documentoId } = await params;

    const [doc] = await db.select({ expedienteId: documentosExpediente.expedienteId, estado: documentosExpediente.estado })
      .from(documentosExpediente).where(eq(documentosExpediente.id, documentoId));
    if (!doc) return Response.json({ error: 'No encontrado' }, { status: 404 });

    // Scope check
    if (auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, doc.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) {
        const [perm] = await db.select({ id: expedientePermisos.id }).from(expedientePermisos)
          .where(and(eq(expedientePermisos.expedienteId, doc.expedienteId), eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn)));
        if (!perm) return Response.json({ error: 'Sin acceso' }, { status: 403 });
      }
    }

    await db.update(documentosExpediente).set({ estado: 'aprobado', aprobadoPor: auth.userId, aprobadoEn: new Date() })
      .where(eq(documentosExpediente.id, documentoId));

    await logSgie({ usuarioId: auth.userId, accion: 'documento_updated', recurso: 'documento', recursoId: documentoId, metadata: { accion: 'aprobar' }, request });

    return Response.json({ ok: true });
  } catch (err) { return authFailureResponse(err); }
}
