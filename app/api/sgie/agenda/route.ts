import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventosAgenda, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, inArray, desc, count, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  expedienteId: z.string().uuid().optional(),
  estado: z.string().optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
});

const createSchema = z.object({
  titulo: z.string().min(1).max(300),
  descripcion: z.string().max(2000).optional(),
  fecha: z.string().datetime(),
  expedienteId: z.string().uuid().optional(),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const esAdmin = auth.rol === 'admin';
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    let accesibles: string[] | null = null;
    if (!esAdmin) {
      const [asig, perm] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
          .where(and(eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
          .where(and(eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      const ids = new Set([...asig.map(r => r.id), ...perm.map(r => r.id)]);
      accesibles = Array.from(ids);
      if (accesibles.length === 0) return Response.json({ eventos: [], total: 0, page: 1, limit: query.limit });
    }

    // Sprint 3: filtros por expediente, estado y rango de fechas.
    const conditions = [];
    if (accesibles) conditions.push(inArray(eventosAgenda.expedienteId, accesibles));
    if (query.expedienteId) conditions.push(eq(eventosAgenda.expedienteId, query.expedienteId));
    if (query.estado) conditions.push(eq(eventosAgenda.estado, query.estado as never));
    if (query.desde) conditions.push(gte(eventosAgenda.fecha, new Date(query.desde)));
    if (query.hasta) conditions.push(lte(eventosAgenda.fecha, new Date(query.hasta)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [c]] = await Promise.all([
      db.select().from(eventosAgenda).where(where).orderBy(desc(eventosAgenda.fecha)).limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ total: count() }).from(eventosAgenda).where(where),
    ]);

    return Response.json({ eventos: rows, total: c?.total ?? 0, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

/**
 * POST /api/sgie/agenda
 * Crea un evento de agenda manual. Si asocia expediente, valida scope.
 * Sprint 3 — tarea 1.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:agenda:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = createSchema.parse(await request.json());

    // Validar acceso al expediente si se asocia.
    if (parsed.expedienteId && auth.rol !== 'admin') {
      const [asig] = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, parsed.expedienteId), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!asig) return Response.json({ error: 'Sin acceso al expediente' }, { status: 403 });
    }

    const [evento] = await db.insert(eventosAgenda).values({
      titulo: parsed.titulo.trim(),
      descripcion: parsed.descripcion?.trim() || null,
      fecha: new Date(parsed.fecha),
      expedienteId: parsed.expedienteId ?? null,
      tipo: 'interna',
      estado: 'propuesta',
    }).returning({ id: eventosAgenda.id });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'evento_created',
      recurso: 'evento_agenda',
      recursoId: evento?.id,
      metadata: { titulo: parsed.titulo, expedienteId: parsed.expedienteId ?? null },
      request,
    });

    return Response.json({ evento }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
