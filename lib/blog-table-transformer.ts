/**
 * Transformador de tablas del blog → fichas responsive (render-only).
 *
 * Sustituye las `<table>` presentes en el HTML renderizado de los artículos por
 * estructuras semánticas de fichas (`article-comparison-cards`, `article-data-cards`,
 * `article-data-list`) que son legibles en móvil y no producen overflow horizontal
 * ni palabras partidas letra por letra.
 *
 * REGLA ABSOLUTA: nunca muta `post.body`. Opera exclusivamente sobre el HTML ya
 * saneado en la fase de fuente y antes de la sanitización final de render. No
 * persiste nada; el cuerpo, el hash y la firma editoriales quedan intactos.
 *
 * Parser: `htmlparser2` (AST real, ya presente como dependencia transitiva de
 * `sanitize-html`). No se usa regex para parsear tablas. Determinista, idempotente
 * y seguro frente a HTML malformado: si una tabla no puede transformarse sin
 * pérdida, se conserva intacta y se registra un warning (la sanitización final
 * decidirá si la elimina o no; el contrato del gate exigirá cero tablas finales
 * solo cuando todas sean transformables).
 */

import { parseDocument } from 'htmlparser2';
import { cloneNode, type Document, type Element, type Node } from 'domhandler';
import { getOuterHTML } from 'domutils';

/** Clona un nodo (con su subárbol) asignándole un nuevo parent. */
function cloneNodeWithParent(node: Node, parent: Node): Node {
  const cloned = cloneNode(node, true) as Node;
  (cloned as { parent: Node | null }).parent = parent;
  return cloned;
}

/** Métricas de una invocación al transformador. */
export interface BlogTableTransformReport {
  tablesFound: number;
  tablesTransformed: number;
  cardsGenerated: number;
  sourceCells: number;
  renderedFields: number;
  informationLosses: number;
  warnings: string[];
}

export interface TransformedBlogTables {
  html: string;
  report: BlogTableTransformReport;
}

/** Clasificación estructural de una tabla (alineada con el inventario). */
export type TableClassification =
  | 'TWO_COLUMN_DEFINITION'
  | 'THREE_COLUMN_COMPARISON'
  | 'MULTI_COLUMN_COMPARISON'
  | 'SINGLE_COLUMN_LIST'
  | 'HEADERLESS_DATA'
  | 'COMPLEX_SPAN_MATRIX'
  | 'MALFORMED_TABLE'
  | 'NESTED_TABLE';

interface ParsedCell {
  /** HTML interno serializado de la celda (preserva strong/em/a/ul/p...). */
  html: string;
  /** Texto plano para comparación de equivalencia. */
  text: string;
  isHeader: boolean;
  colspan: number;
  rowspan: number;
}

interface ParsedTable {
  caption: string;
  /** Encabezados lógicos por columna (resueltos). */
  headers: string[];
  /** Filas de datos (sin la fila de encabezados). */
  dataRows: ParsedCell[][];
  columnCount: number;
  classification: TableClassification;
  transformable: boolean;
}

const TABLE_TAGS = new Set(['table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col']);

function isElement(node: Node | null | undefined): node is Element {
  return !!node && node.type === 'tag';
}

