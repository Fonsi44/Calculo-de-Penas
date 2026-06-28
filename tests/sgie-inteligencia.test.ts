/**
 * Tests de helpers de inteligencia SGIE (Sprint 3, tarea 4).
 * Funciones puras — sin DB.
 */
import { describe, it, expect } from 'vitest';
import {
  etiquetarConfianza, traducirEtiquetaConfianza, tonoConfianza,
  estadoCampoExtraido, valorEfectivoCampo, estaBienClasificado,
} from '../lib/sgie/inteligencia';

describe('etiquetarConfianza', () => {
  it('etiqueta rangos correctos', () => {
    expect(etiquetarConfianza(0)).toBe('baja');
    expect(etiquetarConfianza(40)).toBe('baja');
    expect(etiquetarConfianza(41)).toBe('media');
    expect(etiquetarConfianza(70)).toBe('media');
    expect(etiquetarConfianza(71)).toBe('alta');
    expect(etiquetarConfianza(90)).toBe('alta');
    expect(etiquetarConfianza(91)).toBe('muy_alta');
    expect(etiquetarConfianza(100)).toBe('muy_alta');
  });

  it('devuelve null para valores nulos', () => {
    expect(etiquetarConfianza(null)).toBeNull();
    expect(etiquetarConfianza(undefined)).toBeNull();
  });
});

describe('traducirEtiquetaConfianza', () => {
  it('traduce etiquetas', () => {
    expect(traducirEtiquetaConfianza('baja')).toBe('Baja');
    expect(traducirEtiquetaConfianza('muy_alta')).toBe('Muy alta');
  });
  it('devuelve guion para nulo', () => {
    expect(traducirEtiquetaConfianza(null)).toBe('—');
    expect(traducirEtiquetaConfianza(undefined)).toBe('—');
  });
});

describe('tonoConfianza', () => {
  it('asigna tonos con tokens', () => {
    expect(tonoConfianza('muy_alta')).toContain('text-success');
    expect(tonoConfianza('baja')).toContain('text-danger');
    expect(tonoConfianza('media')).toContain('text-warning');
    expect(tonoConfianza(null)).toContain('text-text-secondary');
  });
});

describe('estadoCampoExtraido', () => {
  it('prioridad: corregido > confirmado > pendiente', () => {
    expect(estadoCampoExtraido({ corregidoPor: 'u1', confirmadoPor: 'u2' })).toBe('corregido');
    expect(estadoCampoExtraido({ confirmadoPor: 'u2' })).toBe('confirmado');
    expect(estadoCampoExtraido({})).toBe('pendiente');
  });
});

describe('valorEfectivoCampo', () => {
  it('usa corregidoValor si existe', () => {
    expect(valorEfectivoCampo({ valor: 'original', corregidoValor: 'corregido' })).toBe('corregido');
    expect(valorEfectivoCampo({ valor: 'original' })).toBe('original');
    expect(valorEfectivoCampo({})).toBeNull();
  });
});

describe('estaBienClasificado', () => {
  it('umbral >= 71', () => {
    expect(estaBienClasificado(90)).toBe(true);
    expect(estaBienClasificado(71)).toBe(true);
    expect(estaBienClasificado(70)).toBe(false);
    expect(estaBienClasificado(null)).toBe(false);
  });
});
