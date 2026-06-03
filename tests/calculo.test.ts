import { describe, it, expect } from 'vitest';
import {
  meses_a_texto,
  aumentar_en_fraccion,
  disminuir_en_fraccion,
  aplicar_mitad_superior,
  aplicar_mitad_inferior,
  calcular_gravedad,
} from '../lib/utils';
import {
  calcular_pena_individual,
  aplicar_concurso,
  calcular_pena,
  type DelitoBase,
  type DelitoConfig,
  type CalculoRequest,
} from '../lib/calculo';

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

const delitoGrave: DelitoBase = {
  id: 'test-2',
  nombre: 'Homicidio simple',
  articulo: 'Art. 112 CP',
  clasificacion: 'Vida',
  penas_accesorias: ['Inhabilitación absoluta'],
  pena_minima_meses: 180,
  pena_maxima_meses: 360,
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

describe('meses_a_texto', () => {
  it('convierte 0 meses', () => expect(meses_a_texto(0)).toBe('0 meses'));
  it('convierte 1 mes', () => expect(meses_a_texto(1)).toBe('1 mes'));
  it('convierte 2 meses', () => expect(meses_a_texto(2)).toBe('2 meses'));
  it('convierte 12 meses', () => expect(meses_a_texto(12)).toBe('1 año'));
  it('convierte 24 meses', () => expect(meses_a_texto(24)).toBe('2 años'));
  it('convierte 18 meses', () => expect(meses_a_texto(18)).toBe('1 año y 6 meses'));
  it('convierte 480 meses como perpetuidad', () => expect(meses_a_texto(480)).toBe('Prisión a perpetuidad'));
});

describe('aumentar_en_fraccion (Art. 69.1 CP)', () => {
  it('aumenta 6-24 en 1/3: límite mín = 24, límite máx = 32', () => {
    const [min, max] = aumentar_en_fraccion(6, 24, 1 / 3);
    expect(min).toBe(24);
    expect(max).toBe(32);
  });

  it('aumenta 180-360 en 1/3: límite mín = 360, límite máx = 480', () => {
    const [min, max] = aumentar_en_fraccion(180, 360, 1 / 3);
    expect(min).toBe(360);
    expect(max).toBe(480);
  });
});

describe('disminuir_en_fraccion (Art. 69.2 CP)', () => {
  it('reduce 6-24 en 1/4 (tentativa acabada): límite mín = 4.5→4, límite máx = 6', () => {
    const [min, max] = disminuir_en_fraccion(6, 24, 1 / 4);
    expect(min).toBe(4);
    expect(max).toBe(6);
  });

  it('reduce 6-24 en 1/3 (tentativa inacabada): límite mín = 4, límite máx = 6', () => {
    const [min, max] = disminuir_en_fraccion(6, 24, 1 / 3);
    expect(min).toBe(4);
    expect(max).toBe(6);
  });

  it('nunca baja de 1 mes', () => {
    const [min, max] = disminuir_en_fraccion(1, 6, 1 / 3);
    expect(min).toBe(1);
    expect(max).toBe(1);
  });
});

describe('mitad superior e inferior', () => {
  it('mitad superior de 6-24 = (15, 24)', () => {
    const [min, max] = aplicar_mitad_superior(6, 24);
    expect(min).toBe(15);
    expect(max).toBe(24);
  });

  it('mitad inferior de 6-24 = (6, 15)', () => {
    const [min, max] = aplicar_mitad_inferior(6, 24);
    expect(min).toBe(6);
    expect(max).toBe(15);
  });
});

describe('calcular_gravedad', () => {
  it('≥360 meses = Muy grave', () => expect(calcular_gravedad(360)).toBe('Muy grave'));
  it('≥120 meses = Grave', () => expect(calcular_gravedad(120)).toBe('Grave'));
  it('≥36 meses = Menos grave', () => expect(calcular_gravedad(36)).toBe('Menos grave'));
  it('<36 meses = Leve', () => expect(calcular_gravedad(6)).toBe('Leve'));
});

describe('calcular_pena_individual — casos base', () => {
  it('delito único sin circunstancias: pena base', () => {
    const r = calcular_pena_individual(makeConfig(), delitoBase);
    expect(r.exento).toBe(false);
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(24);
    expect(r.pena_recomendada).toBe(15);
  });

  it('eximente completa → exento', () => {
    const r = calcular_pena_individual(makeConfig({ eximente_completa: 'legitima_defensa' }), delitoBase);
    expect(r.exento).toBe(true);
    expect(r.pena_min).toBe(0);
    expect(r.gravedad).toBe('Exento');
  });
});

describe('calcular_pena_individual — Art. 61 Cómplice', () => {
  it('cómplice: pena inferior en 1/3', () => {
    const r = calcular_pena_individual(makeConfig({ grado_autoria: 'complice' }), delitoBase);
    expect(r.pena_min).toBe(4);
    expect(r.pena_max).toBe(6);
    expect(r.modificaciones[0]).toContain('1/3');
  });
});

describe('calcular_pena_individual — Art. 62 Tentativa', () => {
  it('tentativa acabada: -1/4', () => {
    const r = calcular_pena_individual(makeConfig({ grado_ejecucion: 'tentativa_acabada' }), delitoBase);
    expect(r.pena_min).toBe(4);
    expect(r.pena_max).toBe(6);
    expect(r.modificaciones[0]).toContain('1/4');
  });

  it('tentativa inacabada: -1/3', () => {
    const r = calcular_pena_individual(makeConfig({ grado_ejecucion: 'tentativa_inacabada' }), delitoBase);
    expect(r.pena_min).toBe(4);
    expect(r.pena_max).toBe(6);
    expect(r.modificaciones[0]).toContain('1/3');
  });

  it('tentativa acabada + reduccion_tentativa=2: -1/4 y luego mitad inferior', () => {
    const r = calcular_pena_individual(
      makeConfig({ grado_ejecucion: 'tentativa_acabada', reduccion_tentativa: 2 }),
      delitoBase,
    );
    expect(r.pena_max).toBeLessThanOrEqual(6);
    expect(r.modificaciones.some(m => m.includes('2 grados'))).toBe(true);
  });

  it('reduccion_tentativa=2 sin tentativa: no aplica', () => {
    const r = calcular_pena_individual(
      makeConfig({ reduccion_tentativa: 2 }),
      delitoBase,
    );
    expect(r.modificaciones.some(m => m.includes('2 grados'))).toBe(false);
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(24);
  });
});

describe('calcular_pena_individual — Art. 70 Circunstancias', () => {
  it('1 agravante → mitad superior (Art. 70.b)', () => {
    const r = calcular_pena_individual(makeConfig({ agravantes: ['alevosia'] }), delitoBase);
    expect(r.pena_min).toBe(15);
    expect(r.pena_max).toBe(24);
  });

  it('2 agravantes → mitad superior (Art. 70.b)', () => {
    const r = calcular_pena_individual(makeConfig({ agravantes: ['alevosia', 'discriminacion'] }), delitoBase);
    expect(r.pena_min).toBe(15);
    expect(r.pena_max).toBe(24);
  });

  it('3+ agravantes → límite máximo (Art. 70.e)', () => {
    const r = calcular_pena_individual(makeConfig({ agravantes: ['alevosia', 'discriminacion', 'reincidencia'] }), delitoBase);
    expect(r.pena_min).toBe(24);
    expect(r.pena_max).toBe(24);
  });

  it('1 atenuante → mitad inferior (Art. 70.c)', () => {
    const r = calcular_pena_individual(makeConfig({ atenuantes: ['confesion'] }), delitoBase);
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(15);
  });

  it('2+ atenuantes → límite mínimo (Art. 70.d)', () => {
    const r = calcular_pena_individual(makeConfig({ atenuantes: ['confesion', 'reparacion'] }), delitoBase);
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(6);
  });

  it('agravantes + atenuantes → compensación (Art. 70.f)', () => {
    const r = calcular_pena_individual(makeConfig({ agravantes: ['alevosia'], atenuantes: ['confesion'] }), delitoBase);
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(24);
    expect(r.modificaciones[0]).toContain('compensados');
  });
});

describe('calcular_pena_individual — combinaciones (Art. 61 + 62 + 70)', () => {
  it('cómplice + tentativa acabada + 1 agravante', () => {
    const r = calcular_pena_individual(makeConfig({
      grado_autoria: 'complice',
      grado_ejecucion: 'tentativa_acabada',
      agravantes: ['alevosia'],
    }), delitoBase);
    expect(r.pena_min).toBe(3);
    expect(r.pena_max).toBe(4);
    expect(r.modificaciones.length).toBe(3);
  });

  it('cómplice + tentativa inacabada + 1 atenuante', () => {
    const r = calcular_pena_individual(makeConfig({
      grado_autoria: 'complice',
      grado_ejecucion: 'tentativa_inacabada',
      atenuantes: ['confesion'],
    }), delitoBase);
    expect(r.pena_min).toBe(2);
    expect(r.pena_max).toBe(3);
    expect(r.modificaciones.length).toBe(3);
  });
});

describe('aplicar_concurso — delito único', () => {
  it('un delito sin concurso', () => {
    const resultado = calcular_pena_individual(makeConfig(), delitoBase);
    const r = aplicar_concurso([resultado], 'ninguno');
    expect(r.pena_min).toBe(6);
    expect(r.pena_max).toBe(24);
  });
});

describe('aplicar_concurso — Art. 66 Concurso real', () => {
  it('concurso real con delitos que exceden 20 años → límite 40 años', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoGrave);
    const r2 = calcular_pena_individual(makeConfig({ delito_id: 'test-2' }), delitoGrave);
    const r = aplicar_concurso([r1, r2], 'real');
    expect(r.pena_max).toBe(480);
    expect(r.articulo).toBe('Art. 66 CP');
  });

  it('concurso real con delitos bajo 20 años → límite 30 años', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    const r2 = calcular_pena_individual(makeConfig({ delito_id: 'test-1' }), delitoBase);
    const r = aplicar_concurso([r1, r2], 'real');
    expect(r.pena_max).toBe(48);
  });
});

