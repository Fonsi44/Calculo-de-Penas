import sanitizeHtmlLib from 'sanitize-html';

const SAFE_PROTOCOL = /^(?:https?|mailto|tel):/i;
const CONTROL_OR_SPACE =
  /[\u0000-\u0020\u007f-\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f\u2060\u3000\ufeff]/g;

function safeHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const normalized = trimmed.replace(CONTROL_OR_SPACE, '');
  if (normalized.startsWith('/') && !normalized.startsWith('//')) return trimmed;
  if (normalized.startsWith('#')) return trimmed;
  if (SAFE_PROTOCOL.test(normalized)) return trimmed;
  return undefined;
}

export function sanitizePublicFaqHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
    transformTags: {
      a: (_tagName, attributes) => {
        const href = safeHref(attributes.href);
        const target = attributes.target === '_blank' ? '_blank' : undefined;
        return {
          tagName: 'a',
          attribs: {
            ...(href ? { href } : {}),
            ...(target ? { target, rel: 'noopener noreferrer' } : {}),
          },
        };
      },
    },
  });
}

export function publicFaqPlainText(sanitizedHtml: string): string {
  return sanitizeHtmlLib(sanitizedHtml, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasUnsafePublicFaqHtml(html: string): boolean {
  return sanitizePublicFaqHtml(html) !== html;
}
