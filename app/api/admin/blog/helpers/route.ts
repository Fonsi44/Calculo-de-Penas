import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { extractTags } from '@/lib/blog-helpers';
import { validateCsrf } from '@/lib/csrf';

const helperSchema = z.object({
  action: z.enum(['tags']),
  title: z.string().optional(),
  description: z.string().optional(),
  body: z.string(),
  category: z.string(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
    const body = await request.json();
    const parsed = helperSchema.parse(body);

    if (parsed.action === 'tags') {
      const tags = extractTags(
        parsed.title ?? '',
        parsed.description ?? '',
        parsed.body,
        parsed.category,
      );
      return Response.json({ tags });
    }

    return Response.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
