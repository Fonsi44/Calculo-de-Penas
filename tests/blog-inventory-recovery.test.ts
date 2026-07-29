import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getTotalPages,
  getPostsByPage,
} from '@/lib/blog';
import { searchPosts } from '@/lib/blog-hub';
import type { BlogCardData, Post } from '@/data/blog/types';

function parseCsvLine(line: string): string[] {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)]
    .map((match) => match[1].replaceAll('""', '"'));
}

function readCsv(path: string): Array<Record<string, string>> {
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function post(index: number): Post {
  return {
    slug: `historical-${index}`,
    title: `Artículo histórico ${index}`,
    description: `Descripción recuperada ${index}`,
    body: `<h2>Contenido ${index}</h2><p>Cuerpo histórico.</p>`,
    publishedAt: new Date(2026, 0, index + 1).toISOString(),
    category: index % 2 ? 'derecho-penal' : 'derecho-civil',
    tags: index === 133 ? ['último-recuperado'] : [],
    author: 'Pineda y Asociados',
    readingTime: '5 min',
  };
}

describe('gate de recuperación del inventario histórico', () => {
  const inventory = readCsv('docs/seo/current/blog-recovery-inventory.csv');
  const diff = readCsv('docs/seo/current/blog-recovery-diff.csv');

  it('reconcilia 175 registros como 134 publicados, 1 restaurado, 6 redirects y 34 no publicados', () => {
    expect(inventory).toHaveLength(175);
    expect(inventory.filter((row) => row.recovery_action === 'KEEP_HISTORICAL_ARTICLE'))
      .toHaveLength(134);
    expect(inventory.filter((row) => row.recovery_action === 'RESTORE_HISTORICAL_ARTICLE'))
      .toHaveLength(1);
    expect(inventory.filter((row) => row.recovery_action === 'KEEP_REDIRECT'))
      .toHaveLength(6);
    expect(inventory.filter((row) => row.recovery_action === 'KEEP_UNPUBLISHED'))
      .toHaveLength(34);
    expect(inventory.filter((row) => row.historically_visible === 'true'))
      .toHaveLength(141);
  });

  it('conserva los 141 cuerpos históricos en la base aislada sin cambios', () => {
    expect(diff).toHaveLength(141);
    expect(diff.every((row) => row.same_body === 'true' && row.status === 'MATCH')).toBe(true);
  });

  it('excluye el fixture sintético del inventario público recuperado', () => {
    expect(inventory.some((row) => row.slug === 'fixture-preview-articulo-verificado'))
      .toBe(false);
  });

  it('no superpone propuestas de Fase 3 sobre la lectura pública', () => {
    const publicAdapter = readFileSync('lib/blog.ts', 'utf8');
    expect(publicAdapter).not.toContain('phase3-editorial-overrides.json');
    expect(publicAdapter).not.toContain('documentary?.body');
    expect(publicAdapter).toContain('signatureValid: p.signatureValid');
    expect(publicAdapter).toContain('reviewedContentHash: p.reviewedContentHash');
  });

  it('mantiene 11 páginas estables tras separar cuatro destacados y permite buscar todo el corpus', () => {
    const posts = Array.from({ length: 135 }, (_, index) => post(index));
    const gridPosts = posts.slice(4);
    expect(getTotalPages(gridPosts, 12)).toBe(11);
    expect(getPostsByPage(gridPosts, 11, 12)).toHaveLength(11);
    expect(searchPosts(posts as BlogCardData[], 'último-recuperado').map((item) => item.slug))
      .toEqual(['historical-133']);
  });
});
