/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mocks: AccessService + los 6 servicios + DB ────────────────────────────
const { chain } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'orderBy', 'insert', 'values', 'update', 'set', 'delete']) c[m] = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.returning = vi.fn(() => Promise.resolve([{ id: 'run-1' }]));
  c.onConflictDoNothing = vi.fn(() => c);
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  c.then = vi.fn((onf?: (v: unknown) => unknown) => Promise.resolve([]).then(onf));
  return { chain: c };
});

const { canAccessCaseMock } = vi.hoisted(() => ({ canAccessCaseMock: vi.fn(async () => true) }));
const { resolveFlagMock } = vi.hoisted(() => ({ resolveFlagMock: vi.fn(async () => ({ enabled: true, config: {}, killSwitch: false, resolvedScope: 'global' as const })) }));

vi.mock('@/lib/db', () => ({ db: chain }));
vi.mock('@/lib/access-service', () => ({ canAccessCase: canAccessCaseMock }));
vi.mock('@/lib/sgie/feature-flags', () => ({ resolveFlag: resolveFlagMock, isFlagEnabled: vi.fn(async () => true) }));

// Mock de los 6 servicios para aislar la lógica del orchestrator.
const mocks = vi.hoisted(() => ({
  clasificarDocumento: vi.fn(async () => ({ ok: true, estrategia: 'heuristic', tipoPropuesto: 'identidad', confianza: 80, evidencias: [], alternativas: [], estado: 'propuesta', pipelineRunId: 'cls-1' })),
  extraerEstructurado: vi.fn(async () => ({ ok: true, campos: [], confianza: 0, estado: 'extraido', extraccionId: 'ext-1' })),
  autoVincularDocumento: vi.fn(async () => ({ ok: true, accion: 'auto_vinculada', vinculoId: 'lnk-1', confianza: 80, explicacion: 'ok' })),
  detectarContradiccionesExpediente: vi.fn(async () => ({ ok: true, detectadas: [] })),
  generarResumenIncremental: vi.fn(async () => ({ ok: true, regenerado: true, cambios: [], sourceHash: 'h', watermark: new Date(), resumen: 'resumen' })),
  recomendarNextAction: vi.fn(async () => ({ ok: true, alternativas: [], principal: { id: 'na-1' } })),
  obtenerClasificacionVigente: vi.fn(async () => ({ tipoPropuesto: 'identidad' })),
}));
vi.mock('@/lib/sgie/clasificacion-documental', () => ({
  clasificarDocumento: mocks.clasificarDocumento,
  obtenerClasificacionVigente: mocks.obtenerClasificacionVigente,
}));
vi.mock('@/lib/sgie/extraccion-estructurada', () => ({ extraerEstructurado: mocks.extraerEstructurado }));
vi.mock('@/lib/sgie/auto-vinculacion', () => ({ autoVincularDocumento: mocks.autoVincularDocumento }));
vi.mock('@/lib/sgie/motor-contradicciones', () => ({ detectarContradiccionesExpediente: mocks.detectarContradiccionesExpediente }));
vi.mock('@/lib/sgie/resumen-incremental', () => ({ generarResumenIncremental: mocks.generarResumenIncremental }));
vi.mock('@/lib/sgie/next-action', () => ({ recomendarNextAction: mocks.recomendarNextAction }));
vi.mock('@/lib/sgie/resumen-ia', () => ({}));

import { ejecutarPipelineAutomatizacion } from '../lib/sgie/document-automation-orchestrator';

beforeEach(() => {
  for (const k of Object.keys(chain)) {
    const m = chain[k] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  canAccessCaseMock.mockClear();
  canAccessCaseMock.mockResolvedValue(true);
  resolveFlagMock.mockClear();
  resolveFlagMock.mockResolvedValue({ enabled: true, config: {}, killSwitch: false, resolvedScope: 'global' });
  for (const k of Object.keys(mocks) as Array<keyof typeof mocks>) mocks[k].mockClear();
});

const INPUT = {
  documentId: 'doc-1', expedienteId: 'exp-1', actorId: 'user-1',
  nombreOriginal: 'identidad.pdf', tipoMime: 'application/pdf', textoExtraido: 'texto',
};

describe('DocumentAutomationOrchestrator — autorización', () => {
  it('actor SIN acceso => ok false, autorizado false, no ejecuta etapas', async () => {
    canAccessCaseMock.mockResolvedValueOnce(false);
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    expect(r.autorizado).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.etapas).toHaveLength(1);
    expect(r.etapas[0].error).toBe('FORBIDDEN');
    // Ningún servicio se invoca.
    expect(mocks.clasificarDocumento).not.toHaveBeenCalled();
  });

  it('actor CON acceso => ejecuta el pipeline', async () => {
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    expect(r.autorizado).toBe(true);
    expect(mocks.clasificarDocumento).toHaveBeenCalled();
  });
});

describe('DocumentAutomationOrchestrator — kill switch', () => {
  it('kill switch en sgie.ai.classification => aborta antes de procesar', async () => {
    resolveFlagMock.mockResolvedValueOnce({ enabled: false, config: {}, killSwitch: true, resolvedScope: 'global' });
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Kill switch/);
    expect(mocks.clasificarDocumento).not.toHaveBeenCalled();
  });
});

describe('DocumentAutomationOrchestrator — correlation ID', () => {
  it('genera correlationId único si no se provee', async () => {
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    expect(r.correlationId).toBeTruthy();
    expect(typeof r.correlationId).toBe('string');
    expect(r.correlationId.length).toBeGreaterThan(10);
  });

  it('propaga correlationId provisto', async () => {
    const r = await ejecutarPipelineAutomatizacion({ ...INPUT, correlationId: 'fixed-corr-id' });
    expect(r.correlationId).toBe('fixed-corr-id');
  });
});

describe('DocumentAutomationOrchestrator — pipeline completo', () => {
  it('ejecuta las 6 etapas cuando todo OK', async () => {
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    expect(r.etapas).toHaveLength(6);
    expect(r.etapas.map((e) => e.etapa)).toEqual([
      'classification', 'extraction', 'linking', 'contradiction', 'summary', 'next_action',
    ]);
    expect(r.ok).toBe(true);
    // Cada etapa registró un ai_pipeline_run.
    expect(r.pipelineRunIds.length).toBeGreaterThanOrEqual(6);
  });

  it('un fallo en una etapa no aborta las siguientes (resiliente)', async () => {
    (mocks.extraerEstructurado as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, campos: [], confianza: 0, estado: 'pendiente_revision' });
    const r = await ejecutarPipelineAutomatizacion(INPUT);
    // La etapa extraction falló pero el pipeline siguió.
    expect(r.etapas.find((e) => e.etapa === 'extraction')?.ok).toBe(false);
    expect(r.etapas.find((e) => e.etapa === 'linking')).toBeDefined();
    expect(r.etapas.find((e) => e.etapa === 'next_action')).toBeDefined();
  });
});
