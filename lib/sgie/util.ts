/**
 * SGIE — utilidades compartidas.
 *
 * Helpers de seguridad documental: generación de tokens criptográficos,
 * cálculo de hash SHA-256, validación por magic bytes, saneamiento de nombres
 * y detección de MIME real. Referencia: pinedayasociados.md §12.4, §22.2.
 */
import { createHash, randomBytes } from 'crypto';
import { put } from '@vercel/blob';

/**
 * Genera un token aleatorio seguro de 256 bits (32 bytes) en base64url.
 * Usado para enlaces mágicos de carga documental.
 */
export function generarTokenSeguro(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Calcula el hash SHA-256 de un token de enlace mágico para almacenamiento.
 * Hex lowercase, 64 chars. NUNCA se persiste el token en claro: en
 * `enlaces_magicos` solo se guarda este hash.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Calcula el hash SHA-256 de un buffer. Hex lowercase, 64 chars.
 * Obligatorio ANTES de cualquier procesamiento IA/OCR (§12.5, §22.3).
 */
export function calcularHashSha256(buffer: ArrayBuffer | Uint8Array): string {
  const hash = createHash('sha256');
  hash.update(new Uint8Array(buffer));
  return hash.digest('hex');
}

/**
 * MIME permitidos para carga documental SGIE. Configurable por admin en fases
 * posteriores; por ahora un conjunto seguro por defecto.
 */
export const MIME_PERMITIDOS_SGIE = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

/**
 * Tamaño máximo por defecto para documentos SGIE: 25 MB.
 * Configurable por admin en fases posteriores.
 */
export const TAMAÑO_MAX_BYTES_SGIE = 25 * 1024 * 1024;

/**
 * Extensiones peligrosas que se rechazan siempre, sin importar el MIME declarado.
 */
const EXTENSIONES_PELIGROSAS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'js', 'mjs', 'jar', 'com', 'scr', 'msi',
  'html', 'htm', 'svg', 'php', 'phtml', 'asp', 'aspx', 'jsp',
]);

/**
 * Firmas magic bytes de los formatos permitidos. Permite detectar MIME spoofing:
 * un archivo puede declarar `application/pdf` pero no ser un PDF real.
 * Referencia: §12.4, §22.3 (validación por magic bytes cuando sea posible).
 */
const MAGIC_BYTES: Array<{ mime: string; offset: number; bytes: number[] }> = [
  { mime: 'application/pdf', offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }, // ‰PNG
  { mime: 'image/webp', offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (WebP contenedor)
];

/**
 * Detecta el MIME real a partir de los magic bytes del buffer.
 * Devuelve null si no coincide ningún formato conocido.
 */
export function detectarMimePorMagicBytes(buffer: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    let coincide = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        coincide = false;
        break;
      }
    }
    if (coincide) return sig.mime;
  }
  return null;
}

/**
 * Valida un archivo para carga SGIE: tamaño, MIME declarado, magic bytes y
 * extensión peligrosa. Devuelve null si es válido, o un mensaje de error.
 */
export function validarArchivoCarga(params: {
  buffer: Uint8Array;
  mimeDeclarado: string;
  nombreOriginal: string;
  tamañoBytes: number;
  mimePermitidos?: Set<string>;
  tamañoMaxBytes?: number;
}): { ok: true; mimeReal: string } | { ok: false; error: string } {
  const {
    buffer,
    mimeDeclarado,
    nombreOriginal,
    tamañoBytes,
    mimePermitidos = MIME_PERMITIDOS_SGIE,
    tamañoMaxBytes = TAMAÑO_MAX_BYTES_SGIE,
  } = params;

  if (tamañoBytes <= 0) {
    return { ok: false, error: 'El archivo está vacío.' };
  }
  if (tamañoBytes > tamañoMaxBytes) {
    return { ok: false, error: `El archivo excede el tamaño máximo de ${Math.round(tamañoMaxBytes / 1024 / 1024)} MB.` };
  }

  // Extensión peligrosa.
  const ext = (nombreOriginal.split('.').pop() || '').toLowerCase();
  if (EXTENSIONES_PELIGROSAS.has(ext)) {
    return { ok: false, error: `La extensión .${ext} no está permitida.` };
  }

  // MIME declarado permitido.
  if (!mimePermitidos.has(mimeDeclarado)) {
    return { ok: false, error: `El tipo MIME "${mimeDeclarado}" no está permitido.` };
  }

  // Magic bytes: si el formato está en la tabla de firmas, el MIME real debe
  // coincidir con el declarado. Si no está en la tabla (text/plain, docx),
  // se acepta el declarado (no todos los formatos tienen magic bytes fiables).
  const mimeReal = detectarMimePorMagicBytes(buffer);
  if (mimeReal && mimeReal !== mimeDeclarado) {
    return { ok: false, error: `El contenido del archivo no coincide con el tipo declarado (${mimeDeclarado} vs ${mimeReal}).` };
  }

  return { ok: true, mimeReal: mimeReal ?? mimeDeclarado };
}

/**
 * Sanea un nombre de archivo para almacenamiento: minúsculas, [a-z0-9-], sin
 * path traversal, con sufijo aleatorio para evitar colisiones.
 */
export function saneaNombreDocumento(nombreOriginal: string): string {
  const base = (nombreOriginal.replace(/\.[^.]+$/, '') || 'documento')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'documento';
  const ext = (nombreOriginal.split('.').pop() || '').toLowerCase();
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'bin';
  const suffix = randomBytes(4).toString('hex');
  return `${base}-${suffix}.${safeExt}`;
}

/**
 * Sube un documento a Vercel Blob con acceso PRIVADO (rutas privadas §22.3).
 * El acceso se media por API autorizada (scope por expediente y rol), no por
 * URL pública. En desarrollo sin token, hace fallback a filesystem local.
 */
export async function subirDocumentoBlob(params: {
  nombreSaneado: string;
  buffer: ArrayBuffer;
  contentType: string;
}): Promise<{ url: string; backend: 'vercel-blob' | 'local-fs' }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && token.trim().length > 0 && !token.includes('PEGA_AQUI')) {
    const blob = await put(params.nombreSaneado, params.buffer, {
      access: 'private',
      addRandomSuffix: false,
      token: token.trim(),
      contentType: params.contentType,
    });
    return { url: blob.url, backend: 'vercel-blob' };
  }
  // Fallback desarrollo: filesystem local (no persistente en prod, sólo dev).
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');
  const dir = join(process.cwd(), 'private-uploads', 'sgie');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(join(dir, params.nombreSaneado), Buffer.from(params.buffer));
  return { url: `file://local/${params.nombreSaneado}`, backend: 'local-fs' };
}
