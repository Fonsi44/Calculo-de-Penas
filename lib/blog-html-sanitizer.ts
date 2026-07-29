import sanitizeHtmlLib from 'sanitize-html';

const BLOG_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del', 'mark', 'small', 'sup', 'sub',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'hr',
  'span', 'div', 'section', 'aside',
  'figure', 'figcaption', 'img',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'details', 'summary',
] as const;

const ACTIVE_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'applet', 'frame', 'frameset',
  'form', 'input', 'button', 'select', 'option', 'textarea',
  'meta', 'base', 'link', 'template', 'noscript', 'svg', 'math',
]);

const SOURCE_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
  td: ['colspan', 'rowspan', 'style'],
  th: ['colspan', 'rowspan', 'scope', 'style'],
  p: ['style'],
  div: ['style'],
  section: ['style'],
  table: ['style'],
  details: ['open'],
};

const GENERATED_CLASSES = [
  'my-7', 'rounded-lg', 'border', 'border-accent/30', 'bg-surface-alt', 'p-4',
  'text-xxs', 'font-bold', 'uppercase', 'tracking-wider', 'text-accent-dark',
  'mb-1', 'text-sm', 'font-semibold', 'text-text', 'text-text-secondary',
  'leading-relaxed', 'mb-2', 'text-primary', 'hover:text-accent-dark',
  'context-link',
];

const FINAL_ATTRIBUTES: Record<string, string[]> = {
  ...SOURCE_ATTRIBUTES,
  h2: ['id'],
  h3: ['id'],
  a: [
    'href', 'target', 'rel', 'class',
    'data-event-name', 'data-cta-location', 'data-cta-topic', 'data-internal-link',
  ],
  aside: ['class'],
  p: ['style', 'class'],
};

const SAFE_PROTOCOL = /^(?:https?|mailto|tel):/i;
const CONTROL_OR_UNICODE_SPACE = /[\u0000-\u0020\u007f-\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f\u2060\u3000\ufeff]/g;
const SAFE_HEADING_ID = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
const SAFE_DIMENSION = /^(?:[2-9]|[1-9]\d{1,3})$/;

export interface BlogSanitizationReport {
  removedTags: number;
  removedAttributes: number;
  removedSchemes: number;
  removedStyles: number;
  removedImages: number;
}

export interface SanitizedBlogHtml {
  html: string;
  report: BlogSanitizationReport;
}

function safeNavigationUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const normalized = trimmed.replace(CONTROL_OR_UNICODE_SPACE, '');
  if (
    normalized.startsWith('/')
    && !normalized.startsWith('//')
  ) return trimmed;
  if (normalized.startsWith('#') || normalized.startsWith('?')) return trimmed;
  if (SAFE_PROTOCOL.test(normalized)) return trimmed;
  return undefined;
}

function safeImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(CONTROL_OR_UNICODE_SPACE, '');
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return undefined;
  if (/[?&](?:email|correo|phone|telefono|token|key|id)=/i.test(normalized)) return undefined;
  return value.trim();
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function createReport(before: string, after: string): BlogSanitizationReport {
  const beforeTags = [...before.matchAll(/<\/?\s*([a-z][a-z0-9-]*)\b/gi)]
    .map((match) => match[1].toLowerCase());
  const afterTags = [...after.matchAll(/<\/?\s*([a-z][a-z0-9-]*)\b/gi)]
    .map((match) => match[1].toLowerCase());
  const afterTagCounts = new Map<string, number>();
  for (const tag of afterTags) afterTagCounts.set(tag, (afterTagCounts.get(tag) ?? 0) + 1);
  let removedTags = 0;
  for (const tag of beforeTags) {
    const remaining = afterTagCounts.get(tag) ?? 0;
    if (remaining > 0) afterTagCounts.set(tag, remaining - 1);
    else removedTags += 1;
  }

  return {
    removedTags,
    removedAttributes:
      countMatches(before, /\s(?:on[a-z]+|srcdoc|formaction|xlink:href|xmlns|nonce|integrity|ping|name|id|data-[\w-]+)\s*=/gi)
      - countMatches(after, /\s(?:id|data-[\w-]+)\s*=/gi),
    removedSchemes: countMatches(
      before,
      /(?:javascript|vbscript|data|file|blob)\s*:/gi,
    ) - countMatches(after, /(?:javascript|vbscript|data|file|blob)\s*:/gi),
    removedStyles: Math.max(
      0,
      countMatches(before, /\sstyle\s*=/gi) - countMatches(after, /\sstyle\s*=/gi),
    ),
    removedImages: Math.max(
      0,
      countMatches(before, /<img\b/gi) - countMatches(after, /<img\b/gi),
    ),
  };
}

