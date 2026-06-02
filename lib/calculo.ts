import { meses_a_texto, reducir_grado, aumentar_grado, aplicar_mitad_superior, aplicar_mitad_inferior } from './utils';
import { AGRAVANTES, ATENUANTES, EXIMENTES, GRADOS_AUTORIA, GRADOS_EJECUCION } from './catalogos';

export interface DelitoBase {
  id: string;
  nombre: string;
  articulo: string;
  clasificacion?: string | null;
  penas_accesorias: string[];
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa: boolean;
  pena_alternativa_min: number;
  pena_alternativa_max: number;
}

export interface DelitoConfig {
  delito_id: string;
  pena_seleccionada: 'prision' | 'multa';
  variables_activas: string[];
  grado_autoria: string;
  grado_ejecucion: string;
  reduccion_tentativa: number;
  agravantes: string[];
  atenuantes: string[];
  eximentes: string[];
  eximente_completa: boolean;
}

export interface CalculoRequest {
  delitos: DelitoConfig[];
  tipo_concurso: string;
}

export interface ResultadoIndividual {
  delito: { id: string; nombre: string; articulo: string; clasificacion?: string | null; penas_accesorias: string[] };
  pena_min: number;
  pena_max: number;
  pena_recomendada: number;
  gravedad: string;
  tipo_pena: string;
  exento: boolean;
  pena_base_min: number;
  pena_base_max: number;
  modificaciones: string[];
}

export interface ResultadoConcurso {
  pena_min: number;
  pena_max: number;
  descripcion: string;
  articulo: string;
}

export interface ResultadoCalculo {
  delitos_analizados: any[];
  tipo_concurso: string;
  concurso_descripcion: string;
  concurso_articulo: string;
  pena_principal: string;
  pena_principal_minimo_meses: number;
  pena_principal_maximo_meses: number;
  penas_accesorias: string[];
  analisis_juridico: string;
  fecha: string;
  disclaimer: string;
}

export function calcular_pena_individual(config: DelitoConfig, delito: DelitoBase): ResultadoIndividual {
  let pena_min: number, pena_max: number, tipo_pena: string;

  if (config.pena_seleccionada === 'prision') {
    pena_min = delito.pena_minima_meses;
    pena_max = delito.pena_maxima_meses;
    tipo_pena = 'prisión';
  } else {
    pena_min = delito.pena_alternativa_min || 0;
    pena_max = delito.pena_alternativa_max || 0;
    tipo_pena = 'multa';
  }

  const pena_base_min = pena_min;
  const pena_base_max = pena_max;

  if (config.eximente_completa) {
    return {
      delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
      pena_min: 0, pena_max: 0, pena_recomendada: 0, gravedad: 'Exento', tipo_pena, exento: true,
      pena_base_min, pena_base_max, modificaciones: ['Eximente completa aplicada - EXENTO'],
    };
  }

  const modificaciones: string[] = [];

  if (config.grado_autoria === 'complice') {
    [pena_min, pena_max] = reducir_grado(pena_min, pena_max, 1);
    modificaciones.push('Cómplice: pena inferior en 1 grado (Art. 29 CP)');
  }

  if (config.grado_ejecucion === 'tentativa_acabada' || config.grado_ejecucion === 'tentativa_inacabada') {
    [pena_min, pena_max] = reducir_grado(pena_min, pena_max, config.reduccion_tentativa);
    modificaciones.push(`Tentativa: pena inferior en ${config.reduccion_tentativa} grado(s) (Art. 62 CP)`);
  }

  for (const ex_id of config.eximentes) {
    const ex = EXIMENTES.find(e => e.id === ex_id);
    if (ex && !ex.completa) {
      [pena_min, pena_max] = reducir_grado(pena_min, pena_max, 1);
      modificaciones.push('Eximente incompleta: pena inferior en 1 grado');
    }
  }

  const neto = config.agravantes.length - config.atenuantes.length;
  if (neto > 0) {
    if (neto >= 2) {
      [pena_min, pena_max] = aumentar_grado(pena_min, pena_max, 1);
      modificaciones.push(`Saldo de ${neto} agravante(s): pena superior en 1 grado`);
    } else {
      [pena_min, pena_max] = aplicar_mitad_superior(pena_min, pena_max);
      modificaciones.push('Saldo de 1 agravante: pena en mitad superior');
    }
  } else if (neto < 0) {
    const neto_abs = Math.abs(neto);
    if (neto_abs >= 2) {
      [pena_min, pena_max] = reducir_grado(pena_min, pena_max, 1);
      modificaciones.push(`Saldo de ${neto_abs} atenuante(s): pena inferior en 1 grado`);
    } else {
      [pena_min, pena_max] = aplicar_mitad_inferior(pena_min, pena_max);
      modificaciones.push('Saldo de 1 atenuante: pena en mitad inferior');
    }
  } else {
    if (config.agravantes.length > 0 || config.atenuantes.length > 0) {
      modificaciones.push('Agravantes y atenuantes compensados: se aplica pena base');
    }
  }

  const p_min = Math.max(1, pena_min);
  const p_max = Math.max(1, pena_max);
  const medio = Math.floor((p_min + p_max) / 2);

  let gravedad: string;
  if (p_max >= 360) gravedad = 'Muy grave';
  else if (p_max >= 120) gravedad = 'Grave';
  else if (p_max >= 36) gravedad = 'Menos grave';
  else gravedad = 'Leve';

  return {
    delito: { id: delito.id, nombre: delito.nombre, articulo: delito.articulo, clasificacion: delito.clasificacion, penas_accesorias: delito.penas_accesorias },
    pena_min: p_min, pena_max: p_max, pena_recomendada: medio, gravedad, tipo_pena, exento: false,
    pena_base_min, pena_base_max, modificaciones,
  };
}

