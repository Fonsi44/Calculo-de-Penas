/**
 * Almacenamiento persistente para uploads de la intranet.
 *
 * PROBLEMA RESUELTO (H01): antes los uploads se escribían en `public/images/...`
 * del filesystem local, que es EFÍMERO en Vercel: las imágenes desaparecían
 * tras cada deploy. Ahora se suben a Vercel Blob (almacenamiento persistente,
 * integrado con el host) cuando está configurado, con fallback a filesystem
 * local para desarrollo sin credenciales.
 *
 * IMPLEMENTACIÓN: SDK oficial @vercel/blob (first-party). Antes se intentó
 * una implementación REST artesanal que no replicaba bien el contrato de la
 * API (405 Unknown operation). El SDK garantiza compatibilidad con futuras
 * versiones del servicio.
 *
 * DISEÑO:
 * - Token siempre de variable de entorno (`BLOB_READ_WRITE_TOKEN`), nunca
 *   hardcodeado (§3 Secretos).
 * - En desarrollo (sin token), escribe a `public/images/uploads/` como antes,
 *   para no romper el flujo local.
 */

import { put, del } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'public', 'images', 'uploads');

export interface UploadResult {
  /** URL pública del recurso subido (blob:... en prod, /images/uploads/... en dev). */
  url: string;
  /** Nombre del archivo almacenado (para metadatos). */
  filename: string;
  /** Tamaño en bytes. */
  size: number;
  /** MIME type. */
  mimeType: string;
  /** Dónde se almacenó realmente (para auditoría y diagnóstico). */
  backend: 'vercel-blob' | 'local-fs';
}

function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token && token.trim().length > 0 && !token.includes('PEGA_AQUI')
    ? token.trim()
    : null;
}

/**
 * Sanitiza un nombre de archivo: minúsculas, solo [a-z0-9-], sin colisiones.
 */
function sanitizeFilename(rawSlug: string, originalName: string): string {
  const slug = (rawSlug || originalName.replace(/\.[^.]+$/, ''))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'archivo';
  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'bin';
  return `${slug}-${Date.now()}.${safeExt}`;
}

/**
 * Sube un archivo a almacenamiento persistente.
 *
 * - En producción con `BLOB_READ_WRITE_TOKEN` configurado → Vercel Blob.
 * - En desarrollo sin token → filesystem local `public/images/uploads/`.
 */
export async function uploadFile(
  file: File,
  options: { slug?: string } = {},
): Promise<UploadResult> {
  const filename = sanitizeFilename(options.slug || '', file.name);
  const token = getBlobToken();

  if (token) {
    try {
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
        token,
      });
      return {
        url: blob.url,
        filename,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        backend: 'vercel-blob',
      };
    } catch (err) {
      throw new StorageError(
        `Vercel Blob: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Fallback desarrollo: filesystem local
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(LOCAL_UPLOAD_DIR, filename), buffer);

  return {
    url: `/images/uploads/${filename}`,
    filename,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    backend: 'local-fs',
  };
}

/**
 * Elimina un archivo del almacenamiento.
 * En Vercel Blob requiere la URL completa; en local, el path relativo.
 * Best-effort: no lanza si el archivo no existe.
 */
export async function deleteFile(url: string): Promise<void> {
  if (url.includes('blob.vercel-storage.com')) {
    const token = getBlobToken();
    if (!token) return;
    try {
      await del(url, { token });
    } catch {
      // best-effort
    }
    return;
  }

  // Fallback local
  if (url.startsWith('/images/')) {
    const filePath = join(process.cwd(), 'public', url);
    const fs = await import('fs');
    if (fs.existsSync(filePath)) {
      try { await fs.promises.unlink(filePath); } catch { /* best-effort */ }
    }
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}
