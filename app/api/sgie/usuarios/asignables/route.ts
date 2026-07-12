/**
 * GET /api/sgie/usuarios/asignables
 *
 * Lista abogados activos y no bloqueados, asignables como responsable de una
 * tarea. Payload mínimo (id, nombre) — sin emails ni datos sensibles.
 *
 * Sprint 2 — selector de responsable en el CRUD de Tareas.
 *
 * Seguridad: requireAbogado. No expone hashes, emails ni estado interno.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export async function GET(request: Request) {
  try {
    await requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const conditions = [
      eq(usuarios.active, true),
      eq(usuarios.bloqueado, false),
      or(eq(usuarios.rol, 'abogado'), eq(usuarios.rol, 'admin'))!,
    ];
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(ilike(usuarios.nombre, term)!);
    }

    const rows = await db
      .select({ id: usuarios.id, nombre: usuarios.nombre })
      .from(usuarios)
      .where(and(...conditions))
      .orderBy(asc(usuarios.nombre))
      .limit(query.limit);

    return Response.json({ usuarios: rows, total: rows.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
