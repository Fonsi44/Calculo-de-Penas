/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

let queueIdx = 0;
const _queue: unknown[] = [];

const { chain, mockNext } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};

  const chainingMethods = [
    'select', 'from', 'where', 'orderBy', 'innerJoin', 'leftJoin',
    'insert', 'values', 'onConflictDoNothing',
    'update', 'set', 'distinct', 'as',
  ];
  for (const m of chainingMethods) {
    c[m] = vi.fn(() => c);
  }

  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => {
    const val = queueIdx < _queue.length ? _queue[queueIdx++] : undefined;
    return Promise.resolve(val !== undefined ? val : []);
  });
  c.returning = vi.fn(() => {
    const val = queueIdx < _queue.length ? _queue[queueIdx++] : undefined;
    return Promise.resolve(val !== undefined ? val : []);
  });
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));
  c.then = vi.fn((onfulfilled?: (v: unknown) => unknown) => {
    const val = queueIdx < _queue.length ? _queue[queueIdx++] : undefined;
    return Promise.resolve(val !== undefined ? val : []).then(onfulfilled);
  });
  c.catch = vi.fn((onrejected?: (v: unknown) => unknown) => {
    return Promise.resolve([]).catch(onrejected);
  });

  const mockNext = (val: unknown) => { _queue.push(val); };

  return { chain: c, mockNext };
});

vi.mock('@/lib/db', () => ({ db: chain }));
vi.mock('@/lib/sgie/auditoria-sgie', () => ({ logSgie: vi.fn() }));
vi.mock('@/lib/sgie/util', () => ({
  hashToken: vi.fn((token: string) => `hashed-${token}`),
}));

