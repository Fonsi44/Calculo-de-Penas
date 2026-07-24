/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mock DB ───────────────────────────────────────────────────────────────────
// vi.hoisted runs before vi.mock factories (vitest hoisting semantics)

const { chain } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  const methods = [
    'select', 'from', 'where', 'orderBy', 'innerJoin',
    'insert', 'values', 'onConflictDoNothing',
    'update', 'set', 'limit', 'offset', 'returning', 'execute', 'transaction',
  ];
  for (const m of methods.filter(x => !['limit', 'offset', 'returning', 'execute', 'transaction'].includes(x))) {
    c[m] = vi.fn(() => c);
  }
  c.limit = vi.fn(() => Promise.resolve([]));
  c.offset = vi.fn(() => Promise.resolve([]));
  c.returning = vi.fn(() => Promise.resolve([]));
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  c.then = vi.fn((onfulfilled?: (v: unknown) => unknown) => Promise.resolve([]).then(onfulfilled));
  c.catch = vi.fn((onrejected?: (v: unknown) => unknown) => Promise.resolve([]).catch(onrejected));
  return { chain: c };
});

vi.mock('@/lib/db', () => ({ db: chain }));

vi.mock('@/lib/sgie/auditoria-sgie', () => ({
  logSgie: vi.fn(),
}));

const mockGetIaConfig = vi.fn();
const mockIsIaEnabled = vi.fn();
const mockLlamarIaDocumental = vi.fn();

vi.mock('@/lib/sgie/ia-documental', () => ({
  getIaConfig: (...args: unknown[]) => mockGetIaConfig(...args),
  isIaEnabled: (...args: unknown[]) => mockIsIaEnabled(...args),
  llamarIaDocumental: (...args: unknown[]) => mockLlamarIaDocumental(...args),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { encolarJob, reclamarJobs, completarJob, fallarJob, recuperarLocksAbandonados, obtenerMetricas } from '../lib/sgie/jobs-db';
import { encolarEvento, OUTBOX_EVENTS, completarEvento } from '../lib/sgie/outbox';
import { validarVersionAprobada, obtenerFaseActual } from '../lib/sgie/workflow';
import { compensarBlobHuerfano } from '../lib/sgie/upload-atomico';
import { getOcrProvider } from '../lib/sgie/ocr/provider';
import { routingDecision, ejecutarTarea } from '../lib/sgie/ia-router';
import { obtenerEstadoIntegraciones } from '../lib/sgie/observabilidad';
import { suprimirDestinatario, cancelarRecordatoriosSiCumplido } from '../lib/sgie/correos-db';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function returning<T>(val: T) {
  (chain.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce(val);
}

function whereResolved<T>(val: T) {
  (chain.where as ReturnType<typeof vi.fn>).mockResolvedValueOnce(val);
}

function executeRows(rows: Record<string, unknown>[]) {
  (chain.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows, rowCount: rows.length });
}

beforeEach(() => {
  for (const key of Object.keys(chain)) {
    const m = chain[key] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
});

// ─── 1. Job queue ──────────────────────────────────────────────────────────────

describe('jobs-db', () => {
  describe('encolarlJob', () => {
    it('creates a job and returns id', async () => {
      returning([{ id: 'job-1' }]);

      const result = await encolarJob({ tipo: 'extraccion_texto', refId: 'doc-1' });

      expect(result).toEqual({ id: 'job-1', duplicado: false });
    });

    it('with same idempotencyKey returns duplicado', async () => {
      whereResolved([{ id: 'existing-job' }]);

      const result = await encolarJob({ tipo: 'extraccion_texto', idempotencyKey: 'dup-key' });

      expect(result).toEqual({ id: 'existing-job', duplicado: true });
    });
  });

  describe('reclamarJobs', () => {
    it('returns only pending jobs', async () => {
      executeRows([
        { id: 'j1', tipo: 'extraccion_texto', estado: 'en_proceso' },
        { id: 'j2', tipo: 'notificacion', estado: 'en_proceso' },
      ]);

      const jobs = await reclamarJobs('worker-1', 10);

      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toMatchObject({ id: 'j1' });
    });
  });

  describe('completarJob', () => {
    it('marks as completado', async () => {
      await expect(completarJob('job-1')).resolves.toBeUndefined();
    });
  });

  describe('fallarJob', () => {
    it('increments attempts and sets nextRunAt with backoff', async () => {
      whereResolved([{ intentos: 1, maxIntentos: 3 }]);

      await fallarJob('job-1', 'error de prueba');

      const setCall = (chain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.intentos).toBe(2);
      expect(setCall.estado).toBe('pendiente');
      expect(setCall.nextRunAt).toBeInstanceOf(Date);
    });

    it('moves to DLQ after maxAttempts', async () => {
      // First whereResolved → fallarJob reads intentos/maxIntentos
      // Second whereResolved → moverADeadLetter reads full job data
      (chain.where as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ intentos: 2, maxIntentos: 3 }])
        .mockResolvedValueOnce([{ tipo: 'extraccion_texto', refId: 'doc-1', payload: {}, intentos: 2 }]);

      await fallarJob('job-1', 'error final');

      expect(chain.transaction).toHaveBeenCalled();
    });
  });

  describe('recuperarLocksAbandonados', () => {
    it('recovers expired locks', async () => {
      executeRows([{ id: 'l1' }, { id: 'l2' }]);

      const recovered = await recuperarLocksAbandonados(5);

      expect(recovered).toBe(2);
    });
  });

  describe('obtenerMetricas', () => {
    it('returns correct counts', async () => {
      (chain.where as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ n: 5 }])
        .mockResolvedValueOnce([{ n: 3 }])
        .mockResolvedValueOnce([{ n: 1 }])
        .mockResolvedValueOnce([{ n: 20 }])
        .mockResolvedValueOnce([{ n: 2 }])
        .mockReturnValueOnce(chain);

      const metrics = await obtenerMetricas();

      expect(metrics.pendientes).toBe(5);
      expect(metrics.en_proceso).toBe(3);
      expect(metrics.fallidos).toBe(1);
      expect(metrics.completados).toBe(20);
      expect(metrics.dead_letter).toBe(2);
    });
  });
});

