import { describe, it, expect } from 'vitest';
import { ipFromRequest, uaFromRequest } from '../lib/audit';

describe('lib/audit — helpers de request', () => {
  it('extrae IP de x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(ipFromRequest(req)).toBe('1.2.3.4');
  });

  it('extrae user-agent', () => {
    const req = new Request('http://localhost', {
      headers: { 'user-agent': 'TestAgent/1.0' },
    });
    expect(uaFromRequest(req)).toBe('TestAgent/1.0');
  });
});
