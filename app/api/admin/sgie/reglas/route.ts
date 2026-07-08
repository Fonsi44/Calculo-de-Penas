import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { reglasConfigVersion } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { CONFIG_DEFAULT } from '@/lib/sgie/motor-reglas';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { validateCsrf } from '@/lib/csrf';

const updateSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  descripcion: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    requireAbogado(request);
    const versiones = await db.select().from(reglasConfigVersion).orderBy(desc(reglasConfigVersion.version)).limit(20);
    const [activa] = await db.select().from(reglasConfigVersion).where(eq(reglasConfigVersion.activa, true)).limit(1);
    return Response.json({ versiones, activa: activa?.config ?? CONFIG_DEFAULT });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    if (auth.rol !== 'admin') return Response.json({ error: 'Solo admin' }, { status: 403 });
    const body = updateSchema.parse(await request.json());

    // Desactivar versión actual
    await db.update(reglasConfigVersion).set({ activa: false }).where(eq(reglasConfigVersion.activa, true));

    // Obtener siguiente versión
    const [ultima] = await db.select({ v: reglasConfigVersion.version }).from(reglasConfigVersion).orderBy(desc(reglasConfigVersion.version)).limit(1);
    const nuevaVersion = (ultima?.v ?? 0) + 1;

    const [nueva] = await db.insert(reglasConfigVersion).values({
      version: nuevaVersion,
      config: body.config,
      descripcion: body.descripcion ?? `Versión ${nuevaVersion}`,
      aprobadoPor: auth.userId,
      activa: true,
    }).returning();

    await logSgie({ usuarioId: auth.userId, accion: 'plantilla_updated', recurso: 'reglas_config', recursoId: nueva.id, request });
    return Response.json({ version: nueva }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
