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
 * y seguro frente a HTML malformado.
 *
 * POLÍTICA DE PÉRDIDA CERO: una tabla que no pueda transformarse sin pérdida de
 * información (headerless, con rowspan/colspan, anidada, malformada) NO se
 * conserva intacta para que el sanitizer final la elimine silenciosamente. Se
 * registra como `untransformableTables += 1` e `informationLosses += 1`, y el gate
 * falla ANTES de que esa tabla llegue a `sanitizeBlogRenderedHtml()`.
 *
 * SOPORTE DE SPANS: rowspan y colspan NO se transforman a fichas (la matriz
 * lógica expande el modelo para clasificar, pero no se renderiza como fichas
 * comparativas). El contrato exige `untransformableTables = 0` para publicados;
 * una futura tabla publicada con spans bloqueará el gate y requerirá mapping o
 * implementación específica (ver docs/seo/current/pr25-final-technical-closure.md).
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

/** Enlaces (href + texto accesible) extraídos de un fragmento HTML.
 *  Tipo interno: se usa dentro del reporte, sin consumidor externo directo. */
interface TableLink {
  href: string;
  text: string;
}

/** Resultado detallado por tabla individual.
 *  Tipo interno: se consume vía BlogTableTransformReport.tables; el audit script
 *  accede por inferencia estructural sin importar este tipo. */
interface BlogTableItemReport {
  tableIndex: number;
  classification: string;
  transformable: boolean;

  sourceRows: number;
  sourceColumns: number;
  sourceCells: number;

  cardsGenerated: number;
  renderedTitleFields: number;
  renderedValueFields: number;
  representedSourceCells: number;

  /** Texto normalizado de la tabla fuente (entidades/espacios). En memoria solo. */
  sourceNormalizedText: string;
  /** Texto normalizado del render de ESA tabla (no del artículo completo). */
  renderedNormalizedText: string;
  /** Equivalencia textual real (multiset de tokens). */
  textEquivalent: boolean;

  sourceLinks: TableLink[];
  renderedLinks: TableLink[];
  /** Equivalencia de enlaces (mismo multiset href+texto+orden lógico). */
  linksEquivalent: boolean;

  finalTableTags: number;
  warnings: string[];
}

/** Métricas de una invocación al transformador. */
export interface BlogTableTransformReport {
  tablesFound: number;
  tablesTransformed: number;
  cardsGenerated: number;
  sourceCells: number;
  /** Celdas fuente representadas en el render (debe == sourceCells). */
  representedSourceCells: number;
  informationLosses: number;
  /** Tablas no transformables (debe ser 0 para cerrar el gate). */
  untransformableTables: number;
  warnings: string[];
  /** Resultado por tabla individual. */
  tables: BlogTableItemReport[];
}

export interface TransformedBlogTables {
  html: string;
  report: BlogTableTransformReport;
}

/** Clasificación estructural de una tabla (alineada con el inventario).
 *  Tipo interno: el inventario CSV usa estos valores como columna
 *  `classification`, pero ningún consumidor de producción importa este tipo. */
type TableClassification =
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

/** Texto plano normalizado para comparación de equivalencia texto↔texto. */
function normalizedPlainText(value: string): string {
  return collapseWhitespace(decodeEntities(value).replace(/<[^>]+>/g, ' ')).toLowerCase();
}

/** Tokeniza un texto normalizado en un multiset estable (para comparación sin orden). */
function tokenMultiset(text: string): string[] {
  // Split por espacios; cada token se conserva tal cual (incluye números, referencias
  // legales como "112", signos con significado). No se ignoran palabras.
  return text.split(/\s+/).filter((t) => t.length > 0);
}

/** Compara dos textos por multiset de tokens (independiente del orden). */
function textMultisetEqual(a: string, b: string): boolean {
  const ta = tokenMultiset(a).sort();
  const tb = tokenMultiset(b).sort();
  if (ta.length !== tb.length) return false;
  return ta.every((tok, i) => tok === tb[i]);
}