describe('aplicar_concurso — Art. 67 Concurso ideal', () => {
  it('pena más grave aumentada 1/3, sin exceder suma', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    const r2 = calcular_pena_individual(makeConfig({ delito_id: 'test-2' }), delitoGrave);
    const r = aplicar_concurso([r1, r2], 'ideal');
    expect(r.pena_min).toBe(186);
    expect(r.pena_max).toBe(384);
    expect(r.articulo).toBe('Art. 67 CP');
  });
});

describe('aplicar_concurso — Art. 68 Delito continuado', () => {
  it('mitad superior + hasta 1/3 adicional', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    const r2 = calcular_pena_individual(makeConfig(), delitoBase);
    const r = aplicar_concurso([r1, r2], 'continuado');
    expect(r.pena_min).toBe(15);
    expect(r.pena_max).toBe(32);
    expect(r.articulo).toBe('Art. 68 CP');
  });
});

describe('utilidades — casos borde', () => {
  it('disminuir_en_fraccion con 1 mes no baja de 1', () => {
    const [min, max] = disminuir_en_fraccion(1, 6, 1 / 3);
    expect(min).toBe(1);
    expect(max).toBe(1);
  });

  it('aumentar_en_fraccion con pena 0', () => {
    const [min, max] = aumentar_en_fraccion(0, 0, 1 / 3);
    expect(min).toBe(0);
    expect(max).toBe(0);
  });

  it('meses_a_texto con valores negativos', () => {
    expect(meses_a_texto(-5)).toBe('0 meses');
  });

  it('calcular_gravedad en límites exactos', () => {
    expect(calcular_gravedad(360)).toBe('Muy grave');
    expect(calcular_gravedad(120)).toBe('Grave');
    expect(calcular_gravedad(36)).toBe('Menos grave');
    expect(calcular_gravedad(35)).toBe('Leve');
  });
});

