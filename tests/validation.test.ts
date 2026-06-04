import { describe, it, expect } from 'vitest';
import { calcularSchema, validate } from '../lib/validation';

describe('validation.ts - calcularSchema', () => {
  const baseDelito = {
    delito_id: 'd1',
    pena_seleccionada: 'prision' as const,
    variables_activas: [],
    grado_autoria: 'autor_directo' as const,
    grado_ejecucion: 'consumado' as const,
    reduccion_tentativa: 1,
    agravantes: [],
    atenuantes: [],
    eximentes: [],
    eximente_completa: null,
  };

  const validRequest = {
    delitos: [baseDelito],
    tipo_concurso: 'ninguno' as const,
  };

  it('acepta un request válido mínimo', () => {
    const r = validate(calcularSchema, validRequest);
    expect(r.success).toBe(true);
  });

  it('rechaza grado_autoria inválido', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, grado_autoria: 'pirata' }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.toLowerCase()).toMatch(/grado_autoria|invalid|pirata/);
    }
  });

  it('rechaza agravante con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, agravantes: ['id_falso_inexistente'] }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza atenuante con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, atenuantes: ['no_existe'] }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza eximente_completa con id inexistente', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, eximente_completa: 'invalida' }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza tipo_concurso inválido', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      tipo_concurso: 'mixto',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza pena_seleccionada distinta del enum', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, pena_seleccionada: 'trabalenguas' }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza reduccion_tentativa fuera de rango', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{ ...baseDelito, reduccion_tentativa: 5 }],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza array de delitos vacío', () => {
    const r = validate(calcularSchema, { ...validRequest, delitos: [] });
    expect(r.success).toBe(false);
  });

  it('acepta todos los IDs válidos de los catálogos', () => {
    const r = validate(calcularSchema, {
      ...validRequest,
      delitos: [{
        ...baseDelito,
        grado_autoria: 'complice',
        grado_ejecucion: 'tentativa_inacabada',
        reduccion_tentativa: 2,
        agravantes: ['alevosia', 'reincidencia'],
        atenuantes: ['arrebato', 'reparacion'],
        eximentes: [],
        eximente_completa: 'legitima_defensa',
      }],
      tipo_concurso: 'real',
    });
    expect(r.success).toBe(true);
  });
});
