export {
  calcularPenaIndividual as calcular_pena_individual,
  calcularPena as calcular_pena,
  aplicarConcursoPublic as aplicar_concurso,
  generarAnalisisJuridicoPublic as generar_analisis_juridico,
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
