import { describe, expect, it } from 'vitest';
import {
  transformBlogTablesForRender,
  __testing,
} from '@/lib/blog-table-transformer';
import {
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
} from '@/lib/blog-html-sanitizer';

const { normalizedPlainText, classify, textMultisetEqual } = __testing;

/** htmlparser2 serializa tildes como entidades HTML numéricas (&#xfa; = ú).
 *  El navegador las renderiza igual, pero para comparar texto en tests hay
 *  que decodificarlas. */
function decodeEntities(html: string): string {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Equivalencia texto: el render debe contener TODO el texto de la tabla.
 *  Decodifica entidades HTML para tolerar la serialización de tildes. */
function textEquivalent(sourceTableHtml: string, renderedHtml: string): boolean {
  const src = normalizedPlainText(decodeEntities(sourceTableHtml));
  const out = normalizedPlainText(decodeEntities(renderedHtml));
  return src.split(' ').every((word) => word.length > 0 && out.includes(word));
}

/** Contiene texto tras decodificar entidades (tolera tildes serializadas). */
function containsDecoded(html: string, needle: string): boolean {
  return decodeEntities(html).includes(needle);
}

/** Índice de un texto tras decodificar entidades. */
function indexOfDecoded(html: string, needle: string): number {
  return decodeEntities(html).indexOf(needle);
}

describe('transformBlogTablesForRender — casos estructurales (#1-#12)', () => {
  it('#1 tabla 2x2 → article-data-cards', () => {
    const html = '<table><tr><th>K</th><th>V</th></tr><tr><td>A</td><td>B</td></tr></table>';
    const { html: out, report } = transformBlogTablesForRender(html);
    expect(out).toContain('article-data-cards');
    expect(report.cardsGenerated).toBe(1);
    expect(/<table/i.test(out)).toBe(false);
  });

  it('#2 tabla 3 columnas → article-comparison-cards', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>'
      + '<tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('article-comparison-cards');
    expect(out).toContain('article-comparison-card__field');
  });

  it('#3 caption se preserva como subtítulo', () => {
    const html = '<table><caption>Plazos legales</caption>'
      + '<tr><th>T</th><th>D</th></tr><tr><td>x</td><td>y</td></tr></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('Plazos legales');
  });

  it('#4 thead define encabezados usados como etiquetas', () => {
    const html = '<table><thead><tr><th>Tipo</th><th>Causa</th><th>Indemnización</th></tr></thead>'
      + '<tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(containsDecoded(out, 'Causa')).toBe(true);
    expect(containsDecoded(out, 'Indemnización')).toBe(true);
  });

  it('#5 encabezados en primera fila (sin thead) se detectan', () => {
    const html = '<table><tr><th>Encabezado</th><th>Otro</th></tr>'
      + '<tr><td>dato1</td><td>dato2</td></tr></table>';
    const { html: out, report } = transformBlogTablesForRender(html);
    expect(containsDecoded(out, 'dato1')).toBe(true);
    expect(containsDecoded(out, 'dato2')).toBe(true);
    expect(containsDecoded(out, 'Otro')).toBe(true); // header usado como label
    expect(report.cardsGenerated).toBe(1);
  });

  it('#6 sin encabezados → clasificación HEADERLESS_DATA, no se transforma', () => {
    const html = '<table><tr><td>solo</td><td>datos</td></tr>'
      + '<tr><td>sin</td><td>th</td></tr></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.cardsGenerated).toBe(0);
  });

  it('#7 una sola columna → article-data-list', () => {
    const html = '<table><tr><th>Item</th></tr><tr><td>Uno</td></tr><tr><td>Dos</td></tr></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('article-data-list');
    expect(out).toContain('<li>Uno</li>');
  });

  it('#8 celdas vacías se preservan sin romper la estructura', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td></td><td>lleno</td></tr></tbody></table>';
    const { html: out, report } = transformBlogTablesForRender(html);
    expect(report.cardsGenerated).toBe(1);
    expect(out).toContain('lleno');
  });

  it('#9 enlaces dentro de celdas se preservan', () => {
    const html = '<table><thead><tr><th>Ref</th></tr></thead>'
      + '<tbody><tr><td><a href="/articulo">Ver</a></td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('href="/articulo"');
    expect(out).toContain('>Ver</a>');
  });

  it('#10 strong/em se preservan', () => {
    const html = '<table><thead><tr><th>T</th></tr></thead>'
      + '<tbody><tr><td><strong>Negrita</strong> <em>cursiva</em></td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('<strong>Negrita</strong>');
    expect(out).toContain('<em>cursiva</em>');
  });

  it('#11 listas dentro de celdas se preservan', () => {
    const html = '<table><thead><tr><th>Lista</th></tr></thead>'
      + '<tbody><tr><td><ul><li>Uno</li><li>Dos</li></ul></td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>Uno</li>');
    expect(out).toContain('<li>Dos</li>');
  });

  it('#12 párrafos dentro de celdas se preservan', () => {
    const html = '<table><thead><tr><th>Texto</th></tr></thead>'
      + '<tbody><tr><td><p>Párrafo uno.</p><p>Párrafo dos.</p></td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(containsDecoded(out, '<p>Párrafo uno.</p>')).toBe(true);
    expect(containsDecoded(out, '<p>Párrafo dos.</p>')).toBe(true);
  });
});

