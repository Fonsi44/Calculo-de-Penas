/**
 * Tests de comportamiento para las páginas de perfil de abogados (Fase 1).
 *
 * Validaciones:
 *  - Los tres slugs canónicos existen y son accesibles.
 *  - Cada perfil tiene name, jobTitle, metaTitle, metaDescription, h1, areas.
 *  - Ningún perfil contiene datos inventados (CAH placeholder, universidad).
 *  - El orden es socio director → socia fundadora → socio.
 *  - El `@id` Person es el correcto (#danilo-pineda-maradiaga, #thania-marlene-paz, #emil-barahona).
 *  - No hay names duplicados ni vacíos.
 *  - getLawyerProfileBySlug resuelve correctamente y notFound() para slugs inválidos.
 */
import { describe, it, expect } from 'vitest';
import {
  LAWYER_PROFILES,
  getLawyerProfileBySlug,
  FOUNDER_PROFILE,
  THANIA_PROFILE,
  EMIL_PROFILE,
  site,
} from '@/lib/site';

const SLUG_DANILO = 'danilo-pineda-maradiaga' as const;
const SLUG_THANIA = 'thania-marlene-paz' as const;
const SLUG_EMIL = 'emil-barahona' as const;

const CANONICAL_NAMES = {
  danilo: 'Danilo Pineda Maradiaga',
  thania: 'Thania Marlene Paz',
  emil: 'Emil Barahona',
};

describe('LAWYER_PROFILES — array canónico de perfiles públicos', () => {
  it('contiene exactamente 3 perfiles en el orden correcto', () => {
    expect(LAWYER_PROFILES).toHaveLength(3);
    expect(LAWYER_PROFILES[0].slug).toBe(SLUG_DANILO);
    expect(LAWYER_PROFILES[1].slug).toBe(SLUG_THANIA);
    expect(LAWYER_PROFILES[2].slug).toBe(SLUG_EMIL);
  });

  it('todos los perfiles tienen campos obligatorios no vacíos', () => {
    for (const p of LAWYER_PROFILES) {
      expect(p.name).toBeTruthy();
      expect(p.jobTitle).toBeTruthy();
      expect(p.metaTitle).toBeTruthy();
      expect(p.metaDescription).toBeTruthy();
      expect(p.h1).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.areas.length).toBeGreaterThanOrEqual(1);
      expect(p.image).toBeTruthy();
      expect(p.imageAlt).toBeTruthy();
    }
  });

  it('los nombres canónicos coinciden con FOUNDER/THANIA/EMIL_PROFILE', () => {
    expect(LAWYER_PROFILES[0].name).toBe(FOUNDER_PROFILE.name);
    expect(LAWYER_PROFILES[1].name).toBe(THANIA_PROFILE.name);
    expect(LAWYER_PROFILES[2].name).toBe(EMIL_PROFILE.name);
  });

  it('personId (@id) es correcto para cada perfil', () => {
    expect(LAWYER_PROFILES[0].personId).toBe(`${site.url}/#danilo-pineda-maradiaga`);
    expect(LAWYER_PROFILES[1].personId).toBe(`${site.url}/#thania-marlene-paz`);
    expect(LAWYER_PROFILES[2].personId).toBe(`${site.url}/#emil-barahona`);
  });

  it('ningún perfil contiene CAH placeholder ni universidad inventada', () => {
    for (const p of LAWYER_PROFILES) {
      const serialized = JSON.stringify(p).toLowerCase();
      expect(serialized).not.toMatch(/cah:\s*\d+/);
      expect(serialized).not.toMatch(/universidad de honduras/);
    }
  });

  it('ningún perfil atribuye años de experiencia a una persona sin evidencia', () => {
    for (const profile of LAWYER_PROFILES) {
      expect(JSON.stringify(profile)).not.toMatch(
        /\b(?:más de\s+)?\d+\+?\s*años\s+(?:de\s+)?(?:experiencia|ejercicio|práctica|colegiación)/i,
      );
    }
    expect(FOUNDER_PROFILE.description).not.toMatch(
      /\b(?:más de\s+)?\d+\+?\s*años\s+(?:de\s+)?(?:experiencia|ejercicio|práctica|colegiación)/i,
    );
  });

  it('ningún name tiene variantes prohibidas', () => {
    const names = LAWYER_PROFILES.map((p) => p.name);
    expect(names).not.toContain('Thania Pineda');
    expect(names).not.toContain('Emil Hernández');
    expect(names).not.toContain('Pineda y Asociados');
  });

  it('metaTitle no contiene sufijo de marca duplicado (pipe mal puesto)', () => {
    // El plan §4.2 especifica titles absolutos; "| Pineda y Asociados" solo
    // aparece si lo añade el template, no en el metaTitle del perfil.
    for (const p of LAWYER_PROFILES) {
      expect(p.metaTitle).not.toMatch(/\| Pineda y Asociados$/);
    }
  });

  it('metaTitle y H1 son coherentes entre sí (comparten el nombre)', () => {
    for (const p of LAWYER_PROFILES) {
      expect(p.metaTitle).toContain(p.name.split(' ')[0]);
      expect(p.h1).toContain(p.name.split(' ')[0]);
    }
  });
});

