import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/lib/auth';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ leftJoin: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })), where: vi.fn(() => Promise.resolve([])) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => ([])) })) })),
  },
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const mod = await importOriginal() as Record<string, unknown>;
  return {
    ...mod,
    COOKIE_NAME: 'token',
    COOKIE_NAME_FALLBACK: 'token_fallback',
    validateSessionFreshness: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/lib/access-service', () => ({
  assertSgieAccess: vi.fn().mockResolvedValue({
    userId: 'mock', rol: 'admin', active: true, suspended: false, sgIeEnabled: true, capabilities: new Set<string>(),
  }),
}));

import { proxy } from '@/proxy';

describe('proxy — admin access (role-based routing)', () => {
  const adminToken = signSessionToken({ userId: 'admin-1', email: 'admin@test.com', rol: 'admin', tokenVersion: 0 });
  const adminTokenEs = signSessionToken({ userId: 'admin-2', email: 'admin2@test.com', rol: 'administrador', tokenVersion: 0 });
  const lawyerToken = signSessionToken({ userId: 'lawyer-1', email: 'lawyer@test.com', rol: 'abogado', tokenVersion: 0 });

  it('admin accede a /intranet/admin con 200', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/admin', { headers: { cookie: `token=${adminToken}` } }));
    expect(res.status).toBe(200);
  });

  it('administrador accede a /intranet/admin con 200', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/admin', { headers: { cookie: `token=${adminTokenEs}` } }));
    expect(res.status).toBe(200);
  });

  it('abogado es redirigido de /intranet/admin', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/admin', { headers: { cookie: `token=${lawyerToken}` } }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/intranet/login');
  });

  it('admin accede a /api/admin/* con 200', async () => {
    const res = await proxy(new NextRequest('https://example.test/api/admin/usuarios', { headers: { cookie: `token=${adminToken}` } }));
    expect(res.status).toBe(200);
  });

  it('administrador accede a /api/admin/* con 200', async () => {
    const res = await proxy(new NextRequest('https://example.test/api/admin/usuarios', { headers: { cookie: `token=${adminTokenEs}` } }));
    expect(res.status).toBe(200);
  });

  it('abogado es rechazado de /api/admin/* con 403', async () => {
    const res = await proxy(new NextRequest('https://example.test/api/admin/usuarios', { headers: { cookie: `token=${lawyerToken}` } }));
    expect(res.status).toBe(403);
  });

  it('post-login: admin redirigido a /intranet/admin', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/login', { headers: { cookie: `token=${adminToken}` } }));
    expect(res.headers.get('location')).toContain('/intranet/admin');
  });

  it('post-login: administrador redirigido a /intranet/admin', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/login', { headers: { cookie: `token=${adminTokenEs}` } }));
    expect(res.headers.get('location')).toContain('/intranet/admin');
  });

  it('post-login: abogado redirigido a /intranet/sgie', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/login', { headers: { cookie: `token=${lawyerToken}` } }));
    expect(res.headers.get('location')).toContain('/intranet/sgie');
  });

  it('admin accede a /intranet/sgie sin restricción', async () => {
    const res = await proxy(new NextRequest('https://example.test/intranet/sgie', { headers: { cookie: `token=${adminToken}` } }));
    expect(res.status).toBe(200);
  });
});
