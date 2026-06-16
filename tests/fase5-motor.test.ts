import { describe, it, expect } from 'vitest';
import {
  calcular_pena,
  calcular_pena_individual,
  aplicarAgravantesEspecificas,
  parsearFraccion,
  type DelitoBase,
  type DelitoConfig,
  type CalculoRequest,
  type SupuestoPenalMotor,
  type AgravanteEspecificaMotor,
  type ContextoCalculo,
} from '../lib/calculo';

// --- Fixtures ---------------------------------------------------------------

const delitoBase: DelitoBase = {
  id: 'test-1',
  nombre: 'Hurto simple',
  articulo: 'Art. 213 CP',
  clasificacion: 'Patrimonio',
  penas_accesorias: [],
  pena_minima_meses: 6,
  pena_maxima_meses: 24,
  tiene_pena_alternativa: false,
  pena_alternativa_min: 0,
  pena_alternativa_max: 0,
};

// Delito con supuesto penal (modalidad específica) — Art. 363 Violación.
const delitoViolacion: DelitoBase = {
  id: 'test-viol',
  nombre: 'Violación',
  articulo: 'Art. 363 CP',
  clasificacion: 'Libertad sexual',
  penas_accesorias: ['Inhabilitación absoluta'],
  pena_minima_meses: 72,
  pena_maxima_meses: 240,
  tiene_pena_alternativa: false,
  pena_alternativa_min: 0,
  pena_alternativa_max: 0,
};

// Supuesto penal: modalidad "Violación de menor" (pena más grave).
const supuestoMenor: SupuestoPenalMotor = {
  id: 'sup-menor',
  delito_id: 'test-viol',
  numeral: '1',
  texto_modalidad: 'Violación de menor de catorce años',
  pena_min_meses: 180,
  pena_max_meses: 240,
  tipo_pena: 'prision',
  tiene_agravantes_especificas: true,
};

// Agravante específica: víctima menor (aumenta 1/3).
const agravanteMenor: AgravanteEspecificaMotor = {
  id: 'agr-menor',
  articulo_cp: '363',
  numeral: '1',
  texto_agravante: 'Cuando la víctima sea menor de catorce años',
  fraccion_aumento: '1/3',
  obligatoria: true,
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
    supuesto_penal_id: null,
    agravantes_especificas_ids: [],
    ...overrides,
  };
}

// === parsearFraccion =======================================================

describe('parsearFraccion', () => {
  it('parsea "1/3" correctamente', () => {
    expect(parsearFraccion('1/3')).toBeCloseTo(1 / 3, 5);
  });

  it('parsea "1/4" correctamente', () => {
    expect(parsearFraccion('1/4')).toBeCloseTo(0.25, 5);
  });

  it('parsea "1/2" correctamente', () => {
    expect(parsearFraccion('1/2')).toBe(0.5);
  });

  it('acepta espacios: "1 / 3"', () => {
    expect(parsearFraccion('1 / 3')).toBeCloseTo(1 / 3, 5);
  });

  it('devuelve 0 para formato inválido', () => {
    expect(parsearFraccion('invalid')).toBe(0);
    expect(parsearFraccion('')).toBe(0);
    expect(parsearFraccion('1/0')).toBe(0); // división por cero
  });
});

// === aplicarAgravantesEspecificas ===========================================

describe('aplicarAgravantesEspecificas', () => {
  const agravantesMap = new Map<string, AgravanteEspecificaMotor>([
    [agravanteMenor.id, agravanteMenor],
  ]);

  it('sin agravantes: no modifica la pena', () => {
    const mods: string[] = [];
    const r = aplicarAgravantesEspecificas(72, 240, makeConfig(), agravantesMap, mods);
    expect(r.pena_min).toBe(72);
    expect(r.pena_max).toBe(240);
    expect(r.agravantes_aplicadas).toHaveLength(0);
    expect(mods).toHaveLength(0);
  });

  it('una agravante de 1/3: amplía el máximo en 1/3', () => {
    const mods: string[] = [];
    const config = makeConfig({ agravantes_especificas_ids: [agravanteMenor.id] });
    const r = aplicarAgravantesEspecificas(72, 240, config, agravantesMap, mods);
    // aumentar_en_fraccion(72, 240, 1/3) => [240, 320]
    expect(r.pena_min).toBe(240);
    expect(r.pena_max).toBe(320);
    expect(r.agravantes_aplicadas).toHaveLength(1);
    expect(mods[0]).toContain('1/3');
    expect(mods[0]).toContain('menor de catorce');
  });

  it('filtrando IDs inexistentes en el mapa', () => {
    const mods: string[] = [];
    const config = makeConfig({ agravantes_especificas_ids: ['no-existe'] });
    const r = aplicarAgravantesEspecificas(72, 240, config, agravantesMap, mods);
    expect(r.pena_min).toBe(72);
    expect(r.pena_max).toBe(240);
    expect(r.agravantes_aplicadas).toHaveLength(0);
  });

  it('acumula fracciones de varias agravantes', () => {
    const segunda: AgravanteEspecificaMotor = {
      id: 'agr-2',
      articulo_cp: '363',
      numeral: '2',
      texto_agravante: 'Con arma',
      fraccion_aumento: '1/3',
      obligatoria: true,
    };
    const map = new Map<string, AgravanteEspecificaMotor>([
      [agravanteMenor.id, agravanteMenor],
      [segunda.id, segunda],
    ]);
    const mods: string[] = [];
    const config = makeConfig({ agravantes_especificas_ids: [agravanteMenor.id, segunda.id] });
    const r = aplicarAgravantesEspecificas(72, 240, config, map, mods);
    // fracción total = 2/3 → aumentar_en_fraccion(72, 240, 2/3).
    // floor(240 * (1 + 2/3)) = floor(399.99...) = 399 por coma flotante.
    expect(r.pena_min).toBe(240);
    expect(r.pena_max).toBeGreaterThanOrEqual(399);
    expect(r.pena_max).toBeLessThanOrEqual(400);
    expect(r.agravantes_aplicadas).toHaveLength(2);
    expect(mods[0]).toContain('67%');
  });
});

