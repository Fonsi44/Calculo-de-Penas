/**
 * Tests de utilidades puras de búsqueda global SGIE (Sprint 1).
 *
 * Cubre `normalizarTermino` (sin DB). La función `buscar` requiere DB y se
 * valida indirectamente vía lint/build; no se testea aquí para no inventar
 * mocks de Drizzle (regla R3: no mocks como solución final).
 */
import { describe, it, expect } from 'vitest';
import { normalizarTermino } from '../lib/sgie/buscar-db';

describe('normalizarTermino', () => {
  it('devuelve null para término vacío', () => {
    expect(normalizarTermino('')).toBeNull();
    expect(normalizarTermino('   ')).toBeNull();
  });

  it('devuelve null para entradas nulas/undefined', () => {
    expect(normalizarTermino(null)).toBeNull();
    expect(normalizarTermino(undefined)).toBeNull();
  });

  it('devuelve null para término de 1 carácter (mínimo 2)', () => {
    expect(normalizarTermino('a')).toBeNull();
    expect(normalizarTermino('9')).toBeNull();
  });

  it('acepta término de 2 caracteres', () => {
    expect(normalizarTermino('RT')).toBe('RT');
  });

  it('hace trim del término', () => {
    expect(normalizarTermino('  María Pérez  ')).toBe('María Pérez');
  });

  it('preserva caracteres especiales y acentos', () => {
    expect(normalizarTermino('Nacaome-2024')).toBe('Nacaome-2024');
    expect(normalizarTermino('RTN 0801')).toBe('RTN 0801');
  });
});
