import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { calcular_pena } from '@/lib/calculo';
import type { DelitoBase } from '@/lib/calculo';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido en el cuerpo de la solicitud' }, { status: 400 });
  }

  if (!body || !Array.isArray(body.delitos) || body.delitos.length === 0) {
    return Response.json({ error: 'Se requiere al menos un delito para calcular la pena' }, { status: 400 });
  }

  const delitoIds: string[] = body.delitos.map((d: any) => d.delito_id);
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

  for (const config of body.delitos) {
    if (!delitosMap.has(config.delito_id)) {
      return Response.json({ error: `Delito ${config.delito_id} no encontrado en la base de datos` }, { status: 404 });
    }
  }

  try {
    const result = calcular_pena(body, delitosMap);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message || 'Error interno al calcular la pena' }, { status: 400 });
  }
}
