/**
 * Tests de utilidades de calendario SGIE (Sprint 2, tarea 3).
 * Funciones puras — sin DB.
 */
import { describe, it, expect } from 'vitest';
import {
  rejillaMes, rejillaSemana, esMismoDia, enRango, indiceDiaISO,
  formatRangoSemana, DIAS_ES_CORTO, MESES_ES,
} from '../lib/sgie/calendario';

describe('indiceDiaISO', () => {
  it('lunes=0 ... domingo=6', () => {
    // 2026-06-15 es lunes; 2026-06-21 es domingo.
    expect(indiceDiaISO(new Date(2026, 5, 15))).toBe(0); // lun
    expect(indiceDiaISO(new Date(2026, 5, 16))).toBe(1); // mar
    expect(indiceDiaISO(new Date(2026, 5, 21))).toBe(6); // dom
  });
});

describe('esMismoDia', () => {
  it('ignora la hora', () => {
    expect(esMismoDia(new Date(2026, 5, 15, 9, 0), new Date(2026, 5, 15, 23, 59))).toBe(true);
    expect(esMismoDia(new Date(2026, 5, 15), new Date(2026, 5, 16))).toBe(false);
  });
});

describe('enRango', () => {
  const desde = new Date(2026, 5, 10);
  const hasta = new Date(2026, 5, 20);
  it('incluye extremos', () => {
    expect(enRango(new Date(2026, 5, 10), desde, hasta)).toBe(true);
    expect(enRango(new Date(2026, 5, 20), desde, hasta)).toBe(true);
    expect(enRango(new Date(2026, 5, 15), desde, hasta)).toBe(true);
  });
  it('excluye fuera de rango', () => {
    expect(enRango(new Date(2026, 5, 9), desde, hasta)).toBe(false);
    expect(enRango(new Date(2026, 5, 21), desde, hasta)).toBe(false);
  });
});

describe('rejillaMes', () => {
  it('devuelve 42 celdas (6 semanas)', () => {
    expect(rejillaMes(2026, 5)).toHaveLength(42); // junio 2026
  });

  it('empieza en lunes', () => {
    const dias = rejillaMes(2026, 5);
    const primero = dias[0].fecha;
    expect(indiceDiaISO(primero)).toBe(0); // lunes
  });

  it('marca correctamente los días dentro del mes', () => {
    const dias = rejillaMes(2026, 5); // junio
    const enMes = dias.filter((d) => d.enMes);
    // Junio 2026 tiene 30 días.
    expect(enMes).toHaveLength(30);
    for (const d of enMes) {
      expect(d.fecha.getMonth()).toBe(5);
    }
  });
});

describe('rejillaSemana', () => {
  it('devuelve 7 días empezando en lunes', () => {
    // 2026-06-17 es miércoles.
    const dias = rejillaSemana(new Date(2026, 5, 17));
    expect(dias).toHaveLength(7);
    expect(indiceDiaISO(dias[0].fecha)).toBe(0); // lunes
    expect(dias[0].fecha.getDate()).toBe(15); // lun 15
    expect(dias[6].fecha.getDate()).toBe(21); // dom 21
  });
});

describe('formatRangoSemana', () => {
  it('formatea rango dentro del mismo mes', () => {
    const dias = rejillaSemana(new Date(2026, 5, 17)); // 15-21 jun
    expect(formatRangoSemana(dias)).toBe('15 – 21 Jun 2026');
  });

  it('formatea rango que cruza meses', () => {
    // 2026-05-31 es domingo → su semana empieza lun 25 may, termina dom 31 may... pero cruzamos a junio:
    // usemos una semana que cruce: miércoles 2026-06-03 → semana lun 1 jun – dom 7 jun (no cruza).
    // Para cruzar mayo/junio: semana del 2026-05-28 (jue) → lun 25 may – dom 31 may (no cruza).
    // Semana que cruza: 2026-04-01 (mié) → lun 30 mar – dom 5 abr.
    const dias = rejillaSemana(new Date(2026, 3, 1));
    expect(formatRangoSemana(dias)).toBe('30 Mar – 5 Abr 2026');
  });
});

describe('constantes', () => {
  it('tiene 12 meses y 7 días', () => {
    expect(MESES_ES).toHaveLength(12);
    expect(DIAS_ES_CORTO).toHaveLength(7);
  });
});
