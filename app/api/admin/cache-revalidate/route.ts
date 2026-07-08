import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { CACHE_TAGS } from '@/lib/cache-dashboard';
import { validateCsrf } from '@/lib/csrf';

const VALID_TAGS: ReadonlySet<string> = new Set(Object.values(CACHE_TAGS));

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    validateCsrf(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  try {
    const body = await request.json();
    const { tags } = body as { tags?: string[] };

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ success: false, message: 'Se requiere un array de tags' }, { status: 400 });
    }

    const invalid = tags.filter((t) => !VALID_TAGS.has(t));
    if (invalid.length > 0) {
      return NextResponse.json({ success: false, message: `Tags inválidos: ${invalid.join(', ')}`, validTags: Array.from(VALID_TAGS) }, { status: 400 });
    }

    for (const tag of tags) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (revalidateTag as any)(tag);
    }

    return NextResponse.json({ success: true, revalidated: tags, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: false, message: 'Body inválido' }, { status: 400 });
  }
}
