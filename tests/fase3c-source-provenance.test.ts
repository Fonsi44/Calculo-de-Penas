/**
 * Fase 3C — Tests del sistema de procedencia de fuentes.
 *
 * Cubre:
 *   - Clasificación correcta de las 7 categorías.
 *   - Fuentes académicas (Georgetown, OEA) NO cuentan como oficiales.
 *   - Fuentes internas sin trazabilidad → canonical_internal_unverified.
 *   - Deduplicación por URL normalizada (http/https, trailing slash, www, case).
 *   - Recuento por procedencia (countSourcesByProvenance).
 *
 * No realiza llamadas externas.
 */
import { describe, it, expect } from 'vitest';
import {
  classifySourceProvenance,
  normalizeSourceForDedup,
  countSourcesByProvenance,
  countsAsOfficial,
  groupProvenance,
  SOURCE_PROVENANCE_VALUES,
} from '../lib/ai/source-provenance';

describe('SourceProvenance — clasificación por dominio', () => {
  it('clasifica poderjudicial.gob.hn como official_primary', () => {
    expect(
      classifySourceProvenance(
        'https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf',
      ),
    ).toBe('official_primary');
  });

  it('clasifica tsc.gob.hn como official_secondary (reproduce, no emite)', () => {
    expect(
      classifySourceProvenance(
        'https://www.tsc.gob.hn/biblioteca/index.php/codigos/168-codigo-penal',
      ),
    ).toBe('official_secondary');
  });

  it('clasifica congreso.gob.hn como official_primary', () => {
    expect(
      classifySourceProvenance('https://www.congreso.gob.hn/'),
    ).toBe('official_primary');
  });

  it('NO clasifica Georgetown como oficial (es institutional_academic)', () => {
    const result = classifySourceProvenance(
      'https://pdba.georgetown.edu/Parties/Honduras/Leyes/constitucion.pdf',
    );
    expect(result).toBe('institutional_academic');
    expect(countsAsOfficial(result)).toBe(false);
  });

  it('NO clasifica OEA como oficial (es institutional_academic)', () => {
    const result = classifySourceProvenance(
      'https://www.oas.org/dil/esp/Codigo_Ninez_Adolescencia_Honduras.pdf',
    );
    expect(result).toBe('institutional_academic');
    expect(countsAsOfficial(result)).toBe(false);
  });

  it('clasifica CEPAL como institutional_academic', () => {
    expect(
      classifySourceProvenance(
        'https://oig.cepal.org/sites/default/files/2013_hnd_d35-13.pdf',
      ),
    ).toBe('institutional_academic');
  });

  it('clasifica UNICEF como institutional_academic', () => {
    expect(
      classifySourceProvenance('https://www.unicef.org/honduras/codigo-ninez'),
    ).toBe('institutional_academic');
  });

  it('clasifica data/*.json como canonical_internal_unverified por defecto', () => {
    expect(
      classifySourceProvenance('data/articulos_cp.json'),
    ).toBe('canonical_internal_unverified');
  });

  it('requiere override explícito para canonical_internal_verified', () => {
    expect(
      classifySourceProvenance('data/articulos_constitucion.json', undefined, {
        override: 'canonical_internal_verified',
      }),
    ).toBe('canonical_internal_verified');
    // Sin override, aunque se declare isInternal, sigue siendo unverified
    expect(
      classifySourceProvenance('data/articulos_constitucion.json', undefined, {
        isInternal: true,
      }),
    ).toBe('canonical_internal_unverified');
  });

  it('clasifica todolegal.app como commercial_secondary', () => {
    expect(
      classifySourceProvenance('https://todolegal.app/laws/94-codigo-ninez'),
    ).toBe('commercial_secondary');
  });

  it('clasifica URL desconocida como unverified', () => {
    expect(
      classifySourceProvenance('https://blog-aleatorio.com/post'),
    ).toBe('unverified');
  });

  it('maneja URL vacía o inválida como unverified', () => {
    expect(classifySourceProvenance('')).toBe('unverified');
    expect(classifySourceProvenance('no-es-url')).toBe('unverified');
  });

  it('respeta override por encima de la heurística', () => {
    expect(
      classifySourceProvenance(
        'https://www.poderjudicial.gob.hn/x.pdf',
        undefined,
        { override: 'official_secondary' },
      ),
    ).toBe('official_secondary');
  });

  it('acepta subdominios de oficiales (legislacion.poderjudicial.gob.hn)', () => {
    expect(
      classifySourceProvenance(
        'https://legislacion.poderjudicial.gob.hn/codigo.pdf',
      ),
    ).toBe('official_primary');
  });
});

