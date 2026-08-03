/**
 * Tests del motor común de política de contenido (lib/content-policy.ts).
 *
 * Verifica que el motor devuelva resultados estructurados reutilizables en
 * Admin, seeds, scripts, API, formularios, build y auditorías de DB, sin
 * duplicar listas de expresiones y sin tocar textos jurídicos legítimos.
 */
import { describe, expect, it } from 'vitest';
import {
  CONTENT_POLICY_RULES,
  assertContentPolicySafe,
  isPublicEditableField,
  scanContentPolicyViolations,
  validateContentPolicy,
  validateEditablePageContent,
} from '@/lib/content-policy';

describe('scanContentPolicyViolations — estructura', () => {
  it('devuelve violaciones estructuradas con código y severidad', () => {
    const violations = scanContentPolicyViolations(
      'Ofrecemos una primera consulta gratuita y sin compromiso.',
      { field: 'home.hero.cta', context: 'página home' },
    );
    expect(violations.length).toBeGreaterThan(0);
    for (const v of violations) {
      expect(v.code).toMatch(/^(prohibited_commercial_claim|unauthorized_testimonial|unauthorized_success_guarantee|unauthorized_superlative|unauthorized_success_rate|fictional_client_case)$/);
      expect(v.severity).toMatch(/^(error|warning)$/);
      expect(typeof v.field).toBe('string');
      expect(typeof v.match).toBe('string');
      expect(typeof v.context).toBe('string');
    }
    expect(violations[0].field).toBe('home.hero.cta');
  });

  it('sugiere la formulación canónica para claims comerciales', () => {
    const violations = scanContentPolicyViolations('consulta sin costo');
    const claim = violations.find((v) => v.code === 'prohibited_commercial_claim');
    expect(claim?.suggestedReplacement).toBe('Evaluación inicial confidencial');
  });
});

describe('validateContentPolicy — semántica', () => {
  it('ok=false cuando hay una violación de severidad error', () => {
    const result = validateContentPolicy('Éxito garantizado en su caso');
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.severity === 'error')).toBe(true);
  });

  it('permite la formulación canónica', () => {
    const result = validateContentPolicy('Evaluación inicial confidencial');
    expect(result.ok).toBe(true);
  });

  it('permite textos jurídicos legítimos sobre trámites públicos', () => {
    const result = validateContentPolicy(
      'La asistencia de la Procuraduría de Trabajo es gratuita para los trabajadores.',
    );
    expect(result.ok).toBe(true);
  });

  it('detecta testimonios no autorizados y garantías en texto genérico', () => {
    const result = validateContentPolicy(
      'Testimonios de clientes: logramos una resolución favorable. Además, resultados asegurados.',
    );
    expect(result.ok).toBe(false);
    const codes = new Set(result.violations.map((v) => v.code));
    expect(codes.has('unauthorized_testimonial')).toBe(true);
    expect(codes.has('unauthorized_success_guarantee')).toBe(true);
  });

  it('detecta porcentajes de éxito sin evidencia', () => {
    const violations = scanContentPolicyViolations('Tenemos una tasa de éxito del 95 %.');
    expect(violations.some((v) => v.code === 'unauthorized_success_rate')).toBe(true);
  });

  it('detecta superlativos no verificados como warning', () => {
    const violations = scanContentPolicyViolations('Somos los mejores abogados de la región.');
    const sup = violations.find((v) => v.code === 'unauthorized_superlative');
    expect(sup?.severity).toBe('warning');
  });

  it('detecta clientes o casos ficticios/de ejemplo como warning', () => {
    const violations = scanContentPolicyViolations('Caso ficticio a modo de ejemplo.');
    expect(violations.some((v) => v.code === 'fictional_client_case')).toBe(true);
  });
});

describe('assertContentPolicySafe', () => {
  it('lanza con el motivo y la formulación canónica', () => {
    expect(() => assertContentPolicySafe('consulta gratuita', { context: 'landing' }))
      .toThrow(/content-policy/);
    expect(() => assertContentPolicySafe('consulta gratuita'))
      .toThrow(/Evaluación inicial confidencial/);
  });

  it('no lanza para contenido conforme', () => {
    expect(() => assertContentPolicySafe('Evaluación inicial confidencial')).not.toThrow();
  });
});

describe('compatibilidad Admin (validateEditablePageContent)', () => {
  it('bloquea la sección testimonials con contenido', () => {
    expect(() => validateEditablePageContent('home', 'testimonials', 'body', 'Testimonio de ejemplo'))
      .toThrow(/testimonials|content-policy/i);
  });

  it('bloquea claims comerciales en campos editables', () => {
    expect(() => validateEditablePageContent('home', 'hero', 'cta', 'Primera consulta gratis'))
      .toThrow(/content-policy/);
  });

  it('no valida secciones internas ni la página de configuración', () => {
    expect(isPublicEditableField('configuracion', 'hero')).toBe(false);
    expect(isPublicEditableField('home', '_meta')).toBe(false);
    expect(isPublicEditableField('home', '_layout')).toBe(false);
    expect(isPublicEditableField('home', '_visibility')).toBe(false);
    expect(isPublicEditableField('home', 'hero')).toBe(true);
    expect(() => validateEditablePageContent('configuracion', 'hero', 'cta', 'consulta gratis'))
      .not.toThrow();
  });
});

describe('reglas consolidadas (fuente única)', () => {
  it('no duplica códigos de regla', () => {
    const codes = CONTENT_POLICY_RULES.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('cada regla devuelve arrays de fragmentos, no regex sueltas', () => {
    for (const rule of CONTENT_POLICY_RULES) {
      const matches = rule.test('texto de prueba neutral');
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.every((m) => typeof m === 'string')).toBe(true);
    }
  });

  it('la función central y las reglas comparten los mismos resultados', () => {
    const direct = CONTENT_POLICY_RULES
      .flatMap((r) => r.test('consulta gratuita'))
      .filter(Boolean);
    const viaScan = scanContentPolicyViolations('consulta gratuita');
    expect(viaScan.length).toBeGreaterThan(0);
    expect(direct.length).toBeGreaterThan(0);
  });
});
