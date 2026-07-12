import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  documentosExpediente,
  expedientes,
  expedienteAsignaciones,
  expedientePermisos,
  clientes,
  requisitosExpediente,
} from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';

async function verificarAccesoDocumento(documentoId: string, usuarioId: string, esAdmin: boolean): Promise<boolean> {
  if (esAdmin) return true;

  const [doc] = await db
    .select({ expedienteId: documentosExpediente.expedienteId })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId));

  if (!doc) return false;

  const [asignado] = await db
    .select({ id: expedienteAsignaciones.id })
    .from(expedienteAsignaciones)
    .where(
      and(
        eq(expedienteAsignaciones.expedienteId, doc.expedienteId),
        eq(expedienteAsignaciones.abogadoId, usuarioId),
        isNull(expedienteAsignaciones.revocadaEn),
      ),
    );

  if (asignado) return true;

  const [permiso] = await db
    .select({ id: expedientePermisos.id })
    .from(expedientePermisos)
    .where(
      and(
        eq(expedientePermisos.expedienteId, doc.expedienteId),
        eq(expedientePermisos.abogadoId, usuarioId),
        isNull(expedientePermisos.revocadoEn),
      ),
    );

  return Boolean(permiso);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    const { id } = await params;

    const tieneAcceso = await verificarAccesoDocumento(id, auth.userId, auth.rol === 'admin');
    if (!tieneAcceso) {
      return Response.json({ error: 'Documento no encontrado o sin acceso' }, { status: 404 });
    }

    const [doc] = await db
      .select({
        id: documentosExpediente.id,
        expedienteId: documentosExpediente.expedienteId,
        requisitoExpedienteId: documentosExpediente.requisitoExpedienteId,
        enlaceMagicoId: documentosExpediente.enlaceMagicoId,
        nombreOriginal: documentosExpediente.nombreOriginal,
        nombreSaneado: documentosExpediente.nombreSaneado,
        tipoMime: documentosExpediente.tipoMime,
        tamañoBytes: documentosExpediente.tamañoBytes,
        hashSha256: documentosExpediente.hashSha256,
        blobUrl: documentosExpediente.blobUrl,
        blobTextoUrl: documentosExpediente.blobTextoUrl,
        estado: documentosExpediente.estado,
        origen: documentosExpediente.origen,
        tipoDocumento: documentosExpediente.tipoDocumento,
        subidoPor: documentosExpediente.subidoPor,
        subidoIp: documentosExpediente.subidoIp,
        subidoEn: documentosExpediente.subidoEn,
        procesadoEn: documentosExpediente.procesadoEn,
        aprobadoPor: documentosExpediente.aprobadoPor,
        aprobadoEn: documentosExpediente.aprobadoEn,
        rechazadoPor: documentosExpediente.rechazadoPor,
        rechazadoEn: documentosExpediente.rechazadoEn,
        rechazoMotivo: documentosExpediente.rechazoMotivo,
        metadata: documentosExpediente.metadata,
        numeroInterno: expedientes.numeroInterno,
        clienteNombre: clientes.nombre,
      })
      .from(documentosExpediente)
      .leftJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(eq(documentosExpediente.id, id));

    if (!doc) {
      return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Obtener el nombre del requisito si existe
    let requisitoNombre: string | null = null;
    if (doc.requisitoExpedienteId) {
      const [req] = await db
        .select({ nombre: requisitosExpediente.nombre })
        .from(requisitosExpediente)
        .where(eq(requisitosExpediente.id, doc.requisitoExpedienteId));
      requisitoNombre = req?.nombre ?? null;
    }

    // Extraer texto del metadata si existe
    const meta = (doc.metadata ?? {}) as Record<string, unknown>;
    const textoExtraido = typeof meta.textoExtraido === 'string' ? meta.textoExtraido : null;

    // No devolver blobUrl ni blobTextoUrl al cliente.
    const { blobUrl: _blobUrl, blobTextoUrl: _blobTextoUrl, ...rest } = doc;

    return Response.json({
      documento: {
        ...rest,
        requisitoNombre,
        textoExtraido: textoExtraido ? `${textoExtraido.slice(0, 2000)}${textoExtraido.length > 2000 ? '...' : ''}` : null,
        confianzaClasificacion: meta.confianzaClasificacion ?? null,
        evidenciasClasificacion: meta.evidenciasClasificacion ?? null,
      },
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
