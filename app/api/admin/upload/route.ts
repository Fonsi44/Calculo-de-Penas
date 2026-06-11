import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'images', 'blog');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

export async function POST(request: Request) {
  try {
    requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = (formData.get('slug') as string) || 'imagen';

    if (!file) {
      return Response.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: `Tipo de archivo no permitido: ${file.type}. Usa JPEG, PNG o WebP.` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: `El archivo excede el tamaño máximo de 10 MB` }, { status: 400 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeSlug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100) || 'imagen';
    const ext = MIME_TO_EXT[file.type] || '.jpg';
    const outputFilename = `${safeSlug}${ext}`;
    const outputPath = join(UPLOAD_DIR, outputFilename);

    await writeFile(outputPath, buffer);

    const publicUrl = `/images/blog/${outputFilename}`;

    return Response.json({
      url: publicUrl,
      filename: outputFilename,
      originalName: file.name,
      size: file.size,
    }, { status: 201 });
  } catch (err) {
    return authFailureResponse(err);
  }
}
