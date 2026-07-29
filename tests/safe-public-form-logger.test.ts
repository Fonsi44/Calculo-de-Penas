import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPublicFormRequestId,
  logPublicFormEvent,
} from '@/lib/safe-public-form-logger';

describe('safe public form logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('genera identificadores aleatorios sin depender de PII', () => {
    const first = createPublicFormRequestId();
    const second = createPublicFormRequestId();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(second).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });

  it('registra exclusivamente campos operativos permitidos', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logPublicFormEvent({
      event: 'consulta_completed',
      requestId: '11111111-1111-4111-8111-111111111111',
      requestPath: '/api/consulta?email=fixture@example.invalid',
      status: 'ok',
      httpStatus: 200,
      savedId: 'saved-1',
      durationMs: 12,
    });
    const serialized = JSON.stringify(info.mock.calls);
    expect(serialized).toContain('/api/consulta');
    expect(serialized).not.toContain('fixture@example.invalid');
  });

  it('rechaza campos prohibidos en test y desarrollo', () => {
    expect(() => logPublicFormEvent({
      event: 'consulta_received',
      requestId: '11111111-1111-4111-8111-111111111111',
      email: 'fixture@example.invalid',
    } as never)).toThrow(/Unsafe public form log fields/);
  });
});
