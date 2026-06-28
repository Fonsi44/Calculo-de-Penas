import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { crearEnlace } from '@/lib/sgie/enlaces-magicos';
import { verificarAccesoExpediente } from '@/lib/sgie/expedientes-db';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { db } from '@/lib/db';
import { enlacesMagicos } from '@/lib/schema';
import { and, desc, eq } from 'drizzle-orm';

const createSchema = z.object({
  expedienteId: z.string().uuid(),
  requisitoExpedienteId: z.string().uuid().optional(),
  clienteEmail: z.string().email().optional(),
  diasExpiracion: z.number().int().min(1).max(90).optional(),
  usosMaximos: z.number().int().min(1).max(50).optional(),
});

const listSchema = z.object({
  expedienteId: z.string().uuid(),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

/**
 * GET /api/sgie/enlaces?expedienteId=...
 *
 * Lista los enlaces mágicos de un expediente accesible por el abogado.
 * Sprint 1 — soporta la UI de enlaces en el detalle del expediente.
 *
 * No devuelve el `token` de enlaces revocados (seguridad: no exponer tokens
 * inútiles). El token sólo se devuelve al crear el enlace (POST).
 */
export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const query = listSchema.parse(Object.fromEntries(searchParams.entries()));

    const c = ctx(auth);
    const tieneAcceso = await verificarAccesoExpediente(query.expedienteId, c);
    if (!tieneAcceso) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const rows = await db
      .select({
        id: enlacesMagicos.id,
        expedienteId: enlacesMagicos.expedienteId,
        requisitoExpedienteId: enlacesMagicos.requisitoExpedienteId,
        clienteEmail: enlacesMagicos.clienteEmail,
        creadoEn: enlacesMagicos.creadoEn,
        expiraEn: enlacesMagicos.expiraEn,
        usosMaximos: enlacesMagicos.usosMaximos,
        usosActuales: enlacesMagicos.usosActuales,
        revocadoEn: enlacesMagicos.revocadoEn,
        revocadoMotivo: enlacesMagicos.revocadoMotivo,
      })
      .from(enlacesMagicos)
      .where(eq(enlacesMagicos.expedienteId, query.expedienteId))
      .orderBy(desc(enlacesMagicos.creadoEn))
      .limit(50);

    return Response.json({ enlaces: rows, total: rows.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

/**
 * POST /api/sgie/enlaces
 * Crea un enlace mágico de carga documental para un expediente con scope.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:enlace:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = createSchema.parse(await request.json());

    const c = ctx(auth);
    const tieneAcceso = await verificarAccesoExpediente(parsed.expedienteId, c);
    if (!tieneAcceso) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const enlace = await crearEnlace(parsed, auth.userId);

    await logSgie({
      usuarioId: auth.userId,
      accion: 'enlace_created',
      recurso: 'enlace_magico',
      recursoId: enlace.id,
      metadata: { expedienteId: parsed.expedienteId },
      request,
    });

    return Response.json({ enlace }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
