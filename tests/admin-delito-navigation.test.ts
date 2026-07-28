import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

describe('navegación administrativa de delitos', () => {
  it('no conserva enlaces absolutos a la ruta inexistente /delito-form', () => {
    const files = [
      'app/intranet/admin/delitos/page.tsx',
      'app/intranet/admin/delitos/[id]/page.tsx',
      'app/intranet/admin/cp/[id]/page.tsx',
    ];

    for (const file of files) {
      const source = readFileSync(resolve(ROOT, file), 'utf8');
      expect(source, file).not.toMatch(/href=\{?`?["']?\/delito-form(?:\?|["'`])/);
    }
  });

  it('enlaza creación, edición y delitos relacionados a la ruta intranet real', () => {
    const list = readFileSync(resolve(ROOT, 'app/intranet/admin/delitos/page.tsx'), 'utf8');
    const detail = readFileSync(resolve(ROOT, 'app/intranet/admin/delitos/[id]/page.tsx'), 'utf8');
    const article = readFileSync(resolve(ROOT, 'app/intranet/admin/cp/[id]/page.tsx'), 'utf8');

    expect(list).toContain('href="/intranet/admin/delito-form"');
    expect(list).toContain('/intranet/admin/delito-form?id=${item.id}');
    expect(detail).toContain('/intranet/admin/delito-form?id=${delito.id}');
    expect(article).toContain('/intranet/admin/delito-form?id=${d.id}');
  });
});
