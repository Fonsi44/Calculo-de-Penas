import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { requireAdmin, authFailureResponse, hashPassword, isAllowedAuthEmail } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { listarUsuariosGestion } from '@/lib/sgie/usuarios-db';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1).max(200),
  rol: z.enum(['admin', 'abogado']),
});

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  // SGIE — filtro por estado de acceso (activos/bloqueados/inactivos/todos).
  estado: z.enum(['activos', 'bloqueados', 'inactivos', 'todos']).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // SGIE — listado con datos de gobernanza (último acceso, bloqueo, vínculo
    // corporativo) y conteo de expedientes asignados por abogado. A diferencia
    // de la versión anterior, devuelve todos los usuarios con su estado para
    // que el admin pueda gestionar bloqueados/inactivos (§6.2).
    const estado = query.estado && query.estado !== 'todos' ? query.estado : undefined;
    const { usuarios: rows, total } = await listarUsuariosGestion({
      q: query.q,
      estado,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return Response.json({ usuarios: rows, total, page: query.page, limit: query.limit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`usuarios:create:${auth.userId}`, { max: 10, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = createSchema.parse(body);

    if (!isAllowedAuthEmail(parsed.email)) {
      return Response.json({ error: 'El email debe ser del dominio @pinedayasociadoshn.com' }, { status: 400 });
    }

    const [existing] = await db.select({ id: usuarios.id }).from(usuarios)
      .where(and(eq(usuarios.email, parsed.email.trim().toLowerCase()), eq(usuarios.active, true)));
    if (existing) {
      return Response.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.password);
    const [user] = await db.insert(usuarios).values({
      email: parsed.email.trim().toLowerCase(),
      passwordHash,
      nombre: parsed.nombre.trim(),
      rol: parsed.rol,
      active: true,
    }).returning({ id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre, rol: usuarios.rol, creadoEn: usuarios.creadoEn });

    await logAudit({
      usuarioId: auth.userId,
      accion: 'usuario_created',
      recurso: 'usuario',
      recursoId: user.id,
      metadata: { targetEmail: user.email, targetRol: user.rol },
      request,
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
