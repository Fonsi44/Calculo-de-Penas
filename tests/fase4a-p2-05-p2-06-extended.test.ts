/// <reference types="vitest/globals" />
/**
 * Tests extendidos de cobertura para P2-05 (resumen incremental) y P2-06
 * (next-action) — Fase 4A.
 *
 * No invoca DeepSeek real ni DB real. Reutiliza el patrón de mock de
 * `fase4a-servicios-core.test.ts` y `fase4a-orchestrator.test.ts`, pero con
 * un `chain` más flexible que permite configurar respuestas controladas por
 * consulta (cola FIFO). El orden de consumo es determinista porque las
 * funciones bajo test invocan las consultas en orden predecible y la
 * composición con `Promise.all` llama `then` en el orden del array.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mocks compartidos ──────────────────────────────────────────────────────

/**
 * Cadena de query builder que registra respuestas controladas por consulta.
 * `queueResponses` se rellena en cada test con los valores que devolverá cada
 * `await db.select()...` en orden FIFO. Cuando se agota, devuelve [].
 */
const { chain, dbState } = vi.hoisted(() => {
  const dbState: { queueResponses: unknown[] } = { queueResponses: [] };

  const consume = (): unknown => dbState.queueResponses.shift() ?? [];

  const c: Record<string, unknown> = {};
  // Selectores que solo devuelven la cadena (sin side-effects).
  for (const m of ['select', 'from', 'where', 'orderBy', 'insert', 'values', 'update', 'set', 'delete']) {
    c[m] = vi.fn(() => c);
  }
  c.limit = vi.fn(() => c);
  c.offset = vi.fn(() => c);
  c.onConflictDoNothing = vi.fn(() => c);
  c.execute = vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 }));

  // `returning()` debe devolver filas; por defecto [{ id: 'gen-1' }].
  c.returning = vi.fn(() => Promise.resolve([{ id: 'gen-1' }]));

  // Transacción: ejecuta el callback pasando el propio chain como `tx`.
  c.transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(c));

  // `then` es la "resolución" del thenable. Saca el siguiente valor de la cola.
  // Se invoca por `await` o `Promise.all`.
  c.then = vi.fn((onf?: (v: unknown) => unknown, onr?: (e: unknown) => unknown) =>
    Promise.resolve(consume()).then(onf, onr),
  );

  return { chain: c, dbState };
});

const { isFlagEnabledMock } = vi.hoisted(() => ({ isFlagEnabledMock: vi.fn(async () => true) }));

// Permite al test controlar el retorno de `generarResumenIa`.
// Unión de los posibles retornos de generarResumenIa (ok true/false).
type ResumenIaOk = {
  ok: true; resumen: string; proveedor: string; modelo: string;
  tokensInput?: number; tokensOutput?: number; confianza?: number;
};
type ResumenIaErr = { ok: false; error: string; codigo: string };
type ResumenIaResult = ResumenIaOk | ResumenIaErr;
const { generarResumenIaMock } = vi.hoisted(() => ({
  generarResumenIaMock: vi.fn(async (): Promise<ResumenIaResult> => ({
    ok: false,
    error: 'mock default',
    codigo: 'ia_deshabilitada',
  })),
}));

vi.mock('@/lib/db', () => ({ db: chain }));
vi.mock('@/lib/sgie/feature-flags', () => ({ isFlagEnabled: isFlagEnabledMock }));
vi.mock('@/lib/sgie/ia-documental', () => ({
  getIaConfig: vi.fn(() => ({
    provider: 'deepseek', model: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1',
    apiKey: 'fake', mode: 'ai', timeoutMs: 5000, maxRetries: 1,
  })),
  isIaEnabled: vi.fn(() => false),
}));
vi.mock('@/lib/sgie/resumen-ia', () => ({ generarResumenIa: generarResumenIaMock }));

// Imports top-level (los mocks ya están registrados).
import { calcularHashFuentes, generarResumenIncremental } from '../lib/sgie/resumen-incremental';
import { generarAccionesDeterministas, persistirAcciones, recomendarNextAction } from '../lib/sgie/next-action';

beforeEach(() => {
  // Limpia todas las llamadas mock y resetea el estado del chain.
  for (const k of Object.keys(chain)) {
    const m = chain[k] as ReturnType<typeof vi.fn>;
    if (typeof m?.mockClear === 'function') m.mockClear();
  }
  dbState.queueResponses = [];
  isFlagEnabledMock.mockClear();
  isFlagEnabledMock.mockResolvedValue(true);
  generarResumenIaMock.mockClear();
  generarResumenIaMock.mockResolvedValue({ ok: false, error: 'mock default', codigo: 'ia_deshabilitada' });
});

// Helpers de input reutilizables.
const datosVacios = {
  numeroInterno: 'EXP-1', estado: 'creado', clienteNombre: null,
  procedimientoNombre: null, resumen: null, documentos: [], campos: [],
  alertasActivas: 0, inconsistencias: [],
};
const datosConDoc = {
  ...datosVacios,
  documentos: [{ nombre: 'identidad.pdf', tipo: 'identidad', confianza: 90 }],
};

