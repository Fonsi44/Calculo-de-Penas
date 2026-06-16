import { AGRAVANTES, ATENUANTES, EXIMENTES } from '../../catalogos';
import { aplicar_mitad_inferior, aplicar_mitad_superior, aumentar_en_fraccion } from '../../utils';
import type { DelitoConfig, AgravanteEspecificaMotor } from './types';

export interface ResultadoCircunstancias {
  pena_min: number;
  pena_max: number;
  total_agravantes: number;
  total_atenuantes: number;
  modificaciones: string[];
}

const idExisteEn = <T extends { id: string }>(items: T[], id: string): boolean =>
  items.some((i) => i.id === id);

export function contarEximentesIncompletas(config: DelitoConfig): number {
  return config.eximentes.filter((eid) => {
    const ex = EXIMENTES.find((e) => e.id === eid);
    return ex ? !ex.completa : false;
  }).length;
}

export function aplicarCircunstancias(
  pena_min: number,
  pena_max: number,
  config: DelitoConfig,
  modificaciones: string[],
): ResultadoCircunstancias {
  const agravantes_validos = config.agravantes.filter((id) => idExisteEn(AGRAVANTES, id));
  const atenuantes_validos = config.atenuantes.filter((id) => idExisteEn(ATENUANTES, id));
  const eximentes_incompletas = contarEximentesIncompletas(config);
  const total_atenuantes = atenuantes_validos.length + eximentes_incompletas;
  const total_agravantes = agravantes_validos.length;

  let min = pena_min;
  let max = pena_max;

  if (total_agravantes === 0 && total_atenuantes === 0) {
    modificaciones.push('Sin circunstancias modificativas: pena en el marco legal');
  } else if (total_agravantes >= 1 && total_atenuantes === 0) {
    if (total_agravantes <= 2) {
      [min, max] = aplicar_mitad_superior(min, max);
      modificaciones.push(`${total_agravantes} agravante(s): pena media hasta límite máximo (Art. 70.b CP)`);
    } else {
      min = max;
      modificaciones.push(`${total_agravantes} agravantes: pena en límite máximo (Art. 70.e CP)`);
    }
  } else if (total_atenuantes >= 1 && total_agravantes === 0) {
    if (total_atenuantes === 1) {
      [min, max] = aplicar_mitad_inferior(min, max);
      modificaciones.push('1 atenuante: pena media hasta límite mínimo (Art. 70.c CP)');
    } else {
      max = min;
      modificaciones.push(`${total_atenuantes} atenuantes: pena en límite mínimo (Art. 70.d CP)`);
    }
  } else {
    // Art. 70.f CP: "compensadas... ni máximo ni mínimo".
    //
    // INTERPRETACIÓN: el Art. 70.f es una DIRECTRIZ JUDICIAL (el juez no puede
    // imponer en su sentencia ni el máximo ni el mínimo legales del tipo), no
    // una fórmula aritmética. Para una calculadora que devuelve un RANGO, el
    // marco legal se mantiene íntegro porque cualquier pena interior es
    // procedente; el usuario (abogado) debe entender que el resultado concreto
    // a imponer no podrá coincidir con los extremos.
    //
    // NOTA: un recorte fino del rango (p.ej. excluir extremos por fracción)
    // requiere modelado más preciso y revisión jurídica — planificado para
    // Fase 3 del plan de corrección. No modificar en Fase 0.
    modificaciones.push(`Agravantes (${total_agravantes}) y atenuantes (${total_atenuantes}) compensados: pena dentro del marco legal, sin imponer máximo ni mínimo (Art. 70.f CP)`);
  }

  return { pena_min: min, pena_max: max, total_agravantes, total_atenuantes, modificaciones };
}

/**
 * Convierte una fracción en formato string ("1/3", "1/4", "1/2") a número.
 * Devuelve 0 si el formato no es válido.
 */
export function parsearFraccion(fraccion: string): number {
  const match = fraccion.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  if (den === 0) return 0;
  return num / den;
}

export interface ResultadoAgravantesEspecificas {
  pena_min: number;
  pena_max: number;
  agravantes_aplicadas: AgravanteEspecificaMotor[];
  modificaciones: string[];
}

/**
 * Fase 3/5 — Aplica agravantes específicas del tipo penal.
 *
 * A diferencia de las agravantes genéricas (Art. 32 CP) que solo desplazan la
 * pena dentro del marco legal (mitad superior / límite máximo), las agravantes
 * ESPECÍFICAS del tipo (p.ej. Art. 312, 363, 200 CP) AUMENTAN el marco legal
 * en una fracción concreta (típicamente 1/3). Esto es cualitativamente distinto:
 * generan un nuevo marco superior.
 *
 * Se aplican DESPUÉS de las circunstancias genéricas (Art. 70 CP), porque las
 * agravantes específicas son de aplicación OBLIGATORIA por el tipo (no exigen
 * discretcionalidad judicial para desplazarse dentro del marco, sino que
 * amplían el propio marco).
 *
 * La fracción de aumento se aplica sobre el extremo máximo del marco actual
 * (mismo criterio que `aumentar_en_fraccion` de Art. 69.1 CP).
 */
export function aplicarAgravantesEspecificas(
  pena_min: number,
  pena_max: number,
  config: DelitoConfig,
  agravantesMap: Map<string, AgravanteEspecificaMotor>,
  modificaciones: string[],
): ResultadoAgravantesEspecificas {
  const ids = config.agravantes_especificas_ids ?? [];
  if (ids.length === 0) {
    return { pena_min, pena_max, agravantes_aplicadas: [], modificaciones };
  }

  // Resolver agravantes específicas desde el mapa (filtrando inexistentes).
  const agravantes_aplicadas: AgravanteEspecificaMotor[] = [];
  for (const id of ids) {
    const agr = agravantesMap.get(id);
    if (agr) agravantes_aplicadas.push(agr);
  }

  if (agravantes_aplicadas.length === 0) {
    return { pena_min, pena_max, agravantes_aplicadas: [], modificaciones };
  }

  // Acumular la fracción de aumento total. Si hay varias agravantes específicas,
  // se SUMAN sus fracciones (criterio restrictivo: cada agravante específica
  // amplía el marco de forma independiente). Esto evita el doble cómputo que
  // ocurriría si se aplicaran secuencialmente sobre el nuevo máximo.
  //
  // Ejemplo: Art. 363 CP con 2 agravantes específicas de 1/3 cada una →
  // fracción total = 2/3 → nuevo máximo = pena_max * (1 + 2/3).
  let fraccion_total = 0;
  for (const agr of agravantes_aplicadas) {
    fraccion_total += parsearFraccion(agr.fraccion_aumento);
  }

  if (fraccion_total <= 0) {
    return { pena_min, pena_max, agravantes_aplicadas, modificaciones };
  }

  const [nuevo_min, nuevo_max] = aumentar_en_fraccion(pena_min, pena_max, fraccion_total);

  const detalle = agravantes_aplicadas
    .map(a => `${a.texto_agravante} (Art. ${a.articulo_cp}${a.numeral ? '.' + a.numeral : ''} CP, +${a.fraccion_aumento})`)
    .join('; ');
  modificaciones.push(
    `${agravantes_aplicadas.length} agravante(s) específica(s) del tipo: ${detalle}. ` +
    `Marco ampliado en ${Math.round(fraccion_total * 100)}% (nuevo máximo ${nuevo_max} meses).`
  );

  return { pena_min: nuevo_min, pena_max: nuevo_max, agravantes_aplicadas, modificaciones };
}
