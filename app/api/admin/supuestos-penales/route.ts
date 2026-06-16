import { db } from '@/lib/db';
import { supuestosPenales, delitos } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { asc, eq } from 'drizzle-orm';

/**
 * GET /api/admin/supuestos-penales
 *
 * Lista todos los supuestos penales (modalidades) con el delito vinculado.
 * Usado por el admin de agravantes para poblar el selector de supuesto penal
 * al crear nuevas agravantes.
 *
 * Requiere rol admin.
 */
export async function GET(request: Request) {
  try {
    requireAdmin(request);

    const rows = await db
      .select({
        supuesto: supuestosPenales,
        delito: delitos,
      })
      .from(supuestosPenales)
      .innerJoin(delitos, eq(supuestosPenales.delitoId, delitos.id))
      .orderBy(asc(delitos.articulo), asc(supuestosPenales.numeral));

    const resultado = rows.map(r => ({
      id: r.supuesto.id,
      delito_id: r.supuesto.delitoId,
      numeral: r.supuesto.numeral,
      texto_modalidad: r.supuesto.textoModalidad,
      pena_min_meses: r.supuesto.penaMinMeses,
      pena_max_meses: r.supuesto.penaMaxMeses,
      tipo_pena: r.supuesto.tipoPena,
      tiene_agravantes_especificas: r.supuesto.tieneAgravantesEspecificas ?? false,
      delito_nombre: r.delito.nombre,
      delito: {
        nombre: r.delito.nombre,
        articulo: r.delito.articulo,
      },
    }));

    return Response.json({ supuestos: resultado });
  } catch (err) {
    return authFailureResponse(err);
  }
}
