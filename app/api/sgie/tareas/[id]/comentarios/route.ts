/**
 * GET  /api/sgie/tareas/:id/comentarios
 * POST /api/sgie/tareas/:id/comentarios
 *
 * Comentarios de una tarea (colaboración). Scope: acceso a la tarea
 * (asignación/permiso del expediente, o autoría/asignación de la tarea).
 * Texto plano (sin HTML inseguro). Borrado lógico vía PATCH/DELETE dedicados.
 *
 * Auditoría: tarea_updated con metadata explícita (no hay acción dedicada en
 * el enum para comentario_created/updated/deleted).
 *
 * Sprint 4 — tarea 3.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { tareaComentarios, usuarios } from '@/lib/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { verificarAccesoTarea } from '@/lib/sgie/tareas-db';

const createSchema = z.object({
  comentario: z.string().min(1).max(2000),
});

async function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAbogado(request);
    const { id } = await params;
    const acceso = await verificarAccesoTarea(id, await ctx(auth));
    if (!acceso) return Response.json({ error: 'Sin acceso a la tarea' }, { status: 403 });

    const rows = await db.select({
      id: tareaComentarios.id,
      tareaId: tareaComentarios.tareaId,
      autorId: tareaComentarios.autorId,
      autorNombre: usuarios.nombre,
      comentario: tareaComentarios.comentario,
      creadoEn: tareaComentarios.creadoEn,
      editadoEn: tareaComentarios.editadoEn,
      eliminadoEn: tareaComentarios.eliminadoEn,
    }).from(tareaComentarios)
      .leftJoin(usuarios, eq(tareaComentarios.autorId, usuarios.id))
      .where(and(eq(tareaComentarios.tareaId, id), isNull(tareaComentarios.eliminadoEn)))
      .orderBy(asc(tareaComentarios.creadoEn));

    return Response.json({ comentarios: rows, total: rows.length });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:comentario:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const acceso = await verificarAccesoTarea(id, await ctx(auth));
    if (!acceso) return Response.json({ error: 'Sin acceso a la tarea' }, { status: 403 });

    const parsed = createSchema.parse(await request.json());
    // Texto plano: eliminar cualquier intento de HTML/script (defensa en profundidad).
    const comentario = parsed.comentario.replace(/<[^>]*>/g, '').trim();

    const [insertado] = await db.insert(tareaComentarios).values({
      tareaId: id, autorId: auth.userId, comentario,
    }).returning({ id: tareaComentarios.id });

    await logSgie({
      usuarioId: auth.userId, accion: 'tarea_updated', recurso: 'tarea_comentario',
      recursoId: insertado?.id, metadata: { evento: 'comentario_created', tareaId: id } as Record<string, unknown>,
      request,
    });

    return Response.json({ comentario: { id: insertado?.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
