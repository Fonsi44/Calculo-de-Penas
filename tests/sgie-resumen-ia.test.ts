/**
 * Tests de helpers de resumen IA (Sprint 4, tarea 1).
 * Funciones puras — sin DB, sin IA.
 */
import { describe, it, expect } from 'vitest';
import { serializarDatosParaResumen, calcularHashEntrada, buildSystemPromptResumen } from '../lib/sgie/resumen-ia';

const datosBase = {
  numeroInterno: 'EXP-2026-001',
  estado: 'pendiente_validacion_abogado',
  clienteNombre: 'María Pérez',
  procedimientoNombre: 'Divorcio voluntario',
  resumen: 'Solicitud de divorcio por mutuo consentimiento.',
  documentos: [{ nombre: 'acta.pdf', tipo: 'acta_nacimiento', confianza: 92 }],
  campos: [{ clave: 'cliente_nombre', valor: 'María Pérez', confianza: 95 }],
  alertasActivas: 1,
  inconsistencias: [],
};

describe('serializarDatosParaResumen', () => {
  it('incluye campos clave del expediente', () => {
    const s = serializarDatosParaResumen(datosBase);
    expect(s).toContain('EXP-2026-001');
    expect(s).toContain('María Pérez');
    expect(s).toContain('Divorcio voluntario');
    expect(s).toContain('pendiente_validacion_abogado');
  });

  it('incluye documentos y campos', () => {
    const s = serializarDatosParaResumen(datosBase);
    expect(s).toContain('acta.pdf');
    expect(s).toContain('cliente_nombre');
    expect(s).toContain('95');
  });

  it('incluye alertas e inconsistencias', () => {
    const datos = { ...datosBase, inconsistencias: [{ clave: 'cliente_rtn', valores: ['A', 'B'] }] };
    const s = serializarDatosParaResumen(datos);
    expect(s).toContain('Alertas activas: 1');
    expect(s).toContain('cliente_rtn');
    expect(s).toContain('A vs B');
  });

  it('omite campos nulos sin romper', () => {
    const s = serializarDatosParaResumen({ ...datosBase, clienteNombre: null, procedimientoNombre: null, resumen: null });
    expect(s).not.toContain('Cliente:');
    expect(s).not.toContain('Procedimiento:');
  });
});

describe('calcularHashEntrada', () => {
  it('es determinista para los mismos datos', () => {
    const h1 = calcularHashEntrada(datosBase);
    const h2 = calcularHashEntrada(datosBase);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // sha256 hex
  });

  it('cambia si cambian los datos fuente', () => {
    const h1 = calcularHashEntrada(datosBase);
    const h2 = calcularHashEntrada({ ...datosBase, estado: 'validado' });
    expect(h1).not.toBe(h2);
  });
});

describe('buildSystemPromptResumen', () => {
  it('contiene reglas restrictivas (R17)', () => {
    const p = buildSystemPromptResumen();
    expect(p).toContain('NO inventes');
    expect(p).toContain('NO cites artículos');
    expect(p).toContain('NO apruebes');
    expect(p).toContain('EXCLUSIVAMENTE');
  });

  it('limita longitud y exige español', () => {
    const p = buildSystemPromptResumen();
    expect(p).toContain('250 palabras');
    expect(p.toLowerCase()).toContain('español');
  });
});
