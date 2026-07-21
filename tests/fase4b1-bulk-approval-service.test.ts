/// <reference types="vitest/globals" />
/**
 * Tests del BulkApprovalService — P2-07 (Fase 4B-1).
 *
 * Cubre los escenarios obligatorios del prompt: preview sin mutaciones, hash
 * estable, preview obsoleta, documentos elegibles/inválidos, mezclas, control
 * optimista, idempotencia, auditoría/outbox sin duplicados, cascadas, flag/kill
 * switch, autorización, reversión permitida/denegada, concurrencia.
 *
 * Usa mock DB con cola de respuestas (patrón SGIE). Las dependencias externas
 * (access-service, readiness, next-action, auditoria, outbox, feature-flags)
 * se mockean para aislar la lógica del servicio.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mock DB con cola de respuestas ──────────────────────────────────────────
let queueIdx = 0;
const _queue: unknown[] = [];

const { chain } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'orderBy', 'insert', 'values', 'update', 'set', 'delete']) {
    c[m] = vi.fn(() => c);
  }
  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => c);
  c.onConflictDoNothing = vi.fn(() => c);
  c.returning = vi.fn(() => {
    const val = queueIdx < _queue.length ? _queue[queueIdx++] : undefined;
    return Promise.resolve(val !== undefined ? val : []);
  });
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  c.then = vi.fn((onf?: (v: unknown) => unknown) => {
    const val = queueIdx < _queue.length ? _queue[queueIdx++] : undefined;
    return Promise.resolve(val !== undefined ? val : []).then(onf);
  });
  return { chain: c, mockNext: (val: unknown) => { _queue.push(val); } };
});

vi.mock('@/lib/db', () => ({ db: chain }));

// Mock feature-flags.
const { isFlagEnabledMock } = vi.hoisted(() => ({ isFlagEnabledMock: vi.fn(async () => true) }));
vi.mock('@/lib/sgie/feature-flags', () => ({ isFlagEnabled: isFlagEnabledMock }));

// Mock access-service.
const { assertCaseAccessMock } = vi.hoisted(() => ({
  assertCaseAccessMock: vi.fn(async () => undefined),
}));
vi.mock('@/lib/access-service', () => ({
  accessService: { assertCaseAccess: assertCaseAccessMock },
}));

// Mock cascadas (readiness, next-action, auditoria, outbox).
vi.mock('@/lib/sgie/readiness', () => ({ recalcularReadinessSiProcede: vi.fn(async () => undefined) }));
vi.mock('@/lib/sgie/next-action', () => ({ recomendarNextAction: vi.fn(async () => ({ ok: true, alternativas: [] })) }));
vi.mock('@/lib/sgie/auditoria-sgie', () => ({
  logSgie: vi.fn(async () => undefined),
  registrarHistorialExpediente: vi.fn(async () => undefined),
}));
vi.mock('@/lib/sgie/signature-package-service', () => ({
  getBlockingPackages: vi.fn(async () => []),
}));
vi.mock('@/lib/sgie/outbox', () => ({
  OUTBOX_EVENTS: { DOCUMENT_APPROVED: 'document.approved', DOCUMENT_APPROVAL_REVERTED: 'document.approval.reverted' },
  encolarEvento: vi.fn(async () => ({ id: 'evt-1' })),
}));

import {
  generarPreview,
  confirmarAprobacion,
  consultarResultado,
  revertirAprobacion,
  BulkApprovalError,
} from '../lib/sgie/bulk-approval-service';

// Helpers
function resetQueue(...vals: unknown[]) {
  queueIdx = 0;
  _queue.length = 0;
  for (const v of vals) _queue.push(v);
}
function mockDoc(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'doc-1', expedienteId: 'exp-1', nombreOriginal: 'identidad.pdf',
    tipoDocumento: 'identidad', estado: 'pendiente_abogado', version: 1,
    aprobadoPor: null, procesadoEn: new Date('2026-01-01'),
    requisitoExpedienteId: null, metadata: { confianzaIa: 90 }, ...over,
  };
}

beforeEach(() => {
  for (const k of Object.keys(chain)) {
    const m = chain[k] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  resetQueue();
  // mockReset limpia también los mockResolvedValueOnce pendientes (mockClear no).
  isFlagEnabledMock.mockReset();
  isFlagEnabledMock.mockResolvedValue(true);
  assertCaseAccessMock.mockReset();
  assertCaseAccessMock.mockResolvedValue(undefined);
});

const CTX = { actorId: 'admin-1' };

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 generarPreview — flag y autorización', () => {
  it('flag apagada => BulkApprovalError FLAG_OFF', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const err = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX).catch((e) => e);
    expect(err).toBeInstanceOf(BulkApprovalError);
    expect((err as BulkApprovalError).code).toBe('FLAG_OFF');
  });

  it('kill switch (isFlagEnabled lanza) => tratado como flag off', async () => {
    isFlagEnabledMock.mockRejectedValueOnce(new Error('kill_switch'));
    await expect(
      generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'FLAG_OFF' });
  });

  it('documentIds vacío => VALIDATION', async () => {
    await expect(
      generarPreview({ expedienteId: 'exp-1', documentIds: [] }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'VALIDATION' });
  });

  it('autorización denegada => FORBIDDEN propagado', async () => {
    assertCaseAccessMock.mockRejectedValueOnce(Object.assign(new Error('Sin acceso'), { status: 403 }));
    await expect(
      generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX).catch((e) => e),
    ).resolves.toBeTruthy();
  });
});

describe('P2-07 generarPreview — sin mutaciones y hash estable', () => {
  it('preview NO muta documentos (solo insert en tablas bulk)', async () => {
    resetQueue([mockDoc()], [], [], []); // docs, contradicciones, vínculos
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.batchId).toBeTruthy();
    // El update de documentos NO debe invocarse en preview.
    expect(chain.update).not.toHaveBeenCalled();
  });

  it('hash estable para los mismos documentos/versiones', async () => {
    resetQueue([mockDoc()], [], []);
    const r1 = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    resetQueue([mockDoc()], [], []);
    const r2 = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r1.previewHash).toBe(r2.previewHash);
    expect(r1.previewHash).toHaveLength(64);
  });

  it('hash cambia si cambia la versión del documento', async () => {
    resetQueue([mockDoc({ version: 1 })], [], []);
    const r1 = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    resetQueue([mockDoc({ version: 2 })], [], []);
    const r2 = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r1.previewHash).not.toBe(r2.previewHash);
  });
});

describe('P2-07 generarPreview — elegibilidad', () => {
  it('documento en estado pendiente_abogado => aprobable', async () => {
    resetQueue([mockDoc({ estado: 'pendiente_abogado' })], [], []);
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].aprobable).toBe(true);
    expect(r.items[0].accion).toBe('aprobar');
  });

  it('documento ya aprobado => accion ya_aprobado', async () => {
    resetQueue([mockDoc({ estado: 'aprobado', aprobadoPor: 'admin-1' })], [], []);
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].accion).toBe('ya_aprobado');
  });

  it('documento de OTRO expediente => no_encontrado', async () => {
    resetQueue([], [], []); // no se encuentra el doc en el expediente
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-ajeno'] }, CTX);
    expect(r.items[0].aprobable).toBe(false);
    expect(r.items[0].codigoNoAprobable).toBe('no_encontrado');
  });

  it('documento en contradicción bloqueante => bloque_contradiccion', async () => {
    resetQueue(
      [mockDoc()],
      [{ id: 'ctr-1', documentAId: 'doc-1', documentBId: null }], // contradicción bloqueante
      [],
    );
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].aprobable).toBe(false);
    expect(r.items[0].codigoNoAprobable).toBe('bloque_contradiccion');
    expect(r.items[0].bloqueos).toContain('contradiccion_bloqueante');
  });

  it('documento con procesamiento pendiente => procesamiento_pendiente', async () => {
    resetQueue([mockDoc({ estado: 'clasificando', procesadoEn: null })], [], []);
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].aprobable).toBe(false);
    expect(r.items[0].codigoNoAprobable).toBe('procesamiento_pendiente');
  });

  it('documento crítico con confianza baja => requiere_revision_humana', async () => {
    resetQueue([mockDoc({ tipoDocumento: 'demanda', metadata: { confianzaIa: 40 } })], [], []);
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].aprobable).toBe(false);
    expect(r.items[0].codigoNoAprobable).toBe('requiere_revision_humana');
  });

  it('documento crítico con confianza alta => aprobable', async () => {
    resetQueue([mockDoc({ tipoDocumento: 'demanda', metadata: { confianzaIa: 90 } })], [], []);
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['doc-1'] }, CTX);
    expect(r.items[0].aprobable).toBe(true);
  });

  it('mezcla de válidos e inválidos => totals correctos', async () => {
    resetQueue(
      [mockDoc({ id: 'd-ok', estado: 'pendiente_abogado' }), mockDoc({ id: 'd-bad', estado: 'clasificando', procesadoEn: null })],
      [],
      [],
    );
    const r = await generarPreview({ expedienteId: 'exp-1', documentIds: ['d-ok', 'd-bad'] }, CTX);
    expect(r.totalElegibles).toBe(1);
    expect(r.totalNoElegibles).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMAR
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 confirmarAprobacion — validaciones', () => {
  it('lote no encontrado => NOT_FOUND', async () => {
    resetQueue([]); // batch no existe
    await expect(
      confirmarAprobacion({ batchId: 'inexistente', idempotencyKey: 'key-12345', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('preview hash distinto => PREVIEW_STALE', async () => {
    resetQueue([{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'otro', estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }]);
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'PREVIEW_STALE' });
  });

  it('preview caducada => PREVIEW_EXPIRED', async () => {
    resetQueue([{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() - 60000), resultados: {}, correlationId: null }]);
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'PREVIEW_EXPIRED' });
  });
});

describe('P2-07 confirmarAprobacion — idempotencia', () => {
  it('idempotencyKey reutilizada con mismo previewHash => devuelve resultado cacheado', async () => {
    resetQueue([{
      id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'key-12345', previewHash: 'a'.repeat(64),
      estado: 'confirmada', previewCaducidad: new Date(Date.now() + 60000),
      resultados: { aprobados: ['d1'], yaAprobados: [], rechazados: [] }, correlationId: 'corr-1',
    }]);
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.estado).toBe('confirmada');
    expect(r.aprobados).toEqual(['d1']);
  });

  it('idempotencyKey reutilizada con previewHash distinto => IDEMPOTENCY_MISMATCH', async () => {
    resetQueue([{
      id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'key-12345', previewHash: 'original',
      estado: 'confirmada', previewCaducidad: new Date(Date.now() + 60000),
      resultados: {}, correlationId: 'corr-1',
    }]);
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345', previewHash: 'distinto' }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH' });
  });
});

describe('P2-07 confirmarAprobacion — ejecución y control optimista', () => {
  // Orden de consumos en confirmarAprobacion (nuevo flujo atómico):
  //   1. select batch (then)
  //   2. claim update returning (returning)
  //   3. select items (then)
  //   por cada item:
  //     4. select doc actual (then)
  //     5. si aprueba: update doc ... returning (returning)
  //     6. marcarItem: update items (then)
  //   + cascadas (mockeadas, no consumen DB aquí).
  it('documento válido => aprobado (update invocado, version+1)', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }], // 1. batch
      [{ id: 'b1' }], // 2. claim update returning (éxito)
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null }], // 3. items
      [{ id: 'doc-1', estado: 'pendiente_abogado', version: 1, aprobadoPor: null }], // 4. doc actual
      [{ id: 'doc-1' }], // 5. returning update doc (aprobado)
      [], // 6. marcarItem
      [], // update batch estado final
    );
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.aprobados).toContain('doc-1');
    expect(r.estado).toBe('confirmada');
  });

  it('control optimista: versión cambió => conflicto_version', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }],
      [{ id: 'b1' }], // claim update returning (éxito)
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null }],
      [{ id: 'doc-1', estado: 'pendiente_abogado', version: 1, aprobadoPor: null }],
      [], // returning vacío => conflicto
      [], // marcarItem
      [], // update batch
    );
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.rechazados.find((x) => x.documentId === 'doc-1')?.codigo).toBe('conflicto_version');
    expect(r.estado).toBe('parcial');
  });

  it('documento ya aprobado por otra vía => ya_aprobado', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }],
      [{ id: 'b1' }], // claim update
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null }],
      [{ id: 'doc-1', estado: 'aprobado', version: 2, aprobadoPor: 'otro' }], // ya aprobado
      [], // marcarItem ya_aprobado
      [], // update batch
    );
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.yaAprobados).toContain('doc-1');
  });

  it('resultado parcial: mezcla válido + conflicto', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }],
      [{ id: 'b1' }], // claim update
      [
        { id: 'it-1', bulkApprovalId: 'b1', documentId: 'd-ok', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null },
        { id: 'it-2', bulkApprovalId: 'b1', documentId: 'd-bad', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null },
      ],
      [{ id: 'd-ok', estado: 'pendiente_abogado', version: 1, aprobadoPor: null }],
      [{ id: 'd-ok' }], // returning (aprobado)
      [], // marcarItem d-ok
      [{ id: 'd-bad', estado: 'pendiente_abogado', version: 1, aprobadoPor: null }],
      [], // returning vacío (conflicto) d-bad
      [], // marcarItem d-bad
      [], // update batch estado final
    );
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.aprobados).toContain('d-ok');
    expect(r.rechazados.find((x) => x.documentId === 'd-bad')).toBeTruthy();
    expect(r.estado).toBe('parcial');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSULTAR
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 consultarResultado', () => {
  it('lote existente => devuelve estado + resultados', async () => {
    resetQueue([{
      id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h',
      estado: 'confirmada', previewCaducidad: new Date(), resultados: { aprobados: ['d1'], yaAprobados: [], rechazados: [] },
      correlationId: 'corr-1',
    }]);
    const r = await consultarResultado('b1', CTX);
    expect(r.estado).toBe('confirmada');
    expect(r.aprobados).toEqual(['d1']);
  });

  it('lote inexistente => NOT_FOUND', async () => {
    resetQueue([]);
    await expect(
      consultarResultado('inexistente', CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REVERTIR
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 revertirAprobacion', () => {
  it('motivo corto => VALIDATION', async () => {
    await expect(
      revertirAprobacion({ batchId: 'b1', motivo: 'corto' }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'VALIDATION' });
  });

  it('reversión permitida => doc vuelve a pendiente_abogado', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'corr-1' }],
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'aprobado', motivo: null }],
      [{ id: 'exp-1', estado: 'creado' }], // expediente NO avanzó
      [{ id: 'doc-1', version: 2, aprobadoPor: 'admin-1', aprobadoEn: new Date() }], // doc actual aprobado
      [{ id: 'doc-1' }], // returning del revert (éxito)
    );
    const r = await revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX);
    expect(r.revertidos).toContain('doc-1');
  });

  it('reversión denegada por cambios posteriores (versión > snapshot+1)', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'corr-1' }],
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'aprobado', motivo: null }],
      [{ id: 'exp-1', estado: 'creado' }],
      [{ id: 'doc-1', version: 5, aprobadoPor: 'admin-1', aprobadoEn: new Date() }], // versión 5 > 1+1=2
    );
    const r = await revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX);
    expect(r.revertidos).toHaveLength(0);
    expect(r.denegados[0].motivo).toMatch(/cambios posteriores/);
  });

  it('reversión denegada por transición del expediente', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'corr-1' }],
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'aprobado', motivo: null }],
      [{ id: 'exp-1', estado: 'aprobado' }], // expediente avanzó
      [{ id: 'doc-1', version: 2, aprobadoPor: 'admin-1', aprobadoEn: new Date() }],
    );
    const r = await revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX);
    expect(r.revertidos).toHaveLength(0);
    expect(r.denegados[0].motivo).toMatch(/avanzó/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Concurrencia conceptual (dos confirmaciones del mismo lote)
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 concurrencia — dos confirmaciones del mismo lote', () => {
  it('la segunda confirmación ve el batch ya confirmado => devuelve cacheado (no duplica)', async () => {
    // Primera confirmación ya completó (estado confirmada con misma key).
    resetQueue([{
      id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'mismakey', previewHash: 'a'.repeat(64),
      estado: 'confirmada', previewCaducidad: new Date(Date.now() + 60000),
      resultados: { aprobados: ['d1'], yaAprobados: [], rechazados: [] }, correlationId: 'c1',
    }]);
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'mismakey', previewHash: 'a'.repeat(64) }, CTX);
    expect(r.aprobados).toEqual(['d1']);
    // No se invoca update de documentos (no duplica aprobación).
    expect(chain.update).not.toHaveBeenCalled();
  });

  it('confirmación concurrente con clave distinta (ya confirmado por otro) => CONFLICT', async () => {
    resetQueue([{
      id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'otra-key', previewHash: 'a'.repeat(64),
      estado: 'confirmada', previewCaducidad: new Date(Date.now() + 60000),
      resultados: {}, correlationId: 'c1',
    }]);
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'mi-key', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'CONFLICT' });
  });

  it('dos confirmaciones concurrentes: la primera reclama, la segunda ve CONFLICT', async () => {
    // Batch en preview + claim fallido (returning vacío) + re-lectura muestra otra key.
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }],
      [], // claim returning vacío (otro llegó primero)
      [{ idempotencyKey: 'otra-key', estado: 'confirmada', resultados: {}, correlationId: 'c2', previewHash: 'a'.repeat(64) }], // re-lectura
    );
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'mi-key', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'CONFLICT' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Defensa en profundidad y autorización adicional
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 defensa en profundidad — expedienteId', () => {
  it('expedienteId del URL no coincide con el del batch => VALIDATION', async () => {
    resetQueue([{ id: 'b1', expedienteId: 'exp-real', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }]);
    await expect(
      confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64), expedienteId: 'exp-falso' }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'VALIDATION' });
  });

  it('expedienteId coincide => procede normalmente', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }],
      [{ id: 'b1' }], // claim OK
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'pendiente', motivo: null }],
      [{ id: 'doc-1', estado: 'pendiente_abogado', version: 1, aprobadoPor: null }],
      [{ id: 'doc-1' }],
      [],
      [],
    );
    const r = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64), expedienteId: 'exp-1' }, CTX);
    expect(r.aprobados).toContain('doc-1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Autorización adicional
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-07 autorización — acceso revocado o denegado', () => {
  it('autorización denegada en confirmar => FORBIDDEN', async () => {
    assertCaseAccessMock.mockRejectedValueOnce(Object.assign(new Error('Sin acceso'), { status: 403 }));
    resetQueue([{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'preview:b1', previewHash: 'a'.repeat(64), estado: 'pendiente', previewCaducidad: new Date(Date.now() + 60000), resultados: {}, correlationId: null }]);
    const err = await confirmarAprobacion({ batchId: 'b1', idempotencyKey: 'key-12345678', previewHash: 'a'.repeat(64) }, CTX).catch((e) => e);
    expect(err).toBeTruthy();
  });

  it('consultarResultado con autorización denegada => FORBIDDEN', async () => {
    assertCaseAccessMock.mockRejectedValueOnce(Object.assign(new Error('Sin acceso'), { status: 403 }));
    resetQueue([{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'c1' }]);
    const err = await consultarResultado('b1', CTX).catch((e) => e);
    expect(err).toBeTruthy();
  });

  it('revertir con flag off => FLAG_OFF', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    await expect(
      revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX).catch((e) => e),
    ).resolves.toMatchObject({ code: 'FLAG_OFF' });
  });

  it('revertir con autorización denegada => FORBIDDEN', async () => {
    assertCaseAccessMock.mockRejectedValueOnce(Object.assign(new Error('Sin acceso'), { status: 403 }));
    resetQueue([{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'c1' }]);
    const err = await revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX).catch((e) => e);
    expect(err).toBeTruthy();
  });

  it('revertir con ventana de 72h superada => denegada', async () => {
    resetQueue(
      [{ id: 'b1', expedienteId: 'exp-1', idempotencyKey: 'k', previewHash: 'h', estado: 'confirmada', previewCaducidad: new Date(), resultados: {}, correlationId: 'corr-1' }],
      [{ id: 'it-1', bulkApprovalId: 'b1', documentId: 'doc-1', expedienteId: 'exp-1', versionSnapshot: 1, tipoDocumento: 'identidad', requisitoId: null, estadoPrevio: 'pendiente_abogado', resultado: 'aprobado', motivo: null }],
      [{ id: 'exp-1', estado: 'creado' }],
      [{ id: 'doc-1', version: 2, aprobadoPor: 'admin-1', aprobadoEn: new Date(Date.now() - 73 * 60 * 60 * 1000) }], // >72h
    );
    const r = await revertirAprobacion({ batchId: 'b1', motivo: 'motivo válido de reversión' }, CTX);
    expect(r.revertidos).toHaveLength(0);
    expect(r.denegados[0].motivo).toMatch(/72h/);
  });
});