describe('SOURCE_PROVENANCE_VALUES', () => {
  it('tiene exactamente 7 categorías', () => {
    expect(SOURCE_PROVENANCE_VALUES).toHaveLength(7);
  });

  it('incluye todas las categorías esperadas', () => {
    expect(SOURCE_PROVENANCE_VALUES).toContain('official_primary');
    expect(SOURCE_PROVENANCE_VALUES).toContain('official_secondary');
    expect(SOURCE_PROVENANCE_VALUES).toContain('institutional_academic');
    expect(SOURCE_PROVENANCE_VALUES).toContain('canonical_internal_verified');
    expect(SOURCE_PROVENANCE_VALUES).toContain(
      'canonical_internal_unverified',
    );
    expect(SOURCE_PROVENANCE_VALUES).toContain('commercial_secondary');
    expect(SOURCE_PROVENANCE_VALUES).toContain('unverified');
  });
});

describe('countsAsOfficial', () => {
  it('solo official_primary y official_secondary cuentan como oficiales', () => {
    expect(countsAsOfficial('official_primary')).toBe(true);
    expect(countsAsOfficial('official_secondary')).toBe(true);
    expect(countsAsOfficial('institutional_academic')).toBe(false);
    expect(countsAsOfficial('canonical_internal_verified')).toBe(false);
    expect(countsAsOfficial('canonical_internal_unverified')).toBe(false);
    expect(countsAsOfficial('commercial_secondary')).toBe(false);
    expect(countsAsOfficial('unverified')).toBe(false);
  });
});

describe('groupProvenance', () => {
  it('agrupa las 7 categorías en 5 grupos', () => {
    expect(groupProvenance('official_primary')).toBe('oficial');
    expect(groupProvenance('official_secondary')).toBe('oficial');
    expect(groupProvenance('institutional_academic')).toBe('institucional');
    expect(groupProvenance('canonical_internal_verified')).toBe('interna');
    expect(groupProvenance('canonical_internal_unverified')).toBe('interna');
    expect(groupProvenance('commercial_secondary')).toBe('comercial');
    expect(groupProvenance('unverified')).toBe('sin_verificar');
  });
});

