import { describe, expect, it } from 'vitest';
import { summarizeReadiness, type ReadinessCheck } from '../app/api/health/readiness/route';

describe('production readiness summary', () => {
  it.each([
    [['healthy', 'healthy'], 'healthy'],
    [['healthy', 'degraded'], 'degraded'],
    [['degraded', 'unready'], 'unready'],
  ] as const)('summarizes %s as %s', (statuses, expected) => {
    const checks: ReadinessCheck[] = statuses.map((status, index) => ({
      name: `check-${index}`,
      status,
    }));
    expect(summarizeReadiness(checks)).toBe(expected);
  });
});