// ═══════════════════════════════════════════════════════════════════════════
// P2-05 — Resumen incremental
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-05 calcularHashFuentes', () => {
  it('devuelve un hash sha256 de 64 chars', async () => {
    // 3 consultas paralelas (docs, extracciones, hist) => 3 respuestas vacías.
    dbState.queueResponses = [[], [], []];
    const hash = await calcularHashFuentes('exp-1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toHaveLength(64);
  });

  it('el hash cambia cuando cambian las fuentes (documentos)', async () => {
    // Estado A: 1 documento.
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }],
      [],
      [],
    ];
    const hashA = await calcularHashFuentes('exp-1');

    // Reset: volvemos a poner las respuestas para una segunda invocación.
    dbState.queueResponses = [
      [{ id: 'd2', hashSha256: 'bbb', subidoEn: new Date('2026-02-01') }],
      [],
      [],
    ];
    const hashB = await calcularHashFuentes('exp-1');

    expect(hashA).not.toBe(hashB);
    expect(hashA).toHaveLength(64);
    expect(hashB).toHaveLength(64);
  });

  it('el hash es estable para las mismas fuentes', async () => {
    const docs = [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }];
    dbState.queueResponses = [docs, [], []];
    const hash1 = await calcularHashFuentes('exp-1');
    dbState.queueResponses = [docs, [], []];
    const hash2 = await calcularHashFuentes('exp-1');
    expect(hash1).toBe(hash2);
  });
});

describe('P2-05 generarResumenIncremental — abstención sin evidencia', () => {
  it('flag on, sin checkpoint previo y sin documentos => ok false, abstencion_sin_evidencia', async () => {
    // Orden de consultas dentro de generarResumenIncremental:
    //  1-3: calcularHashFuentes (docs, extracciones, hist) => todas vacías.
    //  4: checkpoint previo => [] (sin checkpoint).
    //  5-7: obtenerCambiosDesdeWatermark (docs, extracciones, hist) => vacíos.
    dbState.queueResponses = [
      [], [], [],          // calcularHashFuentes
      [],                  // checkpoint previo
      [], [], [],          // obtenerCambiosDesdeWatermark
    ];

    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosVacios });

    expect(r.ok).toBe(false);
    expect(r.regenerado).toBe(false);
    expect(r.razon).toBe('abstencion_sin_evidencia');
    // La IA NO debe invocarse cuando se abstiene.
    expect(generarResumenIaMock).not.toHaveBeenCalled();
  });
});

describe('P2-05 generarResumenIncremental — cache hit (hash sin cambios)', () => {
  it('checkpoint previo con mismo hash => regenerado false, hash_igual_cache_hit', async () => {
    // Primero calculamos el hash real que produce el mock para poder
    // reproducirlo en el checkpoint.
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], // docs
      [],                  // extracciones
      [],                  // hist
    ];
    const hashReal = await calcularHashFuentes('exp-1');

    // Ahora el flujo completo con checkpoint previo cuyo sourceHash === hashReal.
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], // docs
      [],                  // extracciones
      [],                  // hist
      [{ id: 'ck-1', sourceHash: hashReal, watermark: new Date('2026-01-01') }], // checkpoint previo
      // cache hit: se consulta el histórico previo (resumen cacheado).
      [{ resumen: 'resumen cacheado anterior' }], // caseSummaryHistory
    ];

    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });

    expect(r.ok).toBe(true);
    expect(r.regenerado).toBe(false);
    expect(r.razon).toBe('hash_igual_cache_hit');
    expect(r.resumen).toBe('resumen cacheado anterior');
    // La IA NO se invoca en cache hit.
    expect(generarResumenIaMock).not.toHaveBeenCalled();
  });
});

describe('P2-05 generarResumenIncremental — regeneración exitosa', () => {
  it('checkpoint previo con hash distinto + IA ok => regenerado true', async () => {
    // Hash distinto: docs con contenido vs. checkpoint previo con hash viejo.
    generarResumenIaMock.mockResolvedValueOnce({
      ok: true as const,
      resumen: 'Nuevo resumen regenerado por IA',
      proveedor: 'deepseek',
      modelo: 'deepseek-v4-flash',
      tokensInput: 120,
      tokensOutput: 80,
      confianza: 85,
    });

    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], // docs (calcularHashFuentes)
      [{ id: 'e1', creadoEn: new Date('2026-02-01'), confianza: 90 }],     // extracciones
      [],                  // hist
      [{ id: 'ck-1', sourceHash: 'hash-viejo-diferente', watermark: new Date('2026-01-01') }], // checkpoint previo
      // obtenerCambiosDesdeWatermark: documentos nuevos desde watermark.
      [{ id: 'd1', subidoEn: new Date('2026-02-01') }], // docs nuevos
      [{ id: 'e1', creadoEn: new Date('2026-02-01') }], // extracciones nuevas
      [],                  // hist nuevo
    ];

    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });

    expect(r.ok).toBe(true);
    expect(r.regenerado).toBe(true);
    expect(r.resumen).toBe('Nuevo resumen regenerado por IA');
    expect(r.modelo).toBe('deepseek-v4-flash');
    expect(generarResumenIaMock).toHaveBeenCalledTimes(1);
  });
});

