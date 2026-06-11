import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { requireAdmin, authFailureResponse, hashPassword, isAllowedAuthEmail } from '@/lib/auth';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1).max(200),
  rol: z.enum(['admin', 'abogado']).default('abogado'),
});

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const conditions: ReturnType<typeof eq>[] = [];
    conditions.push(eq(usuarios.active, true));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(usuarios.nombre, term), ilike(usuarios.email, term))!);
    }

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      db.select({
        id: usuarios.id,
        email: usuarios.email,
        nombre: usuarios.nombre,
        rol: usuarios.rol,
        active: usuarios.active,
        mustChangePassword: usuarios.mustChangePassword,
        creadoEn: usuarios.creadoEn,
      }).from(usuarios)
        .where(where)
        .orderBy(usuarios.creadoEn)
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db.select({ count: sql<number>`count(*)::int` }).from(usuarios).where(where),
    ]);

    return Response.json({ usuarios: rows, total: countRow?.count ?? 0, page: query.page, limit: query.limit });
  } catch (err) {
    return authFailureResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
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
