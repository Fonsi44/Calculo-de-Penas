import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { inspectUrl, isSearchConsoleConfigured } from '@/lib/google';
import { validateCsrf } from '@/lib/csrf';

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    validateCsrf(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  if (!isSearchConsoleConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'Google Search Console no está configurado',
    });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere una URL válida' },
        { status: 400 },
      );
    }

    const result = await inspectUrl(url);
    return NextResponse.json({ configured: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { configured: true, error: message },
      { status: 500 },
    );
  }
}
