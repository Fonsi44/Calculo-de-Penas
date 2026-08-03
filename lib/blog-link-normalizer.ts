const EXAMPLE_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'ejemplo.com',
  'www.ejemplo.com',
  'tuabogado.com',
  'www.tuabogado.com',
  'localhost',
]);

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const EXPLICIT_PLACEHOLDER = /(?:\bTODO\b|\bPENDIENTE\b|\bREEMPLAZAR\b|\{\{[^}]+\}\}|\[\.\.\.\]|\bURL_AQUI\b|\bENLACE_AQUI\b)/;
const VERCEL_PREVIEW_HOST = /(?:^|\.)vercel\.app$/i;
const DOUBLE_BLOG_PREFIX = /\/blog\/[^/"']+\/blog\//i;

export type BlogLinkIssueClassification =
  | 'dangerous_scheme'
  | 'empty_href'
  | 'bare_anchor'
  | 'invalid_href'
  | 'example_domain'
  | 'localhost'
  | 'vercel_preview_url'
  | 'explicit_placeholder'
  | 'legacy_articles_path'
  | 'legacy_blog_path'
  | 'double_blog_prefix'
  | 'relative_internal_path'
  | 'internal_redirect_origin';

export interface BlogLinkIssue {
  href: string;
  classification: BlogLinkIssueClassification;
  proposedTarget: string;
  resolution: 'runtime_normalization' | 'redirect' | 'body_change_requires_review';
  blocking: boolean;
  signatureRisk: 'none_render_only' | 'body_change_would_invalidate_hash';
}

export interface BlogLinkNormalizationResult {
  html: string;
  issues: BlogLinkIssue[];
}

interface LinkDecision {
  href: string;
  issue?: BlogLinkIssue;
  unwrap: boolean;
}

function issue(
  href: string,
  classification: BlogLinkIssueClassification,
  proposedTarget: string,
  resolution: BlogLinkIssue['resolution'],
  blocking: boolean,
): BlogLinkIssue {
  return {
    href,
    classification,
    proposedTarget,
    resolution,
    blocking,
    signatureRisk: resolution === 'body_change_requires_review'
      ? 'body_change_would_invalidate_hash'
      : 'none_render_only',
  };
}

function classifyHref(
  rawHref: string,
  redirects: Readonly<Record<string, string>>,
): LinkDecision {
  const href = rawHref.trim();
  if (!href) {
    return { href, unwrap: true, issue: issue(rawHref, 'empty_href', '', 'runtime_normalization', true) };
  }
  if (href === '#') {
    return { href, unwrap: true, issue: issue(href, 'bare_anchor', '', 'runtime_normalization', false) };
  }
  if (EXPLICIT_PLACEHOLDER.test(href)) {
    return {
      href,
      unwrap: true,
      issue: issue(href, 'explicit_placeholder', '', 'runtime_normalization', true),
    };
  }
  if (/\s/.test(href)) {
    return { href, unwrap: true, issue: issue(href, 'invalid_href', '', 'runtime_normalization', true) };
  }
  if (DOUBLE_BLOG_PREFIX.test(href)) {
    return {
      href,
      unwrap: true,
      issue: issue(href, 'double_blog_prefix', '', 'body_change_requires_review', true),
    };
  }
  if (/^\/articulos\//i.test(href)) {
    return {
      href,
      unwrap: false,
      issue: issue(href, 'legacy_articles_path', '', 'body_change_requires_review', true),
    };
  }

  const schemeMatch = href.match(/^([a-z][a-z0-9+.-]*:)/i);
  if (schemeMatch && !SAFE_SCHEMES.has(schemeMatch[1].toLowerCase())) {
    return {
      href,
      unwrap: true,
      issue: issue(href, 'dangerous_scheme', '', 'runtime_normalization', true),
    };
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (url.hostname === 'localhost') {
        return { href, unwrap: true, issue: issue(href, 'localhost', '', 'runtime_normalization', true) };
      }
      if (EXAMPLE_HOSTS.has(url.hostname.toLowerCase())) {
        const proposedTarget = `${url.pathname}${url.search}${url.hash}`;
        return {
          href: proposedTarget,
          unwrap: false,
          issue: issue(href, 'example_domain', proposedTarget, 'runtime_normalization', false),
        };
      }
      if (VERCEL_PREVIEW_HOST.test(url.hostname)) {
        return {
          href,
          unwrap: true,
          issue: issue(href, 'vercel_preview_url', '', 'runtime_normalization', true),
        };
      }
    } catch {
      return { href, unwrap: true, issue: issue(href, 'invalid_href', '', 'runtime_normalization', true) };
    }
    return { href, unwrap: false };
  }

  if (
    href.startsWith('/')
    || href.startsWith('#')
    || href.startsWith('?')
    || href.startsWith('./')
    || href.startsWith('../')
    || schemeMatch
  ) {
    const redirectTarget = redirects[href];
    if (redirectTarget) {
      return {
        href: redirectTarget,
        unwrap: false,
        issue: issue(href, 'internal_redirect_origin', redirectTarget, 'redirect', false),
      };
    }
    if (/^\/blog\/[^/?"#]+(?:[?#].*)?$/i.test(href)) {
      return {
        href,
        unwrap: false,
        issue: issue(href, 'legacy_blog_path', '', 'body_change_requires_review', true),
      };
    }
    return { href, unwrap: false };
  }

  const rooted = `/${href}`;
  return {
    href: rooted,
    unwrap: false,
    issue: issue(href, 'relative_internal_path', rooted, 'runtime_normalization', false),
  };
}

/**
 * Normaliza únicamente la copia HTML destinada al render.
 *
 * El cuerpo persistido, su hash y la firma editorial permanecen intactos.
 * La función es determinista e idempotente y devuelve todos los hallazgos para
 * que los scripts de auditoría puedan bloquear o documentar cada incidencia.
 */
export function normalizeBlogLinksForRender(
  html: string,
  redirects: Readonly<Record<string, string>> = {},
): BlogLinkNormalizationResult {
  const issues: BlogLinkIssue[] = [];
  const normalized = html.replace(
    /<a\b([^>]*?)\bhref\s*=\s*(["'])([^"']*)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, before: string, quote: string, rawHref: string, after: string, content: string) => {
      const decision = classifyHref(rawHref, redirects);
      if (decision.issue) issues.push(decision.issue);
      if (decision.unwrap) return content;
      if (decision.href === rawHref) return full;
      return `<a${before}href=${quote}${decision.href}${quote}${after}>${content}</a>`;
    },
  );
  return { html: normalized, issues };
}
