import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveIndexNowKey, listVerifiedPublicIndexNowKeys } from '../scripts/lib/indexnow-key.mjs';

const ROOT = process.cwd();

describe('resolveIndexNowKey', () => {
  it('resuelve la clave verificada desde public/<key>.txt', () => {
    const keys = listVerifiedPublicIndexNowKeys(join(ROOT, 'public'));
    expect(keys).toContain('9f9940d5665c41d98705255d3704be71');

    const prev = process.env.INDEXNOW_KEY;
    process.env.INDEXNOW_KEY = 'clave-obsoleta-de-prueba';
    const resolved = resolveIndexNowKey(ROOT);
    expect(resolved.key).toBe('9f9940d5665c41d98705255d3704be71');
    expect(resolved.source).toBe('public');
    expect(resolved.drift).toBe(true);
    if (prev === undefined) delete process.env.INDEXNOW_KEY;
    else process.env.INDEXNOW_KEY = prev;
  });
});
