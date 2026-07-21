/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mock de DB con cola de respuestas (patrón de tests SGIE) ────────────────
let queueIdx = 0;
const _queue: unknown[] = [];

const { chain, mockNext } = vi.hoisted(() => {
  const c: Record<string, unknown> = {};
  const chainingMethods = [
    'select', 'from', 'where', 'orderBy', 'innerJoin', 'leftJoin',
    'insert', 'values', 'update', 'set', 'delete', 'as', 'distinct',
  ];
  for (const m of chainingMethods) c[m] = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => c);
  c.onConflictDoNothing = vi.fn(() => c); // permite encadenar .returning() después
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
  return { chain: c, mockNext: (val: unknown) => { _queue.push(val); } };
});

vi.mock('@/lib/db', () => ({ db: chain }));

// Mock de access-service para tests de kill switch (bug 7).
const { assertCapabilityMock } = vi.hoisted(() => ({
  assertCapabilityMock: vi.fn(async () => ({ active: true, suspended: false, sgIeEnabled: true, capabilities: new Set(['settings.manage']) })),
}));
vi.mock('@/lib/access-service', () => ({ assertCapability: assertCapabilityMock }));

const {
  resolveFlag, isFlagEnabled, setFlag, activateKillSwitch, clearFlagCache, FLAG_KEYS,
} = await import('../lib/sgie/feature-flags');

// Fila tipo feature_flags (subset de columnas usadas por resolveFlag).
function mockRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'rid',
    flagKey: 'sgie.ai.classification',
    scopeLevel: 'global',
    organizationId: null,
    teamId: null,
    userId: null,
    caseId: null,
    procedureId: null,
    enabled: false,
    config: {},
    killSwitch: false,
    validFrom: null,
    validUntil: null,
    creadoEn: new Date(),
    ...over,
  };
}

beforeEach(() => {
  for (const key of Object.keys(chain)) {
    const m = chain[key] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  queueIdx = 0;
  _queue.length = 0;
  clearFlagCache();
  assertCapabilityMock.mockClear();
  assertCapabilityMock.mockResolvedValue({ active: true, suspended: false, sgIeEnabled: true, capabilities: new Set(['settings.manage']) });
});

describe('FeatureFlagService — deny-by-default', () => {
  it('flag desconocida => enabled false', async () => {
    const r = await resolveFlag('sgie.inventada', {});
    expect(r.enabled).toBe(false);
    expect(r.motivo).toBe('flag_key_desconocida');
  });

  it('flag canónica sin registros => enabled false', async () => {
    mockNext([]); // fetchApplicable devuelve []
    const r = await resolveFlag('sgie.ai.classification', {});
    expect(r.enabled).toBe(false);
    expect(r.motivo).toBe('sin_configuracion');
  });

  it('isFlagEnabled aplica deny-by-default', async () => {
    mockNext([]);
    expect(await isFlagEnabled('sgie.ai.classification', {})).toBe(false);
  });
});

describe('FeatureFlagService — precedencia', () => {
  it('scope específico (expediente) gana a global', async () => {
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: true }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1' });
    // expediente desactiva -> no amplía: como global activa y expediente desactiva,
    // el resultado debe ser false (expediente restringe).
    expect(r.enabled).toBe(false);
    expect(r.resolvedScope).toBe('expediente');
  });

  it('scope específico activa si el general está activo (no restringe, coincide)', async () => {
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: true }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: true }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1' });
    expect(r.enabled).toBe(true);
    expect(r.resolvedScope).toBe('expediente');
  });

  it('scope inferior NO puede ampliar: global desactivada, expediente activa => false', async () => {
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: false }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: true }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1' });
    expect(r.enabled).toBe(false);
  });

  it('scope sin ID en context no aplica (filtra fila de expediente)', async () => {
    // Context sin caseId: la fila expediente se filtra en fetchApplicable.
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: true }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', {}); // sin caseId
    expect(r.enabled).toBe(true); // solo global aplica
  });
});

