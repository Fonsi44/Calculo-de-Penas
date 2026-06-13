import { describe, it, expect } from 'vitest';
import { validarCalculo, validarResultado } from '../lib/calculo-validator';
import type { CalculoRequest, DelitoBase, DelitoConfig } from '../lib/rules/v1';

const delitoBase: DelitoBase = {
  id: 'test-1',
  nombre: 'Hurto simple',
  articulo: 'Art. 363 CP',
  clasificacion: 'Patrimonio',
  penas_accesorias: ['Multa proporcional'],
  pena_minima_meses: 6,
  pena_maxima_meses: 24,
  tiene_pena_alternativa: false,
  pena_alternativa_min: 0,
  pena_alternativa_max: 0,
};

const delitoSinPrision: DelitoBase = {
  id: 'test-0',
  nombre: 'Abandono de animales',
  articulo: 'Art. 342 CP',
  clasificacion: '',
  penas_accesorias: [],
  pena_minima_meses: 0,
  pena_maxima_meses: 0,
  tiene_pena_alternativa: true,
  pena_alternativa_min: 100,
  pena_alternativa_max: 200,
};

const delitoAltaPena: DelitoBase = {
  id: 'test-high',
  nombre: 'Delito grave',
  articulo: 'Art. 999 CP',
  clasificacion: 'Vida',
  penas_accesorias: ['Inhabilitación absoluta'],
  pena_minima_meses: 360,
  pena_maxima_meses: 480,
  tiene_pena_alternativa: false,
  pena_alternativa_min: 0,
  pena_alternativa_max: 0,
};

function makeConfig(overrides: Partial<DelitoConfig> = {}): DelitoConfig {
  return {
    delito_id: 'test-1',
    pena_seleccionada: 'prision',
    variables_activas: [],
    grado_autoria: 'autor_directo',
    grado_ejecucion: 'consumado',
    reduccion_tentativa: 1,
    agravantes: [],
    atenuantes: [],
    eximentes: [],
    eximente_completa: null,
    ...overrides,
  };
}

function makeRequest(configs: DelitoConfig[], tipo: string = 'ninguno'): CalculoRequest {
  return { delitos: configs, tipo_concurso: tipo };
}

describe('validarCalculo', () => {
  it('caso básico válido', () => {
    const r = validarCalculo(makeRequest([makeConfig()]), new Map([['test-1', delitoBase]]));
    expect(r.valido).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it('rechaza sin delitos', () => {
    const r = validarCalculo(makeRequest([]), new Map());
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.campo === 'delitos')).toBe(true);
  });

  it('rechaza delito_id vacío', () => {
    const r = validarCalculo(makeRequest([makeConfig({ delito_id: '' })]), new Map());
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.campo === 'delito[0].delito_id')).toBe(true);
  });

  it('rechaza delito no encontrado en catálogo', () => {
    const r = validarCalculo(makeRequest([makeConfig({ delito_id: 'no-existe' })]), new Map());
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.mensaje.includes('no encontrado'))).toBe(true);
  });

  it('advierte sobre prisión en delito sin pena privativa', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ delito_id: 'test-0', pena_seleccionada: 'prision' })]),
      new Map([['test-0', delitoSinPrision]]),
    );
    expect(r.issues.some(i => i.severidad === 'warning' && i.mensaje.includes('no contempla pena de prisión'))).toBe(true);
  });

  it('advierte sobre multa en delito sin multa', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ delito_id: 'test-1', pena_seleccionada: 'multa' })]),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.issues.some(i => i.severidad === 'warning' && i.mensaje.includes('no contempla multa'))).toBe(true);
  });

  it('rechaza pena mínima > máxima', () => {
    const delitoInvalido: DelitoBase = { ...delitoBase, pena_minima_meses: 50, pena_maxima_meses: 24 };
    const r = validarCalculo(
      makeRequest([makeConfig({ delito_id: 'bad' })]),
      new Map([['bad', delitoInvalido]]),
    );
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.mensaje.includes('no puede ser mayor'))).toBe(true);
  });

  it('rechaza reduccion_tentativa inválida (3)', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ reduccion_tentativa: 3 })]),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(false);
  });

  it('rechaza reduccion_tentativa inválida (0)', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ reduccion_tentativa: 0 })]),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(false);
  });

  it('rechaza grado_autoria no reconocido', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ grado_autoria: 'inventado' })]),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(false);
  });

  it('rechaza grado_ejecucion no reconocido', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ grado_ejecucion: 'frustrado' })]),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(false);
  });

  it('rechaza tipo_concurso no válido', () => {
    const r = validarCalculo(
      makeRequest([makeConfig()], 'imaginario'),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.campo === 'tipo_concurso')).toBe(true);
  });

  it('advierte sobre múltiples delitos sin concurso', () => {
    const r = validarCalculo(
      makeRequest([makeConfig(), makeConfig({ delito_id: 'test-1' })], 'ninguno'),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.issues.some(i => i.severidad === 'warning' && i.campo === 'tipo_concurso')).toBe(true);
  });

  it('rechaza modificaciones en delito sin pena de prisión', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({
        delito_id: 'test-0',
        pena_seleccionada: 'prision',
        grado_autoria: 'complice',
        grado_ejecucion: 'tentativa_acabada',
      })]),
      new Map([['test-0', delitoSinPrision]]),
    );
    expect(r.valido).toBe(false);
    expect(r.issues.some(i => i.severidad === 'error' && i.mensaje.includes('No se pueden aplicar modificaciones'))).toBe(true);
  });

  it('permite concurso real con múltiples delitos', () => {
    const r = validarCalculo(
      makeRequest([makeConfig(), makeConfig({ delito_id: 'test-high' })], 'real'),
      new Map([['test-1', delitoBase], ['test-high', delitoAltaPena]]),
    );
    expect(r.valido).toBe(true);
  });

  it('permite concurso ideal con múltiples delitos', () => {
    const r = validarCalculo(
      makeRequest([makeConfig(), makeConfig({ delito_id: 'test-high' })], 'ideal'),
      new Map([['test-1', delitoBase], ['test-high', delitoAltaPena]]),
    );
    expect(r.valido).toBe(true);
  });

  it('permite delito continuado con múltiples delitos', () => {
    const r = validarCalculo(
      makeRequest([makeConfig(), makeConfig({ delito_id: 'test-1' })], 'continuado'),
      new Map([['test-1', delitoBase]]),
    );
    expect(r.valido).toBe(true);
  });

  it('permite penalty range alto (360-480 meses)', () => {
    const r = validarCalculo(
      makeRequest([makeConfig({ delito_id: 'test-high' })]),
      new Map([['test-high', delitoAltaPena]]),
    );
    expect(r.valido).toBe(true);
  });
});

