import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { calcular_pena } from '@/lib/calculo';
import type { DelitoBase } from '@/lib/calculo';
import { calcularSchema, validate } from '@/lib/validation';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';

const CALC_MAX = 30;
const CALC_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);

    const rl = rateLimit(user.userId, { keyPrefix: 'calc', windowMs: CALC_WINDOW_MS, max: CALC_MAX });
    if (!rl.ok) {
      return rateLimitResponse(rl);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const parsed = validate(calcularSchema, body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const delitoIds = parsed.data.delitos.map(d => d.delito_id);
    const rows = await db.select().from(delitos).where(inArray(delitos.id, delitoIds));

    const delitosMap = new Map<string, DelitoBase>();
    for (const row of rows) {
      delitosMap.set(row.id, {
        id: row.id,
        nombre: row.nombre,
        articulo: row.articulo,
        clasificacion: row.clasificacion,
        penas_accesorias: row.penasAccesorias || [],
        pena_minima_meses: row.penaMinimaMeses,
        pena_maxima_meses: row.penaMaximaMeses,
        tiene_pena_alternativa: row.tienePenaAlternativa ?? false,
        pena_alternativa_min: row.penaAlternativaMin ?? 0,
        pena_alternativa_max: row.penaAlternativaMax ?? 0,
      });
    }

    for (const config of parsed.data.delitos) {
      if (!delitosMap.has(config.delito_id)) {
        return Response.json({ error: `Delito ${config.delito_id} no encontrado` }, { status: 404 });
      }
    }

    try {
      const result = calcular_pena(parsed.data, delitosMap);
      return Response.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error interno';
      return Response.json({ error: message }, { status: 400 });
    }
  } catch (e) {
    return authFailureResponse(e);
  }
}
