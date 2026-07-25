import { describe, expect, it } from 'vitest';
import { normalizeBlogInternalLinks } from '@/lib/blog-context-linker';

describe('normalizeBlogInternalLinks', () => {
  it.each([
    ['solicitar-consulta', '/solicitar-consulta'],
    ['abogados-en-choluteca', '/abogados-en-choluteca'],
    [
      'blog/derecho-laboral/abogado-laboral-choluteca',
      '/blog/derecho-laboral/abogado-laboral-choluteca',
    ],
    [
      'blog/tributario/facturacion-electronica-requisitos-sar',
      '/blog/tributario/facturacion-electronica-requisitos-sar',
    ],
  ])('resuelve %s desde la raíz como %s', (input, expected) => {
    const html = `<p><a href="${input}">Destino</a></p>`;
    expect(normalizeBlogInternalLinks(html)).toContain(`href="${expected}"`);
  });

  it.each([
    '/solicitar-consulta',
    '#preguntas',
    '?page=2',
    'https://www.poderjudicial.gob.hn/',
    'mailto:contacto@pinedayasociadoshn.com',
    'tel:+50495363724',
    '../ruta-relativa-explicita',
    './ruta-relativa-explicita',
  ])('no altera un destino ya explícito: %s', (href) => {
    const html = `<a class="enlace" href='${href}'>Destino</a>`;
    expect(normalizeBlogInternalLinks(html)).toBe(html);
  });
});
