import { describe, it, expect } from 'vitest';
import { extraerClaimsForNotebooklm } from '@/scripts/lib/blog-claims-extract';

describe('extraerClaimsForNotebooklm', () => {
  it('extrae artículos y decretos sin cargar delitos.json', () => {
    const body =
      '<p>El art. 175 CPP y el Decreto 9-99-E. Daños y perjuicios laborales.</p>';
    const claims = extraerClaimsForNotebooklm(body);
    expect(claims.some((c) => /175 CPP/i.test(c.textoOriginal))).toBe(true);
    expect(claims.some((c) => /9-99-E/i.test(c.textoOriginal))).toBe(true);
    expect(claims.some((c) => c.textoOriginal.toLowerCase() === 'daños')).toBe(false);
  });
});
