import { describe, it, expect } from 'vitest';
import { extraerClaimsForNotebooklm } from '@/scripts/lib/blog-claims-extract';
import {
  normalizeBodyForCompare,
  parseAuditReport,
  runCitationChecks,
} from '@/scripts/lib/blog-notebooklm-contract-checks';

describe('extraerClaimsForNotebooklm constitución implícita', () => {
  it('detecta art. N cuando el contexto menciona Constitución', () => {
    const body =
      '<p>La Constitución declara inviolable el derecho de defensa (art. 82) y el art. 71 fija plazos.</p>';
    const claims = extraerClaimsForNotebooklm(body);
    expect(claims.some((c) => /82 de la Constitución/i.test(c.textoOriginal))).toBe(true);
    expect(claims.some((c) => /71 de la Constitución/i.test(c.textoOriginal))).toBe(true);
  });
});

describe('blog-notebooklm-contract-checks', () => {
  it('normaliza espacios para comparar bodies', () => {
    expect(normalizeBodyForCompare('a   b\n c')).toBe('a b c');
  });

  it('parsea informes de auditoría', () => {
    const stats = parseAuditReport({
      slug: 'test',
      stats: { total: 3, ok: 2, error: 1, insuficiente: 0, errorAlta: 1 },
    });
    expect(stats?.errorAlta).toBe(1);
  });

  it('detecta citas prohibidas en body', () => {
    const bodies = new Map([
      ['mediacion-vs-juicio-cual-elegir', 'Los arts. 920 y 921 CPC regulan...'],
    ]);
    const { failed } = runCitationChecks(bodies);
    expect(failed).toBeGreaterThan(0);
  });
});
