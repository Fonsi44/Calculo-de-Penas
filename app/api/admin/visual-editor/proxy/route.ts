import { NextRequest } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { getPageContent } from '@/lib/page-content-db';
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

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

  const pageUrl = `${baseUrl}${publicPath}`;

  let html: string;
  try {
    const res = await fetch(pageUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      return new Response(`Error fetching page: ${res.status}`, { status: 502 });
    }
    html = await res.text();
  } catch {
    return new Response('Could not fetch page. Ensure the server is running.', { status: 502 });
  }

  const contentMap = await getPageContent(page);

  html = html.replace(
    '</head>',
    `<style id="ve-styles">${EDITOR_CSS}</style></head>`
  );

  const script = generateEditorScript(contentMap, page);
  html = html.replace(
    '</body>',
    `<script id="ve-script">${script}</script></body>`
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
