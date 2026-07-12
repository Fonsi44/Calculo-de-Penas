import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { createPreviewToken } from '@/lib/preview-db';
import { sanitizeHtml } from '@/lib/sanitize';

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    validateCsrf(request);

    const body = await request.json();
    const { title, body: contentBody, category, slug, description } = body;
    if (!title || !contentBody) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Sanitize HTML with strict allowlist (lib/sanitize.ts) before storing.
    const sanitizedBody = sanitizeHtml(contentBody);

    const token = await createPreviewToken({
      title: String(title).slice(0, 500),
      body: sanitizedBody,
      category: category || undefined,
      slug: slug || undefined,
      description: description || undefined,
      createdBy: auth.userId,
    });

    return NextResponse.json({ token, url: `/preview/${token}` });
  } catch (err) {
    return authFailureResponse(err);
  }
}
