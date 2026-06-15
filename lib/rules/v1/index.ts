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
import { formatHondurasDateTime } from '@/lib/datetime';

export function calcularPenaIndividual(config: DelitoConfig, delito: DelitoBase): ResultadoIndividual {
  const base = seleccionarPenaBase(config, delito);
  let { pena_min, pena_max } = base;
  const { tipo_pena, unidad, pena_base_min, pena_base_max, es_perpetuidad } = base;

  // PERPETUIDAD: es una pena cualitativa (Art. 37 CP). No se le aplican
  // fracciones, mitades ni circunstancias numéricas. Se devuelve como tope
  // absoluto (480 meses = 40 años efectivos) marcada como perpetuidad.
  if (es_perpetuidad) {
    return {
      delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
      pena_min,
      pena_max,
      pena_recomendada: pena_max,
      gravedad: 'Muy grave',
      tipo_pena: 'perpetuidad',
      unidad,
      exento: false,
      pena_base_min,
      pena_base_max,
      modificaciones: ['Prisión a perpetuidad (Art. 37 CP): pena cualitativa, no se le aplican reducciones ni fracciones'],
    };
  }

  if (pena_base_min === 0 && pena_base_max === 0 && config.pena_seleccionada === 'prision') {
    return {
      delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
      pena_min: 0, pena_max: 0, pena_recomendada: 0, gravedad: 'Sin pena', tipo_pena, unidad, exento: false,
      pena_base_min, pena_base_max, modificaciones: ['Sin pena privativa de libertad'],
    };
  }

  const eximente = evaluarEximenteCompleta(config.eximente_completa);
  if (eximente.aplica) {
    return {
      delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
      pena_min: 0, pena_max: 0, pena_recomendada: 0, gravedad: 'Exento', tipo_pena, unidad, exento: true,
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

  const p_min = (pena_base_min === 0 && pena_min === 0) ? 0 : Math.max(1, Math.floor(pena_min));
  const p_max = (pena_base_max === 0 && pena_max === 0) ? 0 : Math.max(1, Math.floor(pena_max));
  const medio = p_min === 0 && p_max === 0 ? 0 : Math.floor((p_min + p_max) / 2);
  const gravedad = unidad === 'dias' ? 'Multa' : p_max === 0 ? 'Sin pena' : calcular_gravedad(p_max);

  return {
    delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
    pena_min: p_min, pena_max: p_max, pena_recomendada: medio, gravedad, tipo_pena, unidad, exento: false,
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
  const fecha = formatHondurasDateTime(new Date(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      : resultado.unidad === 'dias'
        ? `${resultado.pena_min} a ${resultado.pena_max} días de ${resultado.tipo_pena}`
        : `${meses_a_texto(resultado.pena_min)} a ${meses_a_texto(resultado.pena_max)} de ${resultado.tipo_pena}`;

    const grado_autoria_nombre = GRADOS_AUTORIA.find((g) => g.id === config.grado_autoria)?.nombre || config.grado_autoria;
    const grado_ejecucion_nombre = GRADOS_EJECUCION.find((g) => g.id === config.grado_ejecucion)?.nombre || config.grado_ejecucion;
    const estado = getEstadoDelito(delito.nombre, delito.articulo);

    const tipo_pena = delito.tipo_pena_principal || (resultado.unidad === 'dias' ? 'Multa' : 'Prisión');

    resultados_individuales.push({
      delito_id: delito.id,
      nombre: delito.nombre,
      articulo: delito.articulo,
      clasificacion: delito.clasificacion || '',
      confianza: estado.estado,
      tipo_pena_principal: tipo_pena,
      pena_base_min: resultado.pena_base_min,
      pena_base_max: resultado.pena_base_max,
      pena_base_texto: resultado.unidad === 'dias'
        ? `${resultado.pena_base_min} a ${resultado.pena_base_max} días`
        : `${meses_a_texto(resultado.pena_base_min)} a ${meses_a_texto(resultado.pena_base_max)}`,
      pena_individual_min: resultado.pena_min,
      pena_individual_max: resultado.pena_max,
      pena_individual_texto: pena_texto,
      pena_recomendada_meses: resultado.pena_recomendada,
      pena_recomendada_texto: resultado.unidad === 'dias'
        ? `${resultado.pena_recomendada} días`
        : meses_a_texto(resultado.pena_recomendada),
      tiene_multa: delito.tiene_multa ?? false,
      multa_min_valor: delito.multa_min_valor ?? null,
      multa_max_valor: delito.multa_max_valor ?? null,
      multa_unidad: delito.multa_unidad ?? null,
      multa_descripcion_legal: delito.multa_descripcion_legal ?? null,
      gravedad: resultado.gravedad,
      grado_autoria: grado_autoria_nombre,
      grado_ejecucion: grado_ejecucion_nombre,
      agravantes_aplicadas: agravantes_nombres,
      atenuantes_aplicadas: atenuantes_nombres,
      penas_accesorias: delito.penas_accesorias,
      inhabilitacion_min_valor: delito.inhabilitacion_min_valor ?? null,
      inhabilitacion_max_valor: delito.inhabilitacion_max_valor ?? null,
      inhabilitacion_unidad: delito.inhabilitacion_unidad ?? null,
      reglas_especiales_pena: delito.reglas_especiales_pena ?? null,
      modificaciones: resultado.modificaciones,
      exento: resultado.exento,
      requiere_revision_humana: delito.requiere_revision_humana ?? false,
      confianza_extraccion: delito.confianza_extraccion ?? null,
      pena_por_remision_normativa: delito.pena_por_remision_normativa ?? false,
      articulos_remitidos_para_pena: delito.articulos_remitidos_para_pena ?? null,
      pena_base_resuelta_desde_articulo: delito.pena_base_resuelta_desde_articulo ?? null,
      condicion_para_aplicar_pena_remitida: delito.condicion_para_aplicar_pena_remitida ?? null,
      agravacion_por_articulo_remitido: delito.agravacion_por_articulo_remitido ?? null,
      formula_calculo_remision: delito.formula_calculo_remision ?? null,
      requiere_datos_economicos: delito.requiere_datos_economicos ?? false,
      variables_necesarias_para_calculo: delito.variables_necesarias_para_calculo ?? null,
      observaciones_remision_normativa: delito.observaciones_remision_normativa ?? null,
    });
  }

  const resultado_concurso = aplicarConcurso(penas_para_concurso, request.tipo_concurso);

  const penas_activas = penas_para_concurso.filter((p) => !p.exento);
  const todas_multas = penas_activas.length > 0 && penas_activas.every((p) => p.unidad === 'dias');
  const tipo_pena_principal = todas_multas ? 'multa' : 'prisión';
  const hayExentos = penas_para_concurso.some((p) => p.exento);
  const todosExentos = penas_para_concurso.length > 0 && penas_para_concurso.every((p) => p.exento);

  let pena_principal_texto: string;
  if (todosExentos) {
    pena_principal_texto = 'EXENTO';
  } else if (resultado_concurso.pena_max === 0 && hayExentos && penas_activas.length === 0) {
    pena_principal_texto = 'EXENTO';
  } else if (resultado_concurso.pena_max === 0) {
    pena_principal_texto = 'Sin pena privativa de libertad';
  } else if (todas_multas) {
    pena_principal_texto = `${resultado_concurso.pena_min} a ${resultado_concurso.pena_max} días de ${tipo_pena_principal}`;
  } else {
    pena_principal_texto = `${meses_a_texto(resultado_concurso.pena_min)} a ${meses_a_texto(resultado_concurso.pena_max)} de ${tipo_pena_principal}`;
  }

  const analisis_juridico = generarAnalisisJuridico(resultados_individuales, request.tipo_concurso, resultado_concurso);

  const advertencias: string[] = [];
  for (const r of resultados_individuales) {
    if (r.requiere_revision_humana) {
      advertencias.push(`${r.nombre} (${r.articulo}): requiere revisión humana.`);
    }
    if (r.confianza === 'pendiente_revision' || r.confianza === 'rechazado') {
      advertencias.push(`${r.nombre}: verificación ${r.confianza === 'pendiente_revision' ? 'pendiente' : 'rechazada'}.`);
    }
    if (r.tipo_pena_principal && !['Prisión', 'Multa', 'Arresto domiciliario', 'Prestación de servicios de utilidad pública', 'Localización permanente', 'Disolución de la persona jurídica', 'Inhabilitación'].includes(r.tipo_pena_principal)) {
      advertencias.push(`${r.nombre}: tipo de pena no estándar (${r.tipo_pena_principal}).`);
    }
  }
  const requiereRevision = resultados_individuales.some(r => r.requiere_revision_humana) ||
    resultados_individuales.some(r => r.confianza === 'rechazado');
  const tipoPenaPrincipal = todas_multas ? 'Multa' : 'Prisión';

  return {
    version_motor: 'v1',
    delitos_analizados: resultados_individuales,
    tipo_concurso: request.tipo_concurso === 'ninguno' ? 'ninguno' : request.tipo_concurso,
    concurso_descripcion: resultado_concurso.descripcion,
    concurso_articulo: resultado_concurso.articulo,
    pena_principal: pena_principal_texto,
    pena_principal_tipo: tipoPenaPrincipal,
    pena_principal_minimo_meses: resultado_concurso.pena_min,
    pena_principal_maximo_meses: resultado_concurso.pena_max,
    penas_accesorias: [...new Set(todas_penas_accesorias)],
    analisis_juridico,
    fecha,
    disclaimer: 'Este cálculo es orientativo y no sustituye la función jurisdiccional. La determinación definitiva de la pena corresponde exclusivamente a los tribunales de justicia de Honduras.',
    requiere_revision: requiereRevision,
    advertencias,
  };
}

export * from './types';
