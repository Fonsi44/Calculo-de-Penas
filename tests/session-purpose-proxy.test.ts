import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { signSessionToken, signTwoFactorChallenge } from '@/lib/auth';
import { proxy } from '@/proxy';

describe('proxy — propósito de sesión', () => {
  it('rechaza un challenge 2FA usado como cookie de intranet', async () => {
    const challenge = signTwoFactorChallenge({ userId: 'u1', jti: 'jti-proxy' });
    const request = new NextRequest('https://example.test/intranet/admin', {
      headers: { cookie: `token=${challenge}` },
    });
    const response = await proxy(request);
    expect(response.headers.get('location')).toContain('/intranet/login');
  });

  it('acepta una sesión explícita y completa', async () => {
    const token = signSessionToken({ userId: 'u1', email: 'u@example.test', rol: 'admin', tokenVersion: 0 });
    const request = new NextRequest('https://example.test/intranet/admin', {
      headers: { cookie: `token=${token}` },
    });
    const response = await proxy(request);
    expect(response.headers.get('location')).toBeNull();
  });
});