function textOf(node: Node): string {
  if (node.type === 'text') return (node as { data?: string }).data ?? '';
  if ('children' in node && node.children) return (node as { children: Node[] }).children.map(textOf).join('');
  return '';
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Decodifica entidades HTML numéricas/centinela comunes que htmlparser2
 *  emite al serializar (p. ej. &#xfa; = ú). El navegador las renderiza igual,
 *  pero para comparación de equivalencia texto↔texto hay que normalizarlas. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Texto plano normalizado para comparación de equivalencia texto↔texto. */
function normalizedPlainText(value: string): string {
  return collapseWhitespace(decodeEntities(value).replace(/<[^>]+>/g, ' ')).toLowerCase();
}

/** Clasifica según nº de columnas, presencia de encabezados y spans. */
function classify(params: {
  columnCount: number;
  hasHeaders: boolean;
  hasSpan: boolean;
  nested: boolean;
  malformed: boolean;
}): TableClassification {
  if (params.malformed) return 'MALFORMED_TABLE';
  if (params.nested) return 'NESTED_TABLE';
  if (params.hasSpan) return 'COMPLEX_SPAN_MATRIX';
  if (!params.hasHeaders) return 'HEADERLESS_DATA';
  if (params.columnCount <= 1) return 'SINGLE_COLUMN_LIST';
  if (params.columnCount === 2) return 'TWO_COLUMN_DEFINITION';
  if (params.columnCount === 3) return 'THREE_COLUMN_COMPARISON';
  return 'MULTI_COLUMN_COMPARISON';
}

function findFirst(parent: Element, tag: string): Element | null {
  const child = (parent.children || []).find((c): c is Element => isElement(c) && c.tagName === tag);
  return child ?? null;
}

function findAllTrs(table: Element): Element[] {
  const trs: Element[] = [];
  const walk = (node: Element) => {
    for (const child of node.children || []) {
      if (!isElement(child)) continue;
      if (child.tagName === 'tr') trs.push(child);
      else if (['thead', 'tbody', 'tfoot'].includes(child.tagName)) walk(child);
    }
  };
  walk(table);
  return trs;
}

/** Construye el grid lógico de celdas expandiendo rowspan/colspan. */
function buildGrid(trs: Element[]): { grid: ParsedCell[][]; hasSpan: boolean } {
  const grid: ParsedCell[][] = [];
  let hasSpan = false;
  /** Ocupación diferida por rowspan: colIndex → { cell, remainingRows }. */
  const pending: Map<number, { cell: ParsedCell; remaining: number }> = new Map();

  for (const tr of trs) {
    const row: ParsedCell[] = [];
    let colIndex = 0;
    const cells = (tr.children || []).filter((c): c is Element => isElement(c) && (c.tagName === 'td' || c.tagName === 'th'));
    let cellCursor = 0;
    while (cellCursor < cells.length || pending.size > 0) {
      // Rellena celdas diferidas por rowspan previo.
      while (pending.has(colIndex)) {
        const entry = pending.get(colIndex)!;
        row.push(entry.cell);
        entry.remaining -= 1;
        if (entry.remaining <= 0) pending.delete(colIndex);
        colIndex += 1;
      }
      if (cellCursor >= cells.length) break;
      const cellEl = cells[cellCursor++];
      const innerHtml = (cellEl.children || []).map((c) => getOuterHTML(c)).join('');
      const cell: ParsedCell = {
        html: innerHtml,
        text: collapseWhitespace(textOf(cellEl)),
        isHeader: cellEl.tagName === 'th',
        colspan: Math.max(1, parseInt(cellEl.attribs?.colspan ?? '1', 10) || 1),
        rowspan: Math.max(1, parseInt(cellEl.attribs?.rowspan ?? '1', 10) || 1),
      };
      if (cell.colspan > 1 || cell.rowspan > 1) hasSpan = true;
      for (let i = 0; i < cell.colspan; i += 1) {
        row.push(cell);
        if (cell.rowspan > 1) {
          pending.set(colIndex, { cell, remaining: cell.rowspan - 1 });
        }
        colIndex += 1;
      }
    }
    // Decrementa los rowspan pendientes no consumidos esta fila.
    pending.forEach((entry, col) => {
      entry.remaining -= 1;
      if (entry.remaining <= 0) pending.delete(col);
    });
    if (row.length > 0) grid.push(row);
  }
  return { grid, hasSpan };
}

function parseTable(tableEl: Element): ParsedTable | null {
  const captionEl = findFirst(tableEl, 'caption');
  const caption = captionEl ? collapseWhitespace(textOf(captionEl)) : '';
  const trs = findAllTrs(tableEl);
  if (trs.length === 0) {
    return {
      caption, headers: [], dataRows: [], columnCount: 0,
      classification: 'MALFORMED_TABLE', transformable: false,
    };
  }
  const { grid, hasSpan } = buildGrid(trs);
  if (grid.length === 0) {
    return {
      caption, headers: [], dataRows: [], columnCount: 0,
      classification: 'MALFORMED_TABLE', transformable: false,
    };
  }
  const columnCount = grid.reduce((max, row) => Math.max(max, row.length), 0);

  // Detección de encabezados: fila completamente de <th>, o presencia de <thead>.
  const hasThead = !!(findFirst(tableEl, 'thead'));
  const firstRow = grid[0];
  const firstRowAllHeaders = firstRow.length > 0 && firstRow.every((c) => c.isHeader);
  const anyHeader = grid.some((row) => row.some((c) => c.isHeader));

  let headers: string[] = [];
  let dataRows = grid;
  if (firstRowAllHeaders || hasThead) {
    headers = firstRow.map((c) => c.text);
    dataRows = grid.slice(1);
  } else if (anyHeader) {
    // Encabezados dispersos: usar la primera fila como etiquetas si tiene algún th.
    headers = firstRow.map((c) => c.text);
    dataRows = grid.slice(1);
  }

  const nested = !!(findFirst(tableEl, 'table')) || grid.some((row) =>
    row.some((c) => /<table\b/i.test(c.html)));
  const malformed = columnCount === 0;
  const classification = classify({
    columnCount, hasHeaders: headers.length > 0, hasSpan, nested, malformed,
  });
  const transformable =
    !malformed && !nested && !hasSpan && classification !== 'HEADERLESS_DATA';

  return { caption, headers, dataRows, columnCount, classification, transformable };
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Genera el HTML de fichas para una tabla parseada. */
function renderCards(parsed: ParsedTable): { html: string; cardsGenerated: number; fields: number } {
  const { classification, headers, dataRows, columnCount, caption } = parsed;

  if (classification === 'SINGLE_COLUMN_LIST' || columnCount <= 1) {
    const items = dataRows.map((row) => row.map((c) => c.html).join(' ')).filter(Boolean);
    const captionHtml = caption ? `    <p class="article-data-list__caption">${escapeText(caption)}</p>\n` : '';
    const html = `<ul class="article-data-list">\n${items.map((it) => `  <li>${it}</li>`).join('\n')}\n</ul>`;
    return { html: caption ? `<section class="article-data-list-wrap">\n${captionHtml}${html}\n</section>` : html, cardsGenerated: items.length, fields: items.length };
  }

  const isComparison = columnCount >= 3;
  const sectionClass = isComparison ? 'article-comparison-cards' : 'article-data-cards';
  const cardClass = isComparison ? 'article-comparison-card' : 'article-data-card';
  const fieldClass = isComparison ? 'article-comparison-card__field' : 'article-data-card__field';
  const labelClass = isComparison ? 'article-comparison-card__label' : 'article-data-card__label';
  const valueClass = isComparison ? 'article-comparison-card__value' : 'article-data-card__value';
  const titleClass = isComparison ? 'article-comparison-card__title' : 'article-data-card__title';

  const cards: string[] = [];
  let fields = 0;
  for (const row of dataRows) {
    if (row.length === 0) continue;
    // Primera celda → título de la ficha (actúa como identificador de fila).
    const titleCell = row[0];
    const titleHtml = titleCell.html.trim() || escapeText(titleCell.text);
    const fieldCells = row.slice(1);
    const parts: string[] = [];
    parts.push(`  <article class="${cardClass}">`);
    parts.push(`    <h3 class="${titleClass}">${titleHtml}</h3>`);
    fieldCells.forEach((cell, idx) => {
      const label = headers[idx + 1] || `Dato ${idx + 1}`;
      parts.push(`    <div class="${fieldClass}">`);
      parts.push(`      <p class="${labelClass}">${escapeText(label)}</p>`);
      parts.push(`      <div class="${valueClass}">${cell.html}</div>`);
      parts.push(`    </div>`);
      fields += 1;
    });
    parts.push(`  </article>`);
    cards.push(parts.join('\n'));
  }
  const captionHtml = caption
    ? `  <p class="${sectionClass}__caption">${escapeText(caption)}</p>\n`
    : '';
  const html = `<section class="${sectionClass}">\n${captionHtml}${cards.join('\n')}\n</section>`;
  return { html, cardsGenerated: cards.length, fields };
}

/**
 * Reemplaza cada nodo `<table>` del documento por su HTML de fichas, recursivamente.
 * Devuelve el documento serializado y acumula métricas en `report`.
 */
function replaceTablesInDocument(
  doc: Document,
  report: BlogTableTransformReport,
): void {
  const tables: Element[] = [];
  const collect = (node: Element) => {
    for (const child of node.children || []) {
      if (!isElement(child)) continue;
      if (child.tagName === 'table') tables.push(child);
      else collect(child);
    }
  };
  collect(doc as unknown as Element);

  for (const table of tables) {
    report.tablesFound += 1;
    const parsed = parseTable(table);
    if (!parsed || !parsed.transformable) {
      report.informationLosses += 0;
      report.warnings.push(
        `Tabla no transformable (${parsed?.classification ?? 'MALFORMED_TABLE'}): se conserva intacta.`,
      );
      continue;
    }
    report.sourceCells += parsed.dataRows.reduce((sum, row) => sum + row.length, 0)
      + parsed.headers.length;
    const { html: cardsHtml, cardsGenerated, fields } = renderCards(parsed);
    report.cardsGenerated += cardsGenerated;
    report.renderedFields += fields;
    report.tablesTransformed += 1;

    // Sustituye el nodo `<table>` por un nodo de texto con el HTML de fichas.
    // domhandler representa el texto con un objeto Text node.
    const parent = table.parent;
    if (!parent || !('children' in parent)) continue;
    const idx = parent.children.indexOf(table);
    if (idx === -1) continue;
    // Parsea el HTML de fichas e inserta los nodos resultantes en el lugar de
    // la tabla. Insertamos markup real, no texto escapado.
    const cardsDoc = parseDocument(cardsHtml);
    const replacementNodes = (cardsDoc as unknown as Element).children as Node[];
    const newNodes: Node[] = replacementNodes.map((node) => cloneNodeWithParent(node, parent as Node));
    if (newNodes.length === 0) continue;
    // Enlaza prev/next entre los nuevos nodos.
    newNodes.forEach((node, i) => {
      const el = node as unknown as { prev: Node | null; next: Node | null };
      el.prev = i === 0 ? (table.prev ?? null) : newNodes[i - 1];
      el.next = i === newNodes.length - 1 ? (table.next ?? null) : newNodes[i + 1];
    });
    (parent.children as Node[]).splice(idx, 1, ...newNodes);
    if (table.prev) (table.prev as { next: Node | null }).next = newNodes[0];
    if (table.next) (table.next as { prev: Node | null }).prev = newNodes[newNodes.length - 1];
  }
}

export function transformBlogTablesForRender(html: string): TransformedBlogTables {
  const report: BlogTableTransformReport = {
    tablesFound: 0,
    tablesTransformed: 0,
    cardsGenerated: 0,
    sourceCells: 0,
    renderedFields: 0,
    informationLosses: 0,
    warnings: [],
  };

  if (!html || !/<table\b/i.test(html)) {
    return { html, report };
  }

  const doc = parseDocument(html);
  replaceTablesInDocument(doc, report);
  const out = getOuterHTML(doc);
  return { html: out, report };
}

/** Reexporta utilidades para tests/auditoría. */
export const __testing = {
  parseTable,
  classify,
  buildGrid,
  normalizedPlainText,
  TABLE_TAGS,
};
