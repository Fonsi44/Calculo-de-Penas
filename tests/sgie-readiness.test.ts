/**
 * Tests de la puerta "Listo para revisión" (Fase 5 auditada).
 *
 * Cubre la lógica conceptual de readiness (sin DB):
 *  - Determinación de estado_final según checks.
 *  - unknown en check blocking bloquea listo_para_revision.
 *  - IA no configurada → checks IA quedan unknown blocking → bloquea.
 *  - OCR pendiente en check blocking → bloquea.
 *  - Todos pass → listo_para_revision.
 *
 * Tras la auditoría de la Fase 5, se corrigió:
 *  1. sin_contradicciones_criticas ahora es unknown (no pass) si IA no ha corrido.
 *  2. calcularEstadoFinal ahora trata unknown blocking como bloqueante.
 */
import { describe, it, expect } from 'vitest';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';
type Check = { name: string; status: CheckStatus; blocking: boolean };

/**
 * Lógica simplificada de estado_final a partir de checks (pura, sin DB).
 * Replica fielmente el algoritmo de `evaluarPreparacionExpediente`.
 */
function calcularEstadoFinal(checks: Check[]): string {
  const bloqueado = checks.some((c) => c.name === 'expediente_no_bloqueado' && c.status === 'fail');
  if (bloqueado) return 'bloqueado_por_cliente';

  const failsBlocking = checks.filter((c) => c.blocking && c.status === 'fail');
  if (failsBlocking.length > 0) {
    return failsBlocking.some((c) => c.name === 'sin_contradicciones_criticas' || c.name === 'documentos_obligatorios_recibidos')
      ? 'requiere_accion_abogado' : 'no_preparado';
  }

  const unknownBlocking = checks.filter((c) => c.blocking && c.status === 'unknown');
  if (unknownBlocking.length > 0) return 'requiere_accion_abogado';

  const warnsBlocking = checks.filter((c) => c.blocking && c.status === 'warn');
  if (warnsBlocking.length > 0) return 'preparado_con_advertencias';

  const passCount = checks.filter((c) => c.status === 'pass').length;
  return passCount >= 6 ? 'listo_para_revision' : 'preparado_con_advertencias';
}

// Checks base (todos pass).
const allPass: Check[] = [
  { name: 'cliente_verificado', status: 'pass', blocking: true },
  { name: 'checklist_obligatorio_completo', status: 'pass', blocking: true },
  { name: 'documentos_obligatorios_recibidos', status: 'pass', blocking: true },
  { name: 'sin_contradicciones_criticas', status: 'pass', blocking: true },
  { name: 'expediente_no_bloqueado', status: 'pass', blocking: true },
  { name: 'sin_documentos_ocr_ilegible', status: 'pass', blocking: false },
  { name: 'resumen_disponible', status: 'pass', blocking: false },
  { name: 'auditoria_completa', status: 'pass', blocking: false },
];

describe('calcularEstadoFinal — todos pass', () => {
  it('todos los checks pass → listo_para_revision', () => {
    expect(calcularEstadoFinal(allPass)).toBe('listo_para_revision');
  });
});

describe('calcularEstadoFinal — fail blocking', () => {
  it('cliente no verificado → no_preparado', () => {
    const c = [...allPass]; c[0] = { ...c[0], status: 'fail' };
    expect(calcularEstadoFinal(c)).toBe('no_preparado');
  });

  it('expediente bloqueado → bloqueado_por_cliente', () => {
    const c = [...allPass]; c[4] = { ...c[4], status: 'fail' };
    expect(calcularEstadoFinal(c)).toBe('bloqueado_por_cliente');
  });

  it('contradicción crítica → requiere_accion_abogado', () => {
    const c = [...allPass]; c[3] = { ...c[3], status: 'fail' };
    expect(calcularEstadoFinal(c)).toBe('requiere_accion_abogado');
  });

  it('documentos obligatorios faltantes → requiere_accion_abogado', () => {
    const c = [...allPass]; c[2] = { ...c[2], status: 'fail' };
    expect(calcularEstadoFinal(c)).toBe('requiere_accion_abogado');
  });
});

describe('calcularEstadoFinal — ☠ unknown blocking (corregido en auditoría)', () => {
  it('unknown en check blocking bloquea listo_para_revision → requiere_accion_abogado', () => {
    // sin_contradicciones_criticas es unknown cuando IA no ha corrido.
    const c = [...allPass]; c[3] = { ...c[3], status: 'unknown' };
    expect(calcularEstadoFinal(c)).toBe('requiere_accion_abogado');
  });

  it('dos unknown blocking siguen bloqueando → requiere_accion_abogado', () => {
    const c = [...allPass];
    c[3] = { ...c[3], status: 'unknown' }; // sin_contradicciones_criticas
    c[0] = { ...c[0], status: 'unknown' }; // cliente_verificado
    expect(calcularEstadoFinal(c)).toBe('requiere_accion_abogado');
  });

  it('unknown no-blocking NO bloquea → listo_para_revision', () => {
    // resumen_disponible es no-blocking; unknown aquí no debería bloquear.
    const c = [...allPass]; c[6] = { ...c[6], status: 'unknown' };
    expect(calcularEstadoFinal(c)).toBe('listo_para_revision');
  });

  it('IA no configurada: sin_contradicciones_criticas unknown → bloquea', () => {
    // Escenario real: IA no configurada → sin_contradicciones unknown (blocking).
    const c = [...allPass]; c[3] = { ...c[3], status: 'unknown' };
    expect(calcularEstadoFinal(c)).not.toBe('listo_para_revision');
  });
});

describe('calcularEstadoFinal — warns', () => {
  it('solo warns blocking → preparado_con_advertencias', () => {
    const c = [...allPass]; c[0] = { ...c[0], status: 'warn' }; c[1] = { ...c[1], status: 'warn' };
    expect(calcularEstadoFinal(c)).toBe('preparado_con_advertencias');
  });

  it('warn no blocking no bloquea → listo_para_revision', () => {
    const c = [...allPass]; c[5] = { ...c[5], status: 'warn' };
    expect(calcularEstadoFinal(c)).toBe('listo_para_revision');
  });
});

describe('calcularEstadoFinal — fail no blocking', () => {
  it('fail no blocking no bloquea → listo_para_revision (si el resto pasa)', () => {
    const c = [...allPass]; c[7] = { ...c[7], status: 'fail' };
    expect(calcularEstadoFinal(c)).toBe('listo_para_revision');
  });
});
