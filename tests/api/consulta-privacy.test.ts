import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const captchaMock = vi.fn();
const sendConsultaEmailMock = vi.fn();
const sendAutoReplyEmailMock = vi.fn();
const isEmailConfiguredMock = vi.fn();
const returningMock = vi.fn();
const valuesMock = vi.fn(() => ({ returning: returningMock }));
const insertMock = vi.fn(() => ({ values: valuesMock }));
const whereMock = vi.fn().mockResolvedValue(undefined);
const setMock = vi.fn(() => ({ where: whereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: () => '203.0.113.25',
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
}));
vi.mock('@/lib/captcha', () => ({
  verifyTurnstileToken: (...args: unknown[]) => captchaMock(...args),
}));
vi.mock('@/lib/email', () => ({
  isEmailConfigured: () => isEmailConfiguredMock(),
  sendConsultaEmail: (...args: unknown[]) => sendConsultaEmailMock(...args),
  sendAutoReplyEmail: (...args: unknown[]) => sendAutoReplyEmailMock(...args),
}));
vi.mock('@/lib/db', () => ({
  db: {
    insert: () => insertMock(),
    update: () => updateMock(),
  },
}));
import { POST } from '@/app/api/consulta/route';

const fixture = {
  nombre: 'Usuario Prueba Automatizada',
  telefono: '+504 9999-0000',
  email: 'qa-no-reply@example.invalid',
  motivo: 'Asesoría preventiva',
  resumen: 'Solicitud sintética para validar privacidad de logs.',
  acepta: true,
  website: '',
  'cf-turnstile-response': 'turnstile-fixture-secret',
};

function request(body: unknown, headers?: HeadersInit): Request {
  return new Request('https://example.test/api/consulta', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function capturedLogs(spies: Array<ReturnType<typeof vi.spyOn>>): string {
  return JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
}

describe('POST /api/consulta privacy', () => {
  let spies: Array<ReturnType<typeof vi.spyOn>>;

  beforeEach(() => {
    spies = [
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
    ];
    rateLimitMock.mockReset().mockResolvedValue({
      ok: true, remaining: 9, resetAt: Date.now() + 60_000, retryAfterSec: 0,
    });
    captchaMock.mockReset().mockResolvedValue(true);
    returningMock.mockReset().mockResolvedValue([{ id: 'saved-1' }]);
    sendConsultaEmailMock.mockReset().mockResolvedValue({ ok: true, id: 'provider-1' });
    sendAutoReplyEmailMock.mockReset().mockResolvedValue({ ok: true, id: 'provider-auto-1' });
    isEmailConfiguredMock.mockReset().mockReturnValue(true);
    whereMock.mockClear();
  });

  it('mantiene persistencia, notificación y autorespuesta sin PII en logs', async () => {
    const response = await POST(request(fixture));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(insertMock).toHaveBeenCalled();
    expect(sendConsultaEmailMock).toHaveBeenCalledOnce();
    expect(sendAutoReplyEmailMock).toHaveBeenCalledOnce();
    const logs = capturedLogs(spies);
    for (const secret of [
      fixture.nombre, fixture.telefono, fixture.email, fixture.resumen,
      fixture['cf-turnstile-response'],
    ]) expect(logs).not.toContain(secret);
  });

  it('no registra valores inválidos', async () => {
    const invalid = 'correo-invalido-identificable';
    const response = await POST(request({ ...fixture, email: invalid }));
    expect(response.status).toBe(400);
    expect(capturedLogs(spies)).not.toContain(invalid);
  });

  it('no registra token cuando falla captcha', async () => {
    captchaMock.mockResolvedValue(false);
    const response = await POST(request(fixture));
    expect(response.status).toBe(400);
    expect(capturedLogs(spies)).not.toContain(fixture['cf-turnstile-response']);
  });

  it('no registra IP ni user-agent cuando aplica rate limit', async () => {
    rateLimitMock.mockResolvedValue({
      ok: false, remaining: 0, resetAt: Date.now() + 60_000, retryAfterSec: 60,
    });
    const response = await POST(request(fixture, { 'user-agent': 'PrivateFixtureAgent/1.0' }));
    expect(response.status).toBe(429);
    const logs = capturedLogs(spies);
    expect(logs).not.toContain('203.0.113.25');
    expect(logs).not.toContain('PrivateFixtureAgent/1.0');
  });

  it('reduce fallos de DB a código y referencia seguros', async () => {
    returningMock.mockRejectedValue(
      new Error('SELECT blog_posts FROM neon://user:secret@example/ Usuario Prueba Automatizada'),
    );
    const response = await POST(request(fixture));
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).toContain('reference');
    expect(text).not.toMatch(/SELECT|neon:|secret|Usuario Prueba/);
    expect(capturedLogs(spies)).not.toMatch(/SELECT|neon:|Usuario Prueba/);
  });

  it('reduce fallos de Resend sin destinatario, asunto, cuerpo ni mensaje crudo', async () => {
    sendConsultaEmailMock.mockResolvedValue({
      ok: false,
      errorCode: 'EMAIL_PROVIDER_REQUEST_FAILED',
      error: `Provider rejected ${fixture.email} ${fixture.resumen}`,
    });
    const response = await POST(request(fixture));
    expect(response.status).toBe(200);
    const logs = capturedLogs(spies);
    expect(logs).not.toContain(fixture.email);
    expect(logs).not.toContain(fixture.resumen);
    expect(logs).not.toContain('Provider rejected');
  });

  it('genera referencias distintas entre peticiones', async () => {
    const first = await (await POST(request(fixture))).json();
    const second = await (await POST(request(fixture))).json();
    expect(first.reference).not.toBe(second.reference);
  });
});