export function aplicar_concurso(penas: ResultadoIndividual[], tipo_concurso: string): ResultadoConcurso {
  const penas_activas = penas.filter(p => !p.exento);

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

  if (tipo_concurso === 'real') {
    const total_min = penas_activas.reduce((s, p) => s + p.pena_min, 0);
    let total_max = penas_activas.reduce((s, p) => s + p.pena_max, 0);
    const pena_mayor = Math.max(...penas_activas.map(p => p.pena_max));
    const limite = Math.min(pena_mayor * 3, 480);
    total_max = Math.min(total_max, limite);
    return {
      pena_min: Math.min(total_min, total_max),
      pena_max: total_max,
      descripcion: 'Concurso Real (Art. 37 CP): Se acumulan las penas. Límite: triple de la mayor o 40 años.',
      articulo: 'Art. 37 CP',
    };
  }

  if (tipo_concurso === 'ideal') {
    const delito_mas_grave = penas_activas.reduce((a, b) => a.pena_max > b.pena_max ? a : b);
    const [pena_min, pena_max] = aplicar_mitad_superior(delito_mas_grave.pena_min, delito_mas_grave.pena_max);
    return {
      pena_min, pena_max,
      descripcion: 'Concurso Ideal (Art. 36 CP): Un hecho, varios delitos. Pena del más grave en mitad superior.',
      articulo: 'Art. 36 CP',
    };
  }

  if (tipo_concurso === 'medial') {
    const delito_mas_grave = penas_activas.reduce((a, b) => a.pena_max > b.pena_max ? a : b);
    const [pena_min, pena_max] = aumentar_grado(delito_mas_grave.pena_min, delito_mas_grave.pena_max);
    return {
      pena_min, pena_max,
      descripcion: 'Concurso Medial (Art. 36.2 CP): Delito medio para cometer otro. Pena superior en grado.',
      articulo: 'Art. 36.2 CP',
    };
  }

  if (tipo_concurso === 'continuado') {
    const delito_mas_grave = penas_activas.reduce((a, b) => a.pena_max > b.pena_max ? a : b);
    const [pena_min, pena_max] = aplicar_mitad_superior(delito_mas_grave.pena_min, delito_mas_grave.pena_max);
    return {
      pena_min, pena_max,
      descripcion: 'Delito Continuado (Art. 35 CP): Pluralidad de acciones con misma finalidad. Pena en mitad superior.',
      articulo: 'Art. 35 CP',
    };
  }

  return { pena_min: 0, pena_max: 0, descripcion: 'Tipo de concurso no reconocido', articulo: '' };
}

