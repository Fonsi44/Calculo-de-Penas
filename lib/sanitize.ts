import sanitizeHtmlLib from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  // NOTA: no se permite 'h1' en bodies de blog/FAQ/CMS. El título del post se
  // renderiza como <h1> en la plantilla app/(public)/blog/[categoria]/[slug]/page.tsx.
  // Permitir h1 aquí generaría doble H1 (problema SEO, regla R15 del AGENTS.md).
  // El comando `npm run blog:normalizar:aplicar` convierte h1 existente a h2.
  'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'pre', 'code', 'hr',
  'span', 'div', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  span: ['style'],
  p: ['style'],
  div: ['style'],
  td: ['style', 'colspan', 'rowspan'],
  th: ['style', 'colspan', 'rowspan'],
  table: ['style'],
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    disallowedTagsMode: 'discard',
    allowedStyles: {
      '*': {
        'color': [/^#(?:[0-9a-f]{3}){1,2}$/i, /^rgb\(/],
        'background-color': [/^#(?:[0-9a-f]{3}){1,2}$/i, /^rgb\(/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
  });
}
