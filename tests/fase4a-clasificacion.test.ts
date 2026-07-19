/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mock DB + feature flags + ia-documental ─────────────────────────────────
const { chain } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'orderBy', 'insert', 'values', 'update', 'set', 'delete']) c[m] = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => c);
  c.returning = vi.fn(() => Promise.resolve([]));
  c.onConflictDoNothing = vi.fn(() => c);
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  return { chain: c };
});

// Cola para select().limit().returning()
let queueIdx = 0;
let queue: unknown[] = [];
beforeEach(() => { queueIdx = 0; queue = []; });
// Override chain.then para consumir cola.
(chain as unknown as { then: unknown }).then = (onfulfilled?: (v: unknown) => unknown) => {
  const val = queueIdx < queue.length ? queue[queueIdx++] : [];
  return Promise.resolve(val).then(onfulfilled);
};

vi.mock('@/lib/db', () => ({ db: chain }));
vi.mock('@/lib/sgie/feature-flags', () => ({
  isFlagEnabled: vi.fn(async () => true),
}));
vi.mock('@/lib/sgie/ia-documental', () => ({
  getIaConfig: vi.fn(() => ({
    provider: 'deepseek', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1',
    apiKey: 'fake', mode: 'ai', timeoutMs: 30000, maxRetries: 1,
  })),
  isIaEnabled: vi.fn(() => false), // por defecto IA deshabilitada en tests
}));

const {
  puedeAutoAprobar, determinarEstado, clasificarDocumento, PIPELINE_VERSION,
} = await import('../lib/sgie/clasificacion-documental');

describe('ClasificacionDocumental — puedeAutoAprobar (lógica de seguridad)', () => {
  it('tipo crítico (demanda) => nunca auto-aprobar aunque confianza alta', () => {
    const r = puedeAutoAprobar('demanda', 99, [{ tipo: 'x', descripcion: 'd' }]);
    expect(r.auto).toBe(false);
    expect(r.motivo).toBe('tipo_crítico_requiere_humano');
  });

  it('tipo crítico (poder) => no auto-aprobar', () => {
    expect(puedeAutoAprobar('poder', 99, [{ tipo: 'x', descripcion: 'd' }]).auto).toBe(false);
  });

  it('tipo no crítico + confianza >= umbral + evidencia => auto', () => {
    const r = puedeAutoAprobar('identidad', 90, [{ tipo: 'x', descripcion: 'd' }]);
    expect(r.auto).toBe(true);
  });

  it('confianza < umbral => no auto', () => {
    const r = puedeAutoAprobar('identidad', 70, [{ tipo: 'x', descripcion: 'd' }]);
    expect(r.auto).toBe(false);
    expect(r.motivo).toMatch(/confianza/);
  });

  it('sin evidencia => no auto aunque confianza alta', () => {
    const r = puedeAutoAprobar('identidad', 99, []);
    expect(r.auto).toBe(false);
    expect(r.motivo).toBe('sin_evidencia');
  });
});

describe('ClasificacionDocumental — determinarEstado', () => {
  it('confianza baja (< propuesta) => pendiente_revision', () => {
    expect(determinarEstado('identidad', 40, [{ tipo: 'x', descripcion: 'd' }])).toBe('pendiente_revision');
  });

  it('tipo no crítico + confianza alta + evidencia => auto_aprobada', () => {
    expect(determinarEstado('identidad', 90, [{ tipo: 'x', descripcion: 'd' }])).toBe('auto_aprobada');
  });

  it('tipo crítico + confianza alta => propuesta (no auto)', () => {
    expect(determinarEstado('poder', 95, [{ tipo: 'x', descripcion: 'd' }])).toBe('propuesta');
  });
});

describe('ClasificacionDocumental — feature flag deny-by-default', () => {
  it('flag desactivada => ok false, no clasifica', async () => {
    const { isFlagEnabled } = await import('../lib/sgie/feature-flags');
    (isFlagEnabled as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const r = await clasificarDocumento({
      documentId: 'd1', nombreOriginal: 'test.pdf', tipoMime: 'application/pdf',
    });
    expect(r.ok).toBe(false);
    expect(r.razonEscalado).toBe('feature_flag_desactivada');
  });
});

describe('ClasificacionDocumental — idempotencia', () => {
  it('clasificación existente para (doc, pipeline) => la devuelve sin re-clasificar', async () => {
    queue.push([
      {
        id: 'cls-1',
        documentId: 'd1',
        pipelineVersion: PIPELINE_VERSION,
        tipoPropuesto: 'identidad',
        confianza: 75,
        estrategia: 'heuristic',
        evidencias: [{ tipo: 'heuristica', descripcion: 'match' }],
        alternativas: [],
        estado: 'propuesta',
        modelo: null,
      },
    ]);
    const r = await clasificarDocumento({
      documentId: 'd1', nombreOriginal: 'test.pdf', tipoMime: 'application/pdf',
    });
    expect(r.ok).toBe(true);
    expect(r.razonEscalado).toBe('idempotente_existente');
    expect(r.tipoPropuesto).toBe('identidad');
    expect(r.confianza).toBe(75);
  });
});

describe('ClasificacionDocumental — heurística como baseline', () => {
  it('flag activa + sin existente + IA deshabilitada => clasifica heurística', async () => {
    queue.push([]); // sin existente
    const r = await clasificarDocumento({
      documentId: 'd2',
      nombreOriginal: 'identidad.pdf',
      tipoMime: 'application/pdf',
      textoExtraido: 'número de identidad 0801-1990-01234',
    });
    expect(r.ok).toBe(true);
    expect(r.estrategia).toBe('heuristic');
    expect(r.tipoPropuesto).toBe('identidad');
    expect(r.confianza).toBeGreaterThan(0);
  });
});
