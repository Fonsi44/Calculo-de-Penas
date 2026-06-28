import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { validarEnlace, consumirUsoEnlace } from '@/lib/sgie/enlaces-magicos';
import {
  validarArchivoCarga,
  calcularHashSha256,
  saneaNombreDocumento,
  subirDocumentoBlob,
} from '@/lib/sgie/util';
import { registrarDocumento } from '@/lib/sgie/documentos-db';

/**
 * POST /api/public/cargar/[token]
 *
 * Carga pública de documentos por enlace mágico. El cliente no tiene cuenta;
 * el token es su credencial. Validaciones (§12.4, §22.2, §22.3):
 *   1. Token válido, no expirado, no revocado, con usos disponibles.
 *   2. Rate limit por IP (10 cargas / 15 min).
 *   3. Tamaño, MIME permitido, magic bytes, extensión peligrosa.
 *   4. Hash SHA-256 ANTES de cualquier procesamiento.
 *   5. Detección de duplicados: si el hash existe en el expediente, marca
 *      `duplicado` y NO se procesa IA/OCR.
 *
 * El procesamiento (texto, clasificación, OCR, IA) se encola como job, nunca
 * aquí (serverless: no procesar pesado en request).
 */

const CARGA_MAX = 10;
const CARGA_VENTANA_MS = 15 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const ip = getClientIp(request);

    // Rate limit por IP (no por token: un atacante podría rotar tokens).
    const rl = await rateLimit(ip, { keyPrefix: 'sgie-carga', windowMs: CARGA_VENTANA_MS, max: CARGA_MAX });
    if (!rl.ok) {
      return rateLimitResponse(rl);
    }

    // Validar token de enlace mágico.
    const validacion = await validarEnlace(token);
    if (!validacion.ok) {
      await audit({
        accion: 'magic_link_accessed',
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        exito: false,
        mensaje: validacion.error,
        metadata: { codigo: validacion.codigo },
      });
      const status = validacion.codigo === 'no_encontrado' ? 404 : 410;
      return Response.json({ error: validacion.error }, { status });
    }

    // Parsear multipart.
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return Response.json({ error: 'Se espera un formulario multipart con el archivo.' }, { status: 400 });
    }
    const file = formData.get('archivo');
    if (!(file instanceof File)) {
      return Response.json({ error: 'No se encontró el archivo en el campo "archivo".' }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Validar archivo (tamaño, MIME, magic bytes, extensión).
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
        metadata: { expedienteId: validacion.enlace.expedienteId, nombre: file.name },
      });
      return Response.json({ error: validacionArchivo.error }, { status: 400 });
    }

    // Hash SHA-256 OBLIGATORIO antes de cualquier procesamiento.
    const hash = calcularHashSha256(buffer);

    // Subir a Blob privado.
    const nombreSaneado = saneaNombreDocumento(file.name);
    const { url: blobUrl, backend } = await subirDocumentoBlob({
      nombreSaneado,
      buffer: buffer.buffer.slice(0, buffer.byteLength),
      contentType: validacionArchivo.mimeReal,
    });

    // Registrar documento (detecta duplicado y marca estado).
    const doc = await registrarDocumento({
      expedienteId: validacion.enlace.expedienteId,
      requisitoExpedienteId: validacion.enlace.requisitoExpedienteId,
      enlaceMagicoId: validacion.enlace.id,
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
    });

    // Si NO es duplicado, encolar job de extracción de texto + clasificación.
    if (!doc.duplicado) {
      const { encolarJob } = await import('@/lib/sgie/jobs-db');
      await encolarJob({
        tipo: 'extraccion_texto',
        refId: doc.id,
        payload: { documentoId: doc.id, blobUrl, mime: validacionArchivo.mimeReal },
      });
    }

    // Consumir un uso del enlace (tras éxito).
    await consumirUsoEnlace(validacion.enlace.id);

    await audit({
      accion: 'documento_uploaded',
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: {
        expedienteId: validacion.enlace.expedienteId,
        documentoId: doc.id,
        duplicado: doc.duplicado,
        hash,
        tamañoBytes: file.size,
      },
    });

    return Response.json(
      {
        ok: true,
        documentoId: doc.id,
        duplicado: doc.duplicado,
        mensaje: doc.duplicado
          ? 'El documento ya estaba registrado (duplicado). No es necesario volver a subirlo.'
          : 'Documento recibido correctamente.',
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[sgie/cargar] Error:', err);
    return Response.json({ error: 'Error al procesar la carga.' }, { status: 500 });
  }
}