describe('pena individual — casos borde', () => {
  it('cómplice + tentativa acabada: dos reducciones más circunstancias', () => {
    const r = calcular_pena_individual(makeConfig({
      grado_autoria: 'complice',
      grado_ejecucion: 'tentativa_acabada',
    }), delitoBase);
    expect(r.modificaciones.length).toBe(3);
    expect(r.pena_min).toBeLessThan(6);
  });

  it('eximente incompleta desde atenuantes (Art. 31.1 CP)', () => {
    const r = calcular_pena_individual(makeConfig({
      atenuantes: ['eximente_incompleta'],
    }), delitoBase);
    expect(r.modificaciones.some(m => m.includes('atenuante'))).toBe(true);
  });

  it('eximente completa tiene prioridad sobre todo', () => {
    const r = calcular_pena_individual(makeConfig({
      eximente_completa: 'legitima_defensa',
      agravantes: ['alevosia', 'discriminacion', 'reincidencia'],
      grado_autoria: 'complice',
    }), delitoBase);
    expect(r.exento).toBe(true);
    expect(r.pena_min).toBe(0);
  });

  it('pena mínima nunca es 0 (salvo exento)', () => {
    const r = calcular_pena_individual(makeConfig({
      grado_autoria: 'complice',
      grado_ejecucion: 'tentativa_inacabada',
      atenuantes: ['confesion', 'reparacion'],
    }), { ...delitoBase, pena_minima_meses: 1, pena_maxima_meses: 6 });
    expect(r.pena_min).toBeGreaterThanOrEqual(1);
  });
});

