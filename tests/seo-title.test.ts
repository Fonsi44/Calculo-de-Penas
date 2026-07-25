import { describe, expect, it } from 'vitest';
import { buildBlogMetaTitle, META_TITLE_MAX } from '@/lib/seo';

describe('buildBlogMetaTitle', () => {
  it('añade la marca cuando cabe completa', () => {
    expect(buildBlogMetaTitle('Pensión alimenticia')).toBe(
      'Pensión alimenticia | Pineda y Asociados',
    );
  });

  it('omite la marca cuando desplaza la consulta principal', () => {
    const title = buildBlogMetaTitle(
      'Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo',
    );

    expect(title).toBe(
      'Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo',
    );
    expect(title.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it('elimina marcas duplicadas antes de reconstruir el title', () => {
    const title = buildBlogMetaTitle(
      'Custodia de hijos | Pineda y Asociados | Pineda y Asociados',
    );

    expect(title.match(/Pineda y Asociados/g)).toHaveLength(1);
  });

  it.each([
    'Abogados en Amapala, Honduras: Guía Legal y',
    'Detenido en Honduras: Conozca sus Derechos y',
    'Abogado de Familia Choluteca: Divorcio y',
  ])('elimina palabras colgantes: %s', (raw) => {
    const title = buildBlogMetaTitle(raw);
    expect(title).not.toMatch(/\s(y|o|de|del|para|con|en)$/i);
    expect(title.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it('recorta en límite de palabra cuando el título base excede el máximo', () => {
    const title = buildBlogMetaTitle(
      'Proceso penal completo en Honduras desde la investigación preparatoria hasta la sentencia y los recursos',
    );

    expect(title.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(title).not.toMatch(/\s(y|o|de|del|para|con|en)$/i);
  });
});
