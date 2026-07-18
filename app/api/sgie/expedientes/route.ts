import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  listarExpedientes,
  crearExpediente,
  generarNumeroInterno,
  type ContextoAbogado,
} from '@/lib/sgie/expedientes-db';
import { assertSgieAccess } from '@/lib/access-service';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { ForbiddenError } from '@/lib/http-errors';

const querySchema = z.object({
  q: z.string().optional(),
  estado: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const createSchema = z.object({
  // numeroInterno opcional: si se omite, se autogenera.
  numeroInterno: z.string().min(1).max(100).optional(),
  clienteId: z.string().uuid().optional(),
  tipoProcedimientoId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  area: z.string().max(200).optional(),
  resumen: z.string().max(2000).optional(),
  requisitosIniciales: z
    .array(
      z.object({
        nombre: z.string().min(1).max(300),
        tipo: z.enum(['obligatorio', 'opcional', 'condicional']).optional(),
        orden: z.number().int().min(0).optional(),
      }),
    )
    .max(100)
    .optional(),
});

function contextoDesdeAuth(auth: { userId: string; rol: string }): ContextoAbogado {
  return {
    usuarioId: auth.userId,
    rol: auth.rol,
    esAdmin: auth.rol === 'admin',
  };
}

/**
 * GET /api/sgie/expedientes
 *
 * Lista expedientes con scope por abogado. El admin ve todos; cada abogado sólo
 * los suyos (asignados o con permiso). El scope se aplica en la query DB.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const { expedientes, total } = await listarExpedientes(contextoDesdeAuth(auth), {
      q: query.q,
      estado: query.estado,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return Response.json({ expedientes, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/**
 * POST /api/sgie/expedientes
 *
 * Crea un expediente. El responsable por defecto es el abogado autenticado;
 * el admin puede designar otro `responsableId`. El expediente nace en estado
 * `creado`; las transiciones críticas posteriores las hace el abogado.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:expediente:create:${auth.userId}`, {
      max: 30,
      windowMs: 60_000,
      keyPrefix: 'sgie',
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const actorAccess = await assertSgieAccess(auth.userId, 'cases.create');
    const canAssign = actorAccess.capabilities.has('cases.assign');
    if (parsed.responsableId && parsed.responsableId !== auth.userId && !canAssign) {
      throw new ForbiddenError('No puede asignar el expediente a otro responsable');
    }
    const responsableId = canAssign ? (parsed.responsableId ?? auth.userId) : auth.userId;
    await assertSgieAccess(responsableId, 'cases.read');
    const [actorOrg, targetOrg] = await Promise.all([
      db.select({ bufeteId: usuarios.bufeteId }).from(usuarios).where(eq(usuarios.id, auth.userId)),
      db.select({ bufeteId: usuarios.bufeteId }).from(usuarios).where(eq(usuarios.id, responsableId)),
    ]);
    if (!targetOrg[0]) return Response.json({ error: 'Responsable no encontrado' }, { status: 404 });
    if (actorOrg[0]?.bufeteId && targetOrg[0].bufeteId && actorOrg[0].bufeteId !== targetOrg[0].bufeteId) {
      throw new ForbiddenError('El responsable no pertenece al mismo bufete');
    }
    const numeroInterno = parsed.numeroInterno?.trim() || (await generarNumeroInterno());

    const creado = await crearExpediente(
      {
        numeroInterno,
        clienteId: parsed.clienteId,
        tipoProcedimientoId: parsed.tipoProcedimientoId,
        responsableId,
        prioridad: parsed.prioridad,
        area: parsed.area,
        resumen: parsed.resumen,
        requisitosIniciales: parsed.requisitosIniciales,
      },
      contextoDesdeAuth(auth),
    );

    return Response.json({ expediente: creado }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