describe('normalizeSourceForDedup — deduplicación por URL', () => {
  it('normaliza scheme a minúsculas', () => {
    expect(normalizeSourceForDedup('HTTPS://example.com/x')).toBe(
      'https://example.com/x',
    );
  });

  it('elimina www. del host', () => {
    expect(normalizeSourceForDedup('https://www.poderjudicial.gob.hn/x')).toBe(
      'https://poderjudicial.gob.hn/x',
    );
  });

  it('convierte host a minúsculas', () => {
    expect(normalizeSourceForDedup('https://PoderJudicial.GOB.HN/x')).toBe(
      'https://poderjudicial.gob.hn/x',
    );
  });

  it('elimina trailing slash del path (salvo raíz)', () => {
    expect(normalizeSourceForDedup('https://example.com/x/')).toBe(
      'https://example.com/x',
    );
    expect(normalizeSourceForDedup('https://example.com/')).toBe(
      'https://example.com/',
    );
  });

  it('elimina fragmentos (#...)', () => {
    expect(normalizeSourceForDedup('https://example.com/x#section')).toBe(
      'https://example.com/x',
    );
  });

  it('conserva query string', () => {
    expect(normalizeSourceForDedup('https://example.com/x?a=1')).toBe(
      'https://example.com/x?a=1',
    );
  });

  it('deduplica variantes de la misma URL', () => {
    const variants = [
      'HTTPS://WWW.poderjudicial.gob.hn/Codigos/CPP.pdf',
      'https://poderjudicial.gob.hn/Codigos/CPP.pdf',
      'https://poderjudicial.gob.hn/Codigos/CPP.pdf#page=10',
    ];
    const normalized = variants.map(normalizeSourceForDedup);
    // Todas deben ser iguales después de normalizar (excepto el fragmento
    // que se elimina, así que las 3 colapsan a 1)
    expect(new Set(normalized).size).toBe(1);
  });

  it('normaliza rutas internas (data/*.json)', () => {
    expect(normalizeSourceForDedup('data/articulos_cp.json')).toBe(
      'data/articulos_cp.json',
    );
    expect(normalizeSourceForDedup('./data/x.json')).toBe('data/x.json');
  });

  it('maneja URL vacía', () => {
    expect(normalizeSourceForDedup('')).toBe('');
  });
});

describe('countSourcesByProvenance', () => {
  it('cuenta fuentes únicas deduplicadas', () => {
    const result = countSourcesByProvenance([
      { url: 'https://poderjudicial.gob.hn/a.pdf' },
      { url: 'https://poderjudicial.gob.hn/a.pdf' }, // dup
      { url: 'https://tsc.gob.hn/b.pdf' },
      { url: 'https://pdba.georgetown.edu/c.pdf' },
      { url: 'data/articulos_cp.json' },
    ]);
    expect(result.total).toBe(4); // 4 únicas (la dup no cuenta)
    expect(result.official).toBe(2); // poderjudicial + tsc
    expect(result.byProvenance.official_primary).toBe(1);
    expect(result.byProvenance.official_secondary).toBe(1);
    expect(result.byProvenance.institutional_academic).toBe(1);
    expect(result.byProvenance.canonical_internal_unverified).toBe(1);
  });

  it('respeta el override de procedencia cuando se proporciona', () => {
    const result = countSourcesByProvenance([
      {
        url: 'data/articulos_constitucion.json',
        provenance: 'canonical_internal_verified',
      },
    ]);
    expect(result.byProvenance.canonical_internal_verified).toBe(1);
    expect(result.byProvenance.canonical_internal_unverified).toBe(0);
  });

  it('devuelve 0 oficiales si solo hay académicas/internas', () => {
    const result = countSourcesByProvenance([
      { url: 'https://pdba.georgetown.edu/x.pdf' },
      { url: 'https://oig.cepal.org/y.pdf' },
      { url: 'data/z.json' },
    ]);
    expect(result.official).toBe(0);
    expect(result.total).toBe(3);
  });

  it('maneja lista vacía', () => {
    const result = countSourcesByProvenance([]);
    expect(result.total).toBe(0);
    expect(result.official).toBe(0);
  });

  it('no cuenta fuentes académicas como oficiales (caso clave Fase 3C)', () => {
    // Este es el test de regresión: Georgetown + OEA no deben inflar
    // el conteo de fuentes oficiales.
    const result = countSourcesByProvenance([
      { url: 'https://pdba.georgetown.edu/Parties/Honduras/Leyes/constitucion.pdf' },
      { url: 'https://www.oas.org/dil/esp/Codigo_Ninez_Adolescencia_Honduras.pdf' },
      { url: 'https://oig.cepal.org/sites/default/files/2013_hnd_d35-13.pdf' },
    ]);
    expect(result.official).toBe(0);
    expect(result.byProvenance.institutional_academic).toBe(3);
  });
});
