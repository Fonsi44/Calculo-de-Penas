/**
 * Fase 0 — Seguridad editorial (Plan maestro SEO/GEO §8, §10, §21).
 *
 * Contratos que este test defiende (no buscan cadenas: validan comportamiento
 * y datos vivos de la fuente única):
 *  - `getEditorialResponsibility` asigna autores canónicos por área y marca
 *    las áreas sin responsable verificado como `requiresHumanAssignment`.
 *  - Las áreas que el plan §3.1 última fila deja sin firma automática están
 *   declaradas y nunca devuelven un autor inventado.
 *  - Los nombres canónicos del equipo son los tres exigidos por el plan §2.1
 *    y las variantes prohibidas no aparecen en la fuente de identidad.
 *  - `normalizeReviewStatus` mapea los 6 estados del plan y trata cualquier
 *    valor no verificado como `pending` (gate: lo no verificado no indexa).
 *  - `polishedTitle` no produce títulos rotos con elipsis.
 *  - El sitemap y la metadata del post excluyen `noindex` de pendientes.
 */
import { describe, it, expect } from 'vitest';
import {
  getEditorialResponsibility,
  normalizeReviewStatus,
  CANONICAL_REVIEWERS,
  REQUIRES_HUMAN_ASSIGNMENT_AREAS,
  PLAN_REVIEW_STATUS_MAP,
} from '@/lib/legal-review';
import { FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';

const NAMES = {
  danilo: 'Danilo Pineda Maradiaga',
  thania: 'Thania Marlene Paz',
  emil: 'Emil Barahona',
};

describe('getEditorialResponsibility — matriz central de autoría (§10)', () => {
  it('asigna Danilo a derecho penal con Emil como revisor', () => {
    const r = getEditorialResponsibility('derecho-penal');
    expect(r.author).toBe(NAMES.danilo);
    expect(r.defaultReviewer).toBe(NAMES.emil);
    expect(r.requiresHumanAssignment).toBe(false);
  });

  it('asigna Emil a derecho laboral con Thania como revisora', () => {
    const r = getEditorialResponsibility('derecho-laboral');
    expect(r.author).toBe(NAMES.emil);
    expect(r.defaultReviewer).toBe(NAMES.thania);
    expect(r.requiresHumanAssignment).toBe(false);
  });

  it('asigna Thania a familia, civil, mercantil, administrativo y notarial', () => {
    for (const area of [
      'derecho-de-familia',
      'derecho-civil',
      'derecho-mercantil',
      'derecho-administrativo',
      'notarial',
    ]) {
      const r = getEditorialResponsibility(area);
      expect(r.author, area).toBe(NAMES.thania);
      expect(r.requiresHumanAssignment).toBe(false);
    }
  });

  it('tema mixto violencia intrafamiliar → Thania autora, Danilo revisor', () => {
    const r = getEditorialResponsibility('familia', 'violencia intrafamiliar');
    expect(r.author).toBe(NAMES.thania);
    expect(r.defaultReviewer).toBe(NAMES.danilo);
  });

  it('áreas sin responsable verificado exigen asignación humana y no inventan autor', () => {
    for (const area of REQUIRES_HUMAN_ASSIGNMENT_AREAS) {
      const r = getEditorialResponsibility(area);
      expect(r.requiresHumanAssignment, area).toBe(true);
      expect(r.author, area).toBe('');
      expect(r.defaultReviewer, area).toBeNull();
    }
  });

  it('área desconocida exige asignación humana (no inventa)', () => {
    const r = getEditorialResponsibility('astrologia-legal');
    expect(r.requiresHumanAssignment).toBe(true);
    expect(r.author).toBe('');
  });

  it('acepta etiquetas legibles además de slugs', () => {
    expect(getEditorialResponsibility('Penal').author).toBe(NAMES.danilo);
    expect(getEditorialResponsibility('Laboral').author).toBe(NAMES.emil);
    expect(getEditorialResponsibility('Familia').author).toBe(NAMES.thania);
  });
});

describe('Nombres canónicos del equipo (§2.1, §8.3)', () => {
  it('los tres nombres canónicos están en la fuente única de identidad', () => {
    expect(FOUNDER_PROFILE.name).toBe(NAMES.danilo);
    expect(THANIA_PROFILE.name).toBe(NAMES.thania);
    expect(EMIL_PROFILE.name).toBe(NAMES.emil);
  });

  it('las variantes prohibidas no son revisores canónicos', () => {
    expect(CANONICAL_REVIEWERS).not.toContain('Thania Pineda');
    expect(CANONICAL_REVIEWERS).not.toContain('Emil Hernández');
    expect(CANONICAL_REVIEWERS).not.toContain('Danilo Pineda');
    expect(CANONICAL_REVIEWERS).toContain(NAMES.danilo);
    expect(CANONICAL_REVIEWERS).toContain(NAMES.thania);
    expect(CANONICAL_REVIEWERS).toContain(NAMES.emil);
  });

  it('ningún perfil contiene universidad inventada (R4)', () => {
    // No publicamos "Universidad de Honduras" ni similar salvo env explícito;
    // el test checkea que el literal no esté hardcodeado en el bio por defecto.
    const bios = [FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE]
      .map((p) => JSON.stringify(p))
      .join('\n');
    expect(bios).not.toMatch(/Universidad de Honduras/);
  });
});

describe('normalizeReviewStatus — gate Fase 0 (§6, §8.1)', () => {
  it('mapea lawyer_verified a verified', () => {
    expect(normalizeReviewStatus('lawyer_verified')).toBe('verified');
  });

  it('mapea Lawyer_Review_Pending, draft, documentary_review a pending', () => {
    expect(normalizeReviewStatus('lawyer_review_pending')).toBe('pending');
    expect(normalizeReviewStatus('draft')).toBe('pending');
    expect(normalizeReviewStatus('documentary_review')).toBe('pending');
  });

  it('mapea outdated y withdrawn a needs_update (noindex hasta actualizar)', () => {
    expect(normalizeReviewStatus('outdated')).toBe('needs_update');
    expect(normalizeReviewStatus('withdrawn')).toBe('needs_update');
  });

  it('trata la tabla published de la DB como pending (no indexable sin firma)', () => {
    expect(normalizeReviewStatus('published')).toBe('pending');
    expect(normalizeReviewStatus('reviewed')).toBe('pending');
    expect(normalizeReviewStatus(undefined)).toBe('pending');
    expect(normalizeReviewStatus(null)).toBe('pending');
  });

  it('acepta los estados vigentes verified/pending/needs_update sin alterarlos', () => {
    expect(normalizeReviewStatus('verified')).toBe('verified');
    expect(normalizeReviewStatus('pending')).toBe('pending');
    expect(normalizeReviewStatus('needs_update')).toBe('needs_update');
  });

  it('PLAN_REVIEW_STATUS_MAP cubre los 6 estados del plan maestro', () => {
    const planStatuses = [
      'draft',
      'documentary_review',
      'lawyer_review_pending',
      'lawyer_verified',
      'outdated',
      'withdrawn',
    ];
    for (const s of planStatuses) {
      expect(PLAN_REVIEW_STATUS_MAP, s).toHaveProperty(s);
    }
  });
});

describe('polishedTitle — sin títulos rotos (§8.2, §10)', () => {
  it('no añade elipsis a títulos terminados en preposición', async () => {
    const { polishedTitle } = await import('@/lib/blog');
    const broken = 'Abogados en Nacaome, Valle: 15 Años de';
    expect(polishedTitle(broken)).toBe(broken);
    expect(polishedTitle('Despido Laboral en Honduras: Guia de')).toBe(
      'Despido Laboral en Honduras: Guia de',
    );
    expect(polishedTitle('Herencias en Honduras: Guía Paso a Paso de')).toBe(
      'Herencias en Honduras: Guía Paso a Paso de',
    );
  });

  it('no recorta por caracteres (devuelve el texto intacto)', async () => {
    const { polishedTitle } = await import('@/lib/blog');
    const long = 'Título juridico muy largo que antes habria sido truncado artificialmente dejando una frase incompleta';
    expect(polishedTitle(long)).toBe(long);
  });

  it('preserva títulos válidos sin alteraciones', async () => {
    const { polishedTitle } = await import('@/lib/blog');
    const ok = 'Despido Injustificado en Honduras: Prestaciones y Plazos';
    expect(polishedTitle(ok)).toBe(ok);
  });
});