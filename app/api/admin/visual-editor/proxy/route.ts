import { NextRequest } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { getPageContent, getPageLayout, getPageVisibility, getPageMeta } from '@/lib/page-content-db';
import { generateEditorScript } from '@/lib/visual-editor/script';
import { EDITOR_CSS } from '@/lib/visual-editor/styles';

const PAGE_ROUTES: Record<string, string> = {
  home: '/',
  despacho: '/despacho',
  'solicitar-consulta': '/solicitar-consulta',
  'como-llegar': '/como-llegar',
  terminos: '/terminos',
  'aviso-legal': '/aviso-legal',
  'politica-privacidad': '/politica-privacidad',
  'politica-cookies': '/politica-cookies',
  disclaimer: '/disclaimer',
  'servicios-juridicos': '/servicios-juridicos',
  'derecho-penal': '/derecho-penal',
  'hondurenos-en-espana': '/hondurenos-en-espana',
};

function buildCandidateUrls(request: NextRequest, publicPath: string): string[] {
  const urls: string[] = [];
  const host = request.headers.get('host');

  if (host) {
    const protocol = process.env.VERCEL ? 'https' : 'http';
    urls.push(`${protocol}://${host}${publicPath}`);
  }

  try {
    const reqUrl = new URL(request.url);
    urls.push(`${reqUrl.protocol}//${reqUrl.host}${publicPath}`);
  } catch {}

  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.replace(/^https?:\/\//, '');
    const vUrl = `https://${vercelUrl}${publicPath}`;
    if (!urls.includes(vUrl)) urls.push(vUrl);
  }

  return urls;
}

async function fetchOne(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes('</body>')) return null;
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryFetchPage(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const html = await fetchOne(url, 5000);
    if (html) return html;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  if (!page || !PAGE_ROUTES[page]) {
    return new Response('Page not found', { status: 404 });
  }

  const publicPath = PAGE_ROUTES[page];

  // Load all editor data in parallel
  let contentMap: Record<string, string> = {};
  let layout: string[] = [];
  let visibility: Record<string, boolean> = {};
  let meta = { status: 'published' as string };

  try {
    const [cm, lo, vi, me] = await Promise.all([
      getPageContent(page, { includeUnpublished: true }),
      getPageLayout(page),
      getPageVisibility(page),
      getPageMeta(page),
    ]);
    contentMap = cm;
    layout = lo;
    visibility = vi;
    meta = { status: me.status };
  } catch {}

  const candidateUrls = buildCandidateUrls(request, publicPath);
  const rawHtml = await tryFetchPage(candidateUrls);

  const script = generateEditorScript(contentMap, page, { layout, visibility, status: meta.status });

  if (rawHtml) {
    const modified = rawHtml
      .replace('</head>', `<style id="ve-styles">${EDITOR_CSS}</style></head>`)
      .replace('</body>', `<script id="ve-script">${script}</script></body>`);
    return new Response(modified, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Fallback: build a simple editor page
  const entries = Object.entries(contentMap)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => {
      const lastDot = key.lastIndexOf('.');
      const section = lastDot >= 0 ? key.substring(0, lastDot) : key;
      const field = lastDot >= 0 ? key.substring(lastDot + 1) : key;
      const isRichtext = value.includes('<');
      const attr = `data-section="${section}" data-field="${field}" data-page="${page}"`;
      const cls = `ve-el${isRichtext ? ' ve-richtext' : ''}`;
      if (isRichtext) {
        return `<div ${attr} class="${cls}" data-richtext="true">${value}</div>`;
      }
      return `<div ${attr} class="${cls}">${value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    })
    .join('\n');

  return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:system-ui;padding:2rem;max-width:820px;margin:0 auto;line-height:1.6;color:#333;background:#fafafa}.ve-el{margin:0.5rem 0;padding:0.25rem 0.5rem;border-radius:4px;min-height:1em;transition:background .15s}.ve-el[data-richtext=true]{min-height:3em;line-height:1.7}</style>
<style id="ve-styles">${EDITOR_CSS}</style>
</head><body class="ve-active">${entries}<script id="ve-script">${script}</script></body></html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
