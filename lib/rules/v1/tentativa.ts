import { LIMITES } from '../../constants';
import { disminuir_en_fraccion } from '../../utils';

export interface ResultadoTentativa {
  pena_min: number;
  pena_max: number;
  modificaciones: string[];
}

/**
 * Aplica la reducción por tentativa conforme al Art. 62 CP.
 *
 * El Código Penal hondureño prevé UNA SOLA reducción por tentativa:
 *   - Tentativa acabada: pena del consumado rebajada en 1/4.
 *   - Tentativa inacabada: pena del consumado rebajada en 1/3.
 *
 * NOTA: El parámetro `reduccion_tentativa` se conserva por compatibilidad de la
 * API (Deprecado Fase 0, auditoría técnico-jurídica), pero NO produce ningún
 * efecto. El CP hondureño NO contempla "dos grados de tentativa" — esa figura
 * es propia del CP español. Cualquier segunda reducción sería ilegal.
 */
export function aplicarTentativa(
  pena_min: number,
  pena_max: number,
  grado_ejecucion: string,
  _reduccion_tentativa: number,
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

  return { pena_min: min, pena_max: max, modificaciones };
}