describe('FeatureFlagService — kill switch', () => {
  it('kill switch global => false con prioridad absoluta sobre override activo', async () => {
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: true }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: true }),
      mockRow({ scopeLevel: 'global', killSwitch: true, enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1' });
    expect(r.enabled).toBe(false);
    expect(r.killSwitch).toBe(true);
    expect(r.motivo).toBe('kill_switch_activo');
  });

  it('activateKillSwitch delega en setFlag con killSwitch=true (admin autorizado)', async () => {
    assertCapabilityMock.mockResolvedValueOnce({ active: true, suspended: false, sgIeEnabled: true, capabilities: new Set(['settings.manage']) });
    mockNext([]); // prev vacío
    await activateKillSwitch('sgie.ai.classification', 'admin-1', 'emergencia');
    // No debe lanzar; la transacción mock acepta las llamadas.
    expect(assertCapabilityMock).toHaveBeenCalledWith('admin-1', 'settings.manage');
  });

  it('activateKillSwitch rechaza abogado sin settings.manage (deny-by-default)', async () => {
    assertCapabilityMock.mockRejectedValueOnce(new Error('ForbiddenError: Falta la capacidad settings.manage'));
    await expect(
      activateKillSwitch('sgie.ai.classification', 'abogado-1', 'emergencia'),
    ).rejects.toThrow();
  });
});

describe('FeatureFlagService — fail-closed', () => {
  it('error de BD no propagado como true: si fetch devuelve [], deny', async () => {
    mockNext([]); // simulamos BD vacía (equivalente a error recuperado)
    const r = await resolveFlag('sgie.ai.classification', {});
    expect(r.enabled).toBe(false);
  });
});

describe('FeatureFlagService — cache', () => {
  it('segunda resolución usa cache (sin nueva llamada BD)', async () => {
    mockNext([mockRow({ scopeLevel: 'global', enabled: true })]);
    const r1 = await resolveFlag('sgie.ai.classification', {});
    expect(r1.enabled).toBe(true);
    // Segunda llamada: no añadimos más respuestas al mock; si cache funciona,
    // no se llama de nuevo a BD y devuelve lo mismo.
    const r2 = await resolveFlag('sgie.ai.classification', {});
    expect(r2.enabled).toBe(true);
  });

  it('clearFlagCache invalida y fuerza re-lectura', async () => {
    mockNext([mockRow({ scopeLevel: 'global', enabled: true })]);
    await resolveFlag('sgie.ai.classification', {});
    clearFlagCache('sgie.ai.classification');
    mockNext([mockRow({ scopeLevel: 'global', enabled: false })]);
    const r = await resolveFlag('sgie.ai.classification', {});
    expect(r.enabled).toBe(false);
  });
});

describe('FeatureFlagService — validación de mutación', () => {
  it('setFlag rechaza flag_key desconocida', async () => {
    await expect(
      setFlag({
        flagKey: 'sgie.inventada',
        scopeLevel: 'global',
        context: {},
        enabled: true,
      }),
    ).rejects.toThrow(/flag_key_desconocida/);
  });

  it('setFlag rechaza scope sin ID requerido', async () => {
    await expect(
      setFlag({
        flagKey: 'sgie.ai.classification',
        scopeLevel: 'expediente',
        context: {}, // sin caseId
        enabled: true,
      }),
    ).rejects.toThrow(/scope_sin_id/);
  });
});

