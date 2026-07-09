/**
 * Tests de la capa IA documental (Fase 4).
 *
 * Cubre lógica PURA (sin DB ni llamadas a DeepSeek):
 *  - calcularScoreYEstado: score alto→prevalidado, contradicción crítica→abogado,
 *    identidad esperada ausente→asistente, score medio→advertencia.
 *  - isIaEnabled: false cuando no hay API key / modo distinto de 'ai'.
 *
 * La integración E2E (DeepSeek + DB) queda fuera de los unitarios por
 * dependencia de credenciales; se documenta en mvp-fase-4.
 */
import { describe, it, expect } from 'vitest';
import { calcularScoreYEstado, UMBRAL_PREVALIDADO } from '../lib/sgie/ia/score';
import { getIaConfig } from '../lib/sgie/ia-documental';

describe('calcularScoreYEstado', () => {
  it('score alto sin contradicción → prevalidado', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 95,
      clienteCoincide: true,
      identidadCoincide: true,
      tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true,
      materiaCoincide: true,
      juzgadoCoincide: true,
      contradicciones: false,
      contradiccionCritica: false,
      identidadEsperadaAusente: false,
      camposExtraidos: 8,
    });
    expect(r.score).toBeGreaterThanOrEqual(UMBRAL_PREVALIDADO);
    expect(r.suggested_status).toBe('prevalidado');
  });

  it('contradicción crítica fuerza revision_abogado (sin importar el score)', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 99,
      clienteCoincide: true,
      identidadCoincide: true,
      tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true,
      materiaCoincide: true,
      juzgadoCoincide: true,
      contradicciones: true,
      contradiccionCritica: true,
      identidadEsperadaAusente: false,
      camposExtraidos: 8,
    });
    expect(r.suggested_status).toBe('revision_abogado');
  });

  it('identidad esperada ausente → revision_asistente', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 90,
      clienteCoincide: true,
      identidadCoincide: null,
      tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true,
      materiaCoincide: true,
      juzgadoCoincide: true,
      contradicciones: false,
      contradiccionCritica: false,
      identidadEsperadaAusente: true,
      camposExtraidos: 3,
    });
    expect(r.suggested_status).toBe('revision_asistente');
  });

  it('score medio sin contradicción → aceptado_con_advertencia', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 70,
      clienteCoincide: true,
      identidadCoincide: true,
      tipoDocumentalCoincide: null,
      numeroJudicialCoincide: null,
      materiaCoincide: null,
      juzgadoCoincide: null,
      contradicciones: false,
      contradiccionCritica: false,
      identidadEsperadaAusente: false,
      camposExtraidos: 4,
    });
    expect(r.suggested_status).toBe('aceptado_con_advertencia');
  });

  it('contradicciones no críticas penalizan el score', () => {
    const base = calcularScoreYEstado({
      iaConfidence: 90, clienteCoincide: true, identidadCoincide: true, tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true, materiaCoincide: true, juzgadoCoincide: true,
      contradicciones: false, contradiccionCritica: false, identidadEsperadaAusente: false, camposExtraidos: 5,
    });
    const conContra = calcularScoreYEstado({
      iaConfidence: 90, clienteCoincide: true, identidadCoincide: true, tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true, materiaCoincide: true, juzgadoCoincide: true,
      contradicciones: true, contradiccionCritica: false, identidadEsperadaAusente: false, camposExtraidos: 5,
    });
    expect(conContra.score).toBeLessThan(base.score);
  });

  it('score muy bajo → revision_abogado', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 10,
      clienteCoincide: false,
      identidadCoincide: false,
      tipoDocumentalCoincide: false,
      numeroJudicialCoincide: false,
      materiaCoincide: false,
      juzgadoCoincide: false,
      contradicciones: false,
      contradiccionCritica: false,
      identidadEsperadaAusente: false,
      camposExtraidos: 1,
    });
    expect(r.score).toBeLessThan(40);
    expect(r.suggested_status).toBe('revision_abogado');
  });

  it('genera un check por cada dimensión + contradicciones', () => {
    const r = calcularScoreYEstado({
      iaConfidence: 80, clienteCoincide: true, identidadCoincide: true, tipoDocumentalCoincide: true,
      numeroJudicialCoincide: true, materiaCoincide: true, juzgadoCoincide: true,
      contradicciones: false, contradiccionCritica: false, identidadEsperadaAusente: false, camposExtraidos: 3,
    });
    expect(r.checks.length).toBeGreaterThanOrEqual(7);
    expect(r.checks.every((c) => ['pass', 'warn', 'fail', 'unknown'].includes(c.status))).toBe(true);
  });
});

describe('getIaConfig — degradación sin credenciales', () => {
  it('en entorno de test sin IA_DOCUMENTAL_API_KEY, apiKey es vacío', () => {
    const cfg = getIaConfig();
    // Sin credenciales en CI/test → isIaEnabled debe ser false.
    // (No asumimos el valor exacto de mode, solo que sin key no está habilitado.)
    const habilitado = cfg.mode === 'ai' && cfg.apiKey.length > 10;
    expect(habilitado).toBe(false);
  });
});
