export {
  calcularPenaIndividual as calcular_pena_individual,
  calcularPena as calcular_pena,
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
} from './rules/v1';
