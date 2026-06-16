import type { DelitoConfig, DelitoBase, SupuestoPenalMotor } from './types';
import { LIMITES } from '../../constants';

export interface PenaBase {
  pena_min: number;
  pena_max: number;
  tipo_pena: 'prisión' | 'multa' | 'perpetuidad';
  unidad: 'meses' | 'dias';
  pena_base_min: number;
  pena_base_max: number;
  es_perpetuidad: boolean;
  /** Fase 5 — Indica que la pena se resolvió desde un supuesto penal específico. */
  resuelta_desde_supuesto_penal: boolean;
}

/**
 * Selecciona la pena base del delito según la elección del usuario.
 *
 * TRATAMIENTO DE LA PERPETUIDAD (Fase 0, auditoría técnico-jurídica):
 * El centinela `9999` meses del catálogo NO es un máximo numérico: la prisión
 * a perpetuidad (Art. 37 CP) es una pena cualitativamente distinta. Aquí se
 * marca `tipo_pena = 'perpetuidad'` y se topea `pena_max` al límite efectivo
 * (480 meses = 40 años) para evitar que el motor aplique fracciones o sumas
 * absurdas sobre 9999. El downstream (concurso, fracciones) debe respetar la
 * marca `es_perpetuidad`.
 *
 * Fase 5 — Supuestos penales:
 * Si `config.supuesto_penal_id` está presente y existe en `supuestosMap`, la
 * pena base se toma del supuesto penal (modalidad/calificación específica) en
 * lugar de la pena genérica del delito. Esto permite calcular delitos con
 * múltiples modalidades (p.ej. Art. 312 con 2 modalidades de femicidio).
 */
export function seleccionarPenaBase(
  config: DelitoConfig,
  delito: DelitoBase,
  supuestosMap?: Map<string, SupuestoPenalMotor>,
): PenaBase {
  let pena_min: number;
  let pena_max: number;
  let tipo_pena: 'prisión' | 'multa' | 'perpetuidad';
  let unidad: 'meses' | 'dias';
  let resuelta_desde_supuesto_penal = false;

  // Fase 5: intentar resolver desde supuesto penal si está seleccionado y existe.
  const supuesto = config.supuesto_penal_id && supuestosMap
    ? supuestosMap.get(config.supuesto_penal_id)
    : undefined;

  if (config.pena_seleccionada === 'prision') {
    if (supuesto && supuesto.tipo_pena !== 'multa') {
      // Usar pena del supuesto penal (modalidad específica).
      pena_min = supuesto.pena_min_meses;
      const esPerpetuidadSupuesto = supuesto.tipo_pena === 'perpetuidad'
        || supuesto.pena_max_meses >= LIMITES.PENA_PERPETUA_MESES;
      pena_max = esPerpetuidadSupuesto ? LIMITES.PENA_PERPETUA_MESES : supuesto.pena_max_meses;
      tipo_pena = esPerpetuidadSupuesto ? 'perpetuidad' : 'prisión';
      resuelta_desde_supuesto_penal = true;
    } else {
      pena_min = delito.pena_minima_meses;
      // La perpetuidad se representa como centinela 9999; se topea al límite
      // efectivo (40 años) y se marca para que el motor no la trate como número.
      const esPerpetuidad = delito.pena_maxima_meses >= LIMITES.PENA_PERPETUA_MESES
        || (delito.reglas_especiales_pena?.toLowerCase().includes('perpetuidad') ?? false);
      pena_max = esPerpetuidad ? LIMITES.PENA_PERPETUA_MESES : delito.pena_maxima_meses;
      tipo_pena = esPerpetuidad ? 'perpetuidad' : 'prisión';
    }
    unidad = 'meses';
  } else {
    if (supuesto && supuesto.tipo_pena === 'multa') {
      // Supuesto penal con pena de multa.
      pena_min = supuesto.pena_min_meses;
      pena_max = supuesto.pena_max_meses;
      resuelta_desde_supuesto_penal = true;
    } else {
      pena_min = delito.pena_alternativa_min || 0;
      pena_max = delito.pena_alternativa_max || 0;
    }
    tipo_pena = 'multa';
    unidad = 'dias';
  }

  const es_perpetuidad = tipo_pena === 'perpetuidad';

  // VALIDACIÓN A6 (auditoría): rango invertido (min > max) es dato corrupto.
  // Se reporta por consola para auditoría de catálogo; el motor lo normaliza
  // a un rango válido intercambiando los extremos para no producir salidas
  // absurdas (p.ej. aplicar_mitad_superior sobre [72,12] → [42,12]).
  if (pena_min > pena_max && pena_max > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[calculadora] Rango invertido en delito "${delito.nombre}" (${delito.articulo}): min=${pena_min} > max=${pena_max}. Normalizando.`);
    [pena_min, pena_max] = [pena_max, pena_min];
  }

  return {
    pena_min,
    pena_max,
    tipo_pena,
    unidad,
    pena_base_min: pena_min,
    pena_base_max: pena_max,
    es_perpetuidad,
    resuelta_desde_supuesto_penal,
  };
}
