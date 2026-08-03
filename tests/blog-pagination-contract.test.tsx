import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlogPagination } from '@/components/blog/blog-pagination';
import { blogCategories } from '@/data/blog/categories';
import {
  buildBlogPaginationPath,
  resolveBlogPagination,
} from '@/lib/blog-pagination';
import { generateMetadata as generateHubMetadata } from '@/app/(public)/blog/page';
import { generateMetadata as generateCategoryMetadata } from '@/app/(public)/blog/[categoria]/page';
import { site } from '@/lib/site';

describe('contrato canónico de paginación del blog', () => {
  it('mantiene la página 1 limpia, indexable y con next', () => {
    expect(resolveBlogPagination({ basePath: '/blog', totalPages: 11 })).toMatchObject({
      page: 1,
      canonicalPath: '/blog',
      index: true,
      follow: true,
      nextPath: '/blog?page=2',
      notFound: false,
    });
  });

  it('hace page=2 autorreferente, indexable y enlazada en ambos sentidos', () => {
    expect(resolveBlogPagination({
      basePath: '/blog',
      rawPage: '2',
      totalPages: 11,
    })).toMatchObject({
      canonicalPath: '/blog?page=2',
      index: true,
      prevPath: '/blog',
      nextPath: '/blog?page=3',
    });
  });

  it('omite next en la última página', () => {
    const result = resolveBlogPagination({ basePath: '/blog', rawPage: '11', totalPages: 11 });
    expect(result.prevPath).toBe('/blog?page=10');
    expect(result.nextPath).toBeUndefined();
  });

  it.each(['0', '-1', 'abc', '1.5'])('rechaza page=%s', (rawPage) => {
    expect(resolveBlogPagination({ basePath: '/blog', rawPage }).notFound).toBe(true);
  });

  it.each([
    ['1', '/blog'],
    ['01', '/blog'],
    ['+2', '/blog?page=2'],
    [' 2 ', '/blog?page=2'],
    ['', '/blog'],
  ])('normaliza page=%j hacia %s', (rawPage, redirectTo) => {
    expect(resolveBlogPagination({ basePath: '/blog', rawPage }).redirectTo).toBe(redirectTo);
  });

  it('devuelve 404 al superar el total', () => {
    expect(resolveBlogPagination({
      basePath: '/blog',
      rawPage: '12',
      totalPages: 11,
    }).notFound).toBe(true);
  });

  it('mantiene filtros noindex con orden page, tag, month', () => {
    expect(resolveBlogPagination({
      basePath: '/blog',
      rawPage: '2',
      tag: 'penal',
      month: '2026-07',
      totalPages: 3,
    })).toMatchObject({
      canonicalPath: '/blog?page=2&tag=penal&month=2026-07',
      index: false,
      follow: true,
      prevPath: '/blog?tag=penal&month=2026-07',
      nextPath: '/blog?page=3&tag=penal&month=2026-07',
    });
  });

  it('elimina filtros vacíos y normaliza el mes', () => {
    expect(resolveBlogPagination({
      basePath: '/blog',
      tag: ' ',
      month: '2026-7',
    })).toMatchObject({
      canonicalPath: '/blog?month=2026-07',
      redirectTo: '/blog?month=2026-07',
      index: false,
    });
  });

  it.each(['2026-13', 'julio', '26-07'])('rechaza el mes inválido %s', (month) => {
    expect(resolveBlogPagination({ basePath: '/blog', month }).notFound).toBe(true);
  });

  it('codifica filtros sin alterar el orden estable', () => {
    expect(buildBlogPaginationPath('/blog', 2, 'derecho penal', '2026-07'))
      .toBe('/blog?page=2&tag=derecho+penal&month=2026-07');
  });

  it('rechaza parámetros repetidos', () => {
    expect(resolveBlogPagination({ basePath: '/blog', rawPage: ['1', '2'] }).notFound)
      .toBe(true);
  });
});

describe('metadata paginada', () => {
  it('alinea canonical, robots, OG, Twitter, title y description en /blog?page=2', async () => {
    const metadata = await generateHubMetadata({
      searchParams: Promise.resolve({ page: '2' }),
    });
    expect(metadata.alternates?.canonical).toBe('/blog?page=2');
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({ url: `${site.url}/blog?page=2` });
    expect(String((metadata.title as { absolute: string }).absolute)).toContain('Página 2');
    expect(metadata.description).toContain('Página 2');
    expect(metadata.twitter).toMatchObject({
      title: expect.stringContaining('Página 2'),
      description: expect.stringContaining('Página 2'),
    });
  });

  it('mantiene filtros autorreferentes y noindex', async () => {
    const metadata = await generateHubMetadata({
      searchParams: Promise.resolve({ page: '2', tag: 'penal', month: '2026-07' }),
    });
    expect(metadata.alternates?.canonical).toBe('/blog?page=2&tag=penal&month=2026-07');
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.openGraph).toMatchObject({
      url: `${site.url}/blog?page=2&tag=penal&month=2026-07`,
    });
  });

  it('hace autorreferente e indexable la página 2 de categoría', async () => {
    const categoria = blogCategories[0].slug;
    const metadata = await generateCategoryMetadata({
      params: Promise.resolve({ categoria }),
      searchParams: Promise.resolve({ page: '2' }),
    });
    expect(metadata.alternates?.canonical).toBe(`/blog/${categoria}?page=2`);
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      url: `${site.url}/blog/${categoria}?page=2`,
    });
    expect(metadata.description).toContain('Página 2');
  });
});

describe('navegación SSR accesible', () => {
  it('contiene href reales, foco visible e indicador de página', () => {
    const html = renderToStaticMarkup(
      <BlogPagination
        page={2}
        totalPages={3}
        buildPageUrl={(page) => buildBlogPaginationPath('/blog', page)}
      />,
    );
    expect(html).toContain('aria-label="Paginación"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/blog?page=3"');
    expect(html).toContain('focus-ring');
    expect(html).toContain('Página 2 de 3');
  });
});
