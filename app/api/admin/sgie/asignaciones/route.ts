import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { expedienteAsignaciones } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { assertSgieAccess } from '@/lib/access-service';

const querySchema = z.object({
  expedienteId: z.string().uuid().optional(),
  abogadoId: z.string().uuid().optional(),
});

const createSchema = z.object({
  expedienteId: z.string().uuid(),
  abogadoId: z.string().uuid(),
  rol: z.enum(['responsable', 'colaborador', 'supervisor']).default('colaborador'),
});

/**
 * GET /api/admin/sgie/asignaciones
 * Lista asignaciones (admin). Filtra por expediente o abogado.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const conditions = [isNull(expedienteAsignaciones.revocadaEn)];
    if (query.expedienteId) conditions.push(eq(expedienteAsignaciones.expedienteId, query.expedienteId));
    if (query.abogadoId) conditions.push(eq(expedienteAsignaciones.abogadoId, query.abogadoId));

    const rows = await db
      .select()
      .from(expedienteAsignaciones)
      .where(and(...conditions));

    return Response.json({ asignaciones: rows });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/**
 * POST /api/admin/sgie/asignaciones
 * Crea una asignación abogado↔expediente. El admin gestiona quién ve qué expediente.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:asignacion:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = createSchema.parse(await request.json());
    await assertSgieAccess(parsed.abogadoId, 'cases.read');

    const [asignacion] = await db
      .insert(expedienteAsignaciones)
      .values({
        expedienteId: parsed.expedienteId,
        abogadoId: parsed.abogadoId,
        rol: parsed.rol,
        asignadoPor: auth.userId,
      })
      .onConflictDoUpdate({
        target: [expedienteAsignaciones.expedienteId, expedienteAsignaciones.abogadoId],
        // Si existía revocada, reactiva.
        set: { revocadaEn: null, rol: parsed.rol, asignadoPor: auth.userId, asignadoEn: new Date() },
      })
      .returning({ id: expedienteAsignaciones.id });

    await logSgie({
      usuarioId: auth.userId,
      accion: 'permiso_updated',
      recurso: 'expediente_asignacion',
      recursoId: asignacion.id,
      metadata: { expedienteId: parsed.expedienteId, abogadoId: parsed.abogadoId, rol: parsed.rol },
      request,
    });

    return Response.json({ asignacion }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
