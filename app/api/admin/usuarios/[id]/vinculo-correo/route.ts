import { requireAdmin, authFailureResponse, ALLOWED_EMAIL_DOMAIN } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { vincularCorreoCorporativo } from '@/lib/sgie/usuarios-db';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const vinculoSchema = z.object({
  vinculado: z.boolean(),
  correoCorporativo: z
    .string()
    .email()
    .refine((v) => v.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN), {
      message: `El correo debe ser del dominio ${ALLOWED_EMAIL_DOMAIN}`,
    })
    .optional(),
});

/**
 * PATCH /api/admin/usuarios/:id/vinculo-correo
 *
 * Vincula (o desvincula) el correo corporativo @pinedayasociadoshn.com de un
 * usuario abogado. Es una verificación administrativa: confirma que el abogado
 * usa un correo corporativo (requisito de gobernanza §6.2 / §29.11).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:vinculo:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const { id } = await params;
    const body = await request.json();
    const parsed = vinculoSchema.parse(body);

    const [actual] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.id, id));
    if (!actual) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (parsed.vinculado) {
      await vincularCorreoCorporativo({
        usuarioId: id,
        correoCorporativo: parsed.correoCorporativo?.trim().toLowerCase(),
      });
    } else {
      // Desvincular: sólo marca el flag en `usuarios`.
      await db
        .update(usuarios)
        .set({ correoCorporativoVinculado: false })
        .where(eq(usuarios.id, id));
    }

    await logAudit({
      usuarioId: auth.userId,
      accion: 'usuario_updated',
      recurso: 'usuario',
      recursoId: id,
      metadata: {
        vinculoCorreoCorporativo: parsed.vinculado,
        correoCorporativo: parsed.correoCorporativo?.trim().toLowerCase() ?? null,
      },
      request,
    });

    return Response.json({ ok: true, vinculado: parsed.vinculado });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
