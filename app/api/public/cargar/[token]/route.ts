import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { httpErrorResponse, correlationIdFrom } from '@/lib/http-errors';
import {
  validarArchivoCarga,
  calcularHashSha256,
  saneaNombreDocumento,
  subirDocumentoBlob,
} from '@/lib/sgie/util';
import {
  reservarEnlaceAtomicamente,
  registrarDocumentoAtomico,
  compensarBlobHuerfano,
} from '@/lib/sgie/upload-atomico';

const CARGA_MAX = 10;
const CARGA_VENTANA_MS = 15 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const correlationId = correlationIdFrom(request);
  try {
    const { token } = await params;
    const ip = getClientIp(request);

    const rl = await rateLimit(ip, { keyPrefix: 'sgie-carga', windowMs: CARGA_VENTANA_MS, max: CARGA_MAX });
    if (!rl.ok) {
      return rateLimitResponse(rl);
    }

    const enlace = await reservarEnlaceAtomicamente(token, correlationId);
    if (!enlace) {
      await audit({
        accion: 'magic_link_accessed',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: 'Enlace no disponible (agotado, expirado, revocado o no encontrado)',
        metadata: { correlationId },
      });
      return Response.json({ error: 'Enlace no disponible o inválido.', code: 'LINK_UNAVAILABLE', correlationId }, { status: 410 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return Response.json({ error: 'Se espera un formulario multipart con el archivo.', correlationId }, { status: 400 });
    }
    const file = formData.get('archivo');
    if (!(file instanceof File)) {
      return Response.json({ error: 'No se encontró el archivo en el campo "archivo".', correlationId }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const validacionArchivo = validarArchivoCarga({
      buffer,
      mimeDeclarado: file.type || 'application/octet-stream',
      nombreOriginal: file.name,
      tamañoBytes: file.size,
    });
    if (!validacionArchivo.ok) {
      await audit({
        accion: 'documento_uploaded',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: validacionArchivo.error,
        metadata: { expedienteId: enlace.expedienteId, nombre: file.name, correlationId },
      });
      return Response.json({ error: validacionArchivo.error, correlationId }, { status: 400 });
    }

    const hash = calcularHashSha256(buffer);

    const nombreSaneado = saneaNombreDocumento(file.name);
    const { url: blobUrl, backend } = await subirDocumentoBlob({
      nombreSaneado,
      buffer: buffer.buffer.slice(0, buffer.byteLength),
      contentType: validacionArchivo.mimeReal,
    });

    let doc;
    try {
      doc = await registrarDocumentoAtomico({
        expedienteId: enlace.expedienteId,
        requisitoExpedienteId: enlace.requisitoExpedienteId,
        enlaceMagicoId: enlace.id,
        nombreOriginal: file.name,
        nombreSaneado,
        tipoMime: validacionArchivo.mimeReal,
        tamañoBytes: file.size,
        hashSha256: hash,
        blobUrl,
        origen: 'cliente',
        subidoIp: ip,
        subidoUserAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
        metadata: { backend, mimeReal: validacionArchivo.mimeReal },
        requestId: correlationId,
      });
    } catch {
      await compensarBlobHuerfano(blobUrl);
      throw new Error('Error al registrar el documento');
    }

    if (!doc.duplicado && enlace.requisitoExpedienteId) {
      try {
        const { vincularDocumentoARequisitoOnUpload } = await import('@/lib/sgie/seguimiento-documental');
        await vincularDocumentoARequisitoOnUpload({
          expedienteId: enlace.expedienteId,
          requisitoExpedienteId: enlace.requisitoExpedienteId,
        });
      } catch {
        // No bloquear la subida por un fallo de vinculación
      }
    }

    await audit({
      accion: 'documento_uploaded',
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: {
        expedienteId: enlace.expedienteId,
        documentoId: doc.id,
        duplicado: doc.duplicado,
        hash,
        tamañoBytes: file.size,
        correlationId,
      },
    });

    return Response.json(
      {
        ok: true,
        documentoId: doc.id,
        duplicado: doc.duplicado,
        correlationId,
        mensaje: doc.duplicado
          ? 'El documento ya estaba registrado (duplicado). No es necesario volver a subirlo.'
          : 'Documento recibido correctamente.',
      },
      {
        status: 201,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (err) {
    console.error(`[${correlationId}] [sgie/cargar] Error:`, err);
    return httpErrorResponse(err, request);
  }
}
