/**
 * Tests de tiempo medio por estado (Sprint 5, tarea 4).
 * Funciones puras — sin DB.
 */
import { describe, it, expect } from 'vitest';
import {
  reconstruirIntervalos, calcularTiempoMedioPorEstado, identificarCuellosBotella, formatDuracion,
  type EventoHistorial,
} from '../lib/sgie/tiempo-por-estado';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

describe('reconstruirIntervalos', () => {
  it('devuelve vacío sin eventos', () => {
    expect(reconstruirIntervalos([], new Date())).toEqual([]);
  });

  it('crea intervalo desde el primer evento hasta ahora si es el único', () => {
    const ahora = new Date('2026-06-28T12:00:00Z');
    const ev: EventoHistorial = { estadoAnterior: null, estadoNuevo: 'creado', creadoEn: '2026-06-28T10:00:00Z' };
    const iv = reconstruirIntervalos([ev], ahora);
    expect(iv).toHaveLength(1);
    expect(iv[0].estado).toBe('creado');
    expect(iv[0].duracionMs).toBe(2 * HORA);
  });

  it('divide intervalos correctamente entre eventos consecutivos', () => {
    const ahora = new Date('2026-06-28T15:00:00Z');
    const eventos: EventoHistorial[] = [
      { estadoAnterior: null, estadoNuevo: 'creado', creadoEn: '2026-06-28T10:00:00Z' },
      { estadoAnterior: 'creado', estadoNuevo: 'en_tramite', creadoEn: '2026-06-28T12:00:00Z' },
    ];
    const iv = reconstruirIntervalos(eventos, ahora);
    expect(iv).toHaveLength(2);
    expect(iv[0]).toMatchObject({ estado: 'creado', duracionMs: 2 * HORA });
    expect(iv[1]).toMatchObject({ estado: 'en_tramite', duracionMs: 3 * HORA });
  });

  it('ordena eventos desordenados cronológicamente', () => {
    const ahora = new Date('2026-06-28T15:00:00Z');
    const eventos: EventoHistorial[] = [
      { estadoAnterior: 'creado', estadoNuevo: 'en_tramite', creadoEn: '2026-06-28T12:00:00Z' },
      { estadoAnterior: null, estadoNuevo: 'creado', creadoEn: '2026-06-28T10:00:00Z' },
    ];
    const iv = reconstruirIntervalos(eventos, ahora);
    expect(iv[0].estado).toBe('creado');
    expect(iv[1].estado).toBe('en_tramite');
  });

  it('ignora intervalos negativos (reloj corrupto)', () => {
    const eventos: EventoHistorial[] = [
      { estadoAnterior: null, estadoNuevo: 'creado', creadoEn: '2026-06-28T12:00:00Z' },
      { estadoAnterior: 'creado', estadoNuevo: 'en_tramite', creadoEn: '2026-06-28T10:00:00Z' }, // anterior
    ];
    const iv = reconstruirIntervalos(eventos, new Date('2026-06-28T15:00:00Z'));
    // Tras ordenar, 'creado' va de 10:00 a 12:00 (2h), 'en_tramite' de 12:00 a 15:00 (3h).
    // El intervalo negativo no aparece porque el orden corrige.
    expect(iv.every((x) => x.duracionMs >= 0)).toBe(true);
  });
});

describe('calcularTiempoMedioPorEstado', () => {
  it('agrega y promedia por estado', () => {
    const iv = reconstruirIntervalos([
      // Expediente 1: creado 2h, en_tramite 1h
      { estadoAnterior: null, estadoNuevo: 'creado', creadoEn: '2026-06-28T10:00:00Z' },
      { estadoAnterior: 'creado', estadoNuevo: 'en_tramite', creadoEn: '2026-06-28T12:00:00Z' },
    ], new Date('2026-06-28T13:00:00Z'));
    const stats = calcularTiempoMedioPorEstado(iv);
    expect(stats).toHaveLength(2);
    const creado = stats.find((s) => s.estado === 'creado');
    expect(creado?.mediaMs).toBe(2 * HORA);
    expect(creado?.muestras).toBe(1);
  });

  it('ordena por duración media descendente', () => {
    const iv = reconstruirIntervalos([
      { estadoAnterior: null, estadoNuevo: 'en_tramite', creadoEn: '2026-06-28T10:00:00Z' },
      { estadoAnterior: 'en_tramite', estadoNuevo: 'validado', creadoEn: '2026-06-28T11:00:00Z' },
    ], new Date('2026-06-28T15:00:00Z'));
    const stats = calcularTiempoMedioPorEstado(iv);
    // en_tramite: 1h, validado: 4h → validado primero
    expect(stats[0].estado).toBe('validado');
  });
});

describe('identificarCuellosBotella', () => {
  it('filtra estados por encima del umbral en días', () => {
    const stats = [
      { estado: 'validado', mediaMs: 8 * DIA, mediaHoras: 192, mediaDias: 8, muestras: 1 },
      { estado: 'creado', mediaMs: 1 * HORA, mediaHoras: 1, mediaDias: 0.04, muestras: 1 },
    ];
    const cb = identificarCuellosBotella(stats, 7);
    expect(cb).toHaveLength(1);
    expect(cb[0].estado).toBe('validado');
  });

  it('devuelve vacío sin estadísticas', () => {
    expect(identificarCuellosBotella([], 7)).toEqual([]);
  });
});

describe('formatDuracion', () => {
  it('formatea días', () => {
    expect(formatDuracion(3.5 * DIA)).toBe('3.5 días');
  });
  it('formatea horas', () => {
    expect(formatDuracion(12 * HORA)).toBe('12 h');
  });
  it('formatea minutos', () => {
    expect(formatDuracion(45 * 60 * 1000)).toBe('45 min');
  });
  it('devuelve guion para no positivo', () => {
    expect(formatDuracion(0)).toBe('—');
    expect(formatDuracion(-1)).toBe('—');
  });
});
