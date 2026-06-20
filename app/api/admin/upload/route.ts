import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { uploadFile, StorageError } from '@/lib/storage';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    validateCsrf(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = (formData.get('slug') as string) || undefined;

    if (!file) {
      return Response.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: `Tipo de archivo no permitido: ${file.type}. Usa JPEG, PNG o WebP.` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: `El archivo excede el tamaño máximo de 10 MB` }, { status: 400 });
    }

    // Subida persistente: Vercel Blob en prod, filesystem local en dev (H01).
    const uploaded = await uploadFile(file, { slug });

    return Response.json({
      url: uploaded.url,
      filename: uploaded.filename,
      originalName: file.name,
      size: uploaded.size,
      backend: uploaded.backend,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageError) {
      return Response.json({ error: `Error de almacenamiento: ${err.message}` }, { status: 502 });
    }
    return authFailureResponse(err);
  }
}
