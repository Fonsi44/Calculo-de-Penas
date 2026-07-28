import { describe, expect, it } from 'vitest';
import {
  compareInventories,
  compareObjectType,
} from '../tools/db/schema-inventory.mjs';

const empty = {
  tables: [], columns: [], indexes: [], constraints: [], enums: [], domains: [],
  compositeTypes: [], sequences: [], extensions: [], routines: [], triggers: [],
  views: [], materializedViews: [], policies: [],
};

describe('semantic schema inventory', () => {
  it('does not equate equal counts with different objects', () => {
    const diff = compareInventories({
      ...empty, tables: [{ schema: 'public', name: 'a', type: 'table' }],
    }, {
      ...empty, tables: [{ schema: 'public', name: 'b', type: 'table' }],
    }) as unknown as { summary: Record<string, Record<string, number>> };
    expect(diff.summary.tables.CANONICAL_ONLY).toBe(1);
    expect(diff.summary.tables.CLONE_ONLY).toBe(1);
  });

  it.each([
    ['full_type', 'text', 'varchar(20)'],
    ['nullable', false, true],
    ['default', 'now()', null],
  ])('detects a different column %s', (field, canonical, clone) => {
    const base = { schema: 'public', table: 't', name: 'c', position: 1 };
    const result = compareObjectType('columns', [
      { ...base, [field]: canonical },
    ], [{ ...base, [field]: clone }]);
    expect(result[0].status).toBe('SAME_NAME_DIFFERENT_DEFINITION');
  });

  it('keys indexes by schema, table and name and compares partial definitions', () => {
    const base = { schema: 'public', table: 'tokens', name: 'token_idx' };
    const result = compareObjectType('indexes', [
      { ...base, unique: true, predicate: 'used_at IS NULL' },
    ], [{ ...base, unique: false, predicate: null }]);
    expect(result[0].status).toBe('SAME_NAME_DIFFERENT_DEFINITION');
  });

  it('detects foreign-key action changes', () => {
    const base = { schema: 'public', table: 'child', name: 'child_parent_fk', type: 'FOREIGN_KEY' };
    const result = compareObjectType('constraints', [
      { ...base, on_delete: 'CASCADE' },
    ], [{ ...base, on_delete: 'NO ACTION' }]);
    expect(result[0].status).toBe('SAME_NAME_DIFFERENT_DEFINITION');
  });

  it('compares ordered enum values as one semantic object', () => {
    const result = compareObjectType('enums', [
      { schema: 'public', name: 'state', values: ['a', 'b'] },
    ], [{ schema: 'public', name: 'state', values: ['a', 'b', 'c'] }]);
    expect(result[0].status).toBe('SAME_NAME_DIFFERENT_DEFINITION');
  });

  it('normalizes column ordinal position in the contractual inventory', () => {
    const canonical = {
      ...empty,
      columns: [{ schema: 'public', table: 't', name: 'c', position: 1, full_type: 'text', nullable: true }],
    };
    const clone = {
      ...empty,
      columns: [{ schema: 'public', table: 't', name: 'c', position: 9, full_type: 'text', nullable: true }],
    };
    const diff = compareInventories(canonical, clone) as unknown as {
      objects: { columns: Array<{ status: string; compatibility?: string }> };
    };
    expect(diff.objects.columns[0]).toMatchObject({
      status: 'IDENTICAL', compatibility: 'ORDINAL_POSITION_ONLY',
    });
  });

  it('accepts append-only enum values present only in the clone', () => {
    const canonical = { ...empty, enums: [{ schema: 'public', name: 'state', values: ['a', 'b'] }] };
    const clone = { ...empty, enums: [{ schema: 'public', name: 'state', values: ['a', 'b', 'legacy'] }] };
    const diff = compareInventories(canonical, clone) as unknown as {
      objects: { enums: Array<{ status: string; compatibility?: string }> };
    };
    expect(diff.objects.enums[0]).toMatchObject({
      status: 'IDENTICAL', compatibility: 'CLONE_APPEND_ONLY_SUPERSET',
    });
  });

  it('accepts a clone UNIQUE constraint backed by the same canonical UNIQUE index', () => {
    const index = {
      schema: 'public', table: 'tokens', name: 'tokens_hash_unique',
      unique: true, columns: ['hash'],
    };
    const canonical = { ...empty, indexes: [index] };
    const clone = {
      ...empty,
      indexes: [index],
      constraints: [{
        schema: 'public', table: 'tokens', name: 'tokens_hash_unique',
        type: 'UNIQUE', columns: ['hash'],
      }],
    };
    const diff = compareInventories(canonical, clone) as unknown as {
      objects: { constraints: Array<{ status: string; compatibility?: string }> };
    };
    expect(diff.objects.constraints[0]).toMatchObject({
      status: 'IDENTICAL', compatibility: 'UNIQUE_INDEX_EQUIVALENT',
    });
  });

  it.each([
    ['routines', { schema: 'public', name: 'f', identity_arguments: '', kind: 'function', definition: 'SELECT 1' },
      { schema: 'public', name: 'f', identity_arguments: '', kind: 'function', definition: 'SELECT 2' }],
    ['triggers', { schema: 'public', table: 't', name: 'audit', definition: 'BEFORE INSERT' },
      { schema: 'public', table: 't', name: 'audit', definition: 'AFTER INSERT' }],
  ])('detects different %s', (type, canonical, clone) => {
    expect(compareObjectType(type, [canonical], [clone])[0].status)
      .toBe('SAME_NAME_DIFFERENT_DEFINITION');
  });

  it('detects a missing trigger', () => {
    const trigger = { schema: 'public', table: 't', name: 'audit' };
    expect(compareObjectType('triggers', [trigger], [])[0].status).toBe('CANONICAL_ONLY');
  });
});
