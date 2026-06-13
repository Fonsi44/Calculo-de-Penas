import type { CalculoRequest, DelitoBase, DelitoConfig } from './rules/v1';

export interface ValidationIssue {
  campo: string;
  mensaje: string;
  severidad: 'error' | 'warning';
}

export interface ValidationResult {
  valido: boolean;
  issues: ValidationIssue[];
}

function validarConfig(config: DelitoConfig, delito: DelitoBase | undefined, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefijo = `delito[${index}]`;

  if (!config.delito_id || config.delito_id.trim().length === 0) {
    issues.push({ campo: `${prefijo}.delito_id`, mensaje: 'Falta el identificador del delito', severidad: 'error' });
  }

  if (!delito) {
    issues.push({ campo: `${prefijo}.delito_id`, mensaje: `Delito "${config.delito_id}" no encontrado en el catálogo`, severidad: 'error' });
    return issues;
  }

  if (config.pena_seleccionada === 'prision') {
    if (delito.pena_minima_meses < 0 || delito.pena_maxima_meses < 0) {
      issues.push({ campo: `${prefijo}.pena_seleccionada`, mensaje: 'La pena de prisión no puede ser negativa', severidad: 'error' });
    } else if (!Number.isInteger(delito.pena_minima_meses) || !Number.isInteger(delito.pena_maxima_meses)) {
      issues.push({ campo: `${prefijo}.pena_seleccionada`, mensaje: 'Los valores de pena deben ser números enteros', severidad: 'error' });
    }

    if (delito.pena_minima_meses > delito.pena_maxima_meses && delito.pena_maxima_meses > 0) {
      issues.push({ campo: `${prefijo}.pena_seleccionada`, mensaje: 'La pena mínima no puede ser mayor que la máxima', severidad: 'error' });
    }

    if (delito.pena_minima_meses === 0 && delito.pena_maxima_meses === 0) {
      issues.push({
        campo: `${prefijo}.pena_seleccionada`,
        mensaje: 'Este delito no contempla pena de prisión. Seleccione "Multa" o elija otro delito.',
        severidad: 'warning',
      });
    }
  }

  if (config.pena_seleccionada === 'multa') {
    const multaMin = delito.pena_alternativa_min ?? 0;
    const multaMax = delito.pena_alternativa_max ?? 0;
    if (multaMin < 0 || multaMax < 0) {
      issues.push({ campo: `${prefijo}.pena_seleccionada`, mensaje: 'La multa no puede ser negativa', severidad: 'error' });
    } else if (!Number.isInteger(multaMin) || !Number.isInteger(multaMax)) {
      issues.push({ campo: `${prefijo}.pena_seleccionada`, mensaje: 'Los valores de multa deben ser números enteros', severidad: 'error' });
    }
    if (multaMin === 0 && multaMax === 0) {
      issues.push({
        campo: `${prefijo}.pena_seleccionada`,
        mensaje: 'Este delito no contempla multa. Seleccione "Prisión" o elija otro delito.',
        severidad: 'warning',
      });
    }
  }

  if (typeof config.reduccion_tentativa !== 'number' || !Number.isInteger(config.reduccion_tentativa) || config.reduccion_tentativa < 1 || config.reduccion_tentativa > 2) {
    issues.push({ campo: `${prefijo}.reduccion_tentativa`, mensaje: 'Reducción por tentativa debe ser 1 o 2', severidad: 'error' });
  }

  if (!config.grado_autoria || !['autor_directo', 'coautor', 'inductor', 'complice'].includes(config.grado_autoria)) {
    issues.push({ campo: `${prefijo}.grado_autoria`, mensaje: 'Grado de autoría no reconocido', severidad: 'error' });
  }

  if (!config.grado_ejecucion || !['consumado', 'tentativa_acabada', 'tentativa_inacabada'].includes(config.grado_ejecucion)) {
    issues.push({ campo: `${prefijo}.grado_ejecucion`, mensaje: 'Grado de ejecución no reconocido', severidad: 'error' });
  }

  return issues;
}

