import { LIMITES } from '../../constants';
import { disminuir_en_fraccion } from '../../utils';

export interface ResultadoGradoAutoria {
  pena_min: number;
  pena_max: number;
  modificaciones: string[];
}

export function aplicarGradoAutoria(
  pena_min: number,
  pena_max: number,
  grado_autoria: string,
  modificaciones: string[],
): ResultadoGradoAutoria {
  if (grado_autoria === 'complice') {
    const [nuevoMin, nuevoMax] = disminuir_en_fraccion(pena_min, pena_max, LIMITES.FRACCION_COMPLICE);
    modificaciones.push('Cómplice: pena inferior en 1/3 (Art. 61 CP)');
    return { pena_min: nuevoMin, pena_max: nuevoMax, modificaciones };
  }
  return { pena_min, pena_max, modificaciones };
}
