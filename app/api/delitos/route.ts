import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { and, or, ilike, isNotNull } from 'drizzle-orm';

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
  const body = await request.json();
  const result = await db.insert(delitos).values({
    nombre: body.nombre,
    articulo: body.articulo,
    conducta: body.conducta,
    clasificacion: body.clasificacion,
    ramaId: body.rama_id,
    constitucionArticuloId: body.constitucion_articulo_id,
    penaMinimaMeses: body.pena_minima_meses,
    penaMaximaMeses: body.pena_maxima_meses,
    tienePenaAlternativa: body.tiene_pena_alternativa ?? false,
    penaAlternativaMin: body.pena_alternativa_min ?? 0,
    penaAlternativaMax: body.pena_alternativa_max ?? 0,
    penasAccesorias: body.penas_accesorias || [],
    observaciones: body.observaciones,
    esGrave: (body.pena_maxima_meses ?? 0) >= 60,
  }).returning({ id: delitos.id });

  return Response.json({ message: 'Delito creado', id: result[0].id }, { status: 201 });
}
