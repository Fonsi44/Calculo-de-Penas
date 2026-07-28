import { describe, expect, it, vi } from 'vitest';
import {
  neutralizeAccounts,
  validateAllowlist,
} from '../tools/ops/disable-synthetic-production-users.mjs';

const account = { id: '00000000-0000-4000-a000-000000000001', email: 'e2e@test.local' };

describe('synthetic account neutralization', () => {
  it('requires exact unique identities', () => {
    expect(() => validateAllowlist([])).toThrow('vacía');
    expect(() => validateAllowlist([account, account])).toThrow('duplicado');
  });

  it('aborts an ambiguous identity without writes', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ ...account, email: 'real@example.org' }],
    });
    await expect(neutralizeAccounts({ query }, [account]))
      .rejects.toThrow('ambigua');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('keeps dry-run read-only', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [account] });
    await expect(neutralizeAccounts({ query }, [account]))
      .resolves.toEqual({ matched: 1, changed: 0 });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('rolls back if any revocation fails', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [account] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('revocation failed'))
      .mockResolvedValue({ rows: [] });
    await expect(neutralizeAccounts({ query }, [account], { apply: true }))
      .rejects.toThrow('revocation failed');
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('does not include email addresses in write parameters', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [account] });
    await neutralizeAccounts({ query }, [account], { apply: true });
    const writeCalls = query.mock.calls.filter(([sql]) => !String(sql).startsWith('SELECT'));
    expect(JSON.stringify(writeCalls)).not.toContain(account.email);
  });
});
