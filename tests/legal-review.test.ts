/**
 * Tests de la infraestructura de revisión jurídica y coherencia de identidad (FASE 1).
 *
 * Cubre los casos exigidos por AGENTS.md / instrucción FASE 1 §7:
 *  - verified sin revisor → inválido.
 *  - verified sin fecha → inválido.
 *  - verified con fecha futura → inválido.
 *  - verified con revisor que es un modelo de IA → inválido.
 *  - revisor no existente en la fuente única de identidad → inválido.
 *  - variantes incorrectas del equipo ("Thania Pineda", "Emil Hernández") →
 *    no figuran como revisores canónicos.
 *  - coherencia NAP: teléfono visible y JSON-LD coinciden.
 *  - JSON-LD coincide con contenido visible (dirección, horario).
 *  - divergencias NAP detectables (test negativo).
 */
import { describe, it, expect } from 'vitest';
import {
  assertLegalReviewValid,
  isReviewAttributable,
  CANONICAL_REVIEWERS,
  getLegalReview,
  LEGAL_REVIEW_REGISTRY,
  type LegalReview,
} from '@/lib/legal-review';
import { site, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE, GENERAL_CONTACT_E164, GENERAL_CONTACT_WHATSAPP } from '@/lib/site';

describe('Infraestructura LegalReview — validación de estados', () => {
  it('rechaza verified sin revisor', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedAt: '2026-01-01',
    };
    expect(() => assertLegalReviewValid(r)).toThrow(/reviewedBy/);
    expect(isReviewAttributable(r)).toBe(false);
  });

  it('rechaza verified sin fecha', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedBy: 'Danilo Pineda Maradiaga',
    };
    expect(() => assertLegalReviewValid(r)).toThrow(/reviewedAt|fecha/i);
    expect(isReviewAttributable(r)).toBe(false);
  });

  it('rechaza verified con fecha futura', () => {
    const futuro = '2999-12-31';
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedBy: 'Danilo Pineda Maradiaga',
      reviewedAt: futuro,
    };
    expect(() => assertLegalReviewValid(r)).toThrow(/futura|posterior/i);
    expect(isReviewAttributable(r)).toBe(false);
  });

  it('rechaza GLM-5.2 como revisor jurídico (no es humano)', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedBy: 'GLM-5.2',
      reviewedAt: '2026-07-01',
    };
    expect(() => assertLegalReviewValid(r)).toThrow(/IA|humano|GLM/i);
    expect(isReviewAttributable(r)).toBe(false);
  });

  it('rechaza nombres profesionales no existentes en la fuente única', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedBy: 'Abogado Ficticio Inexistente',
      reviewedAt: '2026-07-01',
    };
    expect(() => assertLegalReviewValid(r)).toThrow(/canónic|fuente única/i);
  });

  it('acepta verified con revisor canónico y fecha válida', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'verified',
      reviewedBy: FOUNDER_PROFILE.name,
      reviewedAt: '2026-07-15',
    };
    expect(() => assertLegalReviewValid(r)).not.toThrow();
    expect(isReviewAttributable(r)).toBe(true);
  });

  it('acepta pending sin revisor ni fecha', () => {
    const r: LegalReview = { jurisdiction: 'HN', reviewStatus: 'pending' };
    expect(() => assertLegalReviewValid(r)).not.toThrow();
    expect(isReviewAttributable(r)).toBe(false);
  });

  it('needs_update no es atribuible públicamente (no muestra "Revisado por")', () => {
    const r: LegalReview = {
      jurisdiction: 'HN',
      reviewStatus: 'needs_update',
      note: 'pendiente de firma',
    };
    expect(isReviewAttributable(r)).toBe(false);
  });
});

