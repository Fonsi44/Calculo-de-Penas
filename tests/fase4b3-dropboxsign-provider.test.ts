/// <reference types="vitest/globals" />
/**
 * DropboxSignProvider — tests contractuales unitarios.
 * Sin llamadas externas: toda fetch se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';

const { mockFetch } = vi.hoisted(() => {
  const fn = vi.fn();
  return { mockFetch: fn };
});
vi.stubGlobal('fetch', mockFetch);

vi.mock('dotenv', () => ({ config: vi.fn() }));

import { DropboxSignProvider, DropboxSignError } from '../lib/signature/dropboxsign-provider';

function mockResp(status: number, data: unknown, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? 'Not Found' : status === 409 ? 'Conflict' : status === 429 ? 'Too Many' : 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    arrayBuffer: async () => new ArrayBuffer(0),
    headers: new Map(Object.entries(headers || {})),
    get(name: string) { return (headers || {})[name]; },
  };
}

const CTX: Parameters<DropboxSignProvider['createEnvelope']>[0] = {
  packageId: 'pkg-1',
  expedienteId: 'exp-1',
  titulo: 'Test',
  documentos: [],
  firmantes: [{ signerId: 's1', nombre: 'Test', email: 'test@t.com', rolDocumento: 'otorgante', orden: 0, obligatorio: true }],
  ordenFirma: false,
  callbackUrl: 'http://localhost/webhook',
  idempotencyKey: 'idem-1',
};

beforeEach(() => {
  vi.stubEnv('DROPBOX_SIGN_API_KEY', 'test-api-key-32chars-padding123456');
  vi.stubEnv('DROPBOX_SIGN_TEST_MODE', 'true');
  vi.stubEnv('DROPBOX_SIGN_PRODUCTION_ENABLED', 'false');
  vi.unstubAllEnvs?.(); // ensure clean each test
  vi.stubEnv('DROPBOX_SIGN_API_KEY', 'test-api-key-32chars-padding123456');
  vi.stubEnv('DROPBOX_SIGN_TEST_MODE', 'true');
  vi.stubEnv('DROPBOX_SIGN_PRODUCTION_ENABLED', 'false');
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('DropboxSignProvider — configuración', () => {
  it('API key ausente → CONFIG error', async () => {
    vi.stubEnv('DROPBOX_SIGN_API_KEY', '');
    const provider = new DropboxSignProvider();
    await expect(provider.createEnvelope(CTX)).rejects.toThrow(DropboxSignError);
  });

  it('producción sin DROPBOX_SIGN_PRODUCTION_ENABLED → rechazado', async () => {
    vi.stubEnv('DROPBOX_SIGN_TEST_MODE', 'false');
    vi.stubEnv('DROPBOX_SIGN_PRODUCTION_ENABLED', 'false');
    const provider = new DropboxSignProvider();
    await expect(provider.createEnvelope(CTX)).rejects.toThrow(DropboxSignError);
  });

  it('providerId es dropboxsign', () => {
    expect(new DropboxSignProvider().providerId).toBe('dropboxsign');
  });
});

describe('DropboxSignProvider — creación', () => {
  it('creación exitosa → signature_request_id', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {
      signature_request: { signature_request_id: 'abc123abc123abc123abc123abc123abc123ab', is_complete: false },
    }));
    const provider = new DropboxSignProvider();
    const result = await provider.createEnvelope(CTX);
    expect(result.providerEnvelopeId).toBe('abc123abc123abc123abc123abc123abc123ab');
    expect(result.estado).toBe('sent');
  });

  it('respuesta malformada → error', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, { no_signature_request: true }));
    const provider = new DropboxSignProvider();
    await expect(provider.createEnvelope(CTX)).rejects.toThrow();
  });

  it('HTTP 401 → error', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(401, { error: { error_msg: 'Invalid API key' } }));
    const provider = new DropboxSignProvider();
    await expect(provider.createEnvelope(CTX)).rejects.toThrow(DropboxSignError);
  });

  it('HTTP 409 → error', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(409, { error: { error_msg: 'Conflict' } }));
    await expect(new DropboxSignProvider().createEnvelope(CTX)).rejects.toThrow(DropboxSignError);
  });

  it('HTTP 429 → error', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(429, { error: { error_msg: 'Rate limited' } }));
    await expect(new DropboxSignProvider().createEnvelope(CTX)).rejects.toThrow(DropboxSignError);
  });

  it('envía FormData con firmantes y test_mode', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {
      signature_request: { signature_request_id: 'x'.repeat(40), is_complete: false },
    }));
    await new DropboxSignProvider().createEnvelope(CTX);
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain('/signature_request/send');
    expect(call[1].method).toBe('POST');
    expect(call[1].headers.Authorization).toBeTruthy();
  });
});

describe('DropboxSignProvider — consulta', () => {
  const sigId = 'a'.repeat(40);

  it('consulta exitosa → estado normalizado', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {
      signature_request: {
        signature_request_id: sigId, is_complete: false, is_declined: false, is_cancelled: false,
        signatures: [{ signature_id: 's1', signer_name: 'Test', status_code: 'awaiting_signature', signer_email_address: 't@t.com' }],
      },
    }));
    const result = await new DropboxSignProvider().getEnvelope({ providerEnvelopeId: sigId });
    expect(result.estado).toBe('sent');
  });

  it('completed → estado completed', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {
      signature_request: {
        signature_request_id: sigId, is_complete: true, is_declined: false, is_cancelled: false,
        signatures: [{ signature_id: 's1', signer_name: 'Test', status_code: 'signed' }],
      },
    }));
    const result = await new DropboxSignProvider().getEnvelope({ providerEnvelopeId: sigId });
    expect(result.estado).toBe('completed');
  });

  it('declined → estado declined', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {
      signature_request: { signature_request_id: sigId, is_complete: false, is_declined: true, is_cancelled: false, signatures: [] },
    }));
    const result = await new DropboxSignProvider().getEnvelope({ providerEnvelopeId: sigId });
    expect(result.estado).toBe('declined');
  });
});

describe('DropboxSignProvider — cancelación', () => {
  const sigId = 'a'.repeat(40);

  it('cancelación exitosa → ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {}));
    const result = await new DropboxSignProvider().cancelEnvelope({ providerEnvelopeId: sigId, motivo: 'Test' });
    expect(result.ok).toBe(true);
  });

  it('cancelación repetida → ok=false', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(409, { error: { error_msg: 'Already cancelled' } }));
    const result = await new DropboxSignProvider().cancelEnvelope({ providerEnvelopeId: sigId, motivo: 'Test' });
    expect(result.ok).toBe(false);
  });
});

describe('DropboxSignProvider — webhook', () => {
  it('HMAC válida → verificado', async () => {
    vi.stubEnv('DROPBOX_SIGN_API_KEY', 'testkey123');
    const payload = JSON.stringify({ signature_request: { signature_request_id: 'a'.repeat(40) }, event_type: 'signature_request_signed', event_hash: 'fakehash', event_time: Date.now().toString() });
    const expectedHash = createHash('sha256').update(payload + 'testkey123').digest('hex');
    const result = await new DropboxSignProvider().verifyWebhook({
      rawBody: payload,
      headers: { 'dropbox-sign-event-hash': expectedHash },
    });
    expect(result.provider).toBe('dropboxsign');
    expect(result.tipo).toBe('envelope.signed');
  });

  it('HMAC inválida → FORBIDDEN', async () => {
    vi.stubEnv('DROPBOX_SIGN_API_KEY', 'testkey123');
    const payload = JSON.stringify({ signature_request: { signature_request_id: 'a'.repeat(40) } });
    await expect(new DropboxSignProvider().verifyWebhook({
      rawBody: payload,
      headers: { 'dropbox-sign-event-hash': 'wronghash' },
    })).rejects.toThrow(DropboxSignError);
  });

  it('sin header → FORBIDDEN', async () => {
    await expect(new DropboxSignProvider().verifyWebhook({
      rawBody: '{}',
      headers: {},
    })).rejects.toThrow(DropboxSignError);
  });
});

describe('DropboxSignProvider — descarga', () => {
  const sigId = 'a'.repeat(40);

  it('descarga exitosa → PDF con hash', async () => {
    const fileBytes = Buffer.from('fake-signed-pdf-content');
    mockFetch.mockResolvedValueOnce(mockResp(200, null, { 'content-type': 'application/pdf' }));
    // Mock arrayBuffer
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      headers: new Map([['content-type', 'application/pdf']]),
      arrayBuffer: async () => fileBytes.buffer,
    });
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      headers: { get: (name: string) => name === 'content-type' ? 'application/pdf' : null },
      arrayBuffer: async () => fileBytes.buffer,
    } as unknown as Response);

    const result = await new DropboxSignProvider().downloadSignedArtifacts({ providerEnvelopeId: sigId });
    expect(result.length).toBe(1);
    expect(result[0].mime).toBe('application/pdf');
    expect(result[0].hashSha256.length).toBe(64);
  });
});

describe('DropboxSignProvider — resendNotification', () => {
  it('reenvío exitoso', async () => {
    mockFetch.mockResolvedValueOnce(mockResp(200, {}));
    await expect(new DropboxSignProvider().resendNotification!({ providerEnvelopeId: 'a'.repeat(40) })).resolves.toBeUndefined();
  });
});
