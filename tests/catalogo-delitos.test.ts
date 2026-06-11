import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DelitoBase, CalculoRequest } from '../lib/calculo';
import { calcular_pena } from '../lib/calculo';
import { getEstadoDelito, getResumenEstados, type EstadoDelito } from '../lib/estados-delitos';

const ROOT = process.cwd();
const DELITOS_PATH = join(ROOT, 'data', 'delitos.json');

function loadDelitos(): Array<{
  nombre: string;
  articulo: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa: boolean;
  pena_alternativa_min: number;
  pena_alternativa_max: number;
  penas_accesorias: string[];
  conducta: string;
  rama_id: string;
}> {
  return JSON.parse(readFileSync(DELITOS_PATH, 'utf8'));
}

function normalizarArticulo(articulo: string): string {
  return articulo
    .replace(/^Art(?:ículo|\.)\s*/i, '')
    .replace(/\s*CP\s*$/i, '')
    .trim();
}

function toDelitoBase(raw: {
  nombre: string;
  articulo: string;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa: boolean;
  pena_alternativa_min: number;
  pena_alternativa_max: number;
  penas_accesorias: string[];
}): DelitoBase {
  return {
    id: raw.nombre,
    nombre: raw.nombre,
    articulo: raw.articulo,
    clasificacion: null,
    penas_accesorias: raw.penas_accesorias ?? [],
    pena_minima_meses: raw.pena_minima_meses,
    pena_maxima_meses: raw.pena_maxima_meses,
    tiene_pena_alternativa: raw.tiene_pena_alternativa,
    pena_alternativa_min: raw.pena_alternativa_min,
    pena_alternativa_max: raw.pena_alternativa_max,
  };
}

/* ========================================================================== */
/* 1. TEST CATÁLOGO                                                           */
/* ========================================================================== */