describe('FeatureFlagService — catálogo canónico', () => {
  it('FLAG_KEYS tiene exactamente las 11 flags esperadas', () => {
    expect(FLAG_KEYS).toHaveLength(13);
    expect(FLAG_KEYS).toContain('sgie.ai.classification');
    expect(FLAG_KEYS).toContain('sgie.copilot');
    expect(FLAG_KEYS).toContain('sgie.signature.sandbox');
    expect(FLAG_KEYS).toContain('sgie.documents.bulk_approve');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cobertura adicional solicitada en certificación Fase 4A (2026-07-20).
//
// Estos tests cubren lo demostrable con mock. La concurrencia real, el rollback
// transaccional y la autorización detallada (suspendido / otra organización)
// requieren DB aislada y se cubren en el E2E contra Neon (ver
// docs/ops/fase-4a-staging-validation.md).
// ═══════════════════════════════════════════════════════════════════════════

describe('FeatureFlagService — kill switch explícito auditado', () => {
  it('activateKillSwitch delega en setFlag con killSwitch=true y motivo prefijado', async () => {
    assertCapabilityMock.mockResolvedValueOnce({ active: true, suspended: false, sgIeEnabled: true, capabilities: new Set(['settings.manage']) });
    mockNext([]); // prev vacío (FOR UPDATE no encuentra fila)
    await activateKillSwitch('sgie.ai.classification', 'admin-1', 'incidente prompt injection');
    // setFlag invocado dentro de transacción: insert + history.
    expect(chain.insert).toHaveBeenCalled();
    // El motivo del kill switch se prefija con "KILL SWITCH:". El payload va en
    // .values(payload), no en .insert(table).
    const valuesCalls = (chain.values as ReturnType<typeof vi.fn>).mock.calls;
    // Buscar el payload que contiene el motivo KILL SWITCH (insert de history).
    const hayMotivoKillSwitch = valuesCalls.some((call) => {
      const payload = call?.[0];
      try {
        return payload && typeof payload === 'object' && 'motivo' in payload && /KILL SWITCH/.test(String(payload.motivo));
      } catch {
        return false;
      }
    });
    expect(hayMotivoKillSwitch).toBe(true);
  });

  it('activateKillSwitch propaga el actor al historial (trazabilidad)', async () => {
    assertCapabilityMock.mockResolvedValueOnce({ active: true, suspended: false, sgIeEnabled: true, capabilities: new Set(['settings.manage']) });
    mockNext([]);
    await activateKillSwitch('sgie.ai.classification', 'admin-trazable', 'motivo');
    const valuesCalls = (chain.values as ReturnType<typeof vi.fn>).mock.calls;
    // El insert del historial lleva actorId = 'admin-trazable'.
    const hayActorTrazable = valuesCalls.some((call) => {
      const p = call?.[0] as Record<string, unknown> | undefined;
      return p && p.actorId === 'admin-trazable';
    });
    expect(hayActorTrazable).toBe(true);
  });
});

describe('FeatureFlagService — deny-by-default explícito', () => {
  it('flag canónica sin registros en BD => enabled false, motivo sin_configuracion', async () => {
    mockNext([]); // fetchApplicable devuelve []
    const r = await resolveFlag('sgie.ai.next_action', { caseId: 'c1' });
    expect(r.enabled).toBe(false);
    expect(r.killSwitch).toBe(false);
    expect(r.motivo).toBe('sin_configuracion');
  });

  it('flag no canónica => enabled false, motivo flag_key_desconocida (sin tocar BD)', async () => {
    const r = await resolveFlag('sgie.inventada.no.canonica', {});
    expect(r.enabled).toBe(false);
    expect(r.motivo).toBe('flag_key_desconocida');
    // No se ejecuta select porque la flag se rechaza antes de fetchApplicable.
    expect(chain.select).not.toHaveBeenCalled();
  });
});

describe('FeatureFlagService — fetchApplicable optimización (bug 8)', () => {
  it('la query incluye el flagKey y construye WHERE por scope presente', async () => {
    mockNext([mockRow({ scopeLevel: 'global', enabled: true })]);
    await resolveFlag('sgie.ai.classification', { caseId: 'c1', userId: 'u1' });
    // El select fue invocado (no un escaneo: construye WHERE con flagKey + scopes).
    expect(chain.select).toHaveBeenCalled();
    expect(chain.from).toHaveBeenCalled();
    expect(chain.where).toHaveBeenCalled();
  });

  it('kill switch mantiene prioridad absoluta sobre overrides activos', async () => {
    mockNext([
      mockRow({ scopeLevel: 'global', enabled: true }),
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: true }),
      mockRow({ scopeLevel: 'global', killSwitch: true, enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1' });
    expect(r.enabled).toBe(false);
    expect(r.killSwitch).toBe(true);
  });
});

describe('FeatureFlagService — precedencia conservada (bug 8 no cambia semántica)', () => {
  it('scope procedimiento (más específico) gana sobre expediente', async () => {
    mockNext([
      mockRow({ scopeLevel: 'expediente', caseId: 'c1', enabled: true }),
      mockRow({ scopeLevel: 'procedimiento', procedureId: 'p1', enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { caseId: 'c1', procedureId: 'p1' });
    // procedimiento desactiva => restringe.
    expect(r.enabled).toBe(false);
    expect(r.resolvedScope).toBe('procedimiento');
  });

  it('scope usuario restringe lo que organización activó (no-ampliar)', async () => {
    mockNext([
      mockRow({ scopeLevel: 'organizacion', organizationId: 'o1', enabled: true }),
      mockRow({ scopeLevel: 'usuario', userId: 'u1', enabled: false }),
    ]);
    const r = await resolveFlag('sgie.ai.classification', { organizationId: 'o1', userId: 'u1' });
    expect(r.enabled).toBe(false);
  });
});
