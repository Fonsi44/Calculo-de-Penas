import { LIMITES } from '../../constants';
import { aplicar_mitad_inferior, disminuir_en_fraccion } from '../../utils';

export interface ResultadoTentativa {
  pena_min: number;
  pena_max: number;
  modificaciones: string[];
}

export function aplicarTentativa(
  pena_min: number,
  pena_max: number,
  grado_ejecucion: string,
  reduccion_tentativa: number,
  modificaciones: string[],
): ResultadoTentativa {
  let min = pena_min;
  let max = pena_max;

  if (grado_ejecucion === 'tentativa_acabada') {
    [min, max] = disminuir_en_fraccion(min, max, LIMITES.FRACCION_TENTATIVA_ACABADA);
    modificaciones.push('Tentativa acabada: pena inferior en 1/4 (Art. 62 CP)');
  } else if (grado_ejecucion === 'tentativa_inacabada') {
    [min, max] = disminuir_en_fraccion(min, max, LIMITES.FRACCION_TENTATIVA_INACABADA);
    modificaciones.push('Tentativa inacabada: pena inferior en 1/3 (Art. 62 CP)');
  }

  const esTentativa = grado_ejecucion === 'tentativa_acabada' || grado_ejecucion === 'tentativa_inacabada';
  if (esTentativa && reduccion_tentativa === 2) {
    const [nuevoMin, nuevoMax] = aplicar_mitad_inferior(min, max);
    modificaciones.push('2 grados de reducción (Art. 69 CP): mitad inferior aplicada sobre la pena ya reducida por tentativa');
    min = nuevoMin;
    max = nuevoMax;
  }

  return { pena_min: min, pena_max: max, modificaciones };
}
