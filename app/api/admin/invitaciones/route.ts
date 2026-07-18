import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitaciones } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { CAPABILITIES } from '@/lib/access-service';
import { createInvitation } from '@/lib/invitations';
import { logAudit } from '@/lib/audit';

const schema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email(),
  rolInicial: z.enum(['administrador', 'abogado', 'supervisor']),
  equipoId: z.string().uuid().optional(),
  accesoSgie: z.boolean().default(false),
  capacidades: z.array(z.enum(CAPABILITIES)).max(CAPABILITIES.length).default([]),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const rows = await db.select({
      id: invitaciones.id,
      nombre: invitaciones.nombre,
      email: invitaciones.email,
      rolInicial: invitaciones.rolInicial,
      accesoSgie: invitaciones.accesoSgie,
      estado: invitaciones.estado,
      expiraEn: invitaciones.expiraEn,
      creadaEn: invitaciones.creadaEn,
      emailEstado: invitaciones.emailEstado,
    }).from(invitaciones).orderBy(desc(invitaciones.creadaEn)).limit(100);
    return Response.json({ invitaciones: rows });
  } catch (error) {
    return authFailureResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`invitaciones:create:${actor.userId}`, {
      max: 10, windowMs: 60_000, keyPrefix: 'admin',
    });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = schema.parse(await request.json());
    const result = await createInvitation({ ...parsed, creadaPor: actor.userId });
    await logAudit({
      usuarioId: actor.userId,
      accion: 'invitacion_created',
      recurso: 'invitacion',
      recursoId: result.id,
      metadata: { targetEmail: parsed.email, rolInicial: parsed.rolInicial, emailEstado: result.emailEstado },
      request,
    });
    return Response.json({ invitacion: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 422 });
    }
    return authFailureResponse(error);
  }
}
