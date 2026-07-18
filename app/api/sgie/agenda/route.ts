import { and, asc, count, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventosAgenda, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { accessService, assertSgieAccess } from '@/lib/access-service';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  expedienteId: z.string().uuid().optional(),
  estado: z.enum(['propuesta', 'confirmada', 'descartada', 'completada', 'cancelada']).optional(),
  desde: z.string().datetime(),
  hasta: z.string().datetime(),
}).superRefine((value, context) => {
  const from = new Date(value.desde);
  const to = new Date(value.hasta);
  if (to < from) context.addIssue({ code: 'custom', message: 'El rango es inválido', path: ['hasta'] });
  if (to.getTime() - from.getTime() > 93 * 24 * 60 * 60 * 1000) {
    context.addIssue({ code: 'custom', message: 'El rango máximo es de 93 días', path: ['hasta'] });
  }
});

const createSchema = z.object({
  titulo: z.string().min(1).max(300),
  descripcion: z.string().max(2000).optional(),
  inicio: z.string().datetime(),
  fin: z.string().datetime().optional(),
  todoElDia: z.boolean().default(false),
  zonaHoraria: z.string().min(1).max(100).default('America/Tegucigalpa'),
  ubicacion: z.string().max(500).optional(),
  tipo: z.enum(['personal', 'cita_cliente', 'audiencia', 'plazo', 'revision_interna', 'firma', 'tarea_hito', 'ausencia']).default('personal'),
  visibilidad: z.enum(['privado', 'expediente', 'equipo']).default('privado'),
  expedienteId: z.string().uuid().optional(),
  participantes: z.array(z.object({
    usuarioId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    nombre: z.string().max(200).optional(),
  })).max(50).default([]),
  recordatorios: z.array(z.object({
    minutosAntes: z.number().int().min(0).max(43200),
    canal: z.enum(['email', 'sistema']),
  })).max(10).default([]),
}).superRefine((value, context) => {
  if (value.fin && new Date(value.fin) < new Date(value.inicio)) {
    context.addIssue({ code: 'custom', message: 'El final no puede preceder al inicio', path: ['fin'] });
  }
  if (value.visibilidad === 'expediente' && !value.expedienteId) {
    context.addIssue({ code: 'custom', message: 'La visibilidad de expediente requiere expediente', path: ['expedienteId'] });
  }
});

async function accessibleCaseIds(userId: string): Promise<string[]> {
  const [assigned, granted] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, userId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, userId), isNull(expedientePermisos.revocadoEn))),
  ]);
  return [...new Set([...assigned, ...granted].map((row) => row.id))];
}

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const access = await assertSgieAccess(auth.userId, 'calendar.read');
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const conditions = [
      gte(eventosAgenda.inicio, new Date(query.desde)),
      lte(eventosAgenda.inicio, new Date(query.hasta)),
    ];

    if (!access.capabilities.has('calendar.manage_team')) {
      const cases = await accessibleCaseIds(auth.userId);
      conditions.push(cases.length > 0
        ? or(
          eq(eventosAgenda.propietarioId, auth.userId),
          and(eq(eventosAgenda.visibilidad, 'expediente'), inArray(eventosAgenda.expedienteId, cases)),
        )!
        : eq(eventosAgenda.propietarioId, auth.userId));
    }
    if (query.expedienteId) {
      await accessService.assertCaseAccess({ userId: auth.userId, caseId: query.expedienteId, capability: 'calendar.read' });
      conditions.push(eq(eventosAgenda.expedienteId, query.expedienteId));
    }
    if (query.estado) conditions.push(eq(eventosAgenda.estado, query.estado));

    const where = and(...conditions);
    const [rows, [total]] = await Promise.all([
      db.select().from(eventosAgenda).where(where).orderBy(asc(eventosAgenda.inicio))
        .limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ value: count() }).from(eventosAgenda).where(where),
    ]);
    return Response.json({ eventos: rows, total: Number(total?.value ?? 0), page: query.page, limit: query.limit });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Rango o filtros inválidos', details: error.issues }, { status: 422 });
    return authFailureResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const access = await assertSgieAccess(auth.userId, 'calendar.write');
    validateCsrf(request);
    const rl = await rateLimit(`sgie:agenda:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = createSchema.parse(await request.json());
    if (parsed.expedienteId) {
      await accessService.assertCaseAccess({ userId: auth.userId, caseId: parsed.expedienteId, capability: 'calendar.write' });
    }
    if (parsed.visibilidad === 'equipo' && !access.capabilities.has('calendar.manage_team')) {
      return Response.json({ error: 'Falta la capacidad calendar.manage_team' }, { status: 403 });
    }
    const start = new Date(parsed.inicio);
    const [event] = await db.insert(eventosAgenda).values({
      propietarioId: auth.userId,
      creadoPor: auth.userId,
      titulo: parsed.titulo.trim(),
      descripcion: parsed.descripcion?.trim() || null,
      inicio: start,
      fin: parsed.fin ? new Date(parsed.fin) : null,
      fecha: start,
      todoElDia: parsed.todoElDia,
      zonaHoraria: parsed.zonaHoraria,
      ubicacion: parsed.ubicacion?.trim() || null,
      tipo: parsed.tipo,
      estado: 'confirmada',
      visibilidad: parsed.expedienteId ? 'expediente' : parsed.visibilidad,
      expedienteId: parsed.expedienteId ?? null,
      participantes: parsed.participantes,
      recordatorios: parsed.recordatorios,
      confirmadaPor: auth.userId,
      confirmadaEn: new Date(),
    }).returning();
    await logSgie({
      usuarioId: auth.userId, accion: 'evento_created', recurso: 'evento_agenda',
      recursoId: event.id, metadata: { expedienteId: parsed.expedienteId ?? null, tipo: parsed.tipo }, request,
    });
    return Response.json({ evento: event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 422 });
    return authFailureResponse(error);
  }
}
