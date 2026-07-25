import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { site } from '@/lib/site';

const auditorSource = readFileSync('scripts/validar-meta-seo.ts', 'utf8');

describe('auditor de metadata SEO', () => {
  it('audita el HTML compilado y no una copia manual de metadata', () => {
    expect(auditorSource).toContain("'.next', 'server', 'app'");
    expect(auditorSource).toContain('extractBuiltMetadata');
    expect(auditorSource).toContain('generateBlogMetadata');
    expect(auditorSource).not.toContain("checkAll('/despacho'");
    expect(auditorSource).not.toContain('const landings =');
  });

  it('distingue las páginas legales noindex de las rutas indexables', () => {
    expect(auditorSource).toContain('NOINDEX_ROUTES');
    expect(auditorSource).toContain("'Página legal auxiliar indexable contra la política declarada'");
  });

  it('mantiene el title absoluto de la home dentro de 60 caracteres', () => {
    expect(site.tagline.length).toBeLessThanOrEqual(60);
    expect(site.tagline).toContain('Nacaome');
    expect(site.tagline).toContain('Pineda y Asociados');
  });
});
