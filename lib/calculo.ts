import { calcularPena } from './rules/v1';
import type { CalculoRequest, DelitoBase, ResultadoCalculo, ContextoCalculo } from './rules/v1';

export {
  calcularPenaIndividual as calcular_pena_individual,
  aplicarConcurso as aplicar_concurso,
  generarAnalisisJuridico as generar_analisis_juridico,
  aplicarAgravantesEspecificas,
  parsearFraccion,
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
  AgravanteEspecificaMotor,
  SupuestoPenalMotor,
  ContextoCalculo,
} from './rules/v1';

/**
 * Calcula la pena para una solicitud completa.
 *
 * @param request Solicitud con los delitos y tipo de concurso.
 * @param delitosMap Mapa de delitos base (id → DelitoBase).
 * @param version Versión del motor (solo 'v1' soportada).
 * @param contexto Fase 2/3/5 — supuestos penales y agravantes específicas
 *                 para enriquecer el cálculo. Opcional (compatibilidad hacia atrás).
 */
export function calcular_pena(
  request: CalculoRequest,
  delitosMap: Map<string, DelitoBase>,
  version: 'v1' = 'v1',
  contexto?: ContextoCalculo,
): ResultadoCalculo {
  if (version === 'v1') {
    return calcularPena(request, delitosMap, contexto);
  }
  throw new Error(`Versión de motor no soportada: ${version}`);
}
