import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { getEstadoDelito } from '@/lib/estados-delitos';
import { validateCsrf } from '@/lib/csrf';

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.articulo !== undefined) updateData.articulo = body.articulo;
    if (body.conducta !== undefined) updateData.conducta = body.conducta;
    if (body.clasificacion !== undefined) updateData.clasificacion = body.clasificacion;
    if (body.rama_id !== undefined) updateData.ramaId = body.rama_id;
    if (body.constitucion_articulo_id !== undefined) updateData.constitucionArticuloId = body.constitucion_articulo_id;
    if (body.pena_minima_meses !== undefined) updateData.penaMinimaMeses = body.pena_minima_meses;
    if (body.pena_maxima_meses !== undefined) {
      updateData.penaMaximaMeses = body.pena_maxima_meses;
      updateData.esGrave = body.pena_maxima_meses >= 60;
    }
    if (body.tiene_pena_alternativa !== undefined) updateData.tienePenaAlternativa = body.tiene_pena_alternativa;
    if (body.pena_alternativa_min !== undefined) updateData.penaAlternativaMin = body.pena_alternativa_min;
    if (body.pena_alternativa_max !== undefined) updateData.penaAlternativaMax = body.pena_alternativa_max;
    if (body.penas_accesorias !== undefined) updateData.penasAccesorias = body.penas_accesorias;
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones;
    updateData.actualizadoEn = new Date();

    const [row] = await db.update(delitos).set(updateData).where(eq(delitos.id, id)).returning();
    if (!row) {
      return Response.json({ error: 'Delito no encontrado' }, { status: 404 });
    }
    return Response.json({ message: 'Delito actualizado' });
  } catch (e) {
    return authFailureResponse(e);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    const [row] = await db.delete(delitos).where(eq(delitos.id, id)).returning({ id: delitos.id });
    if (!row) {
      return Response.json({ error: 'Delito no encontrado' }, { status: 404 });
    }
    return Response.json({ message: 'Delito eliminado' });
  } catch (e) {
    return authFailureResponse(e);
  }
}
