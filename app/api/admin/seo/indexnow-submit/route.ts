import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { site } from '@/lib/site';
import { validateCsrf } from '@/lib/csrf';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const key = site.indexNowKey;
  if (!key) {
    return NextResponse.json(
      { error: 'INDEXNOW_KEY no configurada. Define la variable en .env.local o Vercel.' },
      { status: 400 },
    );
  }

  let body: { urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido. Envia { "urls": ["https://..."] }.' }, { status: 400 });
  }

  if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json({ error: 'Se requiere un array de URLs en el campo "urls".' }, { status: 400 });
  }

  if (body.urls.length > 10) {
    return NextResponse.json({ error: 'Maximo 10 URLs por solicitud desde el panel admin.' }, { status: 400 });
  }

  const host = site.url.replace(/^https?:\/\//, '');
  const keyLocation = `${site.url}/${key}.txt`;
  const results: { url: string; status: string; error?: string }[] = [];

  for (const url of body.urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          key,
          keyLocation,
          urlList: [url],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        results.push({ url, status: 'submitted' });
      } else {
        const text = await res.text().catch(() => '');
        results.push({ url, status: 'error', error: `HTTP ${res.status}: ${text.substring(0, 200)}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      results.push({ url, status: 'error', error: msg.substring(0, 200) });
    }
  }

  const submitted = results.filter(r => r.status === 'submitted').length;
  const errors = results.filter(r => r.status === 'error').length;

  return NextResponse.json({
    summary: { submitted, errors, total: results.length },
    results,
    keyLocation,
  });
}
