import { db } from '@/lib/db';
import { calculos, casos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    let body: unknown;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }
    const { caso_id, config, resultado } = body as { caso_id?: unknown; config?: unknown; resultado?: unknown };

    if (typeof caso_id !== 'string' || !caso_id || config === undefined || resultado === undefined) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const [caso] = await db.select({ id: casos.id, usuarioId: casos.usuarioId })
      .from(casos).where(eq(casos.id, caso_id));
    if (!caso) return new Response(JSON.stringify({ error: 'Caso no encontrado' }), { status: 404 });
    if (caso.usuarioId !== user.userId) {
      return new Response(JSON.stringify({ error: 'Sin permiso sobre este caso' }), { status: 403 });
    }

    const [row] = await db.insert(calculos).values({
      casoId: caso_id,
      config: JSON.parse(JSON.stringify(config)),
      resultado: JSON.parse(JSON.stringify(resultado)),
    }).returning();

    await audit({
      usuarioId: user.userId,
      accion: 'calculo_created',
      recurso: 'calculo',
      recursoId: row.id,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
    });

    return new Response(JSON.stringify(row), { status: 201 });
  } catch (e) {
    return authFailureResponse(e);
  }
}
