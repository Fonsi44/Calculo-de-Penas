/**
 * Fase 3 — DeepSeek Blog Review: Tests con mocks de fetch
 *
 * Verifica el módulo lib/ai/deepseek-blog-review.ts sin llamadas reales a la API.
 * Mockea global.fetch para simular todos los escenarios de respuesta/error.
 *
 * Se usa vi.useFakeTimers() globalmente para controlar los setTimeout internos
 * (sleep, retry delays, AbortController timeout) sin esperas reales.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  reviewArticle,
  getProviderInfo,
  DEEPSEEK_MODEL,
} from '@/lib/ai/deepseek-blog-review';
import type { ReviewArticleInput, GoogleEvidence, DeepSeekReviewOutput } from '@/lib/ai/deepseek-blog-review';

// ─── Constantes del módulo (replicadas para aserciones) ─────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 120_000;

// ─── Fixtures ───────────────────────────────────────────────────────────────
const sampleEvidence: GoogleEvidence = {
  claims: ['El divorcio en Honduras requiere causal'],
  searchQueries: ['divorcio Honduras código familia'],
  officialSourcesOpened: [],
  sourceExcerpts: 'Fragmento de evidencia...',
};

const sampleInput: ReviewArticleInput = {
  title: 'El divorcio en Honduras',
  body: 'Texto de prueba sobre divorcio en Honduras. Este es un artículo de blog.',
  slug: 'divorcio-honduras',
  extractedClaims: ['El divorcio en Honduras requiere causal'],
  evidence: sampleEvidence,
};

function createSuccessOutput(): DeepSeekReviewOutput {
  return {
    claims: [
      {
        claim: 'El divorcio en Honduras requiere causal',
        classification: 'confirmed',
        jurisdiction: 'HN',
        officialSource: {
          institution: 'Congreso Nacional de Honduras',
          title: 'Código de Familia',
          url: 'https://www.poderjudicial.gob.hn/codigo-familia',
          law: 'Código de Familia',
          article: 'Artículo 233',
          publishedAt: '1984-01-01',
          consultedAt: '2025-01-15',
        },
        sourceExcerptSummary: 'El Código de Familia establece causales de divorcio...',
        analysisProvider: 'DeepSeek',
        analysisModel: DEEPSEEK_MODEL,
        confidence: 'high',
        originalText: 'El divorcio en Honduras requiere causal',
        correctedText: 'El divorcio en Honduras requiere causal específica',
        correctionReason: 'Precisión menor',
        requiresHumanReview: false,
      },
    ],
    summary: 'Análisis completado con alta confianza',
    overallConfidence: 'high',
  };
}

function fetchJsonOk(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  };
}

function fetchError(status: number, body = '') {
  return {
    ok: false,
    status,
    text: async () => body || `Error ${status}`,
  };
}

/**
 * reviewArticle retries up to MAX_RETRIES on any error, sleeping
 * RETRY_DELAY_MS * attempt between attempts.
 * Total sleep for retry loop: 2000 + 4000 = 6000ms.
 */
async function advanceReviewArticleAllRetries(): Promise<void> {
  // reviewArticle intento 1 → falla → sleep(2000) → intento 2 → falla → sleep(4000) → intento 3 → throw
  await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 1); // 2000ms
  await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2); // 4000ms
}

/**
 * callDeepSeek retries 429 up to MAX_RETRIES times, sleeping
 * RETRY_DELAY_MS * attempt between retries.
 * Total sleep for full callDeepSeek retry cycle: 2000 + 4000 + 6000 = 12000ms.
 */
async function advanceCallDeepSeekAllRetries(): Promise<void> {
  await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 1); // 2000ms
  await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2); // 4000ms
  await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 3); // 6000ms
}

