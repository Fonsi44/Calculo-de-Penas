import sanitize from 'sanitize-html';

/**
 * Convierte HTML a texto plano de forma robusta para usar en JSON-LD schemas.
 *
 * Sustituye al patrón `replace(/<[^>]*>/g, '')` (regex), que trunca contenido
 * cuando hay tags anidados, entidades HTML o atributos con `>`, produciendo
 * texto pegado o malformado. Para schemas (especialmente FAQPage acceptedAnswer)
 * Google requiere texto plano legible; un regex mal hecho puede invalidar el
 * rich snippet o generar warnings en Search Console.
 *
 * Usa `sanitize-html` con `allowedTags: []` (deja caer todos los tags) y
 * `allowedAttributes: {}`, decodifica entidades (`&amp;` → `&`) y normaliza
 * espacios. Server-side únicamente (no importar en componentes cliente).
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  const text = sanitize(html, {
    allowedTags: [],
    allowedAttributes: {},
    // 'discard' (default): elimina los tags pero conserva su contenido de
    // texto. 'escape' los convertiría en entidades (&lt;a&gt;) y el texto
    // resultante contendría pseudo-tags, inadecuado para acceptedAnswer.
    disallowedTagsMode: 'discard',
  });
  // sanitize-html re-escapa entidades al serializar (`&` → `&amp;`). Para
  // texto plano destinado a JSON-LD (acceptedAnswer.text) queremos entidades
  // decodificadas a su carácter real. Decodificamos las más comunes.
  const decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Normaliza espacios y saltos de línea colapsados.
  return decoded.replace(/\s+/g, ' ').trim();
}