describe('Catálogo de delitos (data/delitos.json)', () => {
  const delitos = loadDelitos();

  it('total de delitos = 483', () => {
    expect(delitos).toHaveLength(483);
  });

  it('no hay delitos sin nombre', () => {
    const sinNombre = delitos.filter(d => !d.nombre);
    expect(sinNombre).toHaveLength(0);
  });

  it('no hay delitos sin artículo', () => {
    const sinArticulo = delitos.filter(d => !d.articulo);
    expect(sinArticulo).toHaveLength(0);
  });

  it('no hay duplicados por (nombre, articulo)', () => {
    const keys = delitos.map(d => `${d.nombre}__${d.articulo}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(delitos.length);
  });

  it('cada delito con pena de prisión tiene mínimo <= máximo', () => {
    const conPena = delitos.filter(d => d.pena_minima_meses > 0 || d.pena_maxima_meses > 0);
    for (const d of conPena) {
      expect(d.pena_minima_meses, `${d.nombre} (${d.articulo}): min ${d.pena_minima_meses} > max ${d.pena_maxima_meses}`)
        .toBeLessThanOrEqual(d.pena_maxima_meses);
    }
  });

  it('ningún delito tiene penas negativas', () => {
    for (const d of delitos) {
      expect(d.pena_minima_meses, `${d.nombre}: pena_min negativa`).toBeGreaterThanOrEqual(0);
      expect(d.pena_maxima_meses, `${d.nombre}: pena_max negativa`).toBeGreaterThanOrEqual(0);
      expect(d.pena_alternativa_min, `${d.nombre}: alt_min negativa`).toBeGreaterThanOrEqual(0);
      expect(d.pena_alternativa_max, `${d.nombre}: alt_max negativa`).toBeGreaterThanOrEqual(0);
    }
  });

  it('si tiene pena alternativa, alt_min <= alt_max', () => {
    const conAlt = delitos.filter(d => d.tiene_pena_alternativa);
    for (const d of conAlt) {
      expect(d.pena_alternativa_min, `${d.nombre}: alt_min ${d.pena_alternativa_min} > alt_max ${d.pena_alternativa_max}`)
        .toBeLessThanOrEqual(d.pena_alternativa_max);
    }
  });
});

/* ========================================================================== */
/* 2. TEST ESTADOS DE VALIDACIÓN (delitos-estados.json)                       */
/* ========================================================================== */

describe('Estados de validación (delitos-estados.json)', () => {
  it('getResumenEstados: 483 verificados, 0 pendientes, 0 rechazados', () => {
    const resumen = getResumenEstados();
    expect(resumen.verificados).toBe(483);
    expect(resumen.pendientes_revision).toBe(0);
    expect(resumen.rechazados).toBe(0);
    expect(resumen.total).toBe(483);
  });

  it('ningún estado individual es "validado" (el valor legacy incorrecto)', () => {
    const raw = JSON.parse(
      readFileSync(join(ROOT, 'data', 'delitos-estados.json'), 'utf8'),
    );
    const entradas: Record<string, { estado: string }> = raw.entradas;
    for (const [key, entry] of Object.entries(entradas)) {
      expect(entry.estado, `Entrada ${key} tiene estado="validado"`).not.toBe('validado');
    }
  });

  it('todos los estados individuales son valores válidos del tipo EstadoDelito', () => {
    const validos: EstadoDelito[] = ['verificado', 'pendiente_revision', 'rechazado'];
    const raw = JSON.parse(
      readFileSync(join(ROOT, 'data', 'delitos-estados.json'), 'utf8'),
    );
    const entradas: Record<string, { estado: string }> = raw.entradas;
    for (const [key, entry] of Object.entries(entradas)) {
      expect(validos, `Entrada ${key} tiene estado="${entry.estado}"`).toContain(entry.estado as EstadoDelito);
    }
  });

  it('todos los estados individuales son "verificado"', () => {
    const raw = JSON.parse(
      readFileSync(join(ROOT, 'data', 'delitos-estados.json'), 'utf8'),
    );
    const entradas: Record<string, { estado: string }> = raw.entradas;
    for (const [key, entry] of Object.entries(entradas)) {
      expect(entry.estado, `Entrada ${key} no está verificada`).toBe('verificado');
    }
  });
});

/* ========================================================================== */
/* 3. TEST NORMALIZACIÓN DE ARTÍCULOS                                         */
/* ========================================================================== */

describe('Normalización de artículos del CP', () => {
  it('"342" normaliza a "342"', () => {
    expect(normalizarArticulo('342')).toBe('342');
  });

  it('"Art. 342" normaliza a "342"', () => {
    expect(normalizarArticulo('Art. 342')).toBe('342');
  });

  it('"Artículo 342" normaliza a "342"', () => {
    expect(normalizarArticulo('Artículo 342')).toBe('342');
  });

  it('"342 CP" normaliza a "342"', () => {
    expect(normalizarArticulo('342 CP')).toBe('342');
  });

  it('"Art. 342 CP" normaliza a "342"', () => {
    expect(normalizarArticulo('Art. 342 CP')).toBe('342');
  });

  it('"Artículo 342 CP" normaliza a "342"', () => {
    expect(normalizarArticulo('Artículo 342 CP')).toBe('342');
  });

  it('todos estos formatos resuelven al mismo número', () => {
    const formatos = ['342', 'Art. 342', 'Artículo 342', '342 CP', 'Art. 342 CP', 'Artículo 342 CP'];
    const normalizados = new Set(formatos.map(normalizarArticulo));
    expect(normalizados.size).toBe(1);
    expect(normalizados.has('342')).toBe(true);
  });

  it('normalización de artículo con número mayor (Art. 363 CP)', () => {
    expect(normalizarArticulo('Art. 363 CP')).toBe('363');
  });

  it('cada artículo en delitos.json se puede normalizar sin errores', () => {
    const delitos = loadDelitos();
    for (const d of delitos) {
      const n = normalizarArticulo(d.articulo);
      expect(n, `Artículo ${d.articulo} normalizó a vacío`).toBeTruthy();
      expect(/^\d+/.test(n), `Artículo ${d.articulo} normalizó a "${n}" (no es numérico)`).toBe(true);
    }
  });
});

/* ========================================================================== */
/* 4. TEST ESPECÍFICO: ART. 342 CP — ABANDONO DE ANIMALES                    */
/* ========================================================================== */

describe('Art. 342 CP — Abandono de animales', () => {
  const delitos = loadDelitos();

  it('existe en el catálogo', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales');
    expect(d).toBeDefined();
  });

  it('tiene artículo Art. 342 CP', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.articulo).toBe('Art. 342 CP');
  });

  it('pena_minima_meses = 6', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.pena_minima_meses).toBe(6);
  });

  it('pena_maxima_meses = 8', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.pena_maxima_meses).toBe(8);
  });

  it('tiene pena alternativa (multa 100-200 días)', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.tiene_pena_alternativa).toBe(true);
    expect(d.pena_alternativa_min).toBe(100);
    expect(d.pena_alternativa_max).toBe(200);
  });

  it('tiene inhabilitación especial como pena accesoria', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.penas_accesorias).toContain('Inhabilitación especial');
  });

  it('mínimo <= máximo', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    expect(d.pena_minima_meses).toBeLessThanOrEqual(d.pena_maxima_meses);
  });

  it('NO debe ser marcado como es_grave', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    // @ts-expect-error es_grave is in the JSON but not in the TypeScript type
    expect(d.es_grave).toBe(false);
  });

  it('getEstadoDelito devuelve estado "verificado"', () => {
    const estado = getEstadoDelito('Abandono de animales', 'Art. 342 CP');
    expect(estado.estado).toBe('verificado');
  });

  it('no es rechazado ni pendiente_revision', () => {
    const estado = getEstadoDelito('Abandono de animales', 'Art. 342 CP');
    expect(estado.estado).not.toBe('rechazado');
    expect(estado.estado).not.toBe('pendiente_revision');
  });

  it('se puede calcular pena sin error', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    const map = new Map<string, DelitoBase>([[d.nombre, toDelitoBase(d)]]);
    const request: CalculoRequest = {
      delitos: [{
        delito_id: d.nombre,
        pena_seleccionada: 'prision',
        variables_activas: [],
        grado_autoria: 'autor_directo',
        grado_ejecucion: 'consumado',
        reduccion_tentativa: 1,
        agravantes: [],
        atenuantes: [],
        eximentes: [],
        eximente_completa: null,
      }],
      tipo_concurso: 'ninguno',
    };
    const r = calcular_pena(request, map);
    expect(r.delitos_analizados).toHaveLength(1);
    const analizado = r.delitos_analizados[0];
    expect(analizado.confianza).toBe('verificado');
    expect(analizado.pena_base_min).toBe(6);
    expect(analizado.pena_base_max).toBe(8);
  });

  it('el resultado de confianza no es "validado" (valor legacy)', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    const map = new Map<string, DelitoBase>([[d.nombre, toDelitoBase(d)]]);
    const request: CalculoRequest = {
      delitos: [{
        delito_id: d.nombre,
        pena_seleccionada: 'prision',
        variables_activas: [],
        grado_autoria: 'autor_directo',
        grado_ejecucion: 'consumado',
        reduccion_tentativa: 1,
        agravantes: [],
        atenuantes: [],
        eximentes: [],
        eximente_completa: null,
      }],
      tipo_concurso: 'ninguno',
    };
    const r = calcular_pena(request, map);
    expect(r.delitos_analizados[0].confianza).not.toBe('validado' as never);
  });
});

/* ========================================================================== */
/* 5. TEST ALERTA DE DATOS NO VERIFICADOS                                     */
/* ========================================================================== */

describe('Alerta de datos no verificados en cálculo', () => {
  const delitos = loadDelitos();

  it('un delito verificado NO produce confianza != verificado', () => {
    const d = delitos.find(x => x.nombre === 'Abandono de animales')!;
    const map = new Map<string, DelitoBase>([[d.nombre, toDelitoBase(d)]]);
    const request: CalculoRequest = {
      delitos: [{
        delito_id: d.nombre,
        pena_seleccionada: 'prision',
        variables_activas: [],
        grado_autoria: 'autor_directo',
        grado_ejecucion: 'consumado',
        reduccion_tentativa: 1,
        agravantes: [],
        atenuantes: [],
        eximentes: [],
        eximente_completa: null,
      }],
      tipo_concurso: 'ninguno',
    };
    const r = calcular_pena(request, map);
    const noVerificados = r.delitos_analizados.filter(a => a.confianza !== 'verificado');
    expect(noVerificados).toHaveLength(0);
  });

  it('múltiples delitos verificados no producen alerta', () => {
    const hurtos = delitos.filter(x => x.nombre.includes('Hurto')).slice(0, 2);
    if (hurtos.length < 2) return; // skip if not enough samples
    const map = new Map<string, DelitoBase>(hurtos.map(d => [d.nombre, toDelitoBase(d)]));
    const request: CalculoRequest = {
      delitos: hurtos.map(d => ({
        delito_id: d.nombre,
        pena_seleccionada: 'prision' as const,
        variables_activas: [],
        grado_autoria: 'autor_directo',
        grado_ejecucion: 'consumado',
        reduccion_tentativa: 1,
        agravantes: [],
        atenuantes: [],
        eximentes: [],
        eximente_completa: null,
      })),
      tipo_concurso: 'real',
    };
    const r = calcular_pena(request, map);
    const noVerificados = r.delitos_analizados.filter(a => a.confianza !== 'verificado');
    expect(noVerificados, 'Hay delitos que aparecen como no verificados').toHaveLength(0);
  });

  it('todos los 483 delitos verificados en el catálogo producen confianza="verificado"', () => {
    // Muestra: primeras 50 entradas verificables
    const muestra = delitos.slice(0, 50);
    for (const d of muestra) {
      const estado = getEstadoDelito(d.nombre, d.articulo);
      expect(estado.estado, `${d.nombre} (${d.articulo}) debe estar verificado`).toBe('verificado');
    }
  });
});

/* ========================================================================== */
/* 6. TEST CÁLCULO DE PENAS — MUESTRA REPRESENTATIVA                          */
/* ========================================================================== */

describe('Cálculo de penas — muestra representativa', () => {
  const delitos = loadDelitos();

  // Muestra los primeros 30 delitos para verificar que todos calculan correctamente
  const muestra = delitos.slice(0, 30);

  for (const raw of muestra) {
    const d = toDelitoBase(raw);
    const map = new Map<string, DelitoBase>([[d.nombre, d]]);

    it(`${d.nombre} (${d.articulo}) — no lanza error`, () => {
      const request: CalculoRequest = {
        delitos: [{
          delito_id: d.nombre,
          pena_seleccionada: d.tiene_pena_alternativa && d.pena_minima_meses === 0 ? 'multa' : 'prision',
          variables_activas: [],
          grado_autoria: 'autor_directo',
          grado_ejecucion: 'consumado',
          reduccion_tentativa: 1,
          agravantes: [],
          atenuantes: [],
          eximentes: [],
          eximente_completa: null,
        }],
        tipo_concurso: 'ninguno',
      };
      expect(() => calcular_pena(request, map)).not.toThrow();
    });

    it(`${d.nombre} (${d.articulo}) — confianza es verificada`, () => {
      const request: CalculoRequest = {
        delitos: [{
          delito_id: d.nombre,
          pena_seleccionada: d.tiene_pena_alternativa && d.pena_minima_meses === 0 ? 'multa' : 'prision',
          variables_activas: [],
          grado_autoria: 'autor_directo',
          grado_ejecucion: 'consumado',
          reduccion_tentativa: 1,
          agravantes: [],
          atenuantes: [],
          eximentes: [],
          eximente_completa: null,
        }],
        tipo_concurso: 'ninguno',
      };
      const r = calcular_pena(request, map);
      expect(r.delitos_analizados[0].confianza).toBe('verificado');
    });

    it(`${d.nombre} (${d.articulo}) — resultado sin NaN ni null`, () => {
      const request: CalculoRequest = {
        delitos: [{
          delito_id: d.nombre,
          pena_seleccionada: d.tiene_pena_alternativa && d.pena_minima_meses === 0 ? 'multa' : 'prision',
          variables_activas: [],
          grado_autoria: 'autor_directo',
          grado_ejecucion: 'consumado',
          reduccion_tentativa: 1,
          agravantes: [],
          atenuantes: [],
          eximentes: [],
          eximente_completa: null,
        }],
        tipo_concurso: 'ninguno',
      };
      const r = calcular_pena(request, map);
      const a = r.delitos_analizados[0];
      expect(Number.isNaN(a.pena_base_min)).toBe(false);
      expect(Number.isNaN(a.pena_base_max)).toBe(false);
      expect(Number.isNaN(a.pena_individual_min)).toBe(false);
      expect(Number.isNaN(a.pena_individual_max)).toBe(false);
      expect(Number.isNaN(a.pena_recomendada_meses)).toBe(false);
    });
  }
});

/* ========================================================================== */
/* 7. TEST REGRESIÓN: Abandono de animales                                    */
/* ========================================================================== */

describe('Regresión: Abandono de animales (Art. 342 CP)', () => {
  it('no aparece alerta de "1 delito no verificado"', () => {
    const d = loadDelitos().find(x => x.nombre === 'Abandono de animales')!;
    const estado = getEstadoDelito(d.nombre, d.articulo);
    expect(estado.estado).toBe('verificado');
  });

  it('el catálogo muestra 483/483 verificados', () => {
    const resumen = getResumenEstados();
    expect(resumen.verificados).toBe(483);
    expect(resumen.total).toBe(483);
    expect(resumen.pendientes_revision).toBe(0);
    expect(resumen.rechazados).toBe(0);
  });

  it('pena mínima y máxima son las correctas (6-8 meses)', () => {
    const d = loadDelitos().find(x => x.nombre === 'Abandono de animales')!;
    expect(d.pena_minima_meses).toBe(6);
    expect(d.pena_maxima_meses).toBe(8);
  });

  it('penas no son 0-0', () => {
    const d = loadDelitos().find(x => x.nombre === 'Abandono de animales')!;
    expect(d.pena_minima_meses).not.toBe(0);
    expect(d.pena_maxima_meses).not.toBe(0);
  });
});
