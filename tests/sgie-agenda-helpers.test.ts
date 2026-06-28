/**
 * Tests de helpers de agenda SGIE (Sprint 3, tarea 1).
 * Funciones puras — sin DB.
 */
import { describe, it, expect } from 'vitest';
import {
  estadoTrasAccion, accionAuditoriaEvento, accionRequiereConfirmacion, etiquetaAccion,
} from '../lib/sgie/agenda-helpers';

describe('estadoTrasAccion', () => {
  it('confirmar → confirmada', () => {
    expect(estadoTrasAccion('confirmar', 'propuesta')).toBe('confirmada');
    expect(estadoTrasAccion('confirmar', 'confirmada')).toBe('confirmada');
  });

  it('cancelar → descartada', () => {
    expect(estadoTrasAccion('cancelar', 'propuesta')).toBe('descartada');
    expect(estadoTrasAccion('cancelar', 'confirmada')).toBe('descartada');
  });

  it('completar → completada', () => {
    expect(estadoTrasAccion('completar', 'confirmada')).toBe('completada');
  });

  it('reprogramar/editar mantienen el estado actual', () => {
    expect(estadoTrasAccion('reprogramar', 'confirmada')).toBe('confirmada');
    expect(estadoTrasAccion('reprogramar', 'propuesta')).toBe('propuesta');
    expect(estadoTrasAccion('editar', 'confirmada')).toBe('confirmada');
  });
});

describe('accionAuditoriaEvento', () => {
  it('mapea a evento_updated (no hay eventos dedicados en el enum)', () => {
    expect(accionAuditoriaEvento('confirmar')).toBe('evento_updated');
    expect(accionAuditoriaEvento('cancelar')).toBe('evento_updated');
    expect(accionAuditoriaEvento('reprogramar')).toBe('evento_updated');
  });
});

describe('accionRequiereConfirmacion', () => {
  it('cancelar y reprogramar requieren confirmación', () => {
    expect(accionRequiereConfirmacion('cancelar')).toBe(true);
    expect(accionRequiereConfirmacion('reprogramar')).toBe(true);
    expect(accionRequiereConfirmacion('confirmar')).toBe(false);
    expect(accionRequiereConfirmacion('editar')).toBe(false);
  });
});

describe('etiquetaAccion', () => {
  it('devuelve etiqueta legible', () => {
    expect(etiquetaAccion('confirmar')).toBe('Evento confirmado');
    expect(etiquetaAccion('cancelar')).toBe('Evento cancelado');
    expect(etiquetaAccion('reprogramar')).toBe('Evento reprogramado');
  });
});
