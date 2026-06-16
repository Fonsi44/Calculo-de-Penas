import { db } from '@/lib/db';
import { remisionesNormativas } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/remisiones-normativas?articulo=<numero>
 *
 * Devuelve las remisiones normativas (un artículo remite a otro para el
 * cómputo de la pena). Si se pasa `articulo`, filtra las remisiones cuyo
 * origen es ese artículo.
 *
 * Fase 4 — catálogo de consulta. Es público (los textos legales son públicos)
 * pero se recomienda uso interno para el motor de cálculo.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const articulo = url.searchParams.get('articulo');

    let rows;
    if (articulo) {
      rows = await db.select().from(remisionesNormativas).where(eq(remisionesNormativas.articuloOrigen, articulo));
    } else {
      rows = await db.select().from(remisionesNormativas);
    }

    const resultado = rows.map(r => ({
      id: r.id,
      articulo_origen: r.articuloOrigen,
      numeral_origen: r.numeralOrigen,
      articulo_destino: r.articuloDestino,
      numeral_destino: r.numeralDestino,
      texto_remision: r.textoRemision,
      condicion_aplicacion: r.condicionAplicacion,
    }));

    return Response.json(resultado);
  } catch {
    return Response.json({ error: 'Error al obtener remisiones normativas' }, { status: 500 });
  }
}
