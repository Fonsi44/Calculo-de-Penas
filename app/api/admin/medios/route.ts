import { db } from '@/lib/db';
import { medios, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { uploadFile, deleteFile, StorageError } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const rows = await db.select().from(medios).orderBy(desc(medios.creadoEn)).limit(limit).offset(offset);
    return Response.json({ medios: rows, total: rows.length });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`medios:upload:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) return Response.json({ error: 'Archivo requerido' }, { status: 400 });

      // Subida persistente: Vercel Blob en prod, filesystem local en dev.
      const slug = (formData.get('slug') as string) || undefined;
      const uploaded = await uploadFile(file, { slug });

      const [medio] = await db.insert(medios).values({
        nombreArchivo: uploaded.filename,
        altText: (formData.get('altText') as string) || '',
        titulo: (formData.get('titulo') as string) || '',
        tipoMime: uploaded.mimeType,
        tamaño: uploaded.size,
        url: uploaded.url,
        createdBy: auth.userId,
      }).returning();

      await logAudit({ usuarioId: auth.userId, accion: 'medio_created' as AuditoriaAccion, recurso: 'medio', recursoId: medio.id, metadata: { url: uploaded.url, filename: uploaded.filename, backend: uploaded.backend }, request });
      return Response.json({ medio }, { status: 201 });
    }

    return Response.json({ error: 'Usa multipart/form-data' }, { status: 400 });
  } catch (err) {
    if (err instanceof StorageError) {
      return Response.json({ error: `Error de almacenamiento: ${err.message}` }, { status: 502 });
    }
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });

    const [medio] = await db.delete(medios).where(eq(medios.id, id)).returning();
    if (!medio) return Response.json({ error: 'Medio no encontrado' }, { status: 404 });

    // Borrado best-effort del almacenamiento (Vercel Blob o local).
    await deleteFile(medio.url);

    await logAudit({ usuarioId: auth.userId, accion: 'medio_deleted' as AuditoriaAccion, recurso: 'medio', recursoId: id, request });
    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
