import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { listarClientes, crearOReutilizarCliente } from '@/lib/sgie/clientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  // Sprint 5 — por defecto sólo activos. Admin puede pedir incluir inactivos.
  incluirInactivos: z.union([z.string(), z.boolean()]).optional()
    .transform((v) => v === true || v === 'true'),
});

const createSchema = z.object({
  nombre: z.string().min(1).max(300),
  identidad: z.string().max(50).optional(),
  rtn: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  telefono: z.string().max(50).optional(),
  notas: z.string().max(2000).optional(),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const { clientes, total } = await listarClientes(ctx(auth), {
      q: query.q,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      // Sprint 5 — excluir inactivos salvo que se pidan explícitamente.
      incluirInactivos: query.incluirInactivos,
    });
    return Response.json({ clientes, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:cliente:create:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = createSchema.parse(await request.json());
    const result = await crearOReutilizarCliente(parsed, ctx(auth));
    if (result.duplicadoNoAccesible || !result.id) {
      return Response.json({ error: 'No se pudo registrar el cliente.' }, { status: 409 });
    }
    if (result.creado) {
      await logSgie({
        usuarioId: auth.userId,
        accion: 'cliente_created',
        recurso: 'cliente',
        recursoId: result.id,
        metadata: { nombre: parsed.nombre },
        request,
      });
    }
    return Response.json({ cliente: { id: result.id }, creado: result.creado }, { status: result.creado ? 201 : 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
