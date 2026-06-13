import { LIMITES, UMBRALES_GRAVEDAD } from './constants';

// NOTA: meses_a_texto() y formatMeses() (en lib/ui.ts) son funciones con
// propósito distinto. meses_a_texto() es para el motor de cálculo (soporta
// perpetuidad y valores negativos). formatMeses() es para presentación UI y
// PDF (usa pluralizar(), tiene manejo de NaN). No unificar.
export function meses_a_texto(meses: number): string {
  if (meses <= 0) return '0 meses';
  if (meses >= LIMITES.PENA_PERPETUA_MESES) return 'Prisión a perpetuidad';
  const años = Math.floor(meses / 12);
  const meses_restantes = meses % 12;
  if (años > 0 && meses_restantes > 0) {
    return `${años} año${años !== 1 ? 's' : ''} y ${meses_restantes} mes${meses_restantes !== 1 ? 'es' : ''}`;
  } else if (años > 0) {
    return `${años} año${años !== 1 ? 's' : ''}`;
  } else {
    return `${meses_restantes} mes${meses_restantes !== 1 ? 'es' : ''}`;
  }
}

export function aumentar_en_fraccion(min: number, max: number, fraccion: number): [number, number] {
  const nuevo_min = max;
  const nuevo_max = Math.floor(max * (1 + fraccion));
  return [nuevo_min, nuevo_max];
}

export function disminuir_en_fraccion(min: number, max: number, fraccion: number): [number, number] {
  if (min === 0 && max === 0) return [0, 0];
  const nuevo_min = Math.max(1, Math.floor(min * (1 - fraccion)));
  const nuevo_max = min;
  if (nuevo_min > nuevo_max) return [nuevo_max, nuevo_max];
  return [nuevo_min, nuevo_max];
}

export function aplicar_mitad_superior(min: number, max: number): [number, number] {
  const punto_medio = Math.floor((min + max) / 2);
  return [punto_medio, max];
}

export function aplicar_mitad_inferior(min: number, max: number): [number, number] {
  const punto_medio = Math.floor((min + max) / 2);
  return [min, punto_medio];
}

export function calcular_gravedad(pena_max: number): string {
  if (pena_max >= UMBRALES_GRAVEDAD.MUY_GRAVE) return 'Muy grave';
  if (pena_max >= UMBRALES_GRAVEDAD.GRAVE) return 'Grave';
  if (pena_max >= UMBRALES_GRAVEDAD.MENOS_GRAVE) return 'Menos grave';
  return 'Leve';
}
