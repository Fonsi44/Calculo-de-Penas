import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { and, or, ilike, sql } from 'drizzle-orm';
import { getEstadoDelito } from '@/lib/estados-delitos';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clasificacion = searchParams.get('clasificacion');
  const rama = searchParams.get('rama');
  const busqueda = searchParams.get('busqueda');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const countOnly = searchParams.get('count') === '1';

  const filters = [];
  if (clasificacion) {
    filters.push(ilike(delitos.clasificacion, `%${clasificacion}%`));
  }
  if (rama) {
    filters.push(ilike(delitos.ramaId, `%${rama}%`));
  }
  if (busqueda) {
    const q = `%${busqueda}%`;
    filters.push(
      or(ilike(delitos.nombre, q), ilike(delitos.articulo, q), ilike(delitos.conducta, q))
    );
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  if (countOnly) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(delitos).where(where);
    return Response.json({ total: count });
  }

  const [rows, totalRow] = await Promise.all([
    db.select().from(delitos).where(where).orderBy(delitos.nombre).offset(skip).limit(limit),
    db.select({ count: sql<number>`count(*)::int` }).from(delitos).where(where),
  ]);

  return Response.json({
    data: rows.map(d => {
      const estado = getEstadoDelito(d.nombre, d.articulo);
      return {
        id: d.id,
        nombre: d.nombre,
        articulo: d.articulo,
        clasificacion: d.clasificacion,
        conducta: d.conducta,
        rama_id: d.ramaId,
        constitucion_articulo_id: d.constitucionArticuloId,
        pena_minima_meses: d.penaMinimaMeses,
        pena_maxima_meses: d.penaMaximaMeses,
        tiene_pena_alternativa: d.tienePenaAlternativa,
        pena_alternativa_min: d.penaAlternativaMin,
        pena_alternativa_max: d.penaAlternativaMax,
        penas_accesorias: d.penasAccesorias || [],
        observaciones: d.observaciones,
        es_grave: d.esGrave,
        estado: estado.estado,
        estado_nota: estado.nota,
        estado_articulo_sugerido: estado.articulo_sugerido,
      };
    }),
    total: totalRow[0].count,
    limit,
    offset: skip,
    hasMore: skip + rows.length < totalRow[0].count,
  });
}