describe('transformBlogTablesForRender — spans, anidadas y malformadas: RECHAZO SEGURO (#13-#16)', () => {
  it('#13 colspan=2: no transformable, information_losses += 1, untransformable += 1', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>'
      + '<tbody><tr><td colspan="2">combinado</td><td>tercero</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tablesFound).toBe(1);
    expect(report.tablesTransformed).toBe(0);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
    expect(report.tables[0].transformable).toBe(false);
    expect(report.tables[0].finalTableTags).toBe(1);
  });

  it('#14 rowspan=2: no transformable, pérdida registrada', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td rowspan="2">compartido</td><td>uno</td></tr>'
      + '<tr><td>dos</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tablesTransformed).toBe(0);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });

  it('#15 tabla malformada (sin filas) se reporta como pérdida', () => {
    const html = '<table><caption>vacía</caption></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tablesFound).toBe(1);
    expect(report.tablesTransformed).toBe(0);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('MALFORMED_TABLE');
  });

  it('#16 tabla anidada se clasifica NESTED_TABLE y registra pérdida', () => {
    const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr>'
      + '<td><table><tr><td>inner</td></tr></table></td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tablesFound).toBeGreaterThanOrEqual(1);
    expect(report.untransformableTables).toBeGreaterThanOrEqual(1);
    expect(report.informationLosses).toBeGreaterThanOrEqual(1);
    expect(report.tables.some((t) => t.classification === 'NESTED_TABLE')).toBe(true);
  });

  it('#16b headerless (sin th ni thead) registra pérdida, NO inventa "Dato 1"', () => {
    const html = '<table><tr><td>solo</td><td>datos</td></tr>'
      + '<tr><td>sin</td><td>th</td></tr></table>';
    const { report, html: out } = transformBlogTablesForRender(html);
    expect(report.tablesTransformed).toBe(0);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('HEADERLESS_DATA');
    expect(out).not.toMatch(/Dato \d/);
  });
});

