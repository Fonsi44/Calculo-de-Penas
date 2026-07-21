import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { generatePackagePreview, signaturePackageErrorResponse } from '@/lib/sgie/signature-package-service';

const previewSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(30),
  titulo: z.string().min(3).max(300),
  proposito: z.string().optional(),
  signers: z
    .array(
      z.object({
        nombre: z.string().min(1),
        email: z.string().email().optional(),
        identificador: z.string().optional(),
        rolDocumento: z.string().min(1),
        orden: z.number().int().min(0).optional(),
        obligatorio: z.boolean().optional(),
        metodoFuturo: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const { id: expedienteId } = await params;
    const rl = await rateLimit(`sgie:sp:preview:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = previewSchema.parse(await req.json());
    const result = await generatePackagePreview(
      { expedienteId, documentIds: body.documentIds, titulo: body.titulo, proposito: body.proposito, signers: body.signers },
      { actorId: auth.userId },
    );
    return Response.json(result);
  } catch (e) {
    return signaturePackageErrorResponse(e);
  }
}
