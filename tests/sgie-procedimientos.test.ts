/**
 * Tests de extracción de requisitos desde la definición de procedimiento SGIE.
 *
 * Cubre la función pura `extraerRequisitosDeDefinicion` (sin DB).
 * Sprint 0 — instanciación de checklist desde el procedimiento elegido.
 *
 * Referencia: lib/sgie/procedimientos-db.ts · seed-sgie-procedimientos.ts
 */
import { describe, it, expect } from 'vitest';
import { extraerRequisitosDeDefinicion } from '../lib/sgie/procedimientos-db';

describe('extraerRequisitosDeDefinicion', () => {
  it('devuelve array vacío para definición nula o no-objeto', () => {
    expect(extraerRequisitosDeDefinicion(null)).toEqual([]);
    expect(extraerRequisitosDeDefinicion(undefined)).toEqual([]);
    expect(extraerRequisitosDeDefinicion('no-objeto')).toEqual([]);
    expect(extraerRequisitosDeDefinicion(42)).toEqual([]);
  });

  it('devuelve array vacío si la definición no tiene arrays de documentos', () => {
    expect(extraerRequisitosDeDefinicion({ origen: 'seed' })).toEqual([]);
    expect(extraerRequisitosDeDefinicion({ documentosRequeridos: [] })).toEqual([]);
  });

  it('extrae documentos requeridos como obligatorios', () => {
    const def = { documentosRequeridos: ['Identidad del cliente', 'RTN'] };
    const out = extraerRequisitosDeDefinicion(def);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ nombre: 'Identidad del cliente', tipo: 'obligatorio', orden: 0 });
    expect(out[1]).toEqual({ nombre: 'RTN', tipo: 'obligatorio', orden: 1 });
  });

  it('extrae los tres bloques respetando tipos y orden', () => {
    const def = {
      documentosRequeridos: ['Doc obligatorio'],
      documentosOpcionales: ['Doc opcional'],
      documentosCondicionales: ['Doc condicional'],
    };
    const out = extraerRequisitosDeDefinicion(def);
    expect(out).toHaveLength(3);
    expect(out.map((r) => r.tipo)).toEqual(['obligatorio', 'opcional', 'condicional']);
    expect(out.map((r) => r.orden)).toEqual([0, 1, 2]);
  });

  it('ordena obligatorios antes que opcionales antes que condicionales', () => {
    const def = {
      documentosCondicionales: ['C1'],
      documentosRequeridos: ['O1', 'O2'],
      documentosOpcionales: ['P1'],
    };
    const out = extraerRequisitosDeDefinicion(def);
    expect(out.map((r) => r.nombre)).toEqual(['O1', 'O2', 'P1', 'C1']);
  });

  it('descarta entradas no-string y strings vacías', () => {
    const def = {
      documentosRequeridos: ['Válido', '', '   ', 123, null, undefined],
    };
    const out = extraerRequisitosDeDefinicion(def);
    expect(out).toHaveLength(1);
    expect(out[0].nombre).toBe('Válido');
  });

  it('hace trim de los nombres', () => {
    const def = { documentosRequeridos: ['  Con espacios  '] };
    const out = extraerRequisitosDeDefinicion(def);
    expect(out[0].nombre).toBe('Con espacios');
  });

  it('ignora claves no-array silenciosamente (no lanza)', () => {
    const def = {
      documentosRequeridos: 'esto es un string, no un array',
      documentosOpcionales: { no: 'array' },
    };
    expect(extraerRequisitosDeDefinicion(def)).toEqual([]);
  });

  it('no inventa requisitos: definición vacía del seed → sin requisitos', () => {
    // Simula la estructura del seed actual (seed-sgie-procedimientos.ts).
    const seedDef = {
      origen: 'seed-catalogo-areas-juridicas',
      documentosRequeridos: [] as string[],
      documentosOpcionales: [] as string[],
      documentosCondicionales: [] as string[],
      camposEsperados: ['cliente_nombre'],
      notaLegal: 'Pendiente de validación legal.',
    };
    expect(extraerRequisitosDeDefinicion(seedDef)).toEqual([]);
  });
});
