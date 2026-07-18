import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { extraccionesIa, documentosExpediente } from '@/lib/schema';
import { desc, eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  taskType: z.string().optional(),
  modelo: z.string().optional(),
  status: z.string().optional(),
  confMin: z.coerce.number().optional(),
  confMax: z.coerce.number().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const conditions = [];

    const rows = await db
      .select({
        id: extraccionesIa.id,
        documentoId: extraccionesIa.documentoId,
        modelo: extraccionesIa.modelo,
        tokensInput: extraccionesIa.tokensInput,
        tokensOutput: extraccionesIa.tokensOutput,
        duracionMs: extraccionesIa.duracionMs,
        exito: extraccionesIa.exito,
        totalConfidence: extraccionesIa.totalConfidence,
        error: extraccionesIa.error,
        creadoEn: extraccionesIa.creadoEn,
        documentoNombre: documentosExpediente.nombreOriginal,
      })
      .from(extraccionesIa)
      .leftJoin(documentosExpediente, eq(extraccionesIa.documentoId, documentosExpediente.id))
      .orderBy(desc(extraccionesIa.creadoEn))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    const [stats] = await db.select({
      total: count(),
      exitosos: sql`count(*) FILTER (WHERE exito = true)`.as('exitosos'),
      fallidos: sql`count(*) FILTER (WHERE exito = false)`.as('fallidos'),
      avgConf: sql`COALESCE(AVG(total_confidence), 0)`.as('avgConf'),
      totalTokens: sql`COALESCE(SUM(tokens_input + tokens_output), 0)`.as('totalTokens'),
      avgLat: sql`COALESCE(AVG(duracion_ms), 0)`.as('avgLat'),
    }).from(extraccionesIa);

    const items = rows.map((r) => ({
      id: r.id,
      taskType: 'extraccion',
      modelo: r.modelo ?? 'desconocido',
      confianza: r.totalConfidence ?? 0,
      tokens: (r.tokensInput ?? 0) + (r.tokensOutput ?? 0),
      coste: ((r.tokensInput ?? 0) + (r.tokensOutput ?? 0)) * 0.000025,
      latencia: r.duracionMs ? (r.duracionMs / 1000) : 0,
      status: r.exito ? 'exitoso' : 'fallido',
      documento: r.documentoNombre ?? 'Desconocido',
      fecha: r.creadoEn?.toISOString().slice(0, 10) ?? '',
      detalle: r.error ?? '',
    }));

    const total = Number(stats?.total ?? 0);
    const completados = Number(stats?.exitosos ?? 0);

    return Response.json({
      items,
      total,
      summary: {
        total,
        completados,
        avgConf: Number(stats?.avgConf ?? 0),
        totalTokens: Number(stats?.totalTokens ?? 0),
        avgLat: Number(stats?.avgLat ?? 0) / 1000,
      },
      page: query.page,
      limit: query.limit,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