// ─── 2. Transactional outbox ───────────────────────────────────────────────────

describe('outbox', () => {
  describe('encolarEvento', () => {
    it('creates outbox event', async () => {
      const fakeEvent = {
        id: 'evt-1',
        eventType: 'case.created',
        aggregateType: 'case',
        aggregateId: 'case-1',
        payload: { expedienteId: 'e1' },
        status: 'pending',
        creadoEn: new Date(),
      };
      returning([fakeEvent]);

      const evento = await encolarEvento({
        tipo: 'case.created',
        aggregateType: 'case',
        aggregateId: 'case-1',
        payload: { expedienteId: 'e1' },
      });

      expect(evento.id).toBe('evt-1');
      expect(evento.eventType).toBe('case.created');
    });
  });

  describe('OUTBOX_EVENTS', () => {
    it('constants are defined', () => {
      expect(OUTBOX_EVENTS.CASE_CREATED).toBe('case.created');
      expect(OUTBOX_EVENTS.WORKFLOW_INSTANTIATED).toBe('workflow.instantiated');
      expect(OUTBOX_EVENTS.DOCUMENT_UPLOADED).toBe('document.uploaded');
      expect(OUTBOX_EVENTS.COMMUNICATION_REQUESTED).toBe('communication.requested');
      expect(OUTBOX_EVENTS.REQUIREMENT_COMPLETED).toBe('requirement.completed');
      expect(Object.keys(OUTBOX_EVENTS)).toHaveLength(27);
    });
  });

  describe('completarEvento', () => {
    it('marks as completed', async () => {
      await expect(completarEvento('evt-1')).resolves.toBeUndefined();
    });
  });
});

// ─── 3. Workflow engine ────────────────────────────────────────────────────────

describe('workflow', () => {
  describe('validarVersionAprobada', () => {
    it('rejects non-approved versions', async () => {
      const result = await validarVersionAprobada('proc-1');

      expect(result).toBe(false);
    });
  });

  describe('obtenerFaseActual', () => {
    it('returns null for non-existent expediente', async () => {
      const result = await obtenerFaseActual('nonexistent');

      expect(result).toBeNull();
    });
  });
});

// ─── 4. Upload atómico ─────────────────────────────────────────────────────────

describe('upload-atomico', () => {
  describe('compensarBlobHuerfano', () => {
    it('creates cleanup event', async () => {
      await compensarBlobHuerfano('https://blob.example.com/orphan.pdf');

      const insertCall = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertCall).toBeDefined();
    });
  });
});

// ─── 5. OCR provider ───────────────────────────────────────────────────────────

