import { describe, expect, it, vi } from 'vitest';
import {
  beginLockedTransaction,
  compareRequiredSubset,
  insertExactTracking,
  signPlan,
  validateCanonicalExport,
  verifyPlan,
} from '../tools/db/baseline-safety.mjs';

function validPlan() {
  const plan = {
    head: 'abc', branchId: 'branch-clone', database: 'neondb',
    inventoryFingerprint: 'inventory', equivalence: 'EQUIVALENTE',
  };
  return { ...plan, signature: signPlan(plan) };
}

describe('canonical migration baseline safety', () => {
  it.each([
    ['manipulated plan', (p: Record<string, string>) => { p.database = 'other'; }, 'plan_signature'],
    ['different HEAD', () => {}, 'head'],
    ['wrong branch', () => {}, 'branch'],
    ['production branch', () => {}, 'branch'],
  ])('rejects %s', (_name, mutate, expected) => {
    const plan = validPlan();
    mutate(plan);
    const context = {
      head: _name === 'different HEAD' ? 'def' : 'abc',
      branchId: _name === 'wrong branch' || _name === 'production branch' ? 'production' : 'branch-clone',
      database: 'neondb', inventoryFingerprint: 'inventory',
    };
    expect(verifyPlan(plan, context)).toContain(expected);
  });

  it('acquires the advisory lock inside the transaction', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await beginLockedTransaction({ query }, 20);
    expect(query.mock.calls.map((call) => call[0])).toEqual([
      'BEGIN', 'SELECT pg_advisory_xact_lock($1)',
    ]);
  });

  it('copies manual tracking fields exactly', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const appliedAt = new Date('2026-07-28T00:00:00Z');
    await insertExactTracking({ query }, {
      drizzle: { rows: [{ hash: 'd', created_at: 123 }] },
      manual: { rows: [{ name: 'm', hash: 'h', rows_affected: 7, applied_at: appliedAt }] },
    });
    expect(query.mock.calls[1][1]).toEqual(['m', 'h', 7, appliedAt]);
    expect(query.mock.calls[1][0]).not.toContain('ON CONFLICT');
    expect(query.mock.calls[1][0]).not.toContain('NOW()');
  });

  it('surfaces SQL errors so the caller can roll back', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('revocation'));
    await expect(beginLockedTransaction({ query }, 20)).rejects.toThrow('revocation');
  });

  it('rejects legacy canonical exports that contain seed counts without hashes', () => {
    const failures = validateCanonicalExport({
      tracking: { drizzle: { count: 39 }, manual: { count: 20 } },
      seeds: { roles: 3 },
    }, ['roles']);
    expect(failures).toEqual(['format_version', 'seed_fingerprint:roles', 'seed_contracts']);
  });

  it('accepts versioned canonical exports with normalized seed fingerprints', () => {
    const failures = validateCanonicalExport({
      formatVersion: 3,
      tracking: { drizzle: { count: 39 }, manual: { count: 20 } },
      seeds: { roles: { count: 3, sha256: 'a'.repeat(64) } },
      seedContracts: { roles: { rows: [] } },
    }, ['roles']);
    expect(failures).toEqual([]);
  });

  it('accepts additional mutable rows when every contractual seed matches by natural key', () => {
    expect(compareRequiredSubset(
      [{ nombre: 'admin', descripcion: 'Administrador' }],
      [
        { nombre: 'admin', descripcion: 'Administrador' },
        { nombre: 'operador', descripcion: 'Operador local' },
      ],
      ['nombre'],
    )).toMatchObject({ status: 'EQUIVALENTE_SUBSET', missing: [], conflicts: [] });
  });

  it('reports missing and conflicting contractual seeds separately', () => {
    expect(compareRequiredSubset(
      [
        { recurso: 'usuarios', accion: 'leer' },
        { recurso: 'usuarios', accion: 'editar' },
      ],
      [{ recurso: 'usuarios', accion: 'leer', descripcion: 'extra' }],
      ['recurso', 'accion'],
    )).toMatchObject({
      status: 'DIVERGENTE_CONTRACTUAL',
      missing: ['"usuarios"|"editar"'],
      conflicts: ['"usuarios"|"leer"'],
    });
  });
});