export function validarCalculo(request: CalculoRequest, delitosMap: Map<string, DelitoBase>): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!request.delitos || request.delitos.length === 0) {
    issues.push({ campo: 'delitos', mensaje: 'Se requiere al menos un delito', severidad: 'error' });
  }

  for (let i = 0; i < request.delitos.length; i++) {
    const config = request.delitos[i];
    const delito = delitosMap.get(config.delito_id);
    const configIssues = validarConfig(config, delito, i);
    issues.push(...configIssues);

    if (!delito) continue;

    if (config.pena_seleccionada === 'prision' && delito.pena_minima_meses === 0 && delito.pena_maxima_meses === 0) {
      const hayModificaciones =
        config.grado_autoria !== 'autor_directo' ||
        config.grado_ejecucion !== 'consumado' ||
        config.agravantes.length > 0 ||
        config.atenuantes.length > 0 ||
        config.reduccion_tentativa > 1;

      if (hayModificaciones) {
        issues.push({
          campo: `delito[${i}]`,
          mensaje: 'No se pueden aplicar modificaciones a un delito sin pena de prisión.',
          severidad: 'error',
        });
      }
    }
  }

  const validTypes = ['ninguno', 'real', 'ideal', 'continuado'];
  if (!validTypes.includes(request.tipo_concurso)) {
    issues.push({ campo: 'tipo_concurso', mensaje: `Tipo de concurso "${request.tipo_concurso}" no reconocido. Válidos: ${validTypes.join(', ')}`, severidad: 'error' });
  }

  if (request.delitos.length > 1 && request.tipo_concurso === 'ninguno') {
    issues.push({ campo: 'tipo_concurso', mensaje: 'Hay múltiples delitos; seleccione un tipo de concurso', severidad: 'warning' });
  }

  return {
    valido: !issues.some(i => i.severidad === 'error'),
    issues,
  };
}

export function validarResultado(
  penaMin: number,
  penaMax: number,
  fechaInicio: string | null,
  fechaFin: string | null,
  abonoMeses: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(penaMin) || penaMin < 0) {
    issues.push({ campo: 'penaMin', mensaje: 'La pena mínima calculada no es válida', severidad: 'error' });
  }
  if (!Number.isFinite(penaMax) || penaMax < 0) {
    issues.push({ campo: 'penaMax', mensaje: 'La pena máxima calculada no es válida', severidad: 'error' });
  }
  if (penaMin > penaMax && !(penaMin === 0 && penaMax === 0)) {
    issues.push({ campo: 'penaMinMax', mensaje: 'La pena mínima no puede ser mayor que la máxima', severidad: 'error' });
  }

  if (!Number.isFinite(abonoMeses) || abonoMeses < 0) {
    issues.push({ campo: 'abonoMeses', mensaje: 'El abono/prisión preventiva no puede ser negativo', severidad: 'error' });
  }
  if (abonoMeses > penaMin && penaMin > 0) {
    issues.push({ campo: 'abonoMeses', mensaje: 'El abono supera la pena mínima calculada', severidad: 'warning' });
  }

  if (fechaInicio) {
    const d = new Date(fechaInicio);
    if (isNaN(d.getTime())) {
      issues.push({ campo: 'fechaInicio', mensaje: 'Fecha de inicio no válida', severidad: 'error' });
    }
  }
  if (fechaFin) {
    const d = new Date(fechaFin);
    if (isNaN(d.getTime())) {
      issues.push({ campo: 'fechaFin', mensaje: 'Fecha de fin no válida', severidad: 'error' });
    }
  }
  if (fechaInicio && fechaFin) {
    const ini = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (!isNaN(ini.getTime()) && !isNaN(fin.getTime()) && ini > fin) {
      issues.push({ campo: 'fechas', mensaje: 'La fecha de inicio no puede ser posterior a la fecha de fin', severidad: 'error' });
    }
  }

  return issues;
}
