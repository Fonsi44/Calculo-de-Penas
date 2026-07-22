/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks compartidos (antes de imports de servicios) ──────────────────────
const { chain } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'orderBy', 'insert', 'values', 'update', 'set', 'delete']) c[m] = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => c);
  c.returning = vi.fn(() => Promise.resolve([]));
  c.onConflictDoNothing = vi.fn(() => c);
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  c.then = vi.fn((onf?: (v: unknown) => unknown) => Promise.resolve([]).then(onf));
  return { chain: c };
});

const { isFlagEnabledMock } = vi.hoisted(() => ({ isFlagEnabledMock: vi.fn(async () => true) }));

vi.mock('@/lib/db', () => ({ db: chain }));
vi.mock('@/lib/sgie/feature-flags', () => ({ isFlagEnabled: isFlagEnabledMock }));
vi.mock('@/lib/sgie/ia-documental', () => ({
  getIaConfig: vi.fn(() => ({ provider: 'deepseek', model: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1', apiKey: 'fake', mode: 'ai', timeoutMs: 5000, maxRetries: 1 })),
  isIaEnabled: vi.fn(() => false),
}));
vi.mock('@/lib/sgie/resumen-ia', () => ({
  generarResumenIa: vi.fn(async () => ({ ok: false as const, error: 'mock', codigo: 'ia_deshabilitada' as const })),
}));

// Imports top-level (los mocks ya están registrados).
import { esCompatible, autoVincularDocumento, UMBRAL_AUTO_VINCULO } from '../lib/sgie/auto-vinculacion';
import { extraerDeterminista, validarCamposContraSchema } from '../lib/sgie/extraccion-estructurada';
import { detectarContradiccionesDeterministas, detectarDuplicidadHash } from '../lib/sgie/motor-contradicciones';
import { generarResumenIncremental } from '../lib/sgie/resumen-incremental';
import { recomendarNextAction } from '../lib/sgie/next-action';

beforeEach(() => {
  for (const k of Object.keys(chain)) {
    const m = chain[k] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  isFlagEnabledMock.mockClear();
  isFlagEnabledMock.mockResolvedValue(true);
});

// ═══ P2-02 Auto-vinculación ════════════════════════════════════════════════
describe('P2-02 Auto-vinculación — esCompatible', () => {
  it('identidad compatible con "Identificacion oficial"', () => {
    expect(esCompatible('identidad', 'Identificacion oficial')).toBe(true);
  });

  it('identidad NO compatible con "Comprobante de domicilio"', () => {
    expect(esCompatible('identidad', 'Comprobante de domicilio')).toBe(false);
  });

  it('constancia compatible con "Comprobante de domicilio"', () => {
    expect(esCompatible('constancia', 'Comprobante de domicilio')).toBe(true);
  });

  it('tipo desconocido => no compatible con nada', () => {
    expect(esCompatible('xxx', 'Identificacion oficial')).toBe(false);
  });

  it('UMBRAL_AUTO_VINCULO es razonable (>=70)', () => {
    expect(UMBRAL_AUTO_VINCULO).toBeGreaterThanOrEqual(70);
  });
});

describe('P2-02 Auto-vinculación — feature flag deny', () => {
  it('flag desactivada => accion flag_desactivada', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const r = await autoVincularDocumento({ documentId: 'd1', expedienteId: 'e1' });
    expect(r.ok).toBe(false);
    expect(r.accion).toBe('flag_desactivada');
  });
});

// ═══ P2-03 Extracción estructurada ═════════════════════════════════════════
describe('P2-03 Extracción — extraerDeterminista (regex)', () => {
  it('extrae identidad hondureña 0801-1990-01234', () => {
    const r = extraerDeterminista('Documento con identidad 0801-1990-01234 del cliente.');
    const id = r.find((c) => c.clave === 'numero_identidad');
    expect(id?.valor).toBe('0801-1990-01234');
    expect(id?.confianza).toBeGreaterThan(80);
  });

  it('extrae RTN de 14 dígitos', () => {
    const r = extraerDeterminista('RTN: 12345678901234');
    const rtn = r.find((c) => c.clave === 'rtn');
    expect(rtn?.valor).toBe('12345678901234');
  });

  it('extrae fecha dd/mm/aaaa', () => {
    const r = extraerDeterminista('Fecha: 15/07/2026');
    expect(r.find((c) => c.clave === 'fecha_documento')?.valor).toBe('15/07/2026');
  });

  it('texto vacío => []', () => {
    expect(extraerDeterminista()).toEqual([]);
    expect(extraerDeterminista('')).toEqual([]);
  });
});

describe('P2-03 Extracción — validarCamposContraSchema', () => {
  it('rechaza claves no definidas en schema', () => {
    const r = validarCamposContraSchema(
      [{ clave: 'inventada', valor: 'x', confianza: 90 }],
      { campos: [{ clave: 'numero_identidad', tipo: 'string' as const }] },
    );
    expect(r.rechazados).toContain('inventada');
    expect(r.validos).toHaveLength(0);
  });

  it('marca ausentes requeridos', () => {
    const r = validarCamposContraSchema(
      [],
      { campos: [{ clave: 'numero_identidad', tipo: 'string' as const, requerido: true }] },
    );
    expect(r.ausentesRequeridos).toContain('numero_identidad');
    expect(r.validos[0].estado).toBe('ausente');
  });

  it('confianza baja => ambiguo', () => {
    const r = validarCamposContraSchema(
      [{ clave: 'x', valor: 'v', confianza: 30 }],
      { campos: [{ clave: 'x', tipo: 'string' as const }] },
    );
    expect(r.validos[0].estado).toBe('ambiguo');
  });
});

// ═══ P2-04 Contradicciones ═════════════════════════════════════════════════
describe('P2-04 Contradicciones — detectarDeterministas', () => {
  it('dos docs con identidad distinta => crítica bloqueante', () => {
    const r = detectarContradiccionesDeterministas([
      { documentId: 'd1', campos: [{ clave: 'numero_identidad', valor: '0801-1990-01234', confianza: 95 }] },
      { documentId: 'd2', campos: [{ clave: 'numero_identidad', valor: '0801-1990-99999', confianza: 95 }] },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].severidad).toBe('critico');
    expect(r[0].bloqueante).toBe(true);
    expect(r[0].tipo).toBe('identidad_incompatible');
  });

  it('un solo doc => sin contradicción', () => {
    const r = detectarContradiccionesDeterministas([
      { documentId: 'd1', campos: [{ clave: 'numero_identidad', valor: '0801-1990-01234', confianza: 95 }] },
    ]);
    expect(r).toHaveLength(0);
  });

  it('campos no sensibles distintos => advertencia no bloqueante', () => {
    const r = detectarContradiccionesDeterministas([
      { documentId: 'd1', campos: [{ clave: 'color', valor: 'rojo', confianza: 90 }] },
      { documentId: 'd2', campos: [{ clave: 'color', valor: 'azul', confianza: 90 }] },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].severidad).toBe('advertencia');
    expect(r[0].bloqueante).toBe(false);
  });

  it('detecta duplicidad por hash idéntico', () => {
    const r = detectarDuplicidadHash([
      { documentId: 'd1', hashSha256: 'abc123' },
      { documentId: 'd2', hashSha256: 'abc123' },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('duplicidad');
  });
});

// ═══ P2-05 Resumen incremental ═════════════════════════════════════════════
describe('P2-05 Resumen incremental — feature flag deny', () => {
  it('flag desactivada => ok false con razon', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const r = await generarResumenIncremental({
      expedienteId: 'e1',
      datos: {
        numeroInterno: 'EXP-1', estado: 'creado', clienteNombre: null,
        procedimientoNombre: null, resumen: null, documentos: [], campos: [],
        alertasActivas: 0, inconsistencias: [],
      },
    });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
  });
});

// ═══ P2-06 NextActionService ═══════════════════════════════════════════════
describe('P2-06 NextActionService — feature flag deny', () => {
  it('flag desactivada => ok false con razon', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const r = await recomendarNextAction({ expedienteId: 'e1' });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
  });
});
