import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

const ADMIN_MUTATIONS = [
  'app/api/admin/alertas/route.ts',
  'app/api/admin/reglas-comunicacion/route.ts',
  'app/api/admin/simulador/route.ts',
];

describe('contratos de mutaciones administrativas', () => {
  it.each(ADMIN_MUTATIONS)('%s exige sesión admin, CSRF y Zod', (file) => {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    expect(source).toContain('requireAdmin(request)');
    expect(source).toContain('validateCsrf(request)');
    expect(source).toMatch(/z\.object\(/);
  });

  it('el simulador es determinista y declara que es una previsualización', () => {
    const source = readFileSync(resolve(ROOT, 'app/api/admin/simulador/route.ts'), 'utf8');
    expect(source).not.toContain('Math.random');
    expect(source).toContain("mode: 'deterministic-preview'");
  });
});