export function generar_analisis_juridico(delitos: any[], tipo_concurso: string, resultado_concurso: ResultadoConcurso): string {
  const lineas: string[] = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  lineas.push('═'.repeat(50));
  lineas.push('ANÁLISIS JURÍDICO DEL CÁLCULO DE PENA');
  lineas.push('Código Penal de Honduras (Decreto 130-2017)');
  lineas.push('═'.repeat(50));
  lineas.push(`\nFecha: ${fecha}`);
  lineas.push(`Total de delitos analizados: ${delitos.length}`);

  for (let i = 0; i < delitos.length; i++) {
    const d = delitos[i];
    lineas.push(`\n${'─'.repeat(40)}`);
    lineas.push(`DELITO ${i + 1}: ${d.nombre.toUpperCase()}`);
    lineas.push(`${'─'.repeat(40)}`);
    lineas.push(`• Artículo: ${d.articulo}`);
    lineas.push(`• Clasificación: ${d.clasificacion}`);
    lineas.push(`• Pena base: ${d.pena_base_texto}`);
    lineas.push(`• Gravedad: ${d.gravedad || 'No determinada'}`);
    lineas.push(`• Pena recomendada: ${d.pena_recomendada_texto || d.pena_individual_texto}`);
    lineas.push(`• Grado de autoría: ${d.grado_autoria}`);
    lineas.push(`• Grado de ejecución: ${d.grado_ejecucion}`);

    if (d.modificaciones?.length) {
      lineas.push('\nModificaciones aplicadas:');
      for (const mod of d.modificaciones) {
        lineas.push(`  → ${mod}`);
      }
    }

    if (d.agravantes_aplicadas?.length) {
      lineas.push(`\nAgravantes (Art. 27 CP): ${d.agravantes_aplicadas.join(', ')}`);
    }
    if (d.atenuantes_aplicadas?.length) {
      lineas.push(`Atenuantes (Art. 26 CP): ${d.atenuantes_aplicadas.join(', ')}`);
    }

    lineas.push(`\n★ PENA INDIVIDUAL: ${d.pena_individual_texto}`);

    if (d.penas_accesorias?.length) {
      lineas.push(`\nPenas accesorias: ${d.penas_accesorias.join(', ')}`);
    }
  }

  if (delitos.length > 1 && tipo_concurso !== 'ninguno') {
    lineas.push(`\n${'═'.repeat(50)}`);
    lineas.push('CONCURSO DE DELITOS');
    lineas.push(`${'═'.repeat(50)}`);
    lineas.push(`Tipo: ${tipo_concurso.toUpperCase()}`);
    lineas.push(`Base legal: ${resultado_concurso.articulo}`);
    lineas.push(`Efecto: ${resultado_concurso.descripcion}`);
  }

  return lineas.join('\n');
}

export function calcular_pena(request: CalculoRequest, delitosMap: Map<string, DelitoBase>): ResultadoCalculo {
  const resultados_individuales: any[] = [];
  const penas_para_concurso: ResultadoIndividual[] = [];
  const todas_penas_accesorias: string[] = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  for (const config of request.delitos) {
    const delito = delitosMap.get(config.delito_id);
    if (!delito) throw new Error(`Delito ${config.delito_id} no encontrado`);

    const resultado = calcular_pena_individual(config, delito);
    penas_para_concurso.push(resultado);

    if (!resultado.exento) {
      todas_penas_accesorias.push(...delito.penas_accesorias);
    }

    const agravantes_nombres = config.agravantes.map(aid => AGRAVANTES.find(a => a.id === aid)?.nombre || aid);
    const atenuantes_nombres = config.atenuantes.map(aid => ATENUANTES.find(a => a.id === aid)?.nombre || aid);

    const pena_texto = resultado.exento
      ? 'EXENTO (eximente completa)'
      : `${meses_a_texto(resultado.pena_min)} a ${meses_a_texto(resultado.pena_max)} de ${resultado.tipo_pena}`;

    const grado_autoria_nombre = GRADOS_AUTORIA.find(g => g.id === config.grado_autoria)?.nombre || config.grado_autoria;
    const grado_ejecucion_nombre = GRADOS_EJECUCION.find(g => g.id === config.grado_ejecucion)?.nombre || config.grado_ejecucion;

    resultados_individuales.push({
      delito_id: delito.id,
      nombre: delito.nombre,
      articulo: delito.articulo,
      clasificacion: delito.clasificacion || '',
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

  const resultado_concurso = aplicar_concurso(penas_para_concurso, request.tipo_concurso);

  const pena_principal_texto = resultado_concurso.pena_max === 0
    ? 'EXENTO'
    : `${meses_a_texto(resultado_concurso.pena_min)} a ${meses_a_texto(resultado_concurso.pena_max)} de prisión`;

  const analisis_juridico = generar_analisis_juridico(resultados_individuales, request.tipo_concurso, resultado_concurso);

  return {
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
