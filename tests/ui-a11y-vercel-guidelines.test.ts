/**
 * Contrato de a11y pública (Web Interface Guidelines de Vercel).
 * Trabaja sobre fuente: no requiere DB ni navegador.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');

function readRoot(rel: string): string {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) {
    throw new Error(`No existe ${path}`);
  }
  return readFileSync(path, 'utf8');
}

function linesWithNakedOutlineNone(src: string): string[] {
  return src.split('\n').filter((line) => {
    if (!line.includes('focus-visible:outline-none') && !line.includes('focus:outline-none')) {
      return false;
    }
    if (line.includes('ring-') || line.includes('focus-ring') || line.includes('shadow-focus-ring')) {
      return false;
    }
    if (line.includes('input-refined')) {
      return false;
    }
    return true;
  });
}

describe('UI a11y — Web Interface Guidelines (parche público)', () => {
  it('ServiceSearch declara nombre accesible y anuncia resultados', () => {
    const src = readRoot('components/blog/service-search.tsx');
    expect(src).toMatch(/htmlFor=\{searchId\}|htmlFor="service-search/);
    expect(src).toContain('aria-live');
    expect(src).toContain('aria-hidden="true"');
    expect(src).toContain('useDeferredValue');
  });

  it('las tarjetas de área jurídica usan h3, no h4', () => {
    const src = readRoot('app/(public)/servicios-juridicos/[slug]/page.tsx');
    expect(src).not.toMatch(/<h4 className="font-bold text-sm md:text-base text-primary/);
    expect(src).toMatch(/<h3 className="font-bold text-sm md:text-base text-primary/);
  });

  it('CTAs públicos no dejan outline-none sin anillo de foco', () => {
    expect(linesWithNakedOutlineNone(readRoot('components/marketing/cta-buttons.tsx'))).toEqual([]);
  });

  it('el aviso de cookies no deja outline-none sin anillo de foco', () => {
    expect(linesWithNakedOutlineNone(readRoot('components/cookie-consent.tsx'))).toEqual([]);
  });

  it('el formulario de consulta nombra campos y usa inputMode tel', () => {
    const src = readRoot('components/marketing/solicitar-consulta-form.tsx');
    expect(src).toContain('name={fieldId}');
    expect(src).toContain("inputMode={type === 'tel' ? 'tel' : undefined}");
    expect(src).toContain("spellCheck={type === 'email' ? false : undefined}");
  });

  it('anclas y skip-link tienen desplazamiento bajo el header sticky', () => {
    const css = readRoot('app/globals.css');
    expect(css).toContain('scroll-margin-top');
    expect(css).toMatch(/\.skip-link:focus-visible/);
  });

  it('el header monta el buscador de catálogo sin arrastrar areas-juridicas al cliente', () => {
    const layout = readRoot('app/(public)/layout.tsx');
    const header = readRoot('components/marketing/public-header.tsx');
    const search = readRoot('components/marketing/header-service-search.tsx');
    const index = readRoot('lib/service-search-index.ts');

    expect(layout).toContain('buildPublicCatalog');
    expect(layout).toContain('searchEntries');
    expect(header).toContain('HeaderServiceSearch');
    expect(header).toContain('searchEntries');
    expect(search).toContain('Buscar en el blog');
    expect(search).toContain('/blog#buscar');
    expect(search).not.toContain('areas-juridicas');
    expect(index).not.toContain('areas-juridicas');
  });
});