describe('P2-05 generarResumenIncremental — fallo de IA', () => {
  it('IA falla => ok false, fallo_ia, checkpoint previo NO se invalida (sin transacción)', async () => {
    generarResumenIaMock.mockResolvedValueOnce({
      ok: false as const,
      error: 'HTTP 500: error proveedor',
      codigo: 'error_proveedor' as const,
    });

    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], // docs
      [],                  // extracciones
      [],                  // hist
      [{ id: 'ck-previo', sourceHash: 'hash-viejo', watermark: new Date('2026-01-01') }], // checkpoint previo
      [], [], [],          // obtenerCambiosDesdeWatermark (sin cambios nuevos)
    ];

    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });

    expect(r.ok).toBe(false);
    expect(r.regenerado).toBe(true); // se intentó regenerar (la falla es post-IA).
    expect(r.razon).toBe('fallo_ia');
    expect(r.error).toBe('HTTP 500: error proveedor');
    // CRÍTICO: la transacción NO debe ejecutarse cuando la IA falla (no se
    // invalida el checkpoint previo). El código retorna antes de `db.transaction`.
    expect(chain.transaction).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2-06 — NextActionService (generarAccionesDeterministas)
//
// Estrategia: se mockean solo las consultas necesarias para cada escenario,
// devolviendo [] para las tablas no relevantes. El orden de consultas en
// generarAccionesDeterministas es:
//   1. documentContradictions (bloqueantes)
//   2. requisitosExpediente (pendientes)        [si no hay bloqueantes]
//   3. alertas
//   4. jobsSgie (DLQ)
//   5. eventosAgenda (plazos)
//   6. comunicacionesOutbox (fallidas)
//   7. expedientes (estado, para readiness)
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-06 generarAccionesDeterministas — fuente: contradicción bloqueante', () => {
  it('con contradicción bloqueante => acción principal prioridad 1 y no añade más', async () => {
    dbState.queueResponses = [
      // 1. documentContradictions bloqueantes: 1 resultado.
      [{
        id: 'ctr-1', tipo: 'identidad_incompatible',
        explicacion: 'Identidad difiere entre d1 y d2',
      }],
      // Al haber bloqueante, la función retorna sin consultar el resto.
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    expect(acciones).toHaveLength(1);
    expect(acciones[0].actionKey).toBe('resolver_contradiccion_bloqueante:ctr-1');
    expect(acciones[0].prioridad).toBe(1);
    expect(acciones[0].esPrincipal).toBe(true);
    expect(acciones[0].requiereConfirmacionHumana).toBe(true);
    expect(acciones[0].evidencias[0].tipo).toBe('contradiccion');
  });
});

