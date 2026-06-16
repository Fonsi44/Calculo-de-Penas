import { db } from '@/lib/db';
import { agravantesEspecificas } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const updateSchema = z.object({
  articulo_cp: z.string().min(1).max(100).optional(),
  numeral: z.string().max(50).nullable().optional(),
  literal: z.string().max(50).nullable().optional(),
  texto_agravante: z.string().min(1).optional(),
  fraccion_aumento: z.string().min(1).max(20).regex(/^\d+\s*\/\s*\d+$/, 'Fracción inválida (formato: 1/3)').optional(),
  obligatoria: z.boolean().optional(),
});

/**
 * GET /api/admin/agravantes/[id]
 * Devuelve una agravante específica por ID.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const [row] = await db.select().from(agravantesEspecificas).where(eq(agravantesEspecificas.id, id));
    if (!row) return Response.json({ error: 'Agravante no encontrada' }, { status: 404 });
    return Response.json({ agravante: row });
  } catch (err) {
    return authFailureResponse(err);
  }
}

/**
 * PATCH /api/admin/agravantes/[id]
 * Actualiza una agravante específica.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`agravante:update:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const [existing] = await db.select().from(agravantesEspecificas).where(eq(agravantesEspecificas.id, id));
    if (!existing) return Response.json({ error: 'Agravante no encontrada' }, { status: 404 });

    const [updated] = await db.update(agravantesEspecificas).set({
      ...(parsed.articulo_cp !== undefined && { articuloCp: parsed.articulo_cp }),
      ...(parsed.numeral !== undefined && { numeral: parsed.numeral }),
      ...(parsed.literal !== undefined && { literal: parsed.literal }),
      ...(parsed.texto_agravante !== undefined && { textoAgravante: parsed.texto_agravante }),
      ...(parsed.fraccion_aumento !== undefined && { fraccionAumento: parsed.fraccion_aumento }),
      ...(parsed.obligatoria !== undefined && { obligatoria: parsed.obligatoria }),
    }).where(eq(agravantesEspecificas.id, id)).returning();

    await logAudit({
      usuarioId: auth.userId,
      accion: 'agravante_especifica_updated',
      recurso: 'agravantes_especificas',
      recursoId: id,
      metadata: { cambios: parsed },
      request,
    });

    return Response.json({ agravante: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

/**
 * DELETE /api/admin/agravantes/[id]
 * Elimina una agravante específica.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`agravante:delete:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const [existing] = await db.select().from(agravantesEspecificas).where(eq(agravantesEspecificas.id, id));
    if (!existing) return Response.json({ error: 'Agravante no encontrada' }, { status: 404 });

    await db.delete(agravantesEspecificas).where(eq(agravantesEspecificas.id, id));

    await logAudit({
      usuarioId: auth.userId,
      accion: 'agravante_especifica_deleted',
      recurso: 'agravantes_especificas',
      recursoId: id,
      metadata: { articulo_cp: existing.articuloCp },
      request,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return authFailureResponse(err);
  }
}
