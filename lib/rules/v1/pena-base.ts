import type { DelitoConfig, DelitoBase } from './types';

export interface PenaBase {
  pena_min: number;
  pena_max: number;
  tipo_pena: 'prisión' | 'multa';
  unidad: 'meses' | 'dias';
  pena_base_min: number;
  pena_base_max: number;
}

export function seleccionarPenaBase(config: DelitoConfig, delito: DelitoBase): PenaBase {
  let pena_min: number;
  let pena_max: number;
  let tipo_pena: 'prisión' | 'multa';
  let unidad: 'meses' | 'dias';

  if (config.pena_seleccionada === 'prision') {
    pena_min = delito.pena_minima_meses;
    pena_max = delito.pena_maxima_meses;
    tipo_pena = 'prisión';
    unidad = 'meses';
  } else {
    pena_min = delito.pena_alternativa_min || 0;
    pena_max = delito.pena_alternativa_max || 0;
    tipo_pena = 'multa';
    unidad = 'dias';
  }

  return {
    pena_min,
    pena_max,
    tipo_pena,
    unidad,
    pena_base_min: pena_min,
    pena_base_max: pena_max,
  };
}