describe('getLawyerProfileBySlug — resolución de perfil por slug', () => {
  it('resuelve Danilo por slug danilo-pineda-maradiaga', () => {
    const p = getLawyerProfileBySlug('danilo-pineda-maradiaga');
    expect(p).toBeDefined();
    expect(p!.name).toBe(CANONICAL_NAMES.danilo);
    expect(p!.slug).toBe(SLUG_DANILO);
  });

  it('resuelve Thania por slug thania-marlene-paz', () => {
    const p = getLawyerProfileBySlug('thania-marlene-paz');
    expect(p).toBeDefined();
    expect(p!.name).toBe(CANONICAL_NAMES.thania);
  });

  it('resuelve Emil por slug emil-barahona', () => {
    const p = getLawyerProfileBySlug('emil-barahona');
    expect(p).toBeDefined();
    expect(p!.name).toBe(CANONICAL_NAMES.emil);
  });

  it('devuelve undefined para slug inexistente (R4: no inventa)', () => {
    expect(getLawyerProfileBySlug('juan-perez')).toBeUndefined();
    expect(getLawyerProfileBySlug('')).toBeUndefined();
  });

  it('distingue mayúsculas (el slug DB es exacto)', () => {
    // La función busca coincidencia exacta de slug (no normaliza). En la DB
    // los slugs están en minúsculas con guiones; no se garantiza mayúsculas.
    expect(getLawyerProfileBySlug('DANILO-PINEDA-MARADIAGA')).toBeUndefined();
    expect(getLawyerProfileBySlug('danilo-pineda-maradiaga')).toBeDefined();
  });
});

describe('Perfil de Danilo Pineda Maradiaga — socio director', () => {
  const p = getLawyerProfileBySlug(SLUG_DANILO)!;

  it('tiene jobTitle correcto', () => {
    expect(p.jobTitle).toBe('Abogado penalista · Socio director');
  });

  it('metaTitle contiene "Abogado Penalista en Honduras"', () => {
    expect(p.metaTitle).toContain('Abogado Penalista en Honduras');
  });

  it('h1 contiene "abogado penalista"', () => {
    expect(p.h1.toLowerCase()).toContain('abogado penalista');
  });

  it('areas incluye penal y proceso penal', () => {
    expect(p.areas).toContain('Derecho penal');
    expect(p.areas).toContain('Proceso penal');
  });

  it('description menciona defensa penal', () => {
    expect(p.description.toLowerCase()).toContain('defensa penal');
  });
});

describe('Perfil de Thania Marlene Paz — socia fundadora', () => {
  const p = getLawyerProfileBySlug(SLUG_THANIA)!;

  it('tiene jobTitle correcto', () => {
    expect(p.jobTitle).toBe('Abogada · Socia fundadora');
  });

  it('metaTitle contiene "Abogada de Familia, Civil y Mercantil"', () => {
    expect(p.metaTitle).toContain('Abogada de Familia, Civil y Mercantil');
  });

  it('h1 contiene "abogada de familia"', () => {
    expect(p.h1.toLowerCase()).toContain('abogada de familia');
  });

  it('areas incluye familia, administrativo, civil y mercantil', () => {
    expect(p.areas).toContain('Derecho de familia');
    expect(p.areas).toContain('Derecho administrativo');
    expect(p.areas).toContain('Derecho civil y notarial');
    expect(p.areas).toContain('Derecho mercantil y empresarial');
  });
});

describe('Perfil de Emil Barahona — socio del bufete', () => {
  const p = getLawyerProfileBySlug(SLUG_EMIL)!;

  it('tiene jobTitle correcto', () => {
    expect(p.jobTitle).toBe('Abogado · Socio del bufete');
  });

  it('metaTitle contiene "Abogado Laboral, Civil y Penal"', () => {
    expect(p.metaTitle).toContain('Abogado Laboral, Civil y Penal');
  });

  it('h1 contiene "abogado laboral"', () => {
    expect(p.h1.toLowerCase()).toContain('abogado laboral');
  });

  it('areas incluye laboral, civil y penal', () => {
    expect(p.areas).toContain('Derecho laboral');
    expect(p.areas).toContain('Derecho civil y notarial');
    expect(p.areas).toContain('Apoyo en derecho penal');
  });
});
