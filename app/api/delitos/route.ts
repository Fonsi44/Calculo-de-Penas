import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { and, or, ilike } from 'drizzle-orm';
import { delitoCreateSchema, validate } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clasificacion = searchParams.get('clasificacion');
  const busqueda = searchParams.get('busqueda');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = parseInt(searchParams.get('limit') || '100');

  const filters = [];
  if (clasificacion) {
    filters.push(ilike(delitos.clasificacion, `%${clasificacion}%`));
  }
  if (busqueda) {
    const q = `%${busqueda}%`;
    filters.push(
      or(ilike(delitos.nombre, q), ilike(delitos.articulo, q), ilike(delitos.conducta, q))
    );
  }

  const rows = await db.select().from(delitos).where(
    filters.length > 0 ? and(...filters) : undefined
  ).orderBy(delitos.nombre).offset(skip).limit(limit);

  return Response.json(rows.map(d => ({
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
  })));
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