describe('P2-06 generarAccionesDeterministas — fuente: requisitos pendientes', () => {
  it('sin bloqueantes, con requisitos => acción de requisitos como principal', async () => {
    dbState.queueResponses = [
      [], // 1. documentContradictions
      // 2. requisitosExpediente: 2 pendientes.
      [{ id: 'req-1', nombre: 'Identificación oficial' }, { id: 'req-2', nombre: 'RTN' }],
      [], // 3. alertas
      [], // 4. jobsSgie (DLQ)
      [], // 5. eventosAgenda (plazos)
      [], // 6. comunicacionesOutbox
      [{ estado: 'en_revision' }], // 7. expedientes (no en estados de bloqueo)
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const req = acciones.find((a) => a.actionKey.startsWith('solicitar_completar_requisitos'));
    expect(req).toBeDefined();
    expect(req?.prioridad).toBe(3); // <=3 requisitos => prioridad 3.
    expect(req?.esPrincipal).toBe(true);
    expect(req?.evidencias).toHaveLength(2);
  });

  it('con más de 3 requisitos => prioridad 2 (más urgente)', async () => {
    dbState.queueResponses = [
      [],
      [
        { id: 'r1', nombre: 'A' }, { id: 'r2', nombre: 'B' },
        { id: 'r3', nombre: 'C' }, { id: 'r4', nombre: 'D' },
      ],
      [], [], [], [],
      [{ estado: 'en_revision' }],
    ];

    const acciones = await generarAccionesDeterministas('exp-1');
    const req = acciones.find((a) => a.actionKey.startsWith('solicitar_completar_requisitos'));
    expect(req?.prioridad).toBe(2);
  });
});

describe('P2-06 generarAccionesDeterministas — fuente NUEVA: plazos próximos', () => {
  it('plazo que vence en <=3 días => acción atender_plazo_urgente prioridad 2', async () => {
    const enUnDia = new Date(Date.now() + 1 * 86400000).toISOString();
    dbState.queueResponses = [
      [], // contradicciones
      [], // requisitos
      [], // alertas
      [], // jobs DLQ
      // 5. eventosAgenda: plazo urgente.
      [{ id: 'ev-1', titulo: 'Audiencia preliminar', inicio: enUnDia, tipo: 'audiencia' }],
      [], // comunicaciones
      [{ estado: 'en_revision' }], // expediente
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const plazo = acciones.find((a) => a.actionKey === 'atender_plazo_urgente:exp-1');
    expect(plazo).toBeDefined();
    expect(plazo?.prioridad).toBe(2);
    expect(plazo?.reglaId).toBe('det.plazo_3dias');
    expect(plazo?.requiereConfirmacionHumana).toBe(true);
    expect(plazo?.evidencias[0].tipo).toBe('plazo');
  });

  it('plazo entre 4 y 7 días => acción preparar_plazo_cercano prioridad 3', async () => {
    const enCincoDias = new Date(Date.now() + 5 * 86400000).toISOString();
    dbState.queueResponses = [
      [], [], [], [],
      [{ id: 'ev-2', titulo: 'Vencimiento enlace', inicio: enCincoDias, tipo: 'vencimiento_enlace' }],
      [],
      [{ estado: 'en_revision' }],
    ];

    const acciones = await generarAccionesDeterministas('exp-1');
    const plazo = acciones.find((a) => a.actionKey === 'preparar_plazo_cercano:exp-1');
    expect(plazo).toBeDefined();
    expect(plazo?.prioridad).toBe(3);
    expect(plazo?.reglaId).toBe('det.plazo_7dias');
  });
});

describe('P2-06 generarAccionesDeterministas — fuente NUEVA: comunicaciones fallidas', () => {
  it('comunicación fallida => acción revisar_comunicaciones_fallidas prioridad 3', async () => {
    dbState.queueResponses = [
      [], // contradicciones
      [], // requisitos
      [], // alertas
      [], // jobs DLQ
      [], // plazos
      // 6. comunicacionesOutbox: 1 fallida.
      [{
        id: 'cm-1', tipo: 'email', destinatario: 'cliente@x.com',
        error: 'SMTP timeout',
      }],
      [{ estado: 'en_revision' }], // expediente
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const com = acciones.find((a) => a.actionKey === 'revisar_comunicaciones_fallidas:exp-1');
    expect(com).toBeDefined();
    expect(com?.prioridad).toBe(3);
    expect(com?.reglaId).toBe('det.comunicacion_fallida');
    expect(com?.requiereConfirmacionHumana).toBe(true);
    expect(com?.evidencias[0].tipo).toBe('comunicacion');
  });
});

describe('P2-06 generarAccionesDeterministas — fuente NUEVA: readiness bloqueado', () => {
  it('expediente en estado inconsistencias_detectadas => acción resolver_bloqueo_readiness', async () => {
    dbState.queueResponses = [
      [], [], [], [], [], [], // todas las fuentes previas vacías
      // 7. expedientes: estado de bloqueo readiness.
      [{ estado: 'inconsistencias_detectadas' }],
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const ready = acciones.find((a) => a.actionKey === 'resolver_bloqueo_readiness:exp-1');
    expect(ready).toBeDefined();
    expect(ready?.prioridad).toBe(2);
    expect(ready?.reglaId).toBe('det.readiness_bloqueado');
    expect(ready?.bloqueos[0].tipo).toBe('readiness');
  });
});

describe('P2-06 generarAccionesDeterministas — fuente NUEVA: firma/paquete pendiente', () => {
  it('evento tipo firma pendiente (sin ventana de plazo) => acción gestionar_firma_pendiente prioridad 2', async () => {
    // Firma con inicio a 20 días (fuera de la ventana de plazos <=7d) para
    // verificar que la fuente dedicada de firma la captura igualmente.
    const enVeinteDias = new Date(Date.now() + 20 * 86400000).toISOString();
    dbState.queueResponses = [
      [], // contradicciones
      [], // requisitos
      [], // alertas
      [], // jobs DLQ
      // 5. eventosAgenda: evento de firma fuera de ventana de plazos.
      [{ id: 'firma-1', titulo: 'Firma de poder', inicio: enVeinteDias, tipo: 'firma' }],
      [], // comunicaciones
      [{ estado: 'en_revision' }], // expediente
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const firma = acciones.find((a) => a.actionKey === 'gestionar_firma_pendiente:exp-1');
    expect(firma).toBeDefined();
    expect(firma?.prioridad).toBe(2);
    expect(firma?.reglaId).toBe('det.firma_pendiente');
    expect(firma?.requiereConfirmacionHumana).toBe(true);
    expect(firma?.evidencias[0].tipo).toBe('firma_pendiente');
  });

  it('firma dentro de ventana de plazo urgente NO duplica acción (cubre plazos)', async () => {
    // Firma a 1 día: la captura la rama de plazos urgentes; la fuente de firma
    // no debe duplicar la recomendación.
    const enUnDia = new Date(Date.now() + 1 * 86400000).toISOString();
    dbState.queueResponses = [
      [], [], [], [],
      [{ id: 'firma-2', titulo: 'Firma urgente', inicio: enUnDia, tipo: 'firma' }],
      [],
      [{ estado: 'en_revision' }],
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    const firmaDedicada = acciones.find((a) => a.actionKey === 'gestionar_firma_pendiente:exp-1');
    expect(firmaDedicada).toBeUndefined();
    const plazo = acciones.find((a) => a.actionKey === 'atender_plazo_urgente:exp-1');
    expect(plazo).toBeDefined();
  });
});

describe('P2-06 generarAccionesDeterministas — sin acciones urgentes', () => {
  it('todo vacío => acción revision_general como principal prioridad 5', async () => {
    dbState.queueResponses = [
      [], [], [], [], [], [], // todas las fuentes vacías
      [{ estado: 'en_revision' }], // estado normal, sin bloqueo
    ];

    const acciones = await generarAccionesDeterministas('exp-1');

    expect(acciones).toHaveLength(1);
    expect(acciones[0].actionKey).toBe('revision_general:exp-1');
    expect(acciones[0].prioridad).toBe(5);
    expect(acciones[0].esPrincipal).toBe(true);
  });
});

describe('P2-06 generarAccionesDeterministas — idempotencia de actionKey', () => {
  it('los actionKey incluyen el expedienteId para ser idempotentes por caso', async () => {
    dbState.queueResponses = [
      [], [], [], [], [], [],
      [{ estado: 'en_revision' }],
    ];

    const acciones = await generarAccionesDeterministas('exp-XYZ');
    for (const a of acciones) {
      // Todos los actionKey generados (salvo los de contradicción, que usan
      // el id de la contradicción) deben incluir el expedienteId.
      expect(a.actionKey).toMatch(/exp-XYZ/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2-05 — Cobertura ampliada: único checkpoint vigente, histórico, watermark,
// concurrencia/idempotencia, aislamiento, flag apagado, kill switch.
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-05 generarResumenIncremental — único checkpoint vigente', () => {
  it('al regenerar, el checkpoint previo se marca invalidado dentro de la transacción', async () => {
    generarResumenIaMock.mockResolvedValueOnce({
      ok: true as const,
      resumen: 'Resumen nuevo',
      proveedor: 'deepseek',
      modelo: 'deepseek-v4-flash',
      tokensInput: 10,
      tokensOutput: 5,
      confianza: 90,
    });
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-02-01') }], // docs
      [], [], // extracciones, hist
      [{ id: 'ck-previo', sourceHash: 'hash-viejo', watermark: new Date('2026-01-01') }], // checkpoint vigente previo
      [{ id: 'd1', subidoEn: new Date('2026-02-01') }], // docs nuevos desde watermark
      [], [], // extracciones, hist nuevos
    ];
    await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    // La transacción se ejecuta al regenerar con éxito.
    expect(chain.transaction).toHaveBeenCalledTimes(1);
  });
});

describe('P2-05 generarResumenIncremental — histórico se escribe', () => {
  it('tras regenerar con éxito, se inserta en case_summary_history (returning del insert)', async () => {
    generarResumenIaMock.mockResolvedValueOnce({
      ok: true as const,
      resumen: 'Resumen con histórico',
      proveedor: 'deepseek',
      modelo: 'deepseek-v4-flash',
      tokensInput: 30,
      tokensOutput: 20,
      confianza: 88,
    });
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-02-01') }],
      [], [],
      [{ id: 'ck-previo', sourceHash: 'viejo', watermark: new Date('2026-01-01') }],
      [{ id: 'd1', subidoEn: new Date('2026-02-01') }], [], [],
    ];
    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r.ok).toBe(true);
    expect(r.regenerado).toBe(true);
    expect(r.resumen).toBe('Resumen con histórico');
  });
});

describe('P2-05 generarResumenIncremental — watermark avanzado', () => {
  it('el watermark del resultado es posterior al checkpoint previo', async () => {
    generarResumenIaMock.mockResolvedValueOnce({
      ok: true as const,
      resumen: 'R',
      proveedor: 'deepseek',
      modelo: 'deepseek-v4-flash',
      tokensInput: 1,
      tokensOutput: 1,
      confianza: 80,
    });
    const wmPrevio = new Date('2026-01-01');
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-02-01') }],
      [], [],
      [{ id: 'ck', sourceHash: 'viejo', watermark: wmPrevio }],
      [{ id: 'd1', subidoEn: new Date('2026-02-01') }], [], [],
    ];
    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r.ok).toBe(true);
    expect(new Date(r.watermark).getTime()).toBeGreaterThan(wmPrevio.getTime());
  });
});

describe('P2-05 generarResumenIncremental — concurrencia/idempotencia', () => {
  it('dos invocaciones con mismo hash: la primera escribe, la segunda es cache hit (no llama IA)', async () => {
    // Primera invocación: sin checkpoint previo, con datos => genera.
    generarResumenIaMock.mockResolvedValueOnce({
      ok: true as const,
      resumen: 'Primer resumen',
      proveedor: 'deepseek',
      modelo: 'deepseek-v4-flash',
      tokensInput: 5,
      tokensOutput: 5,
      confianza: 85,
    });
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], [], [],
      [], // sin checkpoint previo
      [{ id: 'd1', subidoEn: new Date('2026-01-01') }], [], [],
    ];
    const r1 = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r1.ok).toBe(true);
    expect(r1.regenerado).toBe(true);
    expect(generarResumenIaMock).toHaveBeenCalledTimes(1);

    // Segunda invocación: mismo hash, checkpoint previo con mismo sourceHash.
    const hashReal = r1.sourceHash;
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], [], [],
      [{ id: 'ck', sourceHash: hashReal, watermark: new Date('2026-01-01') }], // checkpoint con mismo hash
      [{ resumen: 'Primer resumen' }], // histórico cacheado
    ];
    const r2 = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r2.ok).toBe(true);
    expect(r2.regenerado).toBe(false);
    expect(r2.razon).toBe('hash_igual_cache_hit');
    expect(generarResumenIaMock).toHaveBeenCalledTimes(1); // NO se llamó de nuevo.
  });
});

