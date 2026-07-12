import { db } from '@/lib/db';
import { menus, type AuditoriaAccion } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const itemSchema = z.object({
  label: z.string().min(1),
  url: z.string().optional(),
  slug: z.string().optional(),
  target: z.string().optional(),
  icon: z.string().optional(),
  children: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
});

const createSchema = z.object({
  nombre: z.string().min(1).max(100),
  items: z.array(itemSchema),
});

const updateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  items: z.array(itemSchema).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const rows = await db.select().from(menus).orderBy(asc(menus.nombre));
    return Response.json({ menus: rows });
  } catch (err) { return authFailureResponse(err); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`menus:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const [menu] = await db.insert(menus).values(parsed).returning();
    await logAudit({ usuarioId: auth.userId, accion: 'menu_created' as AuditoriaAccion, recurso: 'menu', recursoId: menu.id, metadata: { nombre: menu.nombre }, request });
    return Response.json({ menu }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const [menu] = await db.update(menus).set({ ...parsed, actualizadoEn: new Date() }).where(eq(menus.id, id)).returning();
    if (!menu) return Response.json({ error: 'Menú no encontrado' }, { status: 404 });
    await logAudit({ usuarioId: auth.userId, accion: 'menu_updated' as AuditoriaAccion, recurso: 'menu', recursoId: id, metadata: { nombre: menu.nombre }, request });
    return Response.json({ menu });
  } catch (err) { return authFailureResponse(err); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requerido' }, { status: 400 });
    const [menu] = await db.delete(menus).where(eq(menus.id, id)).returning();
    if (!menu) return Response.json({ error: 'Menú no encontrado' }, { status: 404 });
    await logAudit({ usuarioId: auth.userId, accion: 'menu_deleted' as AuditoriaAccion, recurso: 'menu', recursoId: id, request });
    return Response.json({ deleted: true });
  } catch (err) { return authFailureResponse(err); }
}
