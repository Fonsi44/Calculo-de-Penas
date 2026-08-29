import { describe, it, expect, vi, beforeEach } from 'vitest';

const returningMock = vi.fn();
const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });
const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
const captchaMock = vi.fn();

vi.mock('../../lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
  },
  isDbConfigured: () => true,
}));

vi.mock('../../lib/schema', () => ({
  rateLimits: { identifier: 'rate_limits.identifier', keyPrefix: 'rate_limits.key_prefix' },
}));

vi.mock('../../lib/captcha', () => ({
  verifyTurnstileToken: (...args: unknown[]) => captchaMock(...args),
}));

const sendContactEmailMock = vi.fn();
const isEmailConfiguredMock = vi.fn();

vi.mock('../../lib/email', () => ({
  sendContactEmail: (...args: unknown[]) => sendContactEmailMock(...args),
  isEmailConfigured: () => isEmailConfiguredMock(),
}));

import { POST } from '../../app/api/contacto/route';

const baseBody = {
  nombre: 'Juan Pérez',
  telefono: '+504 9536-3724',
  email: 'juan@example.com',
  asunto: 'Cita para consulta',
  mensaje: 'Necesito orientación sobre un caso penal.',
  acepta: true,
  'cf-turnstile-response': 'turnstile-fixture-secret',
};

function jsonRequest(body: unknown): Request {
  return new Request('http://x/api/contacto', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/contacto', () => {
  beforeEach(() => {
    insertMock.mockClear();
    returningMock.mockResolvedValue([{ count: 1, expiresAt: new Date(Date.now() + 60_000).toISOString() }]);
    sendContactEmailMock.mockReset();
    isEmailConfiguredMock.mockReset();
    captchaMock.mockReset().mockResolvedValue(true);
  });

  it('retorna 200 cuando el envío es exitoso', async () => {
    isEmailConfiguredMock.mockReturnValue(true);
    sendContactEmailMock.mockResolvedValue({ ok: true, id: 'email_123' });

    const r = await POST(jsonRequest(baseBody));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.id).toBe('email_123');
    expect(sendContactEmailMock).toHaveBeenCalledOnce();
    const arg = sendContactEmailMock.mock.calls[0][0];
    expect(arg.nombre).toBe('Juan Pérez');
    expect(arg.asunto).toBe('Cita para consulta');
  });

  it('retorna 400 con body inválido (mensaje corto)', async () => {
    const r = await POST(jsonRequest({ ...baseBody, mensaje: 'corto' }));
    expect(r.status).toBe(400);
    expect(sendContactEmailMock).not.toHaveBeenCalled();
  });

  it('retorna 400 con JSON malformado', async () => {
    const req = new Request('http://x/api/contacto', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{no es json',
    });
    const r = await POST(req);
    expect(r.status).toBe(400);
  });

  it('retorna 400 si no acepta la política de privacidad', async () => {
    const r = await POST(jsonRequest({ ...baseBody, acepta: false }));
    expect(r.status).toBe(400);
  });

  it('retorna 503 si Resend no está configurado', async () => {
    isEmailConfiguredMock.mockReturnValue(false);

    const r = await POST(jsonRequest(baseBody));
    expect(r.status).toBe(503);
    expect(sendContactEmailMock).not.toHaveBeenCalled();
  });

  it('retorna 502 si el envío falla', async () => {
    isEmailConfiguredMock.mockReturnValue(true);
    sendContactEmailMock.mockResolvedValue({ ok: false, error: 'SMTP down' });

    const r = await POST(jsonRequest(baseBody));
    expect(r.status).toBe(502);
  });

  it('retorna 429 cuando se excede el rate limit', async () => {
    returningMock.mockResolvedValue([{ count: 99, expiresAt: new Date(Date.now() + 60_000).toISOString() }]);
    isEmailConfiguredMock.mockReturnValue(true);

    const r = await POST(jsonRequest(baseBody));
    expect(r.status).toBe(429);
    expect(sendContactEmailMock).not.toHaveBeenCalled();
  });
});
