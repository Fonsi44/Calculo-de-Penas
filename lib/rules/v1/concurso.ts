import { LIMITES } from '../../constants';
import { meses_a_texto, aumentar_en_fraccion, aplicar_mitad_superior } from '../../utils';
import type { ResultadoIndividual, ResultadoConcurso } from './types';

// PERPETUIDAD (Art. 37 CP): pena cualitativa, no numérica. En cualquier modalidad
// de concurso actúa como TOPE ABSOLUTO (40 años efectivos). No se acumula ni se
// aumenta por fracción.
function toparPerpetuidad(penas: ResultadoIndividual[]): boolean {
  return penas.some((p) => p.tipo_pena === 'perpetuidad');
}

function aplicar_concurso_real(penas: ResultadoIndividual[]): ResultadoConcurso {
  const total_min = penas.reduce((s, p) => s + p.pena_min, 0);
  let total_max = penas.reduce((s, p) => s + p.pena_max, 0);
  const max_individual = Math.max(...penas.map((p) => p.pena_max));
  const triple = max_individual * 3;

  const alguna_excede_20 = penas.some((p) => p.pena_max > LIMITES.UMBRAL_VEINTE_ANOS_MESES);
  const limite = alguna_excede_20 ? LIMITES.PENA_MAXIMA_EXCEPCIONAL_MESES : LIMITES.PENA_MAXIMA_GENERAL_MESES;

  total_max = Math.min(total_max, triple, limite);

  return {
    pena_min: Math.min(total_min, total_max),
    pena_max: total_max,
    descripcion: `Concurso Real: Se acumulan las penas. Límite: triple de la más grave (${meses_a_texto(max_individual)} × 3 = ${meses_a_texto(triple)}), máx. ${alguna_excede_20 ? '40 años' : '30 años'} (Art. 66 CP).`,
    articulo: 'Art. 66 CP',
  };
}

function aplicar_concurso_ideal(penas: ResultadoIndividual[]): ResultadoConcurso {
  const mas_grave = penas.reduce((a, b) => (a.pena_max > b.pena_max ? a : b));
  const [pena_min, pena_max] = aumentar_en_fraccion(mas_grave.pena_min, mas_grave.pena_max, LIMITES.FRACCION_CONCURSO_IDEAL);

  const suma_max = penas.reduce((s, p) => s + p.pena_max, 0);
  const suma_min = penas.reduce((s, p) => s + p.pena_min, 0);

  return {
    pena_min: Math.min(pena_min, suma_min),
    pena_max: Math.min(pena_max, suma_max),
    descripcion: `Concurso Ideal: Pena de la infracción más grave (${mas_grave.delito.nombre}) aumentada en 1/3, sin exceder la suma de penas individuales (Art. 67 CP).`,
    articulo: 'Art. 67 CP',
  };
}

function aplicar_delito_continuado(penas: ResultadoIndividual[]): ResultadoConcurso {
  const mas_grave = penas.reduce((a, b) => (a.pena_max > b.pena_max ? a : b));
  const [pena_min, pena_max] = aplicar_mitad_superior(mas_grave.pena_min, mas_grave.pena_max);
  const max_con_adicional = Math.floor(pena_max * (1 + LIMITES.FRACCION_CONTINUADO_ADICIONAL));

  return {
    pena_min,
    pena_max: max_con_adicional,
    descripcion: `Delito Continuado: Pena en mitad superior de la infracción más grave (${mas_grave.delito.nombre}), pudiendo llegar hasta 1/3 más (Art. 68 CP).`,
    articulo: 'Art. 68 CP',
  };
}

export function aplicarConcurso(penas: ResultadoIndividual[], tipo_concurso: string): ResultadoConcurso {
  const penas_activas = penas.filter((p) => !p.exento);

  if (penas_activas.length === 0) {
    return { pena_min: 0, pena_max: 0, descripcion: 'Todos los delitos exentos', articulo: '' };
  }

  if (penas_activas.length === 1 || tipo_concurso === 'ninguno') {
    return {
      pena_min: penas_activas[0].pena_min,
      pena_max: penas_activas[0].pena_max,
      descripcion: 'Delito único - se aplica pena individual',
      articulo: '',
    };
  }

  let resultado: ResultadoConcurso;
  switch (tipo_concurso) {
    case 'real':
      resultado = aplicar_concurso_real(penas_activas);
      break;
    case 'ideal':
      resultado = aplicar_concurso_ideal(penas_activas);
      break;
    case 'continuado':
      resultado = aplicar_delito_continuado(penas_activas);
      break;
    default:
      return { pena_min: 0, pena_max: 0, descripcion: 'Tipo de concurso no reconocido', articulo: '' };
  }

  // PERPETUIDAD como tope absoluto: si algún delito del concurso lleva
  // prisión a perpetuidad, ningún mecanismo de concurso puede rebasar los
  // 40 años efectivos (Art. 37/66 CP). La perpetuidad no se acumula ni se
  // incrementa por fracción.
  if (toparPerpetuidad(penas_activas) && resultado.pena_max > LIMITES.PENA_MAXIMA_EXCEPCIONAL_MESES) {
    resultado = {
      ...resultado,
      pena_max: LIMITES.PENA_MAXIMA_EXCEPCIONAL_MESES,
      descripcion: `${resultado.descripcion} Topado a perpetuidad (40 años efectivos, Art. 37 CP) por concurrir un delito con pena a perpetuidad.`,
    };
  }

  return resultado;
}