describe('validarResultado', () => {
  it('resultado válido sin fechas ni abonos', () => {
    const r = validarResultado(6, 24, null, null, 0);
    expect(r).toHaveLength(0);
  });

  it('resultado válido con abono parcial', () => {
    const r = validarResultado(6, 24, null, null, 3);
    expect(r).toHaveLength(0);
  });

  it('advierte si abono supera pena mínima', () => {
    const r = validarResultado(6, 24, null, null, 10);
    expect(r.some(i => i.severidad === 'warning' && i.campo === 'abonoMeses')).toBe(true);
  });

  it('rechaza pena mínima negativa', () => {
    const r = validarResultado(-1, 24, null, null, 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'penaMin')).toBe(true);
  });

  it('rechaza pena máxima negativa', () => {
    const r = validarResultado(6, -1, null, null, 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'penaMax')).toBe(true);
  });

  it('rechaza pena NaN', () => {
    const r = validarResultado(NaN, 24, null, null, 0);
    expect(r.some(i => i.severidad === 'error')).toBe(true);
  });

  it('rechaza abono negativo', () => {
    const r = validarResultado(6, 24, null, null, -5);
    expect(r.some(i => i.severidad === 'error')).toBe(true);
  });

  it('rechaza fecha inicio inválida', () => {
    const r = validarResultado(6, 24, 'esto-no-es-fecha', null, 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'fechaInicio')).toBe(true);
  });

  it('rechaza fecha fin inválida', () => {
    const r = validarResultado(6, 24, null, 'invalid-date', 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'fechaFin')).toBe(true);
  });

  it('rechaza fecha inicio posterior a fecha fin', () => {
    const r = validarResultado(6, 24, '2025-12-31', '2025-01-01', 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'fechas')).toBe(true);
  });

  it('permite fechas válidas y abono válido', () => {
    const r = validarResultado(36, 72, '2025-01-01', '2027-12-31', 6);
    expect(r).toHaveLength(0);
  });

  it('permite pena 0 con resultado exento', () => {
    const r = validarResultado(0, 0, null, null, 0);
    expect(r).toHaveLength(0);
  });

  it('rechaza pena mínima > máxima', () => {
    const r = validarResultado(50, 30, null, null, 0);
    expect(r.some(i => i.severidad === 'error' && i.campo === 'penaMinMax')).toBe(true);
  });
});