describe('ocr/provider', () => {
  describe('StubOcrProvider', () => {
    it('returns success:false', async () => {
      const provider = getOcrProvider();
      const result = await provider.processDocument({ buffer: new ArrayBuffer(0), mimeType: 'image/png' });

      expect(result.success).toBe(false);
      expect(result.pages).toEqual([]);
      expect(result.method).toBe('ocr');
      expect(result.error).toContain('OCR no configurado');
    });

    it('isConfigured returns false for stub', () => {
      const provider = getOcrProvider();
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('getOcrProvider', () => {
    it('returns stub by default', () => {
      const provider = getOcrProvider();
      expect(provider.name).toBe('stub');
    });
  });
});

// ─── 6. AI Router ──────────────────────────────────────────────────────────────

describe('ia-router', () => {
  beforeEach(() => {
    delete process.env.IA_DOCUMENTAL_MODE;
    delete process.env.DOCUMENT_AI_MODE;
    delete process.env.IA_DOCUMENTAL_API_KEY;
    mockGetIaConfig.mockReturnValue({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      mode: 'heuristic',
      timeoutMs: 60000,
      maxRetries: 2,
    });
    mockIsIaEnabled.mockReturnValue(false);
  });

  describe('routingDecision', () => {
    it('returns heuristic for empty text', () => {
      const decision = routingDecision('extraction', {}, '');

      expect(decision.estrategia).toBe('heuristic');
    });

    it('returns deepseek_pro for complex text when enabled', () => {
      mockIsIaEnabled.mockReturnValue(true);
      mockGetIaConfig.mockReturnValue({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: 'sk-xxxxxxxxxxxxxx',
        mode: 'ai',
        timeoutMs: 60000,
        maxRetries: 2,
      });
      process.env.DOCUMENT_AI_MODE = 'ai';

      const longText = 'x'.repeat(2500);
      const decision = routingDecision('extraction', { tipoDocumento: 'contrato', textoLength: longText.length }, longText);

      expect(decision.estrategia).toBe('deepseek_pro');
    });
  });

  describe('ejecutarTarea', () => {
    it('returns result when IA disabled', async () => {
      // Force AI mode so classification starts as deepseek, then degrades
      process.env.DOCUMENT_AI_MODE = 'ai';
      mockIsIaEnabled.mockReturnValue(false);
      mockGetIaConfig.mockReturnValue({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        mode: 'disabled',
        timeoutMs: 60000,
        maxRetries: 2,
      });
      returning([{ id: 'task-1' }]);

      const result = await ejecutarTarea('doc-1', 'classification', {
        textoExtraido: 'x'.repeat(500),
        nombreOriginal: 'doc.pdf',
        tipoMime: 'application/pdf',
      });

      expect(result.ok).toBe(true);
      expect(result.estrategia).toBe('deterministic');
      expect(result.taskId).toBe('task-1');
    });
  });
});

// ─── 7. Observabilidad ─────────────────────────────────────────────────────────

describe('observabilidad', () => {
  beforeEach(() => {
    delete process.env.OCR_PROVIDER;
    delete process.env.RESEND_API_KEY;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    mockGetIaConfig.mockReturnValue({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      mode: 'disabled',
      timeoutMs: 60000,
      maxRetries: 2,
    });
  });

  describe('obtenerEstadoIntegraciones', () => {
    it('detects when integrations are not configured', () => {
      const estado = obtenerEstadoIntegraciones();

      expect(estado.ocr.configurado).toBe(false);
      expect(estado.ocr.proveedor).toBe('stub');
      expect(estado.ia.configurado).toBe(false);
      expect(estado.ia.modo).toBe('disabled');
      expect(estado.resend.configurado).toBe(false);
      expect(estado.blob.configurado).toBe(false);
    });

    it('status is deterministic', () => {
      process.env.OCR_PROVIDER = 'tesseract';
      process.env.RESEND_API_KEY = 're_xxx';
      process.env.BLOB_READ_WRITE_TOKEN = 'blob_token';
      mockGetIaConfig.mockReturnValue({
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: 'sk-xxxxxxxxxxxxxx',
        mode: 'ai',
        timeoutMs: 60000,
        maxRetries: 2,
      });

      const estado = obtenerEstadoIntegraciones();

      expect(estado.ocr.configurado).toBe(true);
      expect(estado.ocr.proveedor).toBe('tesseract');
      expect(estado.ia.configurado).toBe(true);
      expect(estado.ia.modo).toBe('ai');
      expect(estado.resend.configurado).toBe(true);
      expect(estado.blob.configurado).toBe(true);
    });
  });
});

// ─── 8. Correos DB ─────────────────────────────────────────────────────────────

describe('correos-db', () => {
  describe('suprimirDestinatario', () => {
    it('should not throw without DB', async () => {
      const result = await suprimirDestinatario('test@example.com');

      expect(result).toEqual({ suprimidos: 0 });
    });
  });

  describe('cancelarRecordatoriosSiCumplido', () => {
    it('returns cancelados 0 when no pending reminders', async () => {
      const result = await cancelarRecordatoriosSiCumplido('exp-1', 'req-1');

      expect(result).toEqual({ cancelados: 0 });
    });
  });
});
