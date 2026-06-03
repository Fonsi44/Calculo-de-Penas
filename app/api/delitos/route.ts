import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { and, or, ilike, sql } from 'drizzle-orm';
import { delitoCreateSchema, validate } from '@/lib/validation';

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
    data: rows.map(d => ({
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
    })),
    total: totalRow[0].count,
    limit,
    offset: skip,
    hasMore: skip + rows.length < totalRow[0].count,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = validate(delitoCreateSchema, body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const result = await db.insert(delitos).values({
    nombre: parsed.data.nombre,
    articulo: parsed.data.articulo,
    conducta: parsed.data.conducta || '',
    clasificacion: parsed.data.clasificacion || '',
    ramaId: parsed.data.rama_id,
    constitucionArticuloId: parsed.data.constitucion_articulo_id,
    penaMinimaMeses: parsed.data.pena_minima_meses,
    penaMaximaMeses: parsed.data.pena_maxima_meses,
    tienePenaAlternativa: parsed.data.tiene_pena_alternativa,
    penaAlternativaMin: parsed.data.pena_alternativa_min,
    penaAlternativaMax: parsed.data.pena_alternativa_max,
    penasAccesorias: parsed.data.penas_accesorias || [],
    observaciones: parsed.data.observaciones,
    esGrave: parsed.data.pena_maxima_meses >= 60,
  }).returning({ id: delitos.id });

  return Response.json({ message: 'Delito creado', id: result[0].id }, { status: 201 });
}
