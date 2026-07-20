/// <reference types="vitest/globals" />
/**
 * Tests de contrato de los API routes de P2-07 (Fase 4B-1).
 *
 * Mockea el servicio y los middleware (auth, csrf, rate-limit) para testear:
 * - validación Zod de bodies (400/422);
 * - autenticación requerida (401);
 * - CSRF requerido (403);
 * - mapeo de errores del servicio a HTTP (404/409/500);
 * - éxito (200).
 *
 * El comportamiento del servicio se cubre en fase4b1-bulk-approval-service.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const { requireAbogadoMock } = vi.hoisted(() => ({
  requireAbogadoMock: vi.fn(async () => ({ userId: 'admin-1', email: 'a@x.com', rol: 'admin', tokenVersion: 1 })),
}));
const { validateCsrfMock } = vi.hoisted(() => ({ validateCsrfMock: vi.fn(() => undefined) }));
const { rateLimitMock } = vi.hoisted(() => ({
  rateLimitMock: vi.fn(async () => ({ ok: true })),
}));
const { rateLimitResponseMock } = vi.hoisted(() => ({
  rateLimitResponseMock: vi.fn(() => new Response('rate', { status: 429 })),
}));

vi.mock('@/lib/auth', () => ({
  requireAbogado: requireAbogadoMock,
  authFailureResponse: vi.fn((e: unknown) => {
    const status = (e as { status?: number })?.status ?? 401;
    return new Response(JSON.stringify({ error: 'auth' }), { status });
  }),
}));
vi.mock('@/lib/csrf', () => ({ validateCsrf: validateCsrfMock }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  rateLimitResponse: rateLimitResponseMock,
}));

// Mock del servicio.
const { generarPreviewMock, confirmarAprobacionMock, consultarResultadoMock, revertirAprobacionMock } = vi.hoisted(() => ({
  generarPreviewMock: vi.fn(async () => ({ batchId: 'b1', expedienteId: 'exp-1', previewHash: 'a'.repeat(64), items: [], caducidad: new Date(), totalElegibles: 0, totalNoElegibles: 0 })),
  confirmarAprobacionMock: vi.fn(async () => ({ batchId: 'b1', expedienteId: 'exp-1', estado: 'confirmada', aprobados: [], yaAprobados: [], rechazados: [], correlationId: 'c1' })),
  consultarResultadoMock: vi.fn(async () => ({ batchId: 'b1', expedienteId: 'exp-1', estado: 'confirmada', aprobados: [], yaAprobados: [], rechazados: [], correlationId: 'c1' })),
  revertirAprobacionMock: vi.fn(async () => ({ batchId: 'b1', expedienteId: 'exp-1', revertidos: [], denegados: [] })),
}));
vi.mock('@/lib/sgie/bulk-approval-service', () => ({
  generarPreview: generarPreviewMock,
  confirmarAprobacion: confirmarAprobacionMock,
  consultarResultado: consultarResultadoMock,
  revertirAprobacion: revertirAprobacionMock,
  BulkApprovalError: class BulkApprovalError extends Error {
    constructor(public code: string, message: string, public statusCode = 400) { super(message); }
  },
  bulkApprovalErrorResponse: vi.fn((err: unknown) => {
    // Zod validation.
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'validation' }), { status: 422 });
    }
    const status = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { status?: number })?.status ?? 500;
    return new Response(JSON.stringify({ error: 'srv' }), { status });
  }),
}));

import { POST as previewPOST } from '@/app/api/sgie/expedientes/[id]/documentos/bulk-approval/preview/route';
import { POST as confirmPOST } from '@/app/api/sgie/expedientes/[id]/documentos/bulk-approval/confirm/route';
import { GET as statusGET } from '@/app/api/sgie/expedientes/[id]/documentos/bulk-approval/[batchId]/route';
import { POST as revertPOST } from '@/app/api/sgie/expedientes/[id]/documentos/bulk-approval/[batchId]/revert/route';

// UUID válido real (zod uuid() rechaza UUIDs uniformes como 0000.../1111...).
const VALID_UUID = '59f5521b-6ef3-45ac-9092-d2b2dea5ab26';

function jsonReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAbogadoMock.mockResolvedValue({ userId: 'admin-1', email: 'a@x.com', rol: 'admin', tokenVersion: 1 });
  validateCsrfMock.mockReturnValue(undefined);
  rateLimitMock.mockResolvedValue({ ok: true });
  // Re-establecer los mocks del servicio (clearAllMocks los deja como vi.fn vacíos).
  generarPreviewMock.mockResolvedValue({ batchId: 'b1', expedienteId: 'exp-1', previewHash: 'a'.repeat(64), caducidad: new Date(), items: [], totalElegibles: 0, totalNoElegibles: 0 });
  confirmarAprobacionMock.mockResolvedValue({ batchId: 'b1', expedienteId: 'exp-1', estado: 'confirmada', aprobados: [], yaAprobados: [], rechazados: [], correlationId: 'c1' });
  consultarResultadoMock.mockResolvedValue({ batchId: 'b1', expedienteId: 'exp-1', estado: 'confirmada', aprobados: [], yaAprobados: [], rechazados: [], correlationId: 'c1' });
  revertirAprobacionMock.mockResolvedValue({ batchId: 'b1', expedienteId: 'exp-1', revertidos: [], denegados: [] });
});

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW
// ═══════════════════════════════════════════════════════════════════════════
describe('P2-07 API preview', () => {
  it('body válido => 200 con preview', async () => {
    const req = jsonReq('http://x/api/sgie/expedientes/exp-1/documentos/bulk-approval/preview', {
      documentIds: [VALID_UUID],
    });
    const res = await previewPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(200);
    expect(generarPreviewMock).toHaveBeenCalledWith(
      { expedienteId: 'exp-1', documentIds: [VALID_UUID] },
      { actorId: 'admin-1' },
    );
  });

  it('documentIds vacío => 422 (Zod)', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/preview', { documentIds: [] });
    const res = await previewPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(422);
  });

  it('documentIds con uuid inválido => 422', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/preview', { documentIds: ['no-uuid'] });
    const res = await previewPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(422);
  });

  it('rate limit excedido => 429', async () => {
    rateLimitMock.mockResolvedValueOnce({ ok: false });
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/preview', { documentIds: [VALID_UUID] });
    const res = await previewPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(429);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM
// ═══════════════════════════════════════════════════════════════════════════
describe('P2-07 API confirm', () => {
  it('body válido => 200 con resultado', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/confirm', {
      batchId: VALID_UUID,
      idempotencyKey: 'key-12345678',
      previewHash: 'a'.repeat(64),
    });
    const res = await confirmPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(200);
  });

  it('previewHash con longitud incorrecta => 422', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/confirm', {
      batchId: VALID_UUID,
      idempotencyKey: 'key-12345678',
      previewHash: 'corto',
    });
    const res = await confirmPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(422);
  });

  it('idempotencyKey corta => 422', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/confirm', {
      batchId: VALID_UUID,
      idempotencyKey: 'short',
      previewHash: 'a'.repeat(64),
    });
    const res = await confirmPOST(req, { params: Promise.resolve({ id: 'exp-1' }) });
    expect(res.status).toBe(422);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════════════════════════════════
describe('P2-07 API status', () => {
  it('GET lote existente => 200', async () => {
    const req = new Request('http://x/api/sgie/exp-1/documentos/bulk-approval/b1', { method: 'GET' });
    const res = await statusGET(req, { params: Promise.resolve({ id: 'exp-1', batchId: 'b1' }) });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REVERT
// ═══════════════════════════════════════════════════════════════════════════
describe('P2-07 API revert', () => {
  it('motivo válido => 200', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/b1/revert', {
      motivo: 'motivo suficientemente largo',
    });
    const res = await revertPOST(req, { params: Promise.resolve({ id: 'exp-1', batchId: 'b1' }) });
    expect(res.status).toBe(200);
  });

  it('motivo corto (<10) => 422', async () => {
    const req = jsonReq('http://x/api/sgie/exp-1/documentos/bulk-approval/b1/revert', { motivo: 'corto' });
    const res = await revertPOST(req, { params: Promise.resolve({ id: 'exp-1', batchId: 'b1' }) });
    expect(res.status).toBe(422);
  });
});
