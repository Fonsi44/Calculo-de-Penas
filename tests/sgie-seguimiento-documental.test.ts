/**
 * Tests del seguimiento documental (Fase 2).
 *
 * Cubre la lógica PURA (sin DB):
 *  - calcularEstadoDocumental: completos / parciales / pendientes / no_aplica.
 *  - accionSegunDias: qué recordatorio/bloqueo toca según días y enviados.
 *
 * Los flujos con DB (vinculación, bloqueo, desbloqueo, envíos idempotentes)
 * requieren infra de mocks extensa y se dejan como integración; aquí se
 * valida la lógica de decisión que es lo crítico para evitar falsos estados.
 */
import { describe, it, expect } from 'vitest';
import { calcularEstadoDocumental } from '../lib/sgie/seguimiento-documental';
import { accionSegunDias, DIAS_PRIMER_RECUERDO, DIAS_SEGUNDO_RECUERDO, DIAS_BLOQUEO } from '../lib/sgie/config-seguimiento';

describe('calcularEstadoDocumental', () => {
  it('sin obligatorios → pendiente_de_documentos', () => {
    expect(calcularEstadoDocumental([])).toBe('pendiente_de_documentos');
    expect(
      calcularEstadoDocumental([{ tipo: 'opcional', estado: 'solicitado', confirmado: false }]),
    ).toBe('pendiente_de_documentos');
  });

  it('todos los obligatorios satisfechos (subido/aprobado) → documentos_completos', () => {
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'subido', confirmado: false },
        { tipo: 'obligatorio', estado: 'aprobado', confirmado: true },
      ]),
    ).toBe('documentos_completos');
  });

  it('algún obligatorio satisfecho pero no todos → documentos_parcialmente_recibidos', () => {
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'subido', confirmado: false },
        { tipo: 'obligatorio', estado: 'solicitado', confirmado: false },
      ]),
    ).toBe('documentos_parcialmente_recibidos');
  });

  it('ningún obligatorio satisfecho → pendiente_de_documentos', () => {
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'solicitado', confirmado: false },
        { tipo: 'obligatorio', estado: 'solicitado', confirmado: false },
      ]),
    ).toBe('pendiente_de_documentos');
  });

  it('no_aplica (confirmado + aprobado) excluye del cómputo de pendientes', () => {
    // Un obligatorio no_aplica + otro subido → completo.
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'aprobado', confirmado: true, noAplica: true },
        { tipo: 'obligatorio', estado: 'subido', confirmado: false },
      ]),
    ).toBe('documentos_completos');
  });

  it('rechazado NO cuenta como satisfecho', () => {
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'rechazado', confirmado: false },
        { tipo: 'obligatorio', estado: 'subido', confirmado: false },
      ]),
    ).toBe('documentos_parcialmente_recibidos');
  });

  it('mezcla con opcionales/condicionales no afecta al cómputo de obligatorios', () => {
    expect(
      calcularEstadoDocumental([
        { tipo: 'obligatorio', estado: 'subido', confirmado: false },
        { tipo: 'opcional', estado: 'solicitado', confirmado: false },
        { tipo: 'condicional', estado: 'solicitado', confirmado: false },
      ]),
    ).toBe('documentos_completos');
  });
});

describe('accionSegunDias — motor de recordatorios', () => {
  it('días menores al primer umbral → ninguna', () => {
    expect(accionSegunDias(0, 0)).toBe('ninguna');
    expect(accionSegunDias(DIAS_PRIMER_RECUERDO - 1, 0)).toBe('ninguna');
  });

  it('alcanzado el primer umbral y 0 enviados → primer', () => {
    expect(accionSegunDias(DIAS_PRIMER_RECUERDO, 0)).toBe('primer');
    expect(accionSegunDias(DIAS_PRIMER_RECUERDO + 1, 0)).toBe('primer');
  });

  it('alcanzado el segundo umbral y <2 enviados → segundo', () => {
    expect(accionSegunDias(DIAS_SEGUNDO_RECUERDO, 0)).toBe('segundo');
    expect(accionSegunDias(DIAS_SEGUNDO_RECUERDO, 1)).toBe('segundo');
  });

  it('ya hay 2 enviados y no supera bloqueo → aviso_bloqueo', () => {
    expect(accionSegunDias(DIAS_SEGUNDO_RECUERDO, 2)).toBe('aviso_bloqueo');
    expect(accionSegunDias(DIAS_BLOQUEO - 1, 2)).toBe('aviso_bloqueo');
  });

  it('superado el umbral de bloqueo → bloquear', () => {
    expect(accionSegunDias(DIAS_BLOQUEO, 2)).toBe('bloquear');
    expect(accionSegunDias(DIAS_BLOQUEO + 5, 2)).toBe('bloquear');
    expect(accionSegunDias(DIAS_BLOQUEO, 0)).toBe('bloquear');
  });

  it('idempotencia implícita: si ya hay 2 enviados, no vuelve a primer/segundo', () => {
    // Aunque pasen pocos días, con 2 enviados nunca retorna 'primer'.
    expect(accionSegunDias(DIAS_PRIMER_RECUERDO, 2)).not.toBe('primer');
  });
});
