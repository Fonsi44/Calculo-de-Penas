import { calcularPena } from './rules/v1';
import type { CalculoRequest, DelitoBase, ResultadoCalculo } from './rules/v1';

export {
  calcularPenaIndividual as calcular_pena_individual,
  aplicarConcurso as aplicar_concurso,
  generarAnalisisJuridico as generar_analisis_juridico,
} from './rules/v1';

export type {
  DelitoBase,
  DelitoConfig,
  CalculoRequest,
  ResultadoIndividual,
  ResultadoConcurso,
  DelitoAnalizado,
  ResultadoCalculo,
  ConfianzaDelito,
} from './rules/v1';

export function calcular_pena(
  request: CalculoRequest,
  delitosMap: Map<string, DelitoBase>,
  version: 'v1' = 'v1',
): ResultadoCalculo {
  if (version === 'v1') {
    return calcularPena(request, delitosMap);
  }
  throw new Error(`Versión de motor no soportada: ${version}`);
}
