import { db } from '@/lib/db';
import { supuestosPenales, agravantesEspecificas } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

const SUP_MAX = 60;
const SUP_WINDOW_MS = 60_000;

/**
 * GET /api/supuestos-penales?delitoId=<uuid>
 *
 * Devuelve los supuestos penales (modalidades) de un delito concreto, junto
 * con las agravantes específicas vinculadas a cada supuesto.
 *
 * Fase 2/3/5 — usado por la calculadora para refinar la pena base y aplicar
 * agravantes del tipo penal. Requiere autenticación (uso interno del bufete).
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const rl = await rateLimit(user.userId, { keyPrefix: 'supuestos', windowMs: SUP_WINDOW_MS, max: SUP_MAX });
    if (!rl.ok) {
      return rateLimitResponse(rl);
    }

    const url = new URL(request.url);
    const delitoId = url.searchParams.get('delitoId');

    if (!delitoId) {
      return Response.json({ error: 'Parámetro delitoId requerido' }, { status: 400 });
    }

    const supuestos = await db.select().from(supuestosPenales).where(eq(supuestosPenales.delitoId, delitoId));

    // Cargar agravantes específicas vinculadas a los supuestos encontrados.
    const supuestoIds = supuestos.map(s => s.id);
    let agravantesPorSupuesto: Record<string, typeof agravantesEspecificas.$inferSelect[]> = {};
    if (supuestoIds.length > 0) {
      const todas = await db.select().from(agravantesEspecificas);
      agravantesPorSupuesto = todas
        .filter(a => supuestoIds.includes(a.supuestoPenalId))
        .reduce((acc, a) => {
          (acc[a.supuestoPenalId] ??= []).push(a);
          return acc;
        }, {} as Record<string, typeof agravantesEspecificas.$inferSelect[]>);
    }

    const resultado = supuestos.map(s => ({
      id: s.id,
      delito_id: s.delitoId,
      numeral: s.numeral,
      literal: s.literal,
      inciso: s.inciso,
      texto_modalidad: s.textoModalidad,
      pena_min_meses: s.penaMinMeses,
      pena_max_meses: s.penaMaxMeses,
      tipo_pena: s.tipoPena,
      tiene_agravantes_especificas: s.tieneAgravantesEspecificas ?? false,
      observaciones: s.observaciones,
      agravantes_especificas: (agravantesPorSupuesto[s.id] ?? []).map(a => ({
        id: a.id,
        articulo_cp: a.articuloCp,
        numeral: a.numeral,
        texto_agravante: a.textoAgravante,
        fraccion_aumento: a.fraccionAumento,
        obligatoria: a.obligatoria ?? false,
      })),
    }));

    return Response.json(resultado);
  } catch (e) {
    return authFailureResponse(e);
  }
}