describe('concurso — casos borde', () => {
  it('todos exentos → pena 0', () => {
    const exento = calcular_pena_individual(makeConfig({ eximente_completa: 'legitima_defensa' }), delitoBase);
    const r = aplicar_concurso([exento, exento], 'real');
    expect(r.pena_min).toBe(0);
    expect(r.pena_max).toBe(0);
  });

  it('concurso tipo no reconocido en múltiples delitos → 0', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    const r2 = calcular_pena_individual(makeConfig({ delito_id: 'test-1' }), delitoBase);
    const r = aplicar_concurso([r1, r2], 'invalido' as never);
    expect(r.pena_max).toBe(0);
  });

  it('concurso ideal no excede suma individual', () => {
    const r1 = calcular_pena_individual(makeConfig(), delitoBase);
    const r2 = calcular_pena_individual(makeConfig({ delito_id: 'test-1' }), delitoBase);
    const r = aplicar_concurso([r1, r2], 'ideal');
    const suma = r1.pena_max + r2.pena_max;
    expect(r.pena_max).toBeLessThanOrEqual(suma);
  });
});

describe('calcular_pena — integración end-to-end', () => {
  it('cálculo completo de un delito', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig()],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-1', delitoBase]]);
    const r = calcular_pena(request, map);
    expect(r.delitos_analizados).toHaveLength(1);
    expect(r.pena_principal).toContain('6 meses');
    expect(r.pena_principal).toContain('2 años');
    expect(r.analisis_juridico).toContain('Código Penal de Honduras');
  });

  it('cálculo con concurso real de 2 delitos', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig(), makeConfig({ delito_id: 'test-2' })],
      tipo_concurso: 'real',
    };
    const map = new Map<string, DelitoBase>([
      ['test-1', delitoBase],
      ['test-2', delitoGrave],
    ]);
    const r = calcular_pena(request, map);
    expect(r.delitos_analizados).toHaveLength(2);
    expect(r.tipo_concurso).toBe('real');
    expect(r.concurso_articulo).toBe('Art. 66 CP');
  });

  it('todos exentos → EXENTO', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig({ eximente_completa: 'legitima_defensa' })],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>([['test-1', delitoBase]]);
    const r = calcular_pena(request, map);
    expect(r.pena_principal).toBe('EXENTO');
  });

  it('lanza error si delito no existe', () => {
    const request: CalculoRequest = {
      delitos: [makeConfig({ delito_id: 'no-existe' })],
      tipo_concurso: 'ninguno',
    };
    const map = new Map<string, DelitoBase>();
    expect(() => calcular_pena(request, map)).toThrow('no encontrado');
  });
});
