/**
 * Formatea respuestas NotebookLM para el widget (markdown ligero → HTML seguro).
 */

const ALLOWED = /^<\/?(p|strong|em|h3|h4|ul|ol|li|br)\b[^>]*>$/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convierte markdown básico de NotebookLM a HTML sin dependencias externas. */
export function formatNlmReplyToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      closeLists();
      out.push(`<h4>${inlineFormat(escapeHtml(trimmed.slice(4)))}</h4>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeLists();
      out.push(`<h3>${inlineFormat(escapeHtml(trimmed.slice(3)))}</h3>`);
      continue;
    }

    const ulMatch = /^[-*•]\s+(.+)/.exec(trimmed);
    if (ulMatch) {
      if (!inUl) {
        closeLists();
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inlineFormat(escapeHtml(ulMatch[1]))}</li>`);
      continue;
    }

    const olMatch = /^\d+\.\s+(.+)/.exec(trimmed);
    if (olMatch) {
      if (!inOl) {
        closeLists();
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inlineFormat(escapeHtml(olMatch[1]))}</li>`);
      continue;
    }

    closeLists();
    out.push(`<p>${inlineFormat(escapeHtml(trimmed))}</p>`);
  }

  closeLists();
  return out.join('');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Sanitiza HTML generado (whitelist mínima). */
export function sanitizeNlmHtml(html: string): string {
  // Sin parser DOM en servidor: confiamos en nuestro generador + strip tags no permitidos.
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match) =>
    ALLOWED.test(match) ? match : '',
  );
}
