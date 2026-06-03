import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock del módulo db ANTES de importar audit.
// Necesario porque audit() llama db.insert() internamente y
// sin DATABASE_URL el Proxy del db real lanza excepción.
const insertMock = vi.fn();
vi.mock('../lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

import { audit, ipFromRequest, uaFromRequest } from '../lib/audit';

describe('ipFromRequest', () => {
  it('extrae la primera IP de x-forwarded-for (múltiples)', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' },
    });
    expect(ipFromRequest(req)).toBe('10.0.0.1');
  });

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-real-ip': '10.0.0.99' },
    });
    expect(ipFromRequest(req)).toBe('10.0.0.99');
  });

  it('devuelve "unknown" sin headers de IP', () => {
    const req = new Request('http://x');
    expect(ipFromRequest(req)).toBe('unknown');
  });
});

describe('uaFromRequest', () => {
  it('extrae el user-agent del header', () => {
    const req = new Request('http://x', {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; TestBot/1.0)' },
    });
    expect(uaFromRequest(req)).toBe('Mozilla/5.0 (compatible; TestBot/1.0)');
  });

  it('devuelve "unknown" si no hay user-agent', () => {
    const req = new Request('http://x');
    expect(uaFromRequest(req)).toBe('unknown');
  });

  it('trunca user-agent a 500 caracteres', () => {
    const longUa = 'A'.repeat(1000);
    const req = new Request('http://x', {
      headers: { 'user-agent': longUa },
    });
    const ua = uaFromRequest(req);
    expect(ua.length).toBe(500);
  });
});

describe('audit (no-bloqueante)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    insertMock.mockReset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('llama db.insert con tabla auditoriaEventos y los valores provistos', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    await audit({
      usuarioId: 'user-uuid-1',
      accion: 'login',
      ip: '1.2.3.4',
      userAgent: 'curl/8.0',
      exito: true,
      mensaje: 'Test login',
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertArg = insertMock.mock.calls[0][0];
    expect(insertArg).toBeDefined();
    expect(insertArg).toHaveProperty('id');
    expect(insertArg).toHaveProperty('usuarioId');
    expect(insertArg).toHaveProperty('accion');

    expect(valuesMock).toHaveBeenCalledTimes(1);
    const row = valuesMock.mock.calls[0][0];
    expect(row.usuarioId).toBe('user-uuid-1');
    expect(row.accion).toBe('login');
    expect(row.ip).toBe('1.2.3.4');
    expect(row.userAgent).toBe('curl/8.0');
    expect(row.exito).toBe(true);
    expect(row.mensaje).toBe('Test login');
  });

  it('rellena campos opcionales con null/true por defecto', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    await audit({ accion: 'logout' });

    const row = valuesMock.mock.calls[0][0];
    expect(row.usuarioId).toBeNull();
    expect(row.recurso).toBeNull();
    expect(row.recursoId).toBeNull();
    expect(row.ip).toBeNull();
    expect(row.userAgent).toBeNull();
    expect(row.metadata).toBeNull();
    expect(row.exito).toBe(true);
    expect(row.mensaje).toBeNull();
  });

  it('NO lanza excepción si db.insert falla (no-bloqueante)', async () => {
    insertMock.mockImplementation(() => {
      throw new Error('Simulated DB connection failure');
    });

    await expect(
      audit({ accion: 'login_failed' })
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    const warnCall = warnSpy.mock.calls[0];
    const warnMsg = warnCall.map((a: unknown) => String(a)).join(' ');
    expect(warnMsg).toContain('[audit]');
    expect(warnMsg).toContain('login_failed');
  });

  it('NO lanza excepción si values() rechaza la promesa', async () => {
    insertMock.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('Async insert failure')),
    });

    await expect(
      audit({ accion: 'caso_created' })
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
  });

  it('serializa metadata como JSONB válido', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const metadata = { email: 'x@y.com', intentos: 3, tags: ['a', 'b'] };
    await audit({ accion: 'login_failed', metadata });

    const row = valuesMock.mock.calls[0][0];
    expect(row.metadata).toEqual(metadata);
  });

  it('acepta todas las 13 acciones del enum sin rechazo de tipo', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const acciones = [
      'login', 'logout', 'login_failed',
      'caso_created', 'caso_updated', 'caso_deleted',
      'calculo_created', 'calculo_deleted',
      'delito_created', 'delito_updated', 'delito_deleted',
      'rate_limited', 'unauthorized_access',
    ] as const;

    for (const accion of acciones) {
      await audit({ accion });
      expect(insertMock).toHaveBeenCalled();
      insertMock.mockClear();
      valuesMock.mockClear();
    }
  });
});