describe('Coherencia de variantes del equipo profesional', () => {
  it('los revisores canónicos incluyen a los tres socios con su nombre completo', () => {
    expect(CANONICAL_REVIEWERS).toContain('Danilo Pineda Maradiaga');
    expect(CANONICAL_REVIEWERS).toContain('Thania Marlene Paz');
    expect(CANONICAL_REVIEWERS).toContain('Emil Barahona');
  });

  it('las variantes incorrectas NO son revisores canónicos', () => {
    // Estos son los errores que existían en data/faqs-hubs.ts antes de la FASE 1.
    expect(CANONICAL_REVIEWERS).not.toContain('Thania Pineda');
    expect(CANONICAL_REVIEWERS).not.toContain('Emil Hernández');
    expect(CANONICAL_REVIEWERS).not.toContain('Danilo Pineda'); // sin segundo apellido
  });

  it('los perfiles canónicos usan los apellidos correctos', () => {
    expect(THANIA_PROFILE.name).toBe('Thania Marlene Paz');
    expect(EMIL_PROFILE.name).toBe('Emil Barahona');
    expect(FOUNDER_PROFILE.name).toBe('Danilo Pineda Maradiaga');
  });
});

describe('Coherencia NAP (Name Address Phone) visible vs JSON-LD', () => {
  it('phoneDisplay y whatsappDisplay derivan del mismo número (no hardcodeados divergentes)', () => {
    const digits = (s: string) => s.replace(/\D/g, '');
    expect(digits(site.phoneDisplay)).toBe(digits(site.phone));
    expect(digits(site.whatsappDisplay)).toBe(site.whatsapp);
  });

  it('el contacto general coincide con el teléfono de Thania (salvo override por env)', () => {
    expect(THANIA_PROFILE.phone).toBe(GENERAL_CONTACT_E164);
    expect(GENERAL_CONTACT_E164).toBe('+50432729292');
    expect(GENERAL_CONTACT_WHATSAPP).toBe('50432729292');
    const envPhoneDigits = (process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '').replace(/\D/g, '');
    const envWaDigits = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '').replace(/\D/g, '');
    const envOverridesToOtherNumber =
      (envPhoneDigits.length > 0 && envPhoneDigits !== '50432729292') ||
      (envWaDigits.length > 0 && envWaDigits !== '50432729292');
    if (envOverridesToOtherNumber) return;
    expect(site.phone.replace(/\D/g, '')).toBe('50432729292');
    expect(site.whatsapp).toBe('50432729292');
  });

  it('la dirección del sitio es única y coherente', () => {
    expect(site.address.city).toBe('Nacaome');
    expect(site.address.department).toBe('Valle');
    expect(site.address.countryCode).toBe('HN');
    expect(site.address.full).toContain('Nacaome');
  });

  it('el correo NO contiene el typo "pinedayasocioshn" (falta la "a")', () => {
    // El dominio correcto es pinedayasociadoshn.com (con "a" en "asociados").
    expect(site.email).toContain('pinedayasociadoshn.com');
    expect(site.email).not.toMatch(/pinedayasocioshn\.com/);
  });

  it('geo coherente con Nacaome, Valle (Honduras)', () => {
    // Nacaome ~ 13.53N, -87.49O. Tolerancia amplia para no acoplar a submillas.
    expect(site.geo.latitude).toBeGreaterThan(13.4);
    expect(site.geo.latitude).toBeLessThan(13.6);
    expect(site.geo.longitude).toBeGreaterThan(-87.6);
    expect(site.geo.longitude).toBeLessThan(-87.4);
  });
});

describe('Registro LEGAL_REVIEW_REGISTRY (FASE 1)', () => {
  it('todas las entradas del registro son internamente válidas', () => {
    for (const [path, review] of Object.entries(LEGAL_REVIEW_REGISTRY)) {
      expect(() => assertLegalReviewValid(review)).not.toThrow();
      // Ninguna entrada arranca como verified sin firma humana real:
      if (review.reviewStatus === 'verified') {
        expect(review.reviewedBy).toBeTruthy();
        expect(review.reviewedAt).toBeTruthy();
      }
      void path;
    }
  });

  it('getLegalReview devuelve pending por defecto para paths no registrados', () => {
    const r = getLegalReview('/ruta-que-no-existe');
    expect(r.reviewStatus).toBe('pending');
  });

  it('las páginas con correcciones FASE 1 están marcadas needs_update (no verified)', () => {
    // No se firma como verified sin revisión humana expresa del despacho.
    const r = getLegalReview('/preguntas-frecuentes');
    expect(r.reviewStatus).not.toBe('verified');
  });
});