beforeEach(() => {
  for (const key of Object.keys(chain)) {
    const m = chain[key] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  queueIdx = 0;
  _queue.length = 0;
});

// Precargar los módulos bajo test una sola vez antes de los tests.
// Sin esto, el primer `await import()` dentro de un `it` paga el coste de
// cargar lib/schema.ts + drizzle-orm mientras corre el timer del test (5000ms),
// lo que provoca timeouts intermitentes cuando la suite completa corre en
// paralelo (menos CPU por worker). El `beforeAll` carga los módulos fuera del
// timer de cada test; los `await import()` posteriores devuelven la versión
// cacheada (sin coste). Los `vi.mock` de arriba se aplican a estas cargas.
beforeAll(async () => {
  await Promise.all([
    import('../lib/sgie/work-queue-service'),
    import('../lib/sgie/review-service'),
    import('../lib/sgie/admin-operations-service'),
    import('../lib/sgie/alertas-sla-service'),
    import('../lib/sgie/client-portal-service'),
    import('../lib/sgie/inbound-service'),
    import('../lib/sgie/communication-rules-service'),
    import('../lib/sgie/workflow-simulation-service'),
    import('../lib/sgie/ai-evaluation-service'),
  ]);
});

// ─── 1. WorkQueueService ───────────────────────────────────────────────────────

describe('WorkQueueService', () => {
  describe('obtenerRequiereMiDecision', () => {
    it('returns array sorted by priority', async () => {
      mockNext([
        { id: 't1', expedienteId: 'e1', expedienteNumero: 'EXP-001', titulo: 'Task 1', prioridad: 'alta', fechaVencimiento: null, estado: 'pendiente', creadaEn: new Date() },
      ]);
      mockNext([]);
      mockNext([]);

      const { obtenerRequiereMiDecision } = await import('../lib/sgie/work-queue-service');
      const result = await obtenerRequiereMiDecision('abogado-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].id).toBe('tarea-t1');
      expect(result[0].prioridad).toBe('alta');
    });

    it('returns empty array when all empty', async () => {
      const { obtenerRequiereMiDecision } = await import('../lib/sgie/work-queue-service');
      const result = await obtenerRequiereMiDecision('abogado-empty');
      expect(result).toEqual([]);
    });
  });
});

// ─── 2. ReviewService ───────────────────────────────────────────────────────────

describe('ReviewService', () => {
  describe('listarRevisionPendiente', () => {
    it('filters by confianzaBaja flag', async () => {
      mockNext([{ total: 1 }]);
      mockNext([
        { id: 'doc-1', expedienteId: 'e1', expedienteNumero: 'EXP-001', requNombre: 'ID', estado: 'pendiente_abogado', creadoEn: new Date() },
      ]);
      mockNext([{ confianza: null, paginas: 0 }]);
      mockNext([{ totalConfidence: null, resultadoJson: null }]);

      const { listarRevisionPendiente } = await import('../lib/sgie/review-service');
      const result = await listarRevisionPendiente(
        { confianzaBaja: true },
        { usuarioId: 'u1', esAdmin: true },
      );

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBe(1);
    });

    it('clamps limit above 100', async () => {
      mockNext([{ total: 0 }]);
      mockNext([]);

      const { listarRevisionPendiente } = await import('../lib/sgie/review-service');
      const result = await listarRevisionPendiente(
        { limit: 999 },
        { usuarioId: 'u1', esAdmin: true },
      );

      expect(result.items.length).toBe(0);
    });

    it('applies abogadoId filter for non-admin', async () => {
      mockNext([{ total: 5 }]);
      mockNext([]);

      const { listarRevisionPendiente } = await import('../lib/sgie/review-service');
      const result = await listarRevisionPendiente(
        { abogadoId: 'abogado-x' },
        { usuarioId: 'u1', esAdmin: false },
      );

      expect(result.total).toBe(5);
    });
  });
});

// ─── 3. AdminOperationsService ──────────────────────────────────────────────────

describe('AdminOperationsService', () => {
  describe('obtenerDashboardCompleto', () => {
    it('returns all dashboard groups with correct structure', async () => {
      const origDbUrl = process.env.DATABASE_URL;
      const origBlob = process.env.BLOB_READ_WRITE_TOKEN;
      const origCron = process.env.CRON_SECRET;
      const origResend = process.env.RESEND_API_KEY;
      process.env.DATABASE_URL = 'postgresql://test/test';
      process.env.BLOB_READ_WRITE_TOKEN = 'blob_test';
      process.env.CRON_SECRET = 'cron_test';
      process.env.RESEND_API_KEY = 're_test';

      // Promise.all: 16 queries
      // 4 end with .from(), 12 end with .where() — all resolve via chain.then
      mockNext([{ n: 0 }]);   // 1. deadLetterJobs (from)
      mockNext([{ n: 2 }]);   // 2. docAtascados (where)
      mockNext([{ n: 0 }]);   // 3. outboxFallidos (where)
      mockNext([{ n: 0 }]);   // 4. rebotes (where)
      mockNext([{ n: 0 }]);   // 5. ocrFallidos (where)
      mockNext([{ n: 0 }]);   // 6. iaFallidos (where)
      mockNext([{ n: 0 }]);   // 7. sinResp (where)
      mockNext([{ n: 10 }]);  // 8. usuarios (from)
      mockNext([{ n: 5 }]);   // 9. sgieActive (where)
      mockNext([{ n: 1 }]);   // 10. suspendidos (where)
      mockNext([{ n: 2 }]);   // 11. invPendientes (where)
      mockNext([{ n: 3 }]);   // 12. equipos (from)
      mockNext([{ n: 3 }]);   // 13. jobsPendientes (where)
      mockNext([{ n: 1 }]);   // 14. outboxPendientes (where)
      mockNext([{ n: 100 }]); // 15. ocrRealizados (from)
      mockNext([{ n: 50 }]);  // 16. iaRealizadas (where)

      // After Promise.all
      mockNext([{ n: 1 }]);                    // expedientesBloqueados
      mockNext([{ n: 0 }]);                    // revisionesAntiguas
      mockNext([{ completadoEn: new Date() }]);// ultimoJob → .limit() consumes this

      const { obtenerDashboardCompleto } = await import('../lib/sgie/admin-operations-service');
      const dashboard = await obtenerDashboardCompleto();

      expect(dashboard).toHaveProperty('incidencias');
      expect(dashboard).toHaveProperty('riesgo');
      expect(dashboard).toHaveProperty('personas');
      expect(dashboard).toHaveProperty('automatizacion');
      expect(dashboard).toHaveProperty('salud');
      expect(dashboard.incidencias).toHaveProperty('jobsDlq');
      expect(dashboard.incidencias.documentosAtascados).toBe(2);
      expect(dashboard.personas.totalUsuarios).toBe(10);
      expect(dashboard.personas.activosSgie).toBe(5);
      expect(dashboard.automatizacion.ocrRealizados).toBe(100);
      expect(dashboard.salud.worker).toBe(true);

      if (origDbUrl !== undefined) process.env.DATABASE_URL = origDbUrl; else delete process.env.DATABASE_URL;
      if (origBlob !== undefined) process.env.BLOB_READ_WRITE_TOKEN = origBlob; else delete process.env.BLOB_READ_WRITE_TOKEN;
      if (origCron !== undefined) process.env.CRON_SECRET = origCron; else delete process.env.CRON_SECRET;
      if (origResend !== undefined) process.env.RESEND_API_KEY = origResend; else delete process.env.RESEND_API_KEY;
    });
  });
});

// ─── 4. AlertasSlaService ──────────────────────────────────────────────────────

describe('AlertasSlaService', () => {
  describe('cambiarEstadoAlerta', () => {
    it('throws when alerta not found', async () => {
      const { cambiarEstadoAlerta } = await import('../lib/sgie/alertas-sla-service');
      await expect(cambiarEstadoAlerta('nonexistent', 'resuelta')).rejects.toThrow('Alerta no encontrada');
    });

    it('accepts valid estado values', async () => {
      mockNext([{ id: 'a1', resuelta: false }]);
      const { cambiarEstadoAlerta } = await import('../lib/sgie/alertas-sla-service');
      await expect(cambiarEstadoAlerta('a1', 'resuelta')).resolves.toBeUndefined();
    });

    it('accepts en_progreso, pospuesta, descartada_con_motivo', async () => {
      const { cambiarEstadoAlerta } = await import('../lib/sgie/alertas-sla-service');

      mockNext([{ id: 'a2', resuelta: false }]);
      await expect(cambiarEstadoAlerta('a2', 'en_progreso')).resolves.toBeUndefined();

      mockNext([{ id: 'a3', resuelta: false }]);
      await expect(cambiarEstadoAlerta('a3', 'pospuesta')).resolves.toBeUndefined();

      mockNext([{ id: 'a4', resuelta: false }]);
      await expect(cambiarEstadoAlerta('a4', 'descartada_con_motivo')).resolves.toBeUndefined();
    });
  });
});

// ─── 5. ClientPortalService ────────────────────────────────────────────────────

describe('ClientPortalService', () => {
  describe('obtenerPortalPorToken', () => {
    it('returns error for invalid token', async () => {
      const { obtenerPortalPorToken } = await import('../lib/sgie/client-portal-service');
      const result = await obtenerPortalPorToken('invalid-token');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Enlace inválido, expirado o revocado');
      }
    });

    it('returns error when enlace is expired', async () => {
      mockNext([]);

      const { obtenerPortalPorToken } = await import('../lib/sgie/client-portal-service');
      const result = await obtenerPortalPorToken('expired-token');

      expect(result.ok).toBe(false);
    });
  });
});

// ─── 6. InboundService ─────────────────────────────────────────────────────────

describe('InboundService', () => {
  describe('verificarWebhookResend', () => {
    beforeEach(() => {
      delete process.env.RESEND_WEBHOOK_SECRET;
      delete process.env.RESEND_SIGNING_SECRET;
      vi.resetModules();
    });

    it('returns false (fail-closed) when no signing secret configured', async () => {
      const { verificarWebhookResend } = await import('../lib/sgie/inbound-service');
      const result = verificarWebhookResend('{}', { 'svix-id': 'x', 'svix-timestamp': '1', 'svix-signature': 'v1,aaa' });
      expect(result).toBe(false);
    });

    it('returns false when Svix headers are missing', async () => {
      process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
      const { verificarWebhookResend } = await import('../lib/sgie/inbound-service');
      const result = verificarWebhookResend('{"key":"value"}', {});
      expect(result).toBe(false);
    });

    it('returns true when verifyResendWebhook accepts (delegación Svix)', async () => {
      process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
      vi.doMock('@/lib/webhook-verify', () => ({
        verifyResendWebhook: vi.fn().mockReturnValue({ ok: true }),
      }));
      const { verificarWebhookResend } = await import('../lib/sgie/inbound-service');
      const result = verificarWebhookResend('{}', { 'svix-id': 'x', 'svix-timestamp': '1', 'svix-signature': 'v1,aaa' });
      expect(result).toBe(true);
    });

    it('returns false when verifyResendWebhook rejects', async () => {
      process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
      vi.doMock('@/lib/webhook-verify', () => ({
        verifyResendWebhook: vi.fn().mockReturnValue({ ok: false, reason: 'bad sig' }),
      }));
      const { verificarWebhookResend } = await import('../lib/sgie/inbound-service');
      const result = verificarWebhookResend('{}', { 'svix-id': 'x', 'svix-timestamp': '1', 'svix-signature': 'v1,aaa' });
      expect(result).toBe(false);
    });

    it('acepta alias obsoleto RESEND_SIGNING_SECRET (compatibilidad)', async () => {
      process.env.RESEND_SIGNING_SECRET = 'whsec_legacy';
      vi.doMock('@/lib/webhook-verify', () => ({
        verifyResendWebhook: vi.fn().mockReturnValue({ ok: true }),
      }));
      const { verificarWebhookResend } = await import('../lib/sgie/inbound-service');
      const result = verificarWebhookResend('{}', { 'svix-id': 'x', 'svix-timestamp': '1', 'svix-signature': 'v1,aaa' });
      expect(result).toBe(true);
    });
  });
});

// ─── 7. CommunicationRulesService ───────────────────────────────────────────────

describe('CommunicationRulesService', () => {
  describe('simularRegla', () => {
    it('throws when regla not found', async () => {
      const { simularRegla } = await import('../lib/sgie/communication-rules-service');
      await expect(simularRegla('nonexistent', 'exp-1')).rejects.toThrow('Regla/plantilla no encontrada');
    });

    it('returns simulation result for valid regla', async () => {
      mockNext([{ id: 'r1', nombre: 'Test Rule', slug: 'test-rule', estado: 'activa', variablesPermitidas: [] }]);
      mockNext([{ n: 0 }]);

      const { simularRegla } = await import('../lib/sgie/communication-rules-service');
      const result = await simularRegla('r1', 'exp-1');

      expect(result).toHaveProperty('regla');
      expect(result).toHaveProperty('simulacion');
      expect(result.simulacion.seEnviaria).toBe(true);
      expect(result.simulacion.expedienteId).toBe('exp-1');
      expect(result.simulacion.enviadosPreviamente).toBe(0);
    });
  });
});

// ─── 8. WorkflowSimulationService ───────────────────────────────────────────────

describe('WorkflowSimulationService', () => {
  describe('simularWorkflow', () => {
    it('detects loops in bidirectional transitions', async () => {
      mockNext([{ id: 'v1' }]);
      mockNext([
        { id: 'f1', nombre: 'Revisión inicial', orden: 1, procedimientoVersionId: 'v1', slug: 'rev-inicial' },
        { id: 'f2', nombre: 'Análisis jurídico', orden: 2, procedimientoVersionId: 'v1', slug: 'analisis' },
      ]);
      mockNext([
        { id: 't1', desdeFaseId: 'f1', haciaFaseId: 'f2', nombre: 'avance', condiciones: null, procedimientoVersionId: 'v1', actoresPermitidos: ['abogado'] },
        { id: 't2', desdeFaseId: 'f2', haciaFaseId: 'f1', nombre: 'revision', condiciones: null, procedimientoVersionId: 'v1', actoresPermitidos: ['abogado'] },
      ]);

      const { simularWorkflow } = await import('../lib/sgie/workflow-simulation-service');
      const result = await simularWorkflow('v1', { rol: 'abogado', eventos: [] });

      expect(result).toHaveProperty('fases');
      expect(result).toHaveProperty('transiciones');
      expect(result).toHaveProperty('loops');
      expect(result.loops.some((l: string) => l.includes('Bucle'))).toBe(true);
    });

    it('returns empty fases when no phases defined', async () => {
      mockNext([{ id: 'v1' }]);
      mockNext([]);

      const { simularWorkflow } = await import('../lib/sgie/workflow-simulation-service');
      const result = await simularWorkflow('v1', { rol: 'abogado', eventos: [] });

      expect(result.fases).toEqual([]);
      expect(result.bloqueos).toContain('El procedimiento no tiene fases definidas');
    });
  });
});

// ─── 9. AiEvaluationService ─────────────────────────────────────────────────────

describe('AiEvaluationService', () => {
  describe('obtenerMetricasIA', () => {
    it('returns valid structure with zero values', async () => {
      const { obtenerMetricasIA } = await import('../lib/sgie/ai-evaluation-service');
      const metrics = await obtenerMetricasIA();

      expect(metrics).toHaveProperty('totalTareas');
      expect(metrics).toHaveProperty('tareasCompletadas');
      expect(metrics).toHaveProperty('costeTotalTokens');
      expect(metrics.costeTotalTokens).toHaveProperty('input');
      expect(metrics.costeTotalTokens).toHaveProperty('output');
      expect(metrics).toHaveProperty('latenciaPromedio');
      expect(metrics).toHaveProperty('tareasConCorreccion');
      expect(typeof metrics.totalTareas).toBe('number');
      expect(typeof metrics.tareasCompletadas).toBe('number');
      expect(typeof metrics.costeTotalTokens.input).toBe('number');
      expect(typeof metrics.costeTotalTokens.output).toBe('number');
      expect(typeof metrics.latenciaPromedio).toBe('number');
      expect(typeof metrics.tareasConCorreccion).toBe('number');
    });

    it('returns correct aggregated values', async () => {
      mockNext([{ n: 10 }]);   // totalTareas (ends with .from())
      mockNext([{ n: 8 }]);    // tareasCompletadas (ends with .where())
      mockNext([{ totalInput: 1000, totalOutput: 500, avgLatencia: 250 }]); // extrasTotal (ends with .from())
      mockNext([{ n: 2 }]);    // correcciones (ends with .from())

      const { obtenerMetricasIA } = await import('../lib/sgie/ai-evaluation-service');
      const metrics = await obtenerMetricasIA();

      expect(metrics.totalTareas).toBe(10);
      expect(metrics.tareasCompletadas).toBe(8);
      expect(metrics.costeTotalTokens.input).toBe(1000);
      expect(metrics.costeTotalTokens.output).toBe(500);
      expect(metrics.latenciaPromedio).toBe(250);
      expect(metrics.tareasConCorreccion).toBe(2);
    });
  });
});
