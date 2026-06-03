import { db } from '@/lib/db';
import { calculos, casos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    let body: any;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
    }
    const { caso_id, config, resultado } = body;

    if (!caso_id || !config || !resultado) {
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

    return new Response(JSON.stringify(row), { status: 201 });
  } catch (e) {
    return authFailureResponse(e);
  }
}
