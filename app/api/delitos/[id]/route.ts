import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getEstadoDelito } from '@/lib/estados-delitos';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db.select().from(delitos).where(eq(delitos.id, id));
  if (!row) {
    return Response.json({ error: 'Delito no encontrado' }, { status: 404 });
  }
  const estado = getEstadoDelito(row.nombre, row.articulo);
  return Response.json({
    id: row.id,
    nombre: row.nombre,
    articulo: row.articulo,
    conducta: row.conducta,
    clasificacion: row.clasificacion,
    rama_id: row.ramaId,
    constitucion_articulo_id: row.constitucionArticuloId,
    pena_minima_meses: row.penaMinimaMeses,
    pena_maxima_meses: row.penaMaximaMeses,
    tiene_pena_alternativa: row.tienePenaAlternativa,
    pena_alternativa_min: row.penaAlternativaMin,
    pena_alternativa_max: row.penaAlternativaMax,
    penas_accesorias: row.penasAccesorias || [],
    observaciones: row.observaciones,
    es_grave: row.esGrave,
    estado: estado.estado,
    estado_nota: estado.nota,
    estado_articulo_sugerido: estado.articulo_sugerido,
  });
}