// === Supuestos penales (pena base desde modalidad) ==========================

describe('calcular_pena_individual con supuesto penal', () => {
  const contexto: ContextoCalculo = {
    supuestos_penales: new Map([[supuestoMenor.id, supuestoMenor]]),
    agravantes_especificas: new Map([[agravanteMenor.id, agravanteMenor]]),
  };

  it('sin supuesto: usa pena base genérica del delito', () => {
    const r = calcular_pena_individual(makeConfig({ delito_id: 'test-viol' }), delitoViolacion);
    expect(r.pena_min).toBe(72);
    expect(r.pena_max).toBe(240);
    expect(r.modificaciones.some(m => m.includes('supuesto penal'))).toBe(false);
  });

  it('con supuesto: usa pena de la modalidad específica', () => {
    const r = calcular_pena_individual(
      makeConfig({ delito_id: 'test-viol', supuesto_penal_id: supuestoMenor.id }),
      delitoViolacion,
      contexto,
    );
    // La modalidad "Violación de menor" tiene pena 180-240, no la genérica 72-240.
    expect(r.pena_base_min).toBe(180);
    expect(r.pena_base_max).toBe(240);
    expect(r.modificaciones.some(m => m.includes('supuesto penal específico'))).toBe(true);
  });

  it('supuesto + agravante específica: pena ampliada', () => {
    const r = calcular_pena_individual(
      makeConfig({
        delito_id: 'test-viol',
        supuesto_penal_id: supuestoMenor.id,
        agravantes_especificas_ids: [agravanteMenor.id],
      }),
      delitoViolacion,
      contexto,
    );
    // Base modalidad: 180-240. Agravante 1/3: aumentar_en_fraccion(180, 240, 1/3) => [240, 320].
    expect(r.pena_max).toBe(320);
    expect(r.modificaciones.some(m => m.includes('agravante'))).toBe(true);
  });
});

// === Compatibilidad hacia atrás ============================================

describe('Compatibilidad hacia atrás (sin contexto Fase 5)', () => {
  it('calcular_pena_individual sin contexto funciona igual que antes', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    // Sin contexto → comportamiento idéntico al motor v1 original.
    expect(r1.pena_min).toBe(6);
    expect(r1.pena_max).toBe(24);
    expect(r1.pena_recomendada).toBe(15);
  });

  it('calcular_pena sin contexto funciona igual que antes', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig()],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-1', delitoBase]]);
    const r = calcular_pena(request, map);
    expect(r.delitos_analizados).toHaveLength(1);
    expect(r.pena_principal).toContain('6 meses');
    expect(r.pena_principal).toContain('2 años');
  });

  it('contexto con mapas vacíos: sin efecto', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig()],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-1', delitoBase]]);
    const contexto: ContextoCalculo = {
      supuestos_penales: new Map(),
      agravantes_especificas: new Map(),
    };
    const r = calcular_pena(request, map, 'v1', contexto);
    expect(r.delitos_analizados[0].pena_individual_min).toBe(6);
    expect(r.delitos_analizados[0].pena_individual_max).toBe(24);
  });
});

// === Integración end-to-end con Fase 5 =====================================

describe('calcular_pena integración con supuesto penal + agravante específica', () => {
  it('delito con modalidad y agravante: resultado enriquecido', () => {
    const contexto: ContextoCalculo = {
      supuestos_penales: new Map([[supuestoMenor.id, supuestoMenor]]),
      agravantes_especificas: new Map([[agravanteMenor.id, agravanteMenor]]),
    };
    const request: CalculoRequest = {
      delitos: [makeConfig({
        delito_id: 'test-viol',
        supuesto_penal_id: supuestoMenor.id,
        agravantes_especificas_ids: [agravanteMenor.id],
      })],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-viol', delitoViolacion]]);
    const r = calcular_pena(request, map, 'v1', contexto);

    expect(r.delitos_analizados).toHaveLength(1);
    const d = r.delitos_analizados[0];
    // La agravante específica debe aparecer en el listado combinado.
    expect(d.agravantes_aplicadas.some(a => a.includes('menor de catorce'))).toBe(true);
    // La pena máxima debe reflejar el aumento por agravante (320 meses).
    expect(d.pena_individual_max).toBe(320);
    // El análisis jurídico debe mencionar la agravante específica.
    expect(r.analisis_juridico).toContain('agravante');
  });

  it('supuesto penal sin agravante: pena de la modalidad sin aumento', () => {
    const contexto: ContextoCalculo = {
      supuestos_penales: new Map([[supuestoMenor.id, supuestoMenor]]),
      agravantes_especificas: new Map(),
    };
    const request: CalculoRequest = {
      delitos: [makeConfig({
        delito_id: 'test-viol',
        supuesto_penal_id: supuestoMenor.id,
      })],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-viol', delitoViolacion]]);
    const r = calcular_pena(request, map, 'v1', contexto);

    const d = r.delitos_analizados[0];
    expect(d.pena_base_min).toBe(180);
    expect(d.pena_base_max).toBe(240);
    expect(d.pena_individual_min).toBe(180);
    expect(d.pena_individual_max).toBe(240);
  });
});
