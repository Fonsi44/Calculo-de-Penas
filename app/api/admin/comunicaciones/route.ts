import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { comunicacionesOutbox } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') ?? 'outbox';
    const filter = searchParams.get('filter') ?? 'todos';

    if (tab === 'plantillas') {
      const { listarPlantillas } = await import('@/lib/sgie/correos-db');
      const { plantillas, total } = await listarPlantillas({ limit: 100, offset: 0 });
      return Response.json({ tab: 'plantillas', plantillas, total });
    }

    if (tab === 'reglas') {
      const resp = await fetch(new URL('/api/admin/sgie/reglas', request.url).toString(), { headers: request.headers });
      const data = await resp.json();
      return Response.json({ tab: 'reglas', ...data });
    }

    const conditions = [];
    if (filter !== 'todos') {
      conditions.push(eq(comunicacionesOutbox.estado, filter));
    }

    const _where = conditions.length > 0 ? undefined : undefined;

    const rows = await db
      .select()
      .from(comunicacionesOutbox)
      .orderBy(desc(comunicacionesOutbox.creadoEn))
      .limit(100);

    const filtrados = filter !== 'todos'
      ? rows.filter((r) => r.estado === filter)
      : rows;

    return Response.json({
      tab: 'outbox',
      outbox: filtrados.map((o) => ({
        id: o.id,
        tipo: o.tipo,
        destinatario: o.destinatario,
        asunto: o.asunto ?? '',
        estado: o.estado,
        intentos: o.intentos ?? 0,
        fecha: o.creadoEn?.toISOString() ?? new Date().toISOString(),
      })),
      total: filtrados.length,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
