import { db } from '@/lib/db';
import { delitos, supuestosPenales, agravantesEspecificas } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { calcular_pena } from '@/lib/calculo';
import type { DelitoBase, AgravanteEspecificaMotor, SupuestoPenalMotor } from '@/lib/calculo';
import { calcularSchema, validate } from '@/lib/validation';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const CALC_MAX = 30;
const CALC_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    validateCsrf(request);

    const rl = await rateLimit(user.userId, { keyPrefix: 'calc', windowMs: CALC_WINDOW_MS, max: CALC_MAX });
    if (!rl.ok) {
      return rateLimitResponse(rl);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const parsed = validate(calcularSchema, body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const delitoIds = parsed.data.delitos.map(d => d.delito_id);
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
        pena_por_remision_normativa: row.penaPorRemisionNormativa ?? false,
        articulos_remitidos_para_pena: row.articulosRemitidosParaPena ?? null,
        pena_base_resuelta_desde_articulo: row.penaBaseResueltaDesdeArticulo ?? null,
        condicion_para_aplicar_pena_remitida: row.condicionParaAplicarPenaRemitida ?? null,
        agravacion_por_articulo_remitido: row.agravacionPorArticuloRemitido ?? null,
        formula_calculo_remision: row.formulaCalculoRemision ?? null,
        requiere_datos_economicos: row.requiereDatosEconomicos ?? false,
        variables_necesarias_para_calculo: row.variablesNecesariasParaCalculo ?? null,
        pena_resuelta_min_meses: row.penaResueltaMinMeses ?? null,
        pena_resuelta_max_meses: row.penaResueltaMaxMeses ?? null,
        observaciones_remision_normativa: row.observacionesRemisionNormativa ?? null,
      });
    }

    for (const config of parsed.data.delitos) {
      if (!delitosMap.has(config.delito_id)) {
        return Response.json({ error: `Delito ${config.delito_id} no encontrado` }, { status: 404 });
      }
    }

    // Fase 2/3/5 — cargar supuestos penales y agravantes específicas vinculadas.
    const supuestosPenalesMap = new Map<string, SupuestoPenalMotor>();
    const agravantesEspecificasMap = new Map<string, AgravanteEspecificaMotor>();

    const supuestoIds = parsed.data.delitos
      .map(d => d.supuesto_penal_id)
      .filter((id): id is string => Boolean(id));
    const agravanteIds = parsed.data.delitos
      .flatMap(d => d.agravantes_especificas_ids ?? [])
      .filter(Boolean);

    if (supuestoIds.length > 0) {
      const supuestosRows = await db.select().from(supuestosPenales).where(inArray(supuestosPenales.id, supuestoIds));
      for (const s of supuestosRows) {
        supuestosPenalesMap.set(s.id, {
          id: s.id,
          delito_id: s.delitoId,
          numeral: s.numeral,
          texto_modalidad: s.textoModalidad,
          pena_min_meses: s.penaMinMeses,
          pena_max_meses: s.penaMaxMeses,
          tipo_pena: s.tipoPena,
          tiene_agravantes_especificas: s.tieneAgravantesEspecificas ?? false,
        });
      }
    }

    if (agravanteIds.length > 0) {
      const agravantesRows = await db.select().from(agravantesEspecificas).where(inArray(agravantesEspecificas.id, agravanteIds));
      for (const a of agravantesRows) {
        agravantesEspecificasMap.set(a.id, {
          id: a.id,
          articulo_cp: a.articuloCp,
          numeral: a.numeral,
          texto_agravante: a.textoAgravante,
          fraccion_aumento: a.fraccionAumento,
          obligatoria: a.obligatoria ?? false,
        });
      }
    }

    try {
      const result = calcular_pena(parsed.data, delitosMap, 'v1', {
        supuestos_penales: supuestosPenalesMap,
        agravantes_especificas: agravantesEspecificasMap,
      });
      return Response.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error interno';
      return Response.json({ error: message }, { status: 400 });
    }
  } catch (e) {
    return authFailureResponse(e);
  }
}
