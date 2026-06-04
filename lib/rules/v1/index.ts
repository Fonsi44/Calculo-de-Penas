import { calcular_gravedad, meses_a_texto } from '../../utils';
import { AGRAVANTES, ATENUANTES, GRADOS_AUTORIA, GRADOS_EJECUCION } from '../../catalogos';
import { getEstadoDelito } from '../../estados-delitos';
import { seleccionarPenaBase } from './pena-base';
import { aplicarGradoAutoria } from './grado-autoria';
import { aplicarTentativa } from './tentativa';
import { aplicarCircunstancias } from './circunstancias';
import { evaluarEximenteCompleta } from './eximentes';
import { aplicarConcurso } from './concurso';
import { generarAnalisisJuridico } from './analisis';
import type { CalculoRequest, DelitoAnalizado, DelitoBase, DelitoConfig, ResultadoCalculo, ResultadoIndividual } from './types';

export function calcularPenaIndividual(config: DelitoConfig, delito: DelitoBase): ResultadoIndividual {
  const base = seleccionarPenaBase(config, delito);
  let { pena_min, pena_max } = base;
  const { tipo_pena, pena_base_min, pena_base_max } = base;

  const eximente = evaluarEximenteCompleta(config.eximente_completa);
  if (eximente.aplica) {
    return {
      delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
      pena_min: 0, pena_max: 0, pena_recomendada: 0, gravedad: 'Exento', tipo_pena, exento: true,
      pena_base_min, pena_base_max, modificaciones: eximente.modificaciones,
    };
  }

  const modificaciones: string[] = [];

  const autoria = aplicarGradoAutoria(pena_min, pena_max, config.grado_autoria, modificaciones);
  pena_min = autoria.pena_min;
  pena_max = autoria.pena_max;

  const tentativa = aplicarTentativa(pena_min, pena_max, config.grado_ejecucion, config.reduccion_tentativa, modificaciones);
  pena_min = tentativa.pena_min;
  pena_max = tentativa.pena_max;

  const circ = aplicarCircunstancias(pena_min, pena_max, config, modificaciones);
  pena_min = circ.pena_min;
  pena_max = circ.pena_max;

  const p_min = Math.max(1, Math.floor(pena_min));
  const p_max = Math.max(1, Math.floor(pena_max));
  const medio = Math.floor((p_min + p_max) / 2);
  const gravedad = calcular_gravedad(p_max);

  return {
    delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
    pena_min: p_min, pena_max: p_max, pena_recomendada: medio, gravedad, tipo_pena, exento: false,
    pena_base_min, pena_base_max, modificaciones,
  };
}

export { aplicarConcurso } from './concurso';
export { generarAnalisisJuridico } from './analisis';

export function generarAnalisisJuridicoPublic(
  delitos: DelitoAnalizado[],
  tipo_concurso: string,
  resultado_concurso: ReturnType<typeof aplicarConcurso>,
): string {
  return generarAnalisisJuridico(delitos, tipo_concurso, resultado_concurso);
}

export function calcularPena(request: CalculoRequest, delitosMap: Map<string, DelitoBase>): ResultadoCalculo {
  const resultados_individuales: DelitoAnalizado[] = [];
  const penas_para_concurso: ResultadoIndividual[] = [];
  const todas_penas_accesorias: string[] = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  for (const config of request.delitos) {
    const delito = delitosMap.get(config.delito_id);
    if (!delito) throw new Error(`Delito ${config.delito_id} no encontrado`);

    const resultado = calcularPenaIndividual(config, delito);
    penas_para_concurso.push(resultado);

    if (!resultado.exento) {
      todas_penas_accesorias.push(...delito.penas_accesorias);
    }

    const agravantes_nombres = config.agravantes.map((aid) => AGRAVANTES.find((a) => a.id === aid)?.nombre || aid);
    const atenuantes_nombres = config.atenuantes.map((aid) => ATENUANTES.find((a) => a.id === aid)?.nombre || aid);

    const pena_texto = resultado.exento
      ? 'EXENTO (eximente completa)'
      : `${meses_a_texto(resultado.pena_min)} a ${meses_a_texto(resultado.pena_max)} de ${resultado.tipo_pena}`;

    const grado_autoria_nombre = GRADOS_AUTORIA.find((g) => g.id === config.grado_autoria)?.nombre || config.grado_autoria;
    const grado_ejecucion_nombre = GRADOS_EJECUCION.find((g) => g.id === config.grado_ejecucion)?.nombre || config.grado_ejecucion;
    const estado = getEstadoDelito(delito.nombre, delito.articulo);

    resultados_individuales.push({
      delito_id: delito.id,
      nombre: delito.nombre,
      articulo: delito.articulo,
      clasificacion: delito.clasificacion || '',
      confianza: estado.estado,
      pena_base_min: resultado.pena_base_min,
      pena_base_max: resultado.pena_base_max,
      pena_base_texto: `${meses_a_texto(resultado.pena_base_min)} a ${meses_a_texto(resultado.pena_base_max)}`,
      pena_individual_min: resultado.pena_min,
      pena_individual_max: resultado.pena_max,
      pena_individual_texto: pena_texto,
      pena_recomendada_meses: resultado.pena_recomendada,
      pena_recomendada_texto: meses_a_texto(resultado.pena_recomendada),
      gravedad: resultado.gravedad,
      grado_autoria: grado_autoria_nombre,
      grado_ejecucion: grado_ejecucion_nombre,
      agravantes_aplicadas: agravantes_nombres,
      atenuantes_aplicadas: atenuantes_nombres,
      penas_accesorias: delito.penas_accesorias,
      modificaciones: resultado.modificaciones,
      exento: resultado.exento,
    });
  }

  const resultado_concurso = aplicarConcurso(penas_para_concurso, request.tipo_concurso);

  const pena_principal_texto = resultado_concurso.pena_max === 0
    ? 'EXENTO'
    : `${meses_a_texto(resultado_concurso.pena_min)} a ${meses_a_texto(resultado_concurso.pena_max)} de prisión`;

  const analisis_juridico = generarAnalisisJuridico(resultados_individuales, request.tipo_concurso, resultado_concurso);

  return {
    version_motor: 'v1',
    delitos_analizados: resultados_individuales,
    tipo_concurso: request.tipo_concurso === 'ninguno' ? 'ninguno' : request.tipo_concurso,
    concurso_descripcion: resultado_concurso.descripcion,
    concurso_articulo: resultado_concurso.articulo,
    pena_principal: pena_principal_texto,
    pena_principal_minimo_meses: resultado_concurso.pena_min,
    pena_principal_maximo_meses: resultado_concurso.pena_max,
    penas_accesorias: [...new Set(todas_penas_accesorias)],
    analisis_juridico,
    fecha,
    disclaimer: 'Este cálculo es orientativo y no sustituye la función jurisdiccional. La determinación definitiva de la pena corresponde exclusivamente a los tribunales de justicia de Honduras.',
  };
}

export * from './types';
