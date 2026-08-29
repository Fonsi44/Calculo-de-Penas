import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEME_PRESETS, site } from '@/lib/site';

const ROOT = resolve(__dirname, '..');

function read(rel: string): string {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

describe('Design system — tokens base', () => {
  const css = read('app/globals.css');

  it('define tokens de radius y sombras', () => {
    expect(css).toMatch(/--radius-lg:/);
    expect(css).toMatch(/--shadow-btn-primary:/);
    expect(css).toMatch(/--shadow-focus-ring:/);
  });

  it('define utilidades card-premium y btn-shadow', () => {
    expect(css).toMatch(/\.card-premium/);
    expect(css).toMatch(/\.shadow-btn-primary/);
  });

  it('respeta prefers-reduced-motion', () => {
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});

describe('Theme presets', () => {
  it('tiene al menos 3 presets registrados', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it.each(THEME_PRESETS)('preset %s tiene archivo CSS', (preset) => {
    expect(existsSync(resolve(ROOT, `themes/${preset}.css`))).toBe(true);
  });

  it('site.theme es un preset válido', () => {
    expect(THEME_PRESETS).toContain(site.theme);
  });
});

describe('Marketing blocks — existencia', () => {
  const blocks = [
    'components/marketing/page-hero.tsx',
    'components/marketing/section.tsx',
    'components/marketing/cta-block.tsx',
    'components/marketing/faq-block.tsx',
    'components/marketing/site-header.tsx',
    'components/marketing/site-footer.tsx',
    'components/marketing/feature-grid.tsx',
  ];

  it.each(blocks)('%s existe', (block) => {
    expect(existsSync(resolve(ROOT, block))).toBe(true);
  });
});

describe('Páginas de ejemplo', () => {
  it('home tiene un solo PageHero (h1)', () => {
    const home = read('app/page.tsx');
    expect(home).toMatch(/PageHero/);
    expect(home).not.toMatch(/<h1/);
  });

  it('about page existe para validación de flujo', () => {
    expect(existsSync(resolve(ROOT, 'app/about/page.tsx'))).toBe(true);
  });
});
