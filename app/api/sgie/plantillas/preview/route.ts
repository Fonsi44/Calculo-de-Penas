import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import {
  obtenerPlantillaPorSlug,
  interpolarPlantilla,
} from '@/lib/sgie/correos-db';

const previewSchema = z.object({
  plantillaSlug: z.string().min(1).max(100),
  variables: z.record(z.string(), z.string()).default({}),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:plantilla:preview:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);
    const parsed = previewSchema.parse(await request.json());
    const plantilla = await obtenerPlantillaPorSlug(parsed.plantillaSlug);
    if (!plantilla) {
      return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    const { asunto, cuerpoHtml } = interpolarPlantilla(plantilla, parsed.variables as Record<string, string>);
    return Response.json({ asunto, cuerpoHtml, slug: plantilla.slug });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}