function sanitize(
  html: string,
  stage: 'source' | 'rendered',
): SanitizedBlogHtml {
  const usedHeadingIds = new Set<string>();
  const allowedAttributes = stage === 'source' ? SOURCE_ATTRIBUTES : FINAL_ATTRIBUTES;

  const sanitized = sanitizeHtmlLib(html, {
    allowedTags: [...BLOG_TAGS, ...(stage === 'source' ? ['h1'] : [])],
    allowedAttributes,
    allowedClasses: stage === 'rendered'
      ? { a: GENERATED_CLASSES, aside: GENERATED_CLASSES, p: GENERATED_CLASSES }
      : {},
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
    allowedStyles: {
      '*': {
        'text-align': [/^(?:left|right|center|justify)$/],
      },
    },
    transformTags: {
      h1: () => ({ tagName: 'h2', attribs: {} }),
      a: (_tagName, attribs) => {
        const href = safeNavigationUrl(attribs.href);
        const target = ['_blank', '_self', '_parent', '_top'].includes(attribs.target)
          ? attribs.target
          : undefined;
        const safe: Record<string, string> = {};
        if (href) safe.href = href;
        if (target) safe.target = target;
        if (target === '_blank') safe.rel = 'noopener noreferrer';
        else if (attribs.rel) {
          const rel = attribs.rel.split(/\s+/).filter((value) =>
            ['nofollow', 'ugc', 'sponsored', 'noopener', 'noreferrer'].includes(value),
          );
          if (rel.length > 0) safe.rel = [...new Set(rel)].join(' ');
        }
        if (stage === 'rendered') {
          for (const name of [
            'class', 'data-event-name', 'data-cta-location', 'data-cta-topic', 'data-internal-link',
          ]) {
            if (attribs[name]) safe[name] = attribs[name].slice(0, 160);
          }
        }
        return { tagName: 'a', attribs: safe };
      },
      img: (_tagName, attribs) => {
        const src = safeImageUrl(attribs.src);
        const alt = attribs.alt?.trim();
        const width = SAFE_DIMENSION.test(attribs.width ?? '') ? attribs.width : undefined;
        const height = SAFE_DIMENSION.test(attribs.height ?? '') ? attribs.height : undefined;
        if (!src || !alt || (width === '1' && height === '1')) {
          return { tagName: 'span', attribs: {} };
        }
        return {
          tagName: 'img',
          attribs: {
            src,
            alt: alt.slice(0, 300),
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
            loading: 'lazy',
            decoding: 'async',
          },
        };
      },
      h2: (tagName, attribs) => {
        if (stage !== 'rendered') return { tagName, attribs: {} as Record<string, string> };
        const id = attribs.id;
        if (!id || !SAFE_HEADING_ID.test(id) || usedHeadingIds.has(id)) {
          return { tagName, attribs: {} as Record<string, string> };
        }
        usedHeadingIds.add(id);
        return { tagName, attribs: { id } };
      },
      h3: (tagName, attribs) => {
        if (stage !== 'rendered') return { tagName, attribs: {} as Record<string, string> };
        const id = attribs.id;
        if (!id || !SAFE_HEADING_ID.test(id) || usedHeadingIds.has(id)) {
          return { tagName, attribs: {} as Record<string, string> };
        }
        usedHeadingIds.add(id);
        return { tagName, attribs: { id } };
      },
    },
    exclusiveFilter: (frame) => {
      if (ACTIVE_TAGS.has(frame.tag)) return true;
      if (frame.tag !== 'img') return false;
      return frame.attribs.width === '1' && frame.attribs.height === '1';
    },
  });

  return { html: sanitized, report: createReport(html, sanitized) };
}

export function sanitizeBlogSourceHtml(html: string): SanitizedBlogHtml {
  return sanitize(html, 'source');
}

export function sanitizeBlogRenderedHtml(html: string): SanitizedBlogHtml {
  return sanitize(html, 'rendered');
}

export function blogHtmlPlainText(html: string): string {
  return sanitizeHtmlLib(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

export function containsActiveBlogHtml(html: string): boolean {
  return /<(?:script|style|iframe|object|embed|applet|form|input|button|select|textarea|meta|base|link|template|svg|math)\b/i.test(html)
    || /\son[a-z]+\s*=/i.test(html)
    || /(?:href|src)\s*=\s*["']?[^>"']*(?:javascript|vbscript|data|file|blob)\s*:/i.test(html)
    || /\b(?:background-image|position|z-index|behavior|-moz-binding|clip-path|animation|filter)\s*:/i.test(html)
    || /\s(?:srcdoc|formaction|xlink:href|xmlns|nonce|integrity|ping)\s*=/i.test(html)
    || /(?:href|src)\s*=\s*["']?\/\//i.test(html);
}

export function serializeBlogJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