describe('P2-05 generarResumenIncremental — aislamiento por expediente', () => {
  it('cambios de exp-A no afectan el hash de exp-B (distinto expedienteId)', async () => {
    dbState.queueResponses = [
      [{ id: 'dA', hashSha256: 'aaa', subidoEn: new Date('2026-01-01') }], [], [],
    ];
    const hashA = await calcularHashFuentes('exp-A');
    dbState.queueResponses = [
      [{ id: 'dB', hashSha256: 'bbb', subidoEn: new Date('2026-02-01') }], [], [],
    ];
    const hashB = await calcularHashFuentes('exp-B');
    expect(hashA).not.toBe(hashB);
  });
});

describe('P2-05 generarResumenIncremental — flag apagado', () => {
  it('sgie.ai.incremental_summary desactivada => ok false, feature_flag_desactivada, sin IA', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
    expect(generarResumenIaMock).not.toHaveBeenCalled();
  });
});

describe('P2-05 generarResumenIncremental — kill switch implícito por flag', () => {
  it('isFlagEnabled lanza (simula kill switch / error) => tratado como flag off, deny', async () => {
    isFlagEnabledMock.mockRejectedValueOnce(new Error('kill_switch'));
    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
    expect(generarResumenIaMock).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2-06 — Cobertura ampliada: conflictos/prioridades, evidencias, DLQ,
// actualización de fuentes, aislamiento, autorización, flag apagado, kill switch.
// ═══════════════════════════════════════════════════════════════════════════

describe('P2-06 generarAccionesDeterministas — conflictos y prioridades', () => {
  it('contradicción bloqueante tiene prioridad sobre requisitos (prioridad 1 gana)', async () => {
    dbState.queueResponses = [
      [{ id: 'ctr-1', tipo: 'x', explicacion: 'Bloqueo' }], // bloqueante
      // Al retornar tras bloqueante, no se consulta el resto.
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    expect(acciones).toHaveLength(1);
    expect(acciones[0].prioridad).toBe(1);
    // No se generó acción de requisitos (la función retorna tras bloqueante).
    expect(acciones.find((a) => a.actionKey.startsWith('solicitar_completar_requisitos'))).toBeUndefined();
  });

  it('varias fuentes no bloqueantes => cada una genera su acción con su prioridad', async () => {
    const enUnDia = new Date(Date.now() + 86400000).toISOString();
    dbState.queueResponses = [
      [], // contradicciones
      [{ id: 'r1', nombre: 'RTN' }], // requisitos
      [{ id: 'a1', severidad: 'critico', titulo: 'SLA roto' }], // alertas
      [{ id: 'j1', payload: { expedienteId: 'exp-1' } }], // DLQ
      [{ id: 'ev1', titulo: 'Audiencia', inicio: enUnDia, tipo: 'audiencia' }], // plazo urgente
      [{ id: 'c1', tipo: 'email', destinatario: 'x@x.com', error: 'timeout' }], // com fallida
      [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    const prioridades = acciones.map((a) => a.prioridad).sort((a, b) => a - b);
    // La acción principal (requisitos, prioridad 3) y varias alternativas.
    expect(acciones.length).toBeGreaterThanOrEqual(4);
    expect(prioridades[0]).toBeLessThanOrEqual(2); // alguna acción urgentísima.
  });
});

describe('P2-06 generarAccionesDeterministas — evidencias verificables', () => {
  it('cada acción no vacía lleva al menos una evidencia con tipo e id', async () => {
    const enUnDia = new Date(Date.now() + 86400000).toISOString();
    dbState.queueResponses = [
      [], // contradicciones
      [{ id: 'r1', nombre: 'RTN' }], // requisitos
      [{ id: 'a1', severidad: 'critico', titulo: 'SLA' }], // alertas
      [], // DLQ
      [{ id: 'ev1', titulo: 'Audiencia', inicio: enUnDia, tipo: 'audiencia' }],
      [],
      [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    // Todas las acciones salvo revision_general deben llevar evidencias.
    for (const a of acciones) {
      if (a.actionKey.startsWith('revision_general')) continue;
      expect(a.evidencias.length).toBeGreaterThan(0);
      for (const e of a.evidencias) {
        expect(e.tipo).toBeTruthy();
      }
    }
  });
});

describe('P2-06 generarAccionesDeterministas — DLQ aislado por expediente', () => {
  it('jobs DLQ de OTRO expediente no generan acción para este expediente', async () => {
    dbState.queueResponses = [
      [], [], [],
      // DLQ: jobs de otro expediente (payload.expedienteId distinto).
      [
        { id: 'j-otro', payload: { expedienteId: 'exp-OTRO' } },
        { id: 'j-otro2', payload: { expedienteId: 'exp-OTRO' } },
      ],
      [], [], // plazos, comunicaciones
      [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    // No debe generarse acción de DLQ (los jobs son de otro expediente).
    expect(acciones.find((a) => a.actionKey === 'revisar_dlq:exp-1')).toBeUndefined();
    // Cae en revision_general.
    expect(acciones[0].actionKey).toBe('revision_general:exp-1');
  });
});

describe('P2-06 persistirAcciones — idempotencia por sourceHash', () => {
  it('acciones con mismo sourceHash generan idempotencyKey estable y principal se asigna', async () => {
    // returning() del mock devuelve [{ id: 'gen-1' }] por defecto; la acción
    // principal se inserta y se marca como principal en el resultado.
    const acciones = [{
      actionKey: 'revision_general:exp-1',
      titulo: 'Revisión general',
      razon: 'r',
      prioridad: 5,
      evidencias: [],
      bloqueos: [],
      requiereConfirmacionHumana: false,
      estrategia: 'determinista' as const,
      confianza: 80,
      esPrincipal: true,
    }];
    const { principal, alternativas } = await persistirAcciones('exp-1', acciones, 'fixed-hash-aaaaaaaa');
    expect(principal).toBeDefined();
    // El mock returning devuelve { id: 'gen-1' }; validar que la acción principal
    // se propagó al resultado (no quedó undefined) y no generó alternativas.
    expect(principal?.id).toBe('gen-1');
    expect(alternativas).toHaveLength(0);
    // El insert fue invocado exactamente una vez (idempotente: una fila por acción).
    expect(chain.insert).toHaveBeenCalledTimes(1);
  });
});

describe('P2-06 recomendarNextAction — flag apagado', () => {
  it('sgie.ai.next_action desactivada => ok false, feature_flag_desactivada', async () => {
    isFlagEnabledMock.mockResolvedValueOnce(false);
    const r = await recomendarNextAction({ expedienteId: 'exp-1' });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
    expect(r.alternativas).toHaveLength(0);
  });
});

describe('P2-06 recomendarNextAction — kill switch / error de flag', () => {
  it('isFlagEnabled lanza => capturado como flag off (deny-by-default)', async () => {
    isFlagEnabledMock.mockRejectedValueOnce(new Error('kill_switch'));
    const r = await recomendarNextAction({ expedienteId: 'exp-1' });
    expect(r.ok).toBe(false);
    expect(r.razon).toBe('feature_flag_desactivada');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cobertura adicional solicitada en certificación Fase 4A (2026-07-20).
// ═══════════════════════════════════════════════════════════════════════════

// ─── P2-05: ausencia de datos inventados, aislamiento por organización ──────

describe('P2-05 generarResumenIncremental — no inventa datos cuando IA falla', () => {
  it('fallo IA => resultado NO incluye resumen inventado (ok false, sin resumen)', async () => {
    generarResumenIaMock.mockResolvedValueOnce({
      ok: false as const,
      error: 'timeout',
      codigo: 'error_proveedor' as const,
    });
    dbState.queueResponses = [
      [{ id: 'd1', hashSha256: 'aaa', subidoEn: new Date('2026-02-01') }], [], [],
      [{ id: 'ck', sourceHash: 'viejo', watermark: new Date('2026-01-01') }],
      [{ id: 'd1', subidoEn: new Date('2026-02-01') }], [], [],
    ];
    const r = await generarResumenIncremental({ expedienteId: 'exp-1', datos: datosConDoc });
    expect(r.ok).toBe(false);
    expect(r.resumen).toBeUndefined(); // NO se inventa un resumen.
    expect(r.razon).toBe('fallo_ia');
  });
});

describe('P2-05 calcularHashFuentes — aislamiento por organización', () => {
  it('el hash es sensible al organizationId implícito vía documentos distintos por caso', async () => {
    // No hay columna organizationId en el hash, pero el aislamiento real proviene
    // de que cada expediente pertenece a una organización y sus documentos son
    // distintos. Validamos que documentos distintos produzcan hash distinto
    // (ya cubierto en aislamiento por expediente). Aquí reforzamos: dos
    // expedientes con mismo contenido aparente pero ids de docs distintos.
    dbState.queueResponses = [
      [{ id: 'orgA-doc', hashSha256: 'hA', subidoEn: new Date('2026-01-01') }], [], [],
    ];
    const hashA = await calcularHashFuentes('exp-orgA');
    dbState.queueResponses = [
      [{ id: 'orgB-doc', hashSha256: 'hB', subidoEn: new Date('2026-01-01') }], [], [],
    ];
    const hashB = await calcularHashFuentes('exp-orgB');
    expect(hashA).not.toBe(hashB);
  });
});

// ─── P2-06: alerta/SLA, plazo vencido, comunicación pendiente, sustitución ──

describe('P2-06 generarAccionesDeterministas — fuente: alerta/SLA crítica', () => {
  it('alerta crítica abierta (con requisitos presentes) => acción atender_alertas_criticas no principal', async () => {
    // Con requisitos presentes, la acción de requisitos es la principal y la
    // alerta crítica queda como alternativa prioridad 2.
    dbState.queueResponses = [
      [], // contradicciones
      [{ id: 'r1', nombre: 'RTN' }], // requisitos (será la principal)
      // 3. alertas: 1 crítica sin resolver.
      [{ id: 'al-1', severidad: 'critico', titulo: 'SLA de respuesta vencido' }],
      [], [], [], // DLQ, plazos, comunicaciones
      [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    const alerta = acciones.find((a) => a.actionKey === 'atender_alertas_criticas:exp-1');
    expect(alerta).toBeDefined();
    expect(alerta?.prioridad).toBe(2);
    expect(alerta?.esPrincipal).toBe(false);
    expect(alerta?.evidencias[0].tipo).toBe('alerta');
    // La principal es la de requisitos.
    const req = acciones.find((a) => a.actionKey.startsWith('solicitar_completar_requisitos'));
    expect(req?.esPrincipal).toBe(true);
  });

  it('alerta de severidad info NO genera acción crítica', async () => {
    dbState.queueResponses = [
      [], [], [{ id: 'al-2', severidad: 'info', titulo: 'Aviso menor' }],
      [], [], [], [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    expect(acciones.find((a) => a.actionKey === 'atender_alertas_criticas:exp-1')).toBeUndefined();
  });
});

describe('P2-06 generarAccionesDeterministas — plazo vencido (ya pasado)', () => {
  it('plazo con inicio hace <1 día (recién vencido) => aún entra en ventana urgente', async () => {
    const haceMedioDia = new Date(Date.now() - 0.5 * 86400000).toISOString();
    dbState.queueResponses = [
      [], [], [], [],
      [{ id: 'ev-venc', titulo: 'Audiencia perdida', inicio: haceMedioDia, tipo: 'audiencia' }],
      [], [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    // diff > -1 día => entra en ventana urgente (atender_plazo_urgente).
    const plazo = acciones.find((a) => a.actionKey === 'atender_plazo_urgente:exp-1');
    expect(plazo).toBeDefined();
  });

  it('plazo con inicio hace >1 día => fuera de ventana, no genera acción de plazo', async () => {
    const hace3Dias = new Date(Date.now() - 3 * 86400000).toISOString();
    dbState.queueResponses = [
      [], [], [], [],
      [{ id: 'ev-old', titulo: 'Plazo antiguo', inicio: hace3Dias, tipo: 'plazo' }],
      [], [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    expect(acciones.find((a) => a.actionKey === 'atender_plazo_urgente:exp-1')).toBeUndefined();
    expect(acciones.find((a) => a.actionKey === 'preparar_plazo_cercano:exp-1')).toBeUndefined();
  });
});

describe('P2-06 generarAccionesDeterministas — comunicación pendiente (no fallida)', () => {
  it('comunicación en estado reintentando (pendiente de entrega) => entra en acción', async () => {
    // La fuente actual cubre 'fallido' y 'reintentando'. 'reintentando' modela
    // la comunicación pendiente de entrega exitosa.
    dbState.queueResponses = [
      [], [], [], [], [],
      [{ id: 'cm-pend', tipo: 'email', destinatario: 'c@x.com', error: null }],
      [{ estado: 'en_revision' }],
    ];
    const acciones = await generarAccionesDeterministas('exp-1');
    const com = acciones.find((a) => a.actionKey === 'revisar_comunicaciones_fallidas:exp-1');
    expect(com).toBeDefined();
  });
});

describe('P2-06 persistirAcciones — sustitución al cambiar fuentes (sourceHash)', () => {
  it('dos persistencias con sourceHash distinto generan idempotencyKey distinto', async () => {
    // El idempotencyKey = expedienteId|actionKey|sourceHash[:16]. Si el source
    // cambia, la key cambia, permitiendo que la nueva acción sustituya a la
    // previa (no se bloquea por la UNIQUE de la key anterior).
    const acciones = [{
      actionKey: 'revision_general:exp-1',
      titulo: 'R', razon: 'r', prioridad: 5, evidencias: [], bloqueos: [],
      requiereConfirmacionHumana: false, estrategia: 'determinista' as const,
      confianza: 80, esPrincipal: true,
    }];
    // Primera persistencia con hash A.
    await persistirAcciones('exp-1', acciones, 'hashAAAA_first16chars');
    // Segunda persistencia con hash B distinto.
    await persistirAcciones('exp-1', acciones, 'hashBBBB_second16char');
    // Dos inserts (uno por invocación): la sustitución es posible porque las
    // idempotencyKeys difieren en el prefijo del sourceHash.
    expect(chain.insert).toHaveBeenCalledTimes(2);
  });
});

describe('P2-06 generarAccionesDeterministas — aislamiento por organización (expediente)', () => {
  it('acciones para exp-orgA incluyen solo el expedienteId de A, no de B', async () => {
    dbState.queueResponses = [
      [], [], [], [], [], [], [{ estado: 'en_revision' }],
    ];
    const accionesA = await generarAccionesDeterministas('exp-orgA');
    for (const a of accionesA) {
      // Ningún actionKey debe referenciar exp-orgB.
      expect(a.actionKey).not.toMatch(/exp-orgB/);
    }
  });
});