// ─── Test Suite ─────────────────────────────────────────────────────────────
describe('Fase 3 — DeepSeek Blog Review', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_BASE_URL;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Key absent
  // ──────────────────────────────────────────────────────────────────────────
  it('lanza error si DEEPSEEK_API_KEY no está configurada', async () => {
    // Sin key, getApiKey() lanza. reviewArticle reintenta 3 veces con sleeps.
    const promise = reviewArticle(sampleInput);
    promise.catch(() => {}); // éviter unhandled rejection con fake timers
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Error 401
  // ──────────────────────────────────────────────────────────────────────────
  it('maneja error 401 correctamente', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-invalid';
    fetchMock.mockResolvedValue(fetchError(401, 'Unauthorized'));

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Error 429 con reintentos exitosos
  // ──────────────────────────────────────────────────────────────────────────
  it('reintenta en 429 y tiene éxito', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-ok';

    // callDeepSeek: fetch1=429, sleep(2000), fetch2=429, sleep(4000), fetch3=200
    fetchMock
      .mockResolvedValueOnce(fetchError(429))
      .mockResolvedValueOnce(fetchError(429))
      .mockResolvedValueOnce(
        fetchJsonOk({
          choices: [{ message: { content: JSON.stringify(createSuccessOutput()) } }],
        }),
      );

    const promise = reviewArticle(sampleInput);

    // Avanzar sleeps de callDeepSeek: 2000ms + 4000ms
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 1);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2);

    const result = await promise;
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].classification).toBe('confirmed');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Rate limit \(429\)/),
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Error 429 agotado (sin éxito)
  // ──────────────────────────────────────────────────────────────────────────
  it('falla tras agotar reintentos por 429', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-429';
    fetchMock.mockResolvedValue(fetchError(429));

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});

    // reviewArticle intento 1 → callDeepSeek: 4 fetch calls (falla tras 3 retries)
    //   sleeps callDeepSeek: 2000 + 4000 + 6000 = 12000ms
    //   sleep reviewArticle: 2000ms
    // reviewArticle intento 2 → callDeepSeek: 4 fetch calls
    //   sleeps: 2000 + 4000 + 6000 = 12000ms
    //   sleep reviewArticle: 4000ms
    // reviewArticle intento 3 → callDeepSeek: 4 fetch calls
    //   sleeps: 2000 + 4000 + 6000 = 12000ms

    for (let rAttempt = 1; rAttempt <= MAX_RETRIES; rAttempt++) {
      // callDeepSeek internal retries
      await advanceCallDeepSeekAllRetries();
      if (rAttempt < MAX_RETRIES) {
        // reviewArticle inter-iteration sleep
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * rAttempt);
      }
    }

    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
    // 12 fetches: 4 por intento reviewArticle (1 + 3 callDeepSeek retries) × 3
    expect(fetchMock).toHaveBeenCalledTimes(12);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Timeout (AbortController)
  // ──────────────────────────────────────────────────────────────────────────
  it('maneja timeout simulando AbortController', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-timeout';

    // Mock fetch que reacciona al abort signal pero nunca resuelve
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }
      });
    });

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});

    // Cada intento de reviewArticle: callDeepSeek timeout a 120s, luego sleep
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // callDeepSeek timeout
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);
      if (attempt < MAX_RETRIES) {
        // reviewArticle sleep entre intentos
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * attempt);
      }
    }

    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Respuesta no JSON
  // ──────────────────────────────────────────────────────────────────────────
  it('lanza error si la respuesta no es JSON válido', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-nonjson';
    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: 'esto no es JSON para nada' } }],
      }),
    );

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. JSON sin array "claims"
  // ──────────────────────────────────────────────────────────────────────────
  it('lanza error si la respuesta no contiene array "claims"', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-no-claims';
    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: JSON.stringify({ summary: 'sin claims' }) } }],
      }),
    );

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Respuesta vacía
  // ──────────────────────────────────────────────────────────────────────────
  it('lanza error si la respuesta está vacía', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-empty';
    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: '' } }],
      }),
    );

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow(/falló después de 3 intentos/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Constante DEEPSEEK_MODEL
  // ──────────────────────────────────────────────────────────────────────────
  it('DEEPSEEK_MODEL está definido correctamente', () => {
    expect(DEEPSEEK_MODEL).toBe('deepseek-v4-pro');
    expect(typeof DEEPSEEK_MODEL).toBe('string');
    expect(DEEPSEEK_MODEL.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Claim confirmado sin fuente (capa de validación)
  // ──────────────────────────────────────────────────────────────────────────
  it('validateAndParseJSON acepta claim confirmado sin officialSource.url (validación estructural)', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-nosource';

    // Fase 3B: validateAndParseJSON ahora incluye validación semántica.
    // Un claim "confirmed" sin officialSource.url se DEGRADA a 'unsupported'
    // (no puede marcarse confirmado sin fuente verificable). Esto corrige el
    // defecto anterior donde el claim pasaba la validación estructural.
    const outputWithoutSource: DeepSeekReviewOutput = {
      claims: [
        {
          claim: 'Test claim sin fuente',
          classification: 'confirmed',
          jurisdiction: 'HN',
          officialSource: {
            institution: '',
            title: '',
            url: '',          // ← sin URL
            law: '',
            article: '',
            publishedAt: '',
            consultedAt: '2025-01-01',
          },
          sourceExcerptSummary: '',
          analysisProvider: 'DeepSeek',
          analysisModel: DEEPSEEK_MODEL,
          confidence: 'high',
          originalText: '',
          correctedText: '',
          correctionReason: '',
          requiresHumanReview: false,
        },
      ],
      summary: 'test',
      overallConfidence: 'high',
    };

    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: JSON.stringify(outputWithoutSource) } }],
      }),
    );

    // Primer intento tiene éxito → sin sleeps
    const result = await reviewArticle(sampleInput);
    expect(result.claims).toHaveLength(1);
    // Fase 3B: el claim se degrada a 'unsupported' por validación semántica
    expect(result.claims[0].classification).toBe('unsupported');
    expect(result.claims[0].requiresHumanReview).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Sin referencias a OpenAI / Gemini
  // ──────────────────────────────────────────────────────────────────────────
  it('no importa ni referencia paquetes de OpenAI ni Gemini', () => {
    const modulePath = path.resolve(
      __dirname,
      '..',
      'lib',
      'ai',
      'deepseek-blog-review.ts',
    );
    const source = fs.readFileSync(modulePath, 'utf-8');

    // Verificar que no hay imports de openai o @google/genai
    expect(source).not.toMatch(/from\s+['"]openai['"]/);
    expect(source).not.toMatch(/from\s+['"]@google\/genai['"]/);
    expect(source).not.toMatch(/from\s+['"]google-generative-ai['"]/);

    // Verificar que no hay referencias en el código
    expect(source).not.toMatch(/OpenAI/);
    expect(source).not.toMatch(/openai/i);
    expect(source).not.toMatch(/gemini/i);
    expect(source).not.toMatch(/Gemini/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Logging sin secretos
  // ──────────────────────────────────────────────────────────────────────────
  it('los mensajes de error no contienen la API key', async () => {
    const secretKey = 'sk-very-secret-deepseek-key-12345';
    process.env.DEEPSEEK_API_KEY = secretKey;

    fetchMock.mockResolvedValue(fetchError(500, 'Internal Server Error'));

    const promise = reviewArticle(sampleInput);
    promise.catch(() => {});
    await advanceReviewArticleAllRetries();
    await expect(promise).rejects.toThrow();

    // Verificar que ninguna llamada a console.error contiene la key
    const errorCalls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    for (const call of errorCalls) {
      const msg = call.join(' ');
      expect(msg).not.toContain(secretKey);
    }

    // Segunda revisión para capturar el mensaje en el catch
    try {
      fetchMock.mockResolvedValue(fetchError(500, 'Internal Server Error'));
      const p2 = reviewArticle(sampleInput);
      p2.catch(() => {});
      await advanceReviewArticleAllRetries();
      await p2;
    } catch (e) {
      expect((e as Error).message).not.toContain(secretKey);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Revisión exitosa completa
  // ──────────────────────────────────────────────────────────────────────────
  it('realiza una revisión exitosa completa', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-success';
    const output = createSuccessOutput();

    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: JSON.stringify(output) } }],
      }),
    );

    // Primer intento tiene éxito → sin sleeps
    const result = await reviewArticle(sampleInput);

    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].classification).toBe('confirmed');
    expect(result.claims[0].officialSource?.url).toBe(
      'https://www.poderjudicial.gob.hn/codigo-familia',
    );
    expect(result.summary).toBe('Análisis completado con alta confianza');
    expect(result.overallConfidence).toBe('high');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('1 claims analizados'),
    );

    // Verificar que fetch fue llamado una sola vez
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const fetchCallArgs = fetchMock.mock.calls[0];
    const fetchOptions = fetchCallArgs[1] as RequestInit;
    expect(fetchOptions.headers).toBeDefined();
    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer test-key-success');

    const body = JSON.parse(fetchOptions.body as string);
    expect(body.model).toBe(DEEPSEEK_MODEL);
    expect(body.messages).toHaveLength(2);
    expect(body.temperature).toBe(0.1);
    expect(body.max_tokens).toBe(8192);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 14. getProviderInfo()
  // ──────────────────────────────────────────────────────────────────────────
  it('getProviderInfo() devuelve información correcta del proveedor', () => {
    const info = getProviderInfo();

    expect(info.provider).toBe('DeepSeek');
    expect(info.model).toBe(DEEPSEEK_MODEL);
    expect(info.baseUrl).toBe('https://api.deepseek.com/v1');

    expect(Object.keys(info)).toEqual(['provider', 'model', 'baseUrl']);
    expect(typeof info.provider).toBe('string');
    expect(typeof info.model).toBe('string');
    expect(typeof info.baseUrl).toBe('string');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Fallback prohibido (§13)
  // El módulo nunca debe cambiar a otro proveedor/modelo ante error.
  // Verifica que no existe lógica de fallback leyendo el código fuente.
  // ──────────────────────────────────────────────────────────────────────────
  it('no implementa lógica de fallback a otro proveedor o modelo', () => {
    const modulePath = path.resolve(
      __dirname,
      '..',
      'lib',
      'ai',
      'deepseek-blog-review.ts',
    );
    const source = fs.readFileSync(modulePath, 'utf-8');

    // No debe haber referencias a otros modelos/proveedores hardcodeados
    expect(source).not.toMatch(/gpt-4o/i);
    expect(source).not.toMatch(/gpt-3\.5/i);
    expect(source).not.toMatch(/gemini/i);
    expect(source).not.toMatch(/claude/i);
    expect(source).not.toMatch(/chatgpt/i);

    // No debe haber lógica de fallback: el modelo enviado es siempre la constante
    // DEEPSEEK_MODEL, no una variable mutable ni un parámetro configurable
    // que permita cambiar de modelo en tiempo de ejecución.
    expect(source).toMatch(/model:\s*DEEPSEEK_MODEL/);

    // callDeepSeek solo reintenta con el mismo endpoint/baseURL; nunca cambia
    // DEEPSEEK_BASE_URL por otra URL de proveedor.
    expect(source).toMatch(/DEEPSEEK_BASE_URL/);
    expect(source).not.toMatch(/api\.openai\.com/);
    expect(source).not.toMatch(/generativelanguage\.googleapis\.com/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 16. Modelo correcto en cada petición (§13 "modelo incorrecto")
  // Verifica que el cuerpo de la petición siempre lleva DEEPSEEK_MODEL.
  // ──────────────────────────────────────────────────────────────────────────
  it('envía siempre DEEPSEEK_MODEL en el cuerpo de la petición, nunca otro modelo', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-model';
    const output = createSuccessOutput();
    fetchMock.mockResolvedValue(
      fetchJsonOk({
        choices: [{ message: { content: JSON.stringify(output) } }],
      }),
    );

    await reviewArticle(sampleInput);

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model).toBe(DEEPSEEK_MODEL);
    expect(body.model).toBe('deepseek-v4-pro');
    expect(body.model).not.toBe('gpt-4o');
    expect(body.model).not.toBe('gemini-3.6-flash');
  });
});
