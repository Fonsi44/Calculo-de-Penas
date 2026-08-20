import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  analyzeBlogBodyLinks,
  extractBlogInternalHrefs,
  injectContextLinks,
  normalizeBlogInternalLinks,
} from '@/lib/blog-context-linker';

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

describe('injectContextLinks', () => {
  it('limita el autoenlazado a cinco destinos por defecto', () => {
    const html = [
      '<p>Nacaome y Choluteca requieren atención.</p>',
      '<p>San Lorenzo y Goascorán también aparecen.</p>',
      '<p>La defensa penal y el derecho laboral pueden coincidir.</p>',
      '<p>También hay derecho civil y derecho mercantil.</p>',
    ].join('');

    const result = injectContextLinks(html);
    expect(result.match(/class="context-link"/g)).toHaveLength(5);
    expect(result.match(/data-internal-link=/g)).toHaveLength(5);
  });

  it('respeta anchors y encabezados existentes y evita self-links', () => {
    const html = [
      '<h2>Defensa penal en Nacaome</h2>',
      '<p><a href="/derecho-penal">Defensa penal</a> en Choluteca.</p>',
      '<p>La pensión alimenticia requiere análisis.</p>',
    ].join('');

    const result = injectContextLinks(html, {
      excludeHrefs: [
        '/abogados-en-choluteca',
        '/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa',
      ],
    });

    expect(result).toContain('<h2>Defensa penal en Nacaome</h2>');
    expect(result).toContain('<a href="/derecho-penal">Defensa penal</a>');
    expect(result).not.toContain('href="/abogados-en-choluteca"');
    expect(result).not.toContain(
      'href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa"',
    );
  });

  it('conecta conceptos laborales con sus guías canónicas', () => {
    const result = injectContextLinks(
      '<p>Un despido injustificado puede afectar las prestaciones laborales, el contrato de trabajo y a una trabajadora embarazada.</p>',
    );

    expect(extractBlogInternalHrefs(result)).toEqual(expect.arrayContaining([
      '/blog/derecho-laboral/despido-laboral-honduras-guia-completa',
      '/blog/derecho-laboral/calcular-liquidacion-laboral-honduras',
      '/blog/derecho-laboral/contratos-trabajo-tipos-clausulas-honduras',
      '/blog/derecho-laboral/derechos-trabajadora-embarazada-honduras',
    ]));
  });

  it('prioriza el cargo local sobre la ciudad y el hub genérico', () => {
    const choluteca = injectContextLinks(
      '<p>Un abogado penalista en Choluteca puede asumir la defensa.</p>',
    );
    const nacaome = injectContextLinks(
      '<p>Un abogado penalista en Nacaome puede asumir la defensa.</p>',
    );

    expect(extractBlogInternalHrefs(choluteca)).toContain('/abogado-penalista-choluteca');
    expect(choluteca).not.toContain('href="/abogados-en-choluteca"');
    expect(choluteca).not.toMatch(/<a href="\/abogado-penalista-choluteca"[^>]*>[\s\S]*<a /);
    expect(extractBlogInternalHrefs(nacaome)).toContain('/abogado-penalista-nacaome');
    expect(nacaome).not.toContain('href="/abogados-en-nacaome"');
  });

  it('enlaza subpáginas penales cuando el cuerpo las nombra', () => {
    const html = [
      '<p>Tras la sentencia cabe ejecución penal y libertad condicional.</p>',
      '<p>El caso de justicia penal juvenil se tramita aparte.</p>',
      '<p>El proceso penal completo incluye la apelación.</p>',
    ].join('');
    const result = injectContextLinks(html);
    const hrefs = extractBlogInternalHrefs(result);

    expect(hrefs).toEqual(expect.arrayContaining([
      '/derecho-penal/ejecucion-penal-y-beneficios',
      '/derecho-penal/menores-justicia-juvenil',
      '/derecho-penal/proceso-penal-completo',
    ]));
    expect(hrefs.filter((href) => href === '/derecho-penal/ejecucion-penal-y-beneficios'))
      .toHaveLength(1);
  });

  it('enlaza defensa penal juvenil al hub de menores, no al hub penal genérico', () => {
    const result = injectContextLinks(
      '<p>La defensa penal juvenil tiene reglas propias.</p>',
    );
    expect(extractBlogInternalHrefs(result)).toContain(
      '/derecho-penal/menores-justicia-juvenil',
    );
    expect(result).not.toContain('href="/derecho-penal"');
  });
});

describe('analyzeBlogBodyLinks', () => {
  it('distingue enlaces persistidos, normalizados y contextuales', () => {
    const analysis = analyzeBlogBodyLinks(
      '<p><a href="solicitar-consulta">Consultar</a> sobre derecho laboral en Nacaome.</p>',
    );

    expect(analysis.persistedHrefs).toEqual(['/solicitar-consulta']);
    expect(analysis.effectiveHrefs).toEqual(expect.arrayContaining([
      '/solicitar-consulta',
      '/servicios-juridicos/derecho-laboral',
      '/abogados-en-nacaome',
    ]));
    expect(analysis.contextualHrefs).toEqual(expect.arrayContaining([
      '/servicios-juridicos/derecho-laboral',
      '/abogados-en-nacaome',
    ]));
    expect(analysis.effectiveHtml).toContain(
      'data-internal-link="/servicios-juridicos/derecho-laboral"',
    );
  });

  it('extrae hrefs internos con comillas simples o dobles', () => {
    expect(extractBlogInternalHrefs(
      '<a href="/uno">Uno</a><a class="x" href=\'/dos#seccion\'>Dos</a><a href="https://example.com">No</a><a href="//cdn.example.com">Tampoco</a>',
    )).toEqual(['/uno', '/dos#seccion']);
  });

  it('mantiene instrumentado el CTA inline de los artículos', () => {
    const generatedCta = readFileSync(
      'lib/blog-generated-cta.ts',
      'utf8',
    );

    expect(generatedCta).toContain('data-event-name="seo_blog_cta_click"');
    expect(generatedCta).toContain('data-cta-location="blog_inline"');
  });
});