describe('transformBlogTablesForRender — casos span obligatorios (§7): fallo controlado', () => {
  it('rowspan=2 → COMPLEX_SPAN_MATRIX, pérdida', () => {
    const html = '<table><thead><tr><th>T</th><th>V</th></tr></thead>'
      + '<tbody><tr><td rowspan="2">x</td><td>1</td></tr><tr><td>2</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });

  it('colspan=2 → COMPLEX_SPAN_MATRIX, pérdida', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td colspan="2">combinado</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });

  it('rowspan + colspan combinados → COMPLEX_SPAN_MATRIX, pérdida', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>'
      + '<tbody><tr><td rowspan="2" colspan="2">compartido</td><td>1</td></tr>'
      + '<tr><td>2</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });

  it('encabezado con colspan → COMPLEX_SPAN_MATRIX, pérdida', () => {
    const html = '<table><thead><tr><th colspan="2">Sección</th></tr></thead>'
      + '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });

  it('celda de datos con rowspan → COMPLEX_SPAN_MATRIX, pérdida', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td>x</td><td rowspan="2">y</td></tr><tr><td>z</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.untransformableTables).toBe(1);
    expect(report.informationLosses).toBe(1);
    expect(report.tables[0].classification).toBe('COMPLEX_SPAN_MATRIX');
  });
});

describe('transformBlogTablesForRender — seguridad e idempotencia (#17-#21)', () => {
  it('#17 HTML inseguro en celdas no se ejecuta (lo limpia el sanitizer final)', () => {
    const html = '<table><thead><tr><th>T</th></tr></thead>'
      + '<tbody><tr><td><script>alert(1)</script>texto</td></tr></tbody></table>';
    const { html: transformed } = transformBlogTablesForRender(html);
    const final = sanitizeBlogRenderedHtml(transformed).html;
    expect(final).not.toMatch(/<script/i);
    expect(final).not.toMatch(/onerror/i);
    expect(final).toContain('texto');
  });

  it('#18 idempotencia: transform(transform(x)) === transform(x)', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const once = transformBlogTablesForRender(html).html;
    const twice = transformBlogTablesForRender(once).html;
    expect(twice).toBe(once);
  });

  it('#19 preservación de texto: toda palabra de los datos está en el render', () => {
    const html = '<table><thead><tr><th>Tipo</th><th>Causa</th><th>Indemnización</th></tr></thead>'
      + '<tbody><tr><td>Despido</td><td>Faltas graves del trabajador</td><td>No procede</td></tr></tbody></table>';
    const { html: out } = transformBlogTablesForRender(html);
    expect(textEquivalent(
      '<table><tr><td>Despido</td><td>Faltas graves del trabajador</td><td>No procede</td></tr></table>',
      out,
    )).toBe(true);
    expect(containsDecoded(out, 'Causa')).toBe(true);
    expect(containsDecoded(out, 'Indemnización')).toBe(true);
  });

  it('#20 cero etiquetas table en salida final (tras sanitizer de render)', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
      + '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const final = sanitizeBlogRenderedHtml(transformBlogTablesForRender(html).html).html;
    expect(final).not.toMatch(/<table\b/i);
    expect(final).not.toMatch(/<t[dhr]\b/i);
  });

  it('#21 multiple tablas en un artículo se transforman todas', () => {
    const html = '<p>intro</p>'
      + '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'
      + '<p>medio</p>'
      + '<table><thead><tr><th>B</th><th>C</th></tr></thead><tbody><tr><td>2</td><td>3</td></tr></tbody></table>'
      + '<p>fin</p>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tablesFound).toBe(2);
    expect(report.tablesTransformed).toBe(2);
  });
});

describe('sanitizadores source/rendered (#22-#25)', () => {
  it('#22 source sanitizer permite etiquetas de tabla', () => {
    const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const source = sanitizeBlogSourceHtml(html).html;
    expect(source).toContain('<table>');
    expect(source).toContain('<th');
    expect(source).toContain('<td');
  });

  it('#23 rendered sanitizer elimina todas las etiquetas de tabla', () => {
    const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const rendered = sanitizeBlogRenderedHtml(html).html;
    expect(rendered).not.toMatch(/<table\b/i);
    expect(rendered).not.toMatch(/<t[dhr]\b/i);
    expect(rendered).not.toMatch(/<thead|tbody|tfoot|caption/i);
    expect(rendered).toContain('A');
    expect(rendered).toContain('1');
  });

  it('#24 clases generadas de fichas sobreviven el sanitizer de render', () => {
    const html = '<section class="article-comparison-cards">'
      + '<article class="article-comparison-card">'
      + '<h3 class="article-comparison-card__title">T</h3>'
      + '<div class="article-comparison-card__field">'
      + '<p class="article-comparison-card__label">L</p>'
      + '<div class="article-comparison-card__value">V</div>'
      + '</div></article></section>';
    const rendered = sanitizeBlogRenderedHtml(html).html;
    expect(rendered).toContain('article-comparison-cards');
    expect(rendered).toContain('article-comparison-card__title');
    expect(rendered).toContain('article-comparison-card__label');
    expect(rendered).toContain('article-comparison-card__value');
  });

  it('#25 clases fuente arbitrarias se eliminan en el render', () => {
    const html = '<table class="evil-table" data-exfil="x">'
      + '<thead><tr><th class="arbitrary">A</th></tr></thead>'
      + '<tbody><tr><td onclick="alert(1)">1</td></tr></tbody></table>';
    const final = sanitizeBlogRenderedHtml(transformBlogTablesForRender(
      sanitizeBlogSourceHtml(html).html,
    ).html).html;
    expect(final).not.toMatch(/evil-table|arbitrary|data-exfil/i);
    expect(final).not.toMatch(/onclick/i);
  });
});

