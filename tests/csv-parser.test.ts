import { describe, expect, it } from 'vitest';
import { parseCsv, stringifyCsv } from '@/lib/csv';

describe('parser CSV canónico', () => {
  it('preserva comas, comillas y saltos de línea dentro de campos', () => {
    const source = stringifyCsv([
      ['a', 'b'],
      ['texto, con coma', 'dice "hola"\ny sigue'],
    ]);
    expect(parseCsv(source)).toEqual([
      ['a', 'b'],
      ['texto, con coma', 'dice "hola"\ny sigue'],
    ]);
  });

  it('rechaza comillas sin cerrar', () => {
    expect(() => parseCsv('"sin cerrar')).toThrow(/comillas sin cerrar/);
  });
});
