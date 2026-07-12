import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { uploadFile, StorageError } from '@/lib/storage';
import { validateImage } from '@/lib/file-validation';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    validateCsrf(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = (formData.get('slug') as string) || undefined;

    if (!file) {
      return Response.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: `El archivo excede el tamaño máximo de 10 MB` }, { status: 400 });
    }

    // Phase 3: validación por magic bytes, no solo MIME de cliente.
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateImage(buffer, file.name);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Subida persistente: Vercel Blob en prod, filesystem local en dev (H01).
    const uploaded = await uploadFile(file, { slug });

    return Response.json({
      url: uploaded.url,
      filename: uploaded.filename,
      originalName: file.name,
      size: uploaded.size,
      detectedType: validation.detectedType,
      backend: uploaded.backend,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageError) {
      return Response.json({ error: `Error de almacenamiento: ${err.message}` }, { status: 502 });
    }
    return authFailureResponse(err);
  }
}
