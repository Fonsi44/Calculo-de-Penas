import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { execute } }));

describe('SGIE dashboard query', () => {
  beforeEach(() => {
    execute.mockReset();
    execute
      .mockResolvedValueOnce({ rows: [{ alerts_active: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
  });

  it('uses the canonical resuelta flag for active alerts', async () => {
    const { getDashboard } = await import('@/lib/sgie/dashboard-service');
    const result = await getDashboard();
    const query = JSON.stringify(execute.mock.calls[0][0]);
    expect(query).toContain('a.resuelta=false');
    expect(query).not.toContain("a.estado='activa'");
    expect(result.alertsActive).toBe(2);
  });
});
