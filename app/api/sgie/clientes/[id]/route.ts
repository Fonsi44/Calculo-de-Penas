import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { obtenerCliente, actualizarCliente } from '@/lib/sgie/clientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

const updateSchema = z.object({
  nombre: z.string().min(1).max(300).optional(),
  identidad: z.string().max(50).optional(),
  rtn: z.string().max(50).optional(),
  email: z.string().email().max(255).or(z.literal('')).optional(),
  telefono: z.string().max(50).optional(),
  notas: z.string().max(2000).optional(),
  // Sprint 5 — baja lógica.
  activo: z.boolean().optional(),
  motivoDesactivacion: z.string().max(500).optional(),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

/**
 * GET /api/sgie/clientes/:id
 *
 * Devuelve el detalle de un cliente con conteo de expedientes accesibles.
 * Sprint 1 — ficha de cliente.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    const { id } = await params;
    const cliente = await obtenerCliente(id, ctx(auth));
    if (!cliente) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 });
    return Response.json({ cliente });
  } catch (err) {
    return authFailureResponse(err);
  }
}

/**
 * PATCH /api/sgie/clientes/:id
 *
 * Actualiza los datos editables de un cliente. Recalcula duplicadoHash si
 * cambian identidad/RTN (detección de duplicados vigente). Auditoría.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:cliente:update:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const parsed = updateSchema.parse(await request.json());
    // email vacío → null (limpiar). El `.or(z.literal(''))` permite borrar.
    const input = {
      nombre: parsed.nombre,
      identidad: parsed.identidad,
      rtn: parsed.rtn,
      email: parsed.email === '' ? '' : parsed.email,
      telefono: parsed.telefono,
      notas: parsed.notas,
      // Sprint 5 — baja lógica.
      activo: parsed.activo,
      motivoDesactivacion: parsed.motivoDesactivacion,
    };

    // Validación: desactivar requiere motivo.
    if (parsed.activo === false && !parsed.motivoDesactivacion?.trim()) {
      return Response.json({ error: 'El motivo de desactivación es obligatorio.' }, { status: 400 });
    }

    const actualizado = await actualizarCliente(id, input, ctx(auth));
    if (!actualizado) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 });

    // Auditoría para baja lógica (Sprint 5). No hay acciones dedicadas en el
    // enum; se usa cliente_updated con metadata explícita del evento.
    await logSgie({
      usuarioId: auth.userId,
      accion: 'cliente_updated',
      recurso: 'cliente',
      recursoId: id,
      metadata: parsed.activo !== undefined
        ? { evento: parsed.activo ? 'cliente_reactivated' : 'cliente_deactivated', activo: parsed.activo, motivo: parsed.motivoDesactivacion ?? null } as Record<string, unknown>
        : { campos: Object.keys(parsed) } as Record<string, unknown>,
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
