import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalDomains, findTypoHits } from '../scripts/seo-canonical-domain-enforce.mjs';

const ROOT = resolve(import.meta.dirname, '..');

describe('Dominio canónico de producción (enforce §2)', () => {
  const envContent = readFileSync(resolve(ROOT, '.env.example'), 'utf8');
  let domains: ReturnType<typeof canonicalDomains>;

  beforeAll(() => {
    domains = canonicalDomains(envContent);
  });

  it('.env.example define el dominio correcto (con "asociados")', () => {
    // Derivado de .env.example: nunca se hardcodea el dominio (evita reintroducir
    // la variante sin la "da" de "asociados").
    expect(domains.correctHost.startsWith('www.')).toBe(true);
    expect(domains.correctHost.endsWith('.com')).toBe(true);
    expect(domains.correctHost).toContain('asociados');
    expect(domains.correctHost).not.toContain('asocios');
  });

  it('la variante derivada elimina la "da" de "asociados"', () => {
    expect(domains.typoHost.length).toBe(domains.correctHost.length - 2);
    expect(domains.typoHost).not.toBe(domains.correctHost);
  });

  it('no hay variante incorrecta en archivos ejecutables ni documentación operativa', () => {
    const hits = findTypoHits(envContent);
    expect(hits, `variante incorrecta presente en: ${hits.join(', ')}`).toEqual([]);
  });

  it('los tests de protección sí escriben la variante a propósito (no se rompen)', () => {
    // Verificación: los tests de rechazo contienen la variante inválida para
    // comprobar su ausencia en el código de la app.
    const fase2 = readFileSync(resolve(ROOT, 'tests/fase2-paginas-centrales.test.ts'), 'utf8');
    expect(fase2).toContain(domains.typoBare);
  });
});
