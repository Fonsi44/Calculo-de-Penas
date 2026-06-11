import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import jwt from 'jsonwebtoken';

const PREVIEW_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production-min-32-chars-AAAAA';
const PREVIEW_EXPIRY = '1h';

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);

    const body = await request.json();
    const { title, body: contentBody, category, slug, description } = body;
    if (!title || !contentBody) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const token = jwt.sign(
      {
        type: 'preview',
        title,
        body: contentBody,
        category: category || 'derecho-penal',
        slug: slug || 'preview',
        description: description || '',
        createdBy: auth.userId,
      },
      PREVIEW_SECRET,
      { expiresIn: PREVIEW_EXPIRY },
    );

    return NextResponse.json({ token, url: `/preview/${token}` });
  } catch (err) {
    return authFailureResponse(err);
  }
}