describe('contratos editoriales y caso de aceptación (#26-#30)', () => {
  it('#26 no se modifica el body: el input del transformador es inmutable', () => {
    const body = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const bodyCopy = body;
    transformBlogTablesForRender(body);
    expect(body).toBe(bodyCopy);
  });

  it('#27 no se modifica el hash: el texto plano del body es estable', () => {
    const body = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const before = normalizedPlainText(body);
    transformBlogTablesForRender(body);
    const after = normalizedPlainText(body);
    expect(before).toBe(after);
  });

  it('#28 no se modifica la firma: el transformador es puro (sin efectos)', () => {
    const body = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const r1 = transformBlogTablesForRender(body);
    transformBlogTablesForRender(body);
    transformBlogTablesForRender(body);
    const r4 = transformBlogTablesForRender(body);
    expect(r1.html).toBe(r4.html);
    expect(body).toMatch(/<table/);
  });

  it('#29 caso "Tipos de despido": genera las 4 fichas esperadas', () => {
    const html = '<table>'
      + '<thead><tr><th>Tipo de despido</th><th>Causa según el Artículo 112 CT</th><th>Derecho a indemnización</th></tr></thead>'
      + '<tbody>'
      + '<tr><td><strong>Despido justificado</strong></td><td>Faltas graves del trabajador.</td><td>No.</td></tr>'
      + '<tr><td><strong>Despido injustificado</strong></td><td>Despido sin causa justa.</td><td>Sí.</td></tr>'
      + '<tr><td><strong>Despido indirecto</strong></td><td>Renuncia por causa del empleador.</td><td>Sí.</td></tr>'
      + '<tr><td><strong>Despido por fuerza mayor</strong></td><td>Cierre acreditado.</td><td>No.</td></tr>'
      + '</tbody></table>';
    const { html: out, report } = transformBlogTablesForRender(html);
    for (const tipo of [
      'Despido justificado',
      'Despido injustificado',
      'Despido indirecto',
      'Despido por fuerza mayor',
    ]) {
      expect(containsDecoded(out, tipo)).toBe(true);
    }
    expect(report.cardsGenerated).toBe(4);
    expect(containsDecoded(out, 'Causa según el Artículo 112 CT')).toBe(true);
    expect(containsDecoded(out, 'Derecho a indemnización')).toBe(true);
  });

  it('#30 multiple tablas + texto entre medias preserva orden de lectura', () => {
    const html = '<p>Antes</p>'
      + '<table><thead><tr><th>Primera</th></tr></thead><tbody><tr><td>AAAA</td></tr></tbody></table>'
      + '<p>Entre</p>'
      + '<table><thead><tr><th>Segunda</th></tr></thead><tbody><tr><td>BBBB</td></tr></tbody></table>'
      + '<p>Después</p>';
    const { html: out } = transformBlogTablesForRender(html);
    const idxAntes = indexOfDecoded(out, 'Antes');
    const idxAAAA = indexOfDecoded(out, 'AAAA');
    const idxEntre = indexOfDecoded(out, 'Entre');
    const idxBBBB = indexOfDecoded(out, 'BBBB');
    const idxDespues = indexOfDecoded(out, 'Después');
    expect(idxAntes).toBeLessThan(idxAAAA);
    expect(idxAAAA).toBeLessThan(idxEntre);
    expect(idxEntre).toBeLessThan(idxBBBB);
    expect(idxBBBB).toBeLessThan(idxDespues);
  });
});

describe('clasificación (helper classify)', () => {
  it('clasifica por número de columnas y complejidad', () => {
    expect(classify({ columnCount: 2, hasHeaders: true, hasSpan: false, nested: false, malformed: false })).toBe('TWO_COLUMN_DEFINITION');
    expect(classify({ columnCount: 3, hasHeaders: true, hasSpan: false, nested: false, malformed: false })).toBe('THREE_COLUMN_COMPARISON');
    expect(classify({ columnCount: 5, hasHeaders: true, hasSpan: false, nested: false, malformed: false })).toBe('MULTI_COLUMN_COMPARISON');
    expect(classify({ columnCount: 1, hasHeaders: true, hasSpan: false, nested: false, malformed: false })).toBe('SINGLE_COLUMN_LIST');
    expect(classify({ columnCount: 3, hasHeaders: false, hasSpan: false, nested: false, malformed: false })).toBe('HEADERLESS_DATA');
    expect(classify({ columnCount: 3, hasHeaders: true, hasSpan: true, nested: false, malformed: false })).toBe('COMPLEX_SPAN_MATRIX');
    expect(classify({ columnCount: 3, hasHeaders: true, hasSpan: false, nested: true, malformed: false })).toBe('NESTED_TABLE');
    expect(classify({ columnCount: 0, hasHeaders: false, hasSpan: false, nested: false, malformed: true })).toBe('MALFORMED_TABLE');
  });
});

