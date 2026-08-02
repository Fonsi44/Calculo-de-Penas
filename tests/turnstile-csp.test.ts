import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('CSP de Cloudflare Turnstile', () => {
  it('autoriza el script de Turnstile en producción y desarrollo', () => {
    const config = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8');
    const scriptDirectives = config.match(/"script-src[^\n]+/g) ?? [];

    expect(scriptDirectives).toHaveLength(2);
    for (const directive of scriptDirectives) {
      expect(directive).toContain('https://challenges.cloudflare.com');
    }
  });
});
