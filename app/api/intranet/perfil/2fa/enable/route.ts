/**
 * POST /api/intranet/perfil/2fa/enable
 *
 * Confirma el enrolamiento: valida el primer código TOTP contra el secret
 * pendiente, activa el 2FA y genera/devuelve los códigos de recuperación (se
 * muestran UNA sola vez). CSRF + rate limit + auditoría two_factor_enabled.
 *
 * Sprint 5 — tarea 1.
 */
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { audit, ipFromRequest, uaFromRequest } from '@/lib/audit';
import {
  obtenerSecretCifrado, verificarCodigoTotp, generarCodigosRecuperacion, habilitar2fa,
} from '@/lib/auth-2fa';

const schema = z.object({ codigo: z.string().min(6).max(6) });

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    validateCsrf(request);
    const rl = await rateLimit(`2fa:enable:${auth.userId}`, { keyPrefix: '2fa', windowMs: 60_000, max: 5 });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = schema.parse(await request.json());
    const secretCifrado = await obtenerSecretCifrado(auth.userId);
    if (!secretCifrado) {
      return Response.json({ error: 'No hay enrolamiento pendiente. Inicie el setup primero.' }, { status: 400 });
    }

    if (!verificarCodigoTotp(secretCifrado, parsed.codigo)) {
      return Response.json({ error: 'Código incorrecto. Inténtelo de nuevo.' }, { status: 400 });
    }

    const codigos = generarCodigosRecuperacion();
    await habilitar2fa(auth.userId, codigos);

    await audit({
      accion: 'login',
      usuarioId: auth.userId,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      exito: true,
      metadata: { evento: 'two_factor_enabled' },
    });

    // Los códigos se devuelven en plano UNA sola vez. El cliente debe pedir al
    // usuario que los guarde. No se vuelven a mostrar.
    return Response.json({ habilitado: true, codigosRecuperacion: codigos, aviso: 'Guarde estos códigos en un lugar seguro. No se volverán a mostrar.' });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    return authFailureResponse(err);
  }
}