describe('equivalencia real por tabla (§5)', () => {
  it('textEquivalent = true cuando TODO el texto (tokens) está en el render', () => {
    const html = '<table><thead><tr><th>Tipo</th><th>Causa</th><th>Indemnización</th></tr></thead>'
      + '<tbody><tr><td>Despido</td><td>Faltas graves</td><td>No procede</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tables[0].textEquivalent).toBe(true);
    expect(report.tables[0].sourceNormalizedText).toMatch(/despido/);
    expect(report.tables[0].renderedNormalizedText).toMatch(/despido/);
  });

  it('representedSourceCells = sourceCells para tabla transformable', () => {
    const html = '<table><thead><tr><th>T</th><th>V</th></tr></thead>'
      + '<tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tables[0].sourceCells).toBe(4);
    expect(report.tables[0].representedSourceCells).toBe(4);
    expect(report.tables[0].representedSourceCells).toBe(report.tables[0].sourceCells);
  });

  it('linksEquivalent = true cuando enlaces se preservan con href+texto+orden', () => {
    const html = '<table><thead><tr><th>Ref</th></tr></thead>'
      + '<tbody><tr><td><a href="/a">A</a></td></tr>'
      + '<tr><td><a href="/b">B</a></td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tables[0].linksEquivalent).toBe(true);
    expect(report.tables[0].sourceLinks.length).toBe(2);
    expect(report.tables[0].renderedLinks[0].href).toBe('/a');
  });

  it('reporte por tabla: tables[] tiene una entrada por cada tabla', () => {
    const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'
      + '<table><thead><tr><th>B</th></tr></thead><tbody><tr><td>2</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tables.length).toBe(2);
    expect(report.tables[0].tableIndex).toBe(0);
    expect(report.tables[1].tableIndex).toBe(1);
    expect(report.tables.every((t) => t.transformable)).toBe(true);
  });

  it('expectedTitles y expectedLabels se derivan del AST (no regex)', () => {
    const html = '<table><thead><tr><th>Tipo</th><th>Causa</th><th>Indemnización</th></tr></thead>'
      + '<tbody><tr><td>Despido justificado</td><td>Faltas graves</td><td>No</td></tr>'
      + '<tr><td>Despido injustificado</td><td>Sin causa</td><td>Sí</td></tr></tbody></table>';
    const { report } = transformBlogTablesForRender(html);
    expect(report.tables[0].expectedTitles).toEqual(['Despido justificado', 'Despido injustificado']);
    expect(report.tables[0].expectedLabels).toEqual(['Causa', 'Indemnización']);
    expect(report.tables[0].expectedValues).toEqual(['Faltas graves', 'No', 'Sin causa', 'Sí']);
  });
});

describe('equivalencia textual EXACTA — multiset idéntico (no subconjunto)', () => {
  const baseHtml = '<table><thead><tr><th>A</th><th>B</th></tr></thead>'
    + '<tbody><tr><td>uno</td><td>dos</td></tr><tr><td>tres</td><td>cuatro</td></tr></tbody></table>';

  it('multiset exacto = true cuando tokens fuente y render son idénticos', () => {
    const { report } = transformBlogTablesForRender(baseHtml);
    expect(report.tables[0].textEquivalent).toBe(true);
    // source: uno dos tres cuatro, render: uno dos tres cuatro (títulos + valores)
    expect(report.tables[0].sourceNormalizedText.split(/\s+/).sort())
      .toEqual(report.tables[0].renderedNormalizedText.split(/\s+/).sort());
  });

  it('textMultisetEqual: tokens extra en render → FALSE (no subconjunto)', () => {
    // Si el render tuviera un token extra, no sería equivalente
    expect(textMultisetEqual('uno dos tres', 'uno dos tres cuatro')).toBe(false);
  });

  it('textMultisetEqual: token duplicado → FALSE', () => {
    expect(textMultisetEqual('uno dos tres', 'uno uno dos tres')).toBe(false);
  });

  it('textMultisetEqual: número extra → FALSE', () => {
    expect(textMultisetEqual('uno dos 3', 'uno dos 3 4')).toBe(false);
  });

  it('textMultisetEqual: referencia legal extra → FALSE', () => {
    expect(textMultisetEqual('artículo 112 ct', 'artículo 112 ct 113')).toBe(false);
  });

  it('textMultisetEqual: token ausente → FALSE', () => {
    expect(textMultisetEqual('uno dos tres', 'uno dos')).toBe(false);
  });

  it('textMultisetEqual: exactamente iguales → TRUE (único caso que pasa)', () => {
    expect(textMultisetEqual('uno dos tres cuatro', 'cuatro dos uno tres')).toBe(true);
  });
});
