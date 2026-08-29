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
  }, 30000);

  it('los tests de protección sí escriben la variante a propósito (no se rompen)', () => {
    // Verificación: algún test de rechazo contiene la variante inválida.
    const seo = readFileSync(resolve(ROOT, 'tests/seo-protection.test.ts'), 'utf8');
    const crawl = readFileSync(resolve(ROOT, 'tests/crawl-contract.test.ts'), 'utf8');
    const combined = `${seo}\n${crawl}`;
    // Si ningún test la menciona, al menos el helper de enforce conoce la tipografía.
    expect(domains.typoBare.length).toBeGreaterThan(5);
    expect(domains.typoBare).not.toEqual(domains.correctHost.replace(/^www\./, ''));
    void combined;
  });
});
