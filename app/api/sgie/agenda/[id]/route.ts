import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventosAgenda } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { accessService, assertSgieAccess } from '@/lib/access-service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/http-errors';

const schema = z.object({
  version: z.number().int().min(1),
  titulo: z.string().min(1).max(300).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  inicio: z.string().datetime().optional(),
  fin: z.string().datetime().nullable().optional(),
  todoElDia: z.boolean().optional(),
  zonaHoraria: z.string().min(1).max(100).optional(),
  ubicacion: z.string().max(500).nullable().optional(),
  estado: z.enum(['propuesta', 'confirmada', 'descartada', 'completada', 'cancelada']).optional(),
  expedienteId: z.string().uuid().nullable().optional(),
  visibilidad: z.enum(['privado', 'expediente', 'equipo']).optional(),
  motivoCategoria: z.enum(['conflicto_agenda', 'solicitud_cliente', 'requerimiento_juzgado', 'falta_documentacion', 'otro']).optional(),
  motivoDetalle: z.string().max(500).optional(),
}).superRefine((value, context) => {
  if (value.inicio && value.fin && new Date(value.fin) < new Date(value.inicio)) {
    context.addIssue({ code: 'custom', message: 'El final no puede preceder al inicio', path: ['fin'] });
  }
  if (value.motivoCategoria === 'otro' && !value.motivoDetalle?.trim()) {
    context.addIssue({ code: 'custom', message: 'Debe indicar el motivo', path: ['motivoDetalle'] });
  }
});

async function assertEventWrite(userId: string, eventId: string) {
  const access = await assertSgieAccess(userId, 'calendar.write');
  const [event] = await db.select().from(eventosAgenda).where(eq(eventosAgenda.id, eventId));
  if (!event) throw new NotFoundError('Evento no encontrado');
  if (event.propietarioId === userId || access.capabilities.has('calendar.manage_team')) return { event, access };
  if (event.visibilidad === 'expediente' && event.expedienteId) {
    await accessService.assertCaseAccess({ userId, caseId: event.expedienteId, capability: 'calendar.write' });
    return { event, access };
  }
  throw new ForbiddenError('Sin acceso al evento');
}

import { resolveEventMutationScope } from '@/lib/agenda-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:agenda:update:${auth.userId}`, { max: 40, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const { event: current, access } = await assertEventWrite(auth.userId, id);
    const parsed = schema.parse(await request.json());
    const scope = resolveEventMutationScope(current, parsed, access.capabilities.has('calendar.manage_team'));
    if (scope.expedienteId && (parsed.expedienteId !== undefined || scope.visibilidad === 'expediente')) {
      await accessService.assertCaseAccess({ userId: auth.userId, caseId: scope.expedienteId, capability: 'calendar.write' });
    }
    const values: Record<string, unknown> = {};
    if (parsed.titulo !== undefined) values.titulo = parsed.titulo.trim();
    if (parsed.descripcion !== undefined) values.descripcion = parsed.descripcion?.trim() || null;
    if (parsed.inicio !== undefined) {
      values.inicio = new Date(parsed.inicio);
      values.fecha = new Date(parsed.inicio);
    }
    if (parsed.fin !== undefined) values.fin = parsed.fin ? new Date(parsed.fin) : null;
    if (parsed.todoElDia !== undefined) values.todoElDia = parsed.todoElDia;
    if (parsed.zonaHoraria !== undefined) values.zonaHoraria = parsed.zonaHoraria;
    if (parsed.ubicacion !== undefined) values.ubicacion = parsed.ubicacion?.trim() || null;
    if (parsed.expedienteId !== undefined) values.expedienteId = scope.expedienteId;
    if (parsed.visibilidad !== undefined) values.visibilidad = scope.visibilidad;
    if (parsed.estado !== undefined) {
      values.estado = parsed.estado;
      if (parsed.estado === 'cancelada' || parsed.estado === 'descartada') values.canceladaEn = new Date();
    }
    values.version = sql`${eventosAgenda.version} + 1`;
    const [updated] = await db.update(eventosAgenda).set(values).where(and(
      eq(eventosAgenda.id, id),
      eq(eventosAgenda.version, parsed.version),
    )).returning({ version: eventosAgenda.version });
    if (!updated) throw new ConflictError('El evento fue modificado por otra sesión; recargue antes de guardar');
    await logSgie({
      usuarioId: auth.userId, accion: 'evento_updated', recurso: 'evento_agenda',
      recursoId: id, metadata: { cambios: Object.keys(values), estadoAnterior: current.estado, motivo: parsed.motivoCategoria }, request,
    });
    return Response.json({ ok: true, version: updated.version });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 422 });
    return authFailureResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:agenda:delete:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;

    const access = await assertSgieAccess(auth.userId, 'calendar.write');
    const [event] = await db.select().from(eventosAgenda).where(eq(eventosAgenda.id, id));
    if (!event) throw new NotFoundError('Evento no encontrado');

    if (event.propietarioId !== auth.userId && !access.capabilities.has('calendar.manage_team')) {
      if (event.visibilidad === 'expediente' && event.expedienteId) {
        await accessService.assertCaseAccess({ userId: auth.userId, caseId: event.expedienteId, capability: 'calendar.write' });
      } else {
        throw new ForbiddenError('Sin acceso al evento');
      }
    }

    await db.delete(eventosAgenda).where(eq(eventosAgenda.id, id));

    await logSgie({
      usuarioId: auth.userId,
      accion: 'evento_deleted',
      recurso: 'evento_agenda',
      recursoId: id,
      metadata: {
        titulo: event.titulo,
        estado: event.estado,
        expedienteId: event.expedienteId,
        propietarioId: event.propietarioId,
      },
      request,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return authFailureResponse(error);
  }
}
