import { describe, expect, it } from 'vitest';
import {
  buildBlogMetaDescription,
  buildBlogMetaTitle,
  META_DESC_MAX,
  META_DESC_MIN,
  META_TITLE_MAX,
} from '@/lib/seo';

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

describe('buildBlogMetaDescription', () => {
  const fullSummary =
    'Resumen editorial completo sobre requisitos, plazos, opciones y pasos legales aplicables en Honduras para orientar al lector antes de consultar.';

  it('conserva la meta explícita cuando ya está en el rango recomendado', () => {
    const meta =
      'Guía jurídica sobre derechos, requisitos, plazos y opciones disponibles en Honduras, con pasos prácticos para preparar cada gestión legal.';

    expect(buildBlogMetaDescription(meta, fullSummary)).toBe(meta);
  });

  it('usa el resumen editorial si la meta explícita es demasiado corta', () => {
    const result = buildBlogMetaDescription(
      'Descripción demasiado corta.',
      fullSummary,
    );

    expect(result).toBe(fullSummary);
    expect(result.length).toBeGreaterThanOrEqual(META_DESC_MIN);
  });

  it('usa el resumen editorial si la meta explícita supera el máximo', () => {
    const result = buildBlogMetaDescription(
      'Meta demasiado extensa '.repeat(12),
      fullSummary,
    );

    expect(result).toBe(fullSummary);
  });

  it('recorta en límite de palabra cuando solo existe una fuente extensa', () => {
    const result = buildBlogMetaDescription(
      `${fullSummary} Información adicional que excede el límite recomendado para el snippet.`,
    );

    expect(result.length).toBeGreaterThanOrEqual(META_DESC_MIN);
    expect(result.length).toBeLessThanOrEqual(META_DESC_MAX);
    expect(result).not.toMatch(/\s$/);
  });
});
