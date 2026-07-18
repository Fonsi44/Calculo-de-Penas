import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { permisos, usuariosCapacidades } from '@/lib/schema';
import { CAPABILITIES, getPersistedAccess } from '@/lib/access-service';
import { validateCsrf } from '@/lib/csrf';
import { logAudit } from '@/lib/audit';

const schema = z.object({
  capacidades: z.array(z.enum(CAPABILITIES)).max(CAPABILITIES.length),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const access = await getPersistedAccess(id);
    const direct = await db.select({
      recurso: permisos.recurso,
      accion: permisos.accion,
    }).from(usuariosCapacidades)
      .innerJoin(permisos, eq(permisos.id, usuariosCapacidades.permisoId))
      .where(eq(usuariosCapacidades.usuarioId, id));
    return Response.json({
      disponibles: CAPABILITIES,
      efectivas: [...access.capabilities],
      adicionales: direct.map((item) => `${item.recurso}.${item.accion}`),
    });
  } catch (error) {
    return authFailureResponse(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const parsed = schema.parse(await request.json());
    const rows = await db.select({
      id: permisos.id,
      recurso: permisos.recurso,
      accion: permisos.accion,
    }).from(permisos);
    const requested = new Set(parsed.capacidades);
    const grants = rows.filter((item) => requested.has(`${item.recurso}.${item.accion}` as typeof CAPABILITIES[number]));

    await db.transaction(async (tx) => {
      await tx.delete(usuariosCapacidades).where(eq(usuariosCapacidades.usuarioId, id));
      if (grants.length > 0) {
        await tx.insert(usuariosCapacidades).values(grants.map((item) => ({
          usuarioId: id,
          permisoId: item.id,
          permitido: true,
          concedidoPor: actor.userId,
        })));
      }
    });
    await logAudit({
      usuarioId: actor.userId,
      accion: 'permiso_updated',
      recurso: 'usuario_capacidades',
      recursoId: id,
      metadata: { capacidadesAdicionales: parsed.capacidades },
      request,
    });
    return Response.json({ ok: true, adicionales: parsed.capacidades });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 422 });
    }
    return authFailureResponse(error);
  }
}
