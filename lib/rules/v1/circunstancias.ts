import { AGRAVANTES, ATENUANTES, EXIMENTES } from '../../catalogos';
import { aplicar_mitad_inferior, aplicar_mitad_superior } from '../../utils';
import type { DelitoConfig } from './types';

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
    modificaciones.push(`Agravantes (${total_agravantes}) y atenuantes (${total_atenuantes}) compensados: ni máximo ni mínimo (Art. 70.f CP)`);
  }

  return { pena_min: min, pena_max: max, total_agravantes, total_atenuantes, modificaciones };
}
