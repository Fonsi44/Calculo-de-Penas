import { describe, expect, it } from 'vitest';
import {
  parseCsv,
  serializeCsv,
} from '../tools/audit/reconcile-remediation-ledger.mjs';

describe('remediation ledger CSV contract', () => {
  it('round-trips commas, quotes and newlines', () => {
    const rows = [{
      id: 'A-1',
      evidence: 'ruta, "verificada"\nsegunda línea',
      decision: 'KEEP',
    }];
    expect(parseCsv(serializeCsv(rows))).toEqual(rows);
  });

  it('preserves empty fields', () => {
    expect(parseCsv('a,b,c\n1,,3\n')).toEqual([{ a: '1', b: '', c: '3' }]);
  });
});
