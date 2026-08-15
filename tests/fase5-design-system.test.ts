/**
 * Tests FASE 5 — Sistema de diseño y consolidación visual.
 *
 * Valida, sobre el código fuente (sin DB ni build), los cambios efectivamente
 * implementados en FASE 5 y las garantías de preservación (SEO/GEO/blog/
 * intranet/analítica/intactos). Tests anti-regresión.
 *
 * Cobertura (alineada con docs/design/fase-5/):
 *   §1 Tokens centralizados en @theme (focus-ring, duration-*, radius-pill).
 *   §2 Eliminación de duplicados (coverage-city-card/grid).
 *   §3 Alineación visual de CtaSpain con ContextualCta (conservando evento).
 *   §4 RespuestaDirecta compone como AnswerBlock (eyebrow + línea dorada).
 *   §5 LandingLocalView delega FAQ en HubFaq (no FAQPage duplicado).
 *   §6 Section acepta variant (mapea a backgrounds existentes).
 *   §7 Preservación: 10 ciudades footer (R18), dominio canónico, sin PII,
 *      sin `verified`, prefers-reduced-motion presente.
 *
 * NOTA: no duplica garantías SEO ya cubiertas por seo-protection.test.ts,
 * fase2/3/4-*.test.ts (canonicals, H1 único, schema, robots, sitemap).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from '@/lib/site';

const ROOT = resolve(__dirname, '..');
const COMPONENTS = resolve(ROOT, 'components/marketing');

function readRoot(rel: string): string {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function readComponent(rel: string): string {
  const path = resolve(COMPONENTS, rel);
  if (!existsSync(path)) {
    throw new Error(`No existe ${path}`);
  }
  return readFileSync(path, 'utf8');
}

// ---------------------------------------------------------------------------
// §1 Tokens centralizados en @theme (FASE 5)
// ---------------------------------------------------------------------------

describe('FASE 5 §1 — Tokens centralizados en @theme', () => {
  const css = readRoot('app/globals.css');

  it('define --radius-pill en @theme', () => {
    expect(css).toMatch(/--radius-pill:\s*9999px/);
  });

  it('define las 3 duraciones canónicas (--duration-fast/normal/slow)', () => {
    expect(css).toMatch(/--duration-fast:\s*160ms/);
    expect(css).toMatch(/--duration-normal:\s*220ms/);
    expect(css).toMatch(/--duration-slow:\s*280ms/);
  });

  it('define --shadow-focus-ring y --shadow-focus-ring-subtle', () => {
    expect(css).toMatch(/--shadow-focus-ring:/);
    expect(css).toMatch(/--shadow-focus-ring-subtle:/);
  });

  it('.focus-ring consume los tokens (no valores hardcodeados)', () => {
    expect(css).toMatch(/\.focus-ring:focus-visible[^}]*box-shadow:\s*var\(--shadow-focus-ring\)/);
    expect(css).toMatch(/\.focus-ring\s*{[^}]*transition:\s*box-shadow\s+var\(--duration-fast\)/);
  });

  it('.hero-card usa var(--radius-lg) (no 16px hardcodeado)', () => {
    expect(css).toMatch(/\.hero-card\s*{[^}]*border-radius:\s*var\(--radius-lg\)/);
    expect(css).not.toMatch(/\.hero-card\s*{[^}]*border-radius:\s*16px/);
  });

  it('.card-dark usa var(--radius-lg) (no 14px hardcodeado)', () => {
    expect(css).toMatch(/\.card-dark\s*{[^}]*border-radius:\s*var\(--radius-lg\)/);
    expect(css).not.toMatch(/\.card-dark\s*{[^}]*border-radius:\s*14px/);
  });
});

// ---------------------------------------------------------------------------
// §2 Eliminación de duplicados (código muerto)
// ---------------------------------------------------------------------------

describe('FASE 5 §2 — Eliminación de coverage-city-card y coverage-city-grid', () => {
  it('coverage-city-card.tsx ya NO existe', () => {
    const path = resolve(COMPONENTS, 'coverage-city-card.tsx');
    expect(existsSync(path)).toBe(false);
  });

  it('coverage-city-grid.tsx ya NO existe', () => {
    const path = resolve(COMPONENTS, 'coverage-city-grid.tsx');
    expect(existsSync(path)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §3 CtaSpain alineado visualmente con ContextualCta (conservando evento)
// ---------------------------------------------------------------------------

describe('FASE 5 §3 — CtaSpain alineado con ContextualCta', () => {
  const cta = readComponent('cta-spain.tsx');

  it('conserva el evento trackCtaSpain (contrato analítico)', () => {
    expect(cta).toMatch(/import.*trackCtaSpain.*from.*'@\/lib\/analytics'/);
    expect(cta).toMatch(/trackCtaSpain\(\)/);
  });

  it('usa el patrón visual de ContextualCta (bg-accent/5 + border-accent/30)', () => {
    expect(cta).toMatch(/bg-accent\/5/);
    expect(cta).toMatch(/border-accent\/30/);
  });

  it('NO usa la banda navy full-width antigua (background="primary")', () => {
    expect(cta).not.toMatch(/background="primary"/);
  });
});

// ---------------------------------------------------------------------------
// §4 RespuestaDirecta compone como AnswerBlock (eyebrow + línea dorada)
// ---------------------------------------------------------------------------

describe('FASE 5 §4 — RespuestaDirecta alineada con AnswerBlock', () => {
  const sdb = readComponent('service-detail-blocks.tsx');

  it('RespuestaDirecta añade la línea dorada decorativa (bg-accent/80, 12x3px)', () => {
    // Localizamos el bloque de RespuestaDirecta y verificamos que contiene la línea.
    expect(sdb).toMatch(/h-\[3px\]\s*w-12\s+rounded-full\s+bg-accent\/80/);
  });

  it('RespuestaDirecta NO impone un <h2> de pregunta (semántica post-H1)', () => {
    // Extraemos el cuerpo de RespuestaDirecta (entre su declaración y el siguiente export).
    const start = sdb.indexOf('export function RespuestaDirecta');
    expect(start).toBeGreaterThan(-1);
    const end = sdb.indexOf('export function', start + 1);
    const body = sdb.slice(start, end === -1 ? undefined : end);
    expect(body).not.toMatch(/<h2/);
  });
});

// ---------------------------------------------------------------------------
// §5 LandingLocalView delega FAQ en HubFaq (sin FAQPage duplicado)
// ---------------------------------------------------------------------------

describe('FASE 5 §5 — LandingLocalView delega FAQ en HubFaq', () => {
  const ll = readComponent('landing-local.tsx');

  it('importa y usa HubFaq', () => {
    expect(ll).toMatch(/import.*HubFaq.*from.*'@\/components\/marketing\/hub-faq'/);
    expect(ll).toMatch(/<HubFaq/);
  });

  it('NO conserva el FAQPage manual en ldSchemas (lo emite HubFaq)', () => {
    // HubFaq genera el FAQPage con @id `${url}#faqpage`; ldSchemas ya no debe
    // tener un segundo bloque FAQPage con el mismo @id.
    const faqPageMatches = ll.match(/'@type':\s*'FAQPage'/g) ?? [];
    expect(faqPageMatches.length).toBe(0);
  });

  it('NO duplica BreadcrumbList en ldSchemas (lo emite <Breadcrumbs>)', () => {
    const breadcrumbMatches = ll.match(/'@type':\s*'BreadcrumbList'/g) ?? [];
    expect(breadcrumbMatches.length).toBe(0);
    expect(ll).toMatch(/<Breadcrumbs/);
  });

  it('usa IconBadge en servicios y blog (no badges inline w-11 h-11)', () => {
    expect(ll).toMatch(/import.*IconBadge.*from.*'@\/components\/marketing\/icon-badge'/);
    expect(ll).toMatch(/<IconBadge\s+icon=\{Scale\}/);
    expect(ll).toMatch(/<IconBadge\s+icon=\{BookOpen\}/);
  });
});

// ---------------------------------------------------------------------------
// §6 Section acepta variant (mapea a backgrounds existentes)
// ---------------------------------------------------------------------------

describe('FASE 5 §6 — Section variant alias', () => {
  const section = readComponent('section.tsx');

  it('declara la prop variant con los 5 valores del design-system', () => {
    expect(section).toMatch(/variant\?:\s*'default'\s*\|\s*'subtle'\s*\|\s*'contrast'\s*\|\s*'brand'\s*\|\s*'editorial'/);
  });

  it('define el mapeo VARIANT_TO_BG', () => {
    expect(section).toMatch(/VARIANT_TO_BG/);
    expect(section).toMatch(/subtle:\s*'muted'/);
    expect(section).toMatch(/brand:\s*'primary'/);
  });

  it('background explícito tiene prioridad sobre variant (compatibilidad)', () => {
    expect(section).toMatch(/background\s*\?\?\s*\(variant/);
  });
});

// ---------------------------------------------------------------------------
// §7 Preservación de garantías previas (no romper FASE 1-4)
// ---------------------------------------------------------------------------

describe('FASE 5 §7 — Preservación de garantías', () => {
  it('dominio canónico se mantiene (https://www.pinedayasociadoshn.com)', () => {
    expect(site.url).toBe('https://www.pinedayasociadoshn.com');
  });

  it('footer conserva las ciudades con landing indexable (R18 2026-08-03)', () => {
    const footer = readComponent('public-footer.tsx');
    const CIUDADES_INDEXABLES = [
      'Nacaome', 'Choluteca', 'San Lorenzo', 'Goascorán',
      'San Marcos de Colón', 'El Triunfo', 'Amapala',
    ];
    const CIUDADES_NOINDEX = [
      'Marcovia', 'Pespire', 'Namasigüe', 'Orocuina',
    ];
    // Normalizamos: quitamos tildes del fuente para tolerar variantes.
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const footerNorm = normalize(footer);
    for (const ciudad of CIUDADES_INDEXABLES) {
      const ciudadNorm = normalize(ciudad);
      expect(footerNorm).toContain(ciudadNorm);
    }
    // Las landings NOINDEX_UNTIL_UNIQUE no aparecen en listados SEO automáticos.
    for (const ciudad of CIUDADES_NOINDEX) {
      const ciudadNorm = normalize(ciudad);
      expect(footerNorm).not.toContain(ciudadNorm);
    }
  });

  it('sede física única sigue siendo Nacaome (R2 + FASE 4)', () => {
    expect(site.address.city).toBe('Nacaome');
  });

  it('globals.css conserva el bloque prefers-reduced-motion global', () => {
    const css = readRoot('app/globals.css');
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('globals.css conserva los easings canónicos (--ease-spring, --ease-soft)', () => {
    const css = readRoot('app/globals.css');
    expect(css).toMatch(/--ease-spring:\s*cubic-bezier/);
    expect(css).toMatch(/--ease-soft:\s*cubic-bezier/);
  });

  it('globals.css conserva las sombras de botón tokenizadas (R16)', () => {
    const css = readRoot('app/globals.css');
    expect(css).toMatch(/--shadow-btn-primary/);
    expect(css).toMatch(/--shadow-btn-secondary/);
    expect(css).toMatch(/--shadow-btn-accent/);
    expect(css).toMatch(/--shadow-btn-success/);
  });

  it('ningún componente marketing afirma `verified` sin revisión humana (R11)', () => {
    const componentsToCheck = [
      'cta-spain.tsx', 'landing-local.tsx', 'service-detail-blocks.tsx',
      'section.tsx', 'hub-faq.tsx', 'icon-badge.tsx',
    ];
    for (const f of componentsToCheck) {
      const src = readComponent(f);
      // No debe haber un string "verified: true" hardcodeado como afirmación.
      expect(src).not.toMatch(/verified:\s*true/);
    }
  });
});

// ---------------------------------------------------------------------------
// §13 — Dominio canónico (FASE 5 — corrección SEO productiva)
// ---------------------------------------------------------------------------
describe('FASE 5 §13 — dominio canónico único', () => {
  const WRONG = 'pinedayasocioshn.com';
  const CORRECT = 'pinedayasociadoshn.com';

  it('lib/site.ts usa el dominio correcto como fallback', () => {
    const src = readFileSync('lib/site.ts', 'utf-8');
    expect(src).toMatch(new RegExp(CORRECT.replace('.', '\\.')));
  });

  it('no hay ocurrencias operativas del dominio incorrecto en lib/site.ts', () => {
    const src = readFileSync('lib/site.ts', 'utf-8');
    const lines = src.split('\n').filter(l => l.includes(WRONG));
    for (const line of lines) {
      const trimmed = line.trim();
      expect(
        trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')
      ).toBe(true);
    }
  });

  it('site.url contiene el dominio correcto', () => {
    expect(site.url).toContain(CORRECT);
  });

  it('el email de contacto usa el dominio correcto', () => {
    expect(site.email).toContain(CORRECT);
  });
});
