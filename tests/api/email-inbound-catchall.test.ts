import { describe, it, expect, vi, beforeEach } from 'vitest';

// Usamos vi.hoisted para setear env vars ANTES de que cualquier módulo se evalúe.
vi.hoisted(() => {
  process.env.INBOUND_FORWARD_TO = 'alfonsroiget@gmail.com';
  process.env.INBOUND_ALLOWED_DOMAIN = 'pinedayasociadoshn.com';
  process.env.RESEND_FROM_EMAIL = 'contacto@pinedayasociadoshn.com';
});

const sendMock = vi.fn();
const receivingGetMock = vi.fn();

vi.mock('../../lib/email', () => {
  const sendAutoReplyEmail = vi.fn().mockResolvedValue({ ok: true, id: 'auto_123' });
  const getClient = vi.fn().mockReturnValue({
    emails: {
      send: (...args: unknown[]) => sendMock(...args),
      receiving: {
        get: (...args: unknown[]) => receivingGetMock(...args),
      },
    },
  });
  return { sendAutoReplyEmail, getClient };
});

vi.mock('../../lib/webhook-verify', () => ({
  verifyResendWebhook: vi.fn().mockReturnValue({ ok: true }),
}));

import { POST } from '../../app/api/email/inbound/route';

function buildEvent(overrides: Record<string, unknown> = {}) {
  const defaults = {
    type: 'email.received',
    created_at: '2026-07-09T12:00:00Z',
    data: {
      email_id: 'test-email-id',
      created_at: '2026-07-09T12:00:00Z',
      from: 'Juan Pérez <juan@example.com>',
      to: ['contacto@pinedayasociadoshn.com'],
      bcc: [],
      cc: [],
      message_id: 'msg-001',
      subject: 'Consulta sobre pensión alimenticia',
      text: 'Hola, quisiera información sobre pensión alimenticia.',
      html: '<p>Hola, quisiera información sobre pensión alimenticia.</p>',
      attachments: [],
    },
  };
  return deepMerge(defaults, overrides);
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function jsonRequest(body: unknown) {
  return new Request('http://x/api/email/inbound', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_test',
      'svix-timestamp': String(Math.floor(Date.now() / 1000)),
      'svix-signature': 'v1,test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

describe('POST /api/email/inbound — catch-all', () => {
  beforeEach(() => {
    sendMock.mockReset();
    receivingGetMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'fwd_001' }, error: null });
    receivingGetMock.mockResolvedValue(null);
  });

  it('reenvía email para contacto@pinedayasociadoshn.com', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['contacto@pinedayasociadoshn.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toContain('contacto@pinedayasociadoshn.com');
    expect(call.replyTo).toBe('juan@example.com');
  });

  it('reenvía email para info@pinedayasociadoshn.com', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['info@pinedayasociadoshn.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toContain('info@pinedayasociadoshn.com');
    expect(call.replyTo).toBe('juan@example.com');
  });

  it('reenvía email para clientes@pinedayasociadoshn.com', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['clientes@pinedayasociadoshn.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toContain('clientes@pinedayasociadoshn.com');
  });

  it('reenvía email para random-test@pinedayasociadoshn.com', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['random-test@pinedayasociadoshn.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toContain('random-test@pinedayasociadoshn.com');
  });

  it('NO reenvía email para dominio externo (test@otrodominio.com)', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['test@otrodominio.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('NO reenvía si to tiene externo + DOMINIO no está en to/cc/bcc', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: {
        to: ['test@otrodominio.com'],
        cc: ['otro@externo.com'],
      },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('incluye reply_to con el remitente original', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { from: 'María López <maria@test.com>' },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.replyTo).toBe('maria@test.com');
  });

  it('incluye el destinatario original en el asunto', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { to: ['admin@pinedayasociadoshn.com'] },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toMatch(/^\[Pineda Inbound: admin@pinedayasociadoshn\.com\]/);
  });

  it('incluye los datos del remitente en el cuerpo HTML', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: {
        from: 'Carlos Ruiz <carlos@test.com>',
        to: ['info@pinedayasociadoshn.com'],
        subject: 'Presupuesto',
      },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.html).toContain('info@pinedayasociadoshn.com');
    expect(call.html).toContain('carlos@test.com');
    expect(call.html).toContain('Presupuesto');
  });

  it('incluye metadatos de adjuntos si existen', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: {
        attachments: [
          { id: 'att_1', filename: 'documento.pdf', content_type: 'application/pdf', content_disposition: 'attachment', content_id: 'cid_1' },
          { id: 'att_2', filename: 'foto.jpg', content_type: 'image/jpeg', content_disposition: 'inline', content_id: 'cid_2' },
        ],
      },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.html).toContain('documento.pdf');
    expect(call.html).toContain('foto.jpg');
    expect(call.html).toContain('application/pdf');
  });

  it('no reenvía si el evento no es email.received', async () => {
    const r = await POST(jsonRequest(buildEvent({ type: 'email.bounced' })));
    expect(r.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('incluye fecha del email en el reenvío', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: { created_at: '2026-07-09T15:30:00Z' },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.html).toContain('2026');
  });

  it('usa cc recipients para detectar el dominio', async () => {
    const r = await POST(jsonRequest(buildEvent({
      data: {
        to: ['externo@gmail.com'],
        cc: ['info@pinedayasociadoshn.com'],
      },
    })));
    expect(r.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toContain('info@pinedayasociadoshn.com');
  });
});