/** Verifica que TODO token de `data` esté presente en `render` (subconjunto).
 *  El render puede contener tokens extra (labels de encabezado reubicados),
 *  pero no debe perder ningún token de datos. */
function dataTextContainedIn(data: string, render: string): boolean {
  const dataTokens = tokenMultiset(data);
  if (dataTokens.length === 0) return true;
  const renderCounts = new Map<string, number>();
  for (const t of tokenMultiset(render)) {
    renderCounts.set(t, (renderCounts.get(t) ?? 0) + 1);
  }
  for (const t of dataTokens) {
    const remaining = renderCounts.get(t) ?? 0;
    if (remaining <= 0) return false;
    renderCounts.set(t, remaining - 1);
  }
  return true;
}

/** Extrae el texto normalizado de SOLO las celdas de datos (<td>) de una tabla. */
function dataCellsNormalizedText(tableEl: Element): string {
  const chunks: string[] = [];
  const walk = (node: Element) => {
    for (const child of node.children || []) {
      if (!isElement(child)) continue;
      if (child.tagName === 'td') {
        chunks.push(getOuterHTML(child as unknown as Parameters<typeof getOuterHTML>[0]));
      } else if (['thead', 'tbody', 'tfoot', 'tr'].includes(child.tagName)) {
        walk(child);
      }
    }
  };
  walk(tableEl);
  return normalizedPlainText(chunks.join(' '));
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

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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

function isElement(node: Node | null | undefined): node is Element {
  return !!node && node.type === 'tag';
}

function textOf(node: Node): string {
  if (node.type === 'text') return (node as { data?: string }).data ?? '';
  if ('children' in node && node.children) return (node as { children: Node[] }).children.map(textOf).join('');
  return '';
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

/** Extrae los enlaces (href + texto accesible) de un fragmento HTML, en orden. */
function extractLinks(root: Element | Document): TableLink[] {
  const links: TableLink[] = [];
  const walk = (node: Element | Document) => {
    for (const child of (node as { children?: Node[] }).children || []) {
      if (!isElement(child)) continue;
      if (child.tagName === 'a') {
        const href = child.attribs?.href ?? '';
        links.push({ href, text: collapseWhitespace(textOf(child)) });
      }
      walk(child);
    }
  };
  walk(root);
  return links;
}

/** Compara dos listas de enlaces por (href, texto, orden lógico). */
function linksEqual(a: TableLink[], b: TableLink[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((link, i) => link.href === b[i].href && link.text === b[i].text);
}

/**
 * Construye el grid lógico de celdas expandiendo rowspan/colspan.
 *
 * NOTA: el grid expandido sirve para CLASIFICAR y contar celdas, NO para
 * renderizar fichas con spans (esos casos son no transformables por contrato).
 *
 * El algoritmo corrige el doble decremento de rowspan: una celda pendiente se
 * decrementa exactamente una vez por fila en la que aparece.
 */
function buildGrid(trs: Element[]): { grid: ParsedCell[][]; hasSpan: boolean } {
  const grid: ParsedCell[][] = [];
  let hasSpan = false;
  /** Ocupación diferida por rowspan: colIndex → { cell, remainingRows }.
   *  remainingRows = filas que aún faltan por rellenar (excluyendo la actual). */
  const pending: Map<number, { cell: ParsedCell; remaining: number }> = new Map();

  for (const tr of trs) {
    const row: ParsedCell[] = [];
    let colIndex = 0;
    const cells = (tr.children || []).filter((c): c is Element => isElement(c) && (c.tagName === 'td' || c.tagName === 'th'));
    let cellCursor = 0;
    // 1. Rellena celdas diferidas por rowspan previo EN ESTA FILA.
    while (pending.has(colIndex)) {
      const entry = pending.get(colIndex)!;
      row.push(entry.cell);
      entry.remaining -= 1; // decremento único: esta fila consume una unidad
      if (entry.remaining <= 0) pending.delete(colIndex);
      colIndex += 1;
    }
    // 2. Inserta las celdas reales de esta fila en los huecos libres.
    while (cellCursor < cells.length) {
      // Salta columnas aún ocupadas por rowspan (ya rellenadas en paso 1).
      while (pending.has(colIndex)) colIndex += 1;
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
      // Inserta la celda (o su repetición lógica por colspan) en la fila actual.
      for (let i = 0; i < cell.colspan; i += 1) {
        while (pending.has(colIndex)) colIndex += 1;
        row.push(cell);
        if (cell.rowspan > 1) {
          pending.set(colIndex, { cell, remaining: cell.rowspan - 1 });
        }
        colIndex += 1;
      }
    }
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
function renderCards(parsed: ParsedTable): { html: string; cardsGenerated: number; titleFields: number; valueFields: number; representedCells: number } {
  const { classification, headers, dataRows, columnCount, caption } = parsed;

  if (classification === 'SINGLE_COLUMN_LIST' || columnCount <= 1) {
    const items = dataRows.map((row) => row.map((c) => c.html).join(' ')).filter(Boolean);
    const captionHtml = caption ? `    <p class="article-data-list__caption">${escapeText(caption)}</p>\n` : '';
    const html = `<ul class="article-data-list">\n${items.map((it) => `  <li>${it}</li>`).join('\n')}\n</ul>`;
    // Cada <li> representa una celda (col 1). El header no se renderiza como celda de datos.
    const represented = items.length;
    return {
      html: caption ? `<section class="article-data-list-wrap">\n${captionHtml}${html}\n</section>` : html,
      cardsGenerated: items.length, titleFields: 0, valueFields: items.length, representedCells: represented,
    };
  }

  const isComparison = columnCount >= 3;
  const sectionClass = isComparison ? 'article-comparison-cards' : 'article-data-cards';
  const cardClass = isComparison ? 'article-comparison-card' : 'article-data-card';
  const fieldClass = isComparison ? 'article-comparison-card__field' : 'article-data-card__field';
  const labelClass = isComparison ? 'article-comparison-card__label' : 'article-data-card__label';
  const valueClass = isComparison ? 'article-comparison-card__value' : 'article-data-card__value';
  const titleClass = isComparison ? 'article-comparison-card__title' : 'article-data-card__title';

  const cards: string[] = [];
  let titleFields = 0;
  let valueFields = 0;
  let representedCells = 0;
  for (const row of dataRows) {
    if (row.length === 0) continue;
    // Primera celda → título de la ficha (actúa como identificador de fila).
    const titleCell = row[0];
    const titleHtml = titleCell.html.trim() || escapeText(titleCell.text);
    titleFields += 1;
    representedCells += 1; // la celda título cuenta como representada
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
      valueFields += 1;
      representedCells += 1;
    });
    parts.push(`  </article>`);
    cards.push(parts.join('\n'));
  }
  const captionHtml = caption
    ? `  <p class="${sectionClass}__caption">${escapeText(caption)}</p>\n`
    : '';
  const html = `<section class="${sectionClass}">\n${captionHtml}${cards.join('\n')}\n</section>`;
  return { html, cardsGenerated: cards.length, titleFields, valueFields, representedCells };
}

/** Serializa el HTML de una sola tabla (para extraer su texto/links renderizados). */
function serializeNode(node: Element | Document): string {
  return getOuterHTML(node as unknown as Parameters<typeof getOuterHTML>[0]);
}

/**
 * Reemplaza cada nodo `<table>` del documento por su HTML de fichas, recursivamente.
 * Devuelve el documento serializado y acumula métricas en `report`.
 *
 * Para tablas NO transformables: registra pérdida y NO toca el nodo (el gate
 * fallará antes de llegar al sanitizer final; nunca se deja al sanitizer que
 * elimine contenido silenciosamente).
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
    const tableIndex = report.tables.length;
    const parsed = parseTable(table);
    const sourceOuterHtml = serializeNode(table);
    const sourceLinks = extractLinks(table);

    if (!parsed || !parsed.transformable) {
      const classification = parsed?.classification ?? 'MALFORMED_TABLE';
      const warning = `Tabla #${tableIndex} no transformable (${classification}): contenido no renderizable como fichas sin pérdida.`;
      report.informationLosses += 1;
      report.untransformableTables += 1;
      report.warnings.push(warning);
      // NO se sustituye el nodo: se deja intacto en el documento serializado
      // (el gate fallará antes del sanitizer; nunca se confía en el sanitizer
      // para eliminar contenido). El reporte lo refleja como pérdida.
      // sourceCells = solo celdas de datos (td); los headers son metadata.
      const sourceCells = parsed
        ? parsed.dataRows.reduce((s, r) => s + r.length, 0)
        : 0;
      report.sourceCells += sourceCells;
      report.tables.push({
        tableIndex,
        classification: String(classification),
        transformable: false,
        sourceRows: parsed?.dataRows.length ?? 0,
        sourceColumns: parsed?.columnCount ?? 0,
        sourceCells,
        cardsGenerated: 0,
        renderedTitleFields: 0,
        renderedValueFields: 0,
        representedSourceCells: 0,
        sourceNormalizedText: normalizedPlainText(sourceOuterHtml),
        renderedNormalizedText: '',
        textEquivalent: false,
        sourceLinks,
        renderedLinks: [],
        linksEquivalent: false,
        finalTableTags: 1, // la tabla sigue presente en el HTML
        warnings: [warning],
      });
      continue;
    }

    const sourceCells = parsed.dataRows.reduce((s, r) => s + r.length, 0);
    report.sourceCells += sourceCells;

    const { html: cardsHtml, cardsGenerated, titleFields, valueFields, representedCells } = renderCards(parsed);
    report.cardsGenerated += cardsGenerated;
    report.tablesTransformed += 1;
    report.representedSourceCells += representedCells;

    // Equivalencia textual: TODO token de celdas de datos (<td>) debe estar
    // presente en el render de las fichas (subconjunto). Los headers pueden
    // aparecer además como labels, lo cual es correcto y esperable.
    const cardsDoc = parseDocument(cardsHtml);
    const renderedNormalized = normalizedPlainText(getOuterHTML(cardsDoc as unknown as Parameters<typeof getOuterHTML>[0]));
    const renderedLinks = extractLinks(cardsDoc as unknown as Element);
    const sourceDataText = dataCellsNormalizedText(table);
    const textEq = dataTextContainedIn(sourceDataText, renderedNormalized);
    const linksEq = linksEqual(sourceLinks, renderedLinks);

    if (!textEq) report.warnings.push(`Tabla #${tableIndex}: equivalencia textual falsa.`);
    if (!linksEq) report.warnings.push(`Tabla #${tableIndex}: equivalencia de enlaces falsa.`);

    report.tables.push({
      tableIndex,
      classification: String(parsed.classification),
      transformable: true,
      sourceRows: parsed.dataRows.length,
      sourceColumns: parsed.columnCount,
      sourceCells,
      cardsGenerated,
      renderedTitleFields: titleFields,
      renderedValueFields: valueFields,
      representedSourceCells: representedCells,
      sourceNormalizedText: sourceDataText,
      renderedNormalizedText: renderedNormalized,
      textEquivalent: textEq,
      sourceLinks,
      renderedLinks,
      linksEquivalent: linksEq,
      finalTableTags: 0,
      warnings: [],
    });

    // Sustituye el nodo `<table>` por los nodos de fichas parseados.
    const parent = table.parent;
    if (!parent || !('children' in parent)) continue;
    const idx = parent.children.indexOf(table);
    if (idx === -1) continue;
    const replacementNodes = (cardsDoc as unknown as Element).children as Node[];
    const newNodes: Node[] = replacementNodes.map((node) => cloneNodeWithParent(node, parent as Node));
    if (newNodes.length === 0) continue;
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
    representedSourceCells: 0,
    informationLosses: 0,
    untransformableTables: 0,
    warnings: [],
    tables: [],
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
  textMultisetEqual,
  dataTextContainedIn,
  dataCellsNormalizedText,
  linksEqual,
  extractLinks,
};
