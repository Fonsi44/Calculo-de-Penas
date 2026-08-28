import { timingSafeEqual } from 'crypto';

/**
 * Verifica API key vía Bearer token o header X-API-Key.
 * Usa comparación en tiempo constante para evitar timing attacks.
 */
export function verifyApiKey(
  request: Request,
  envVarName: string,
): boolean {
  const secret = process.env[envVarName]?.trim();
  if (!secret) return false;

  const auth = request.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerKey = request.headers.get('x-api-key')?.trim() ?? '';
  const candidate = bearer || headerKey;
  if (!candidate) return false;

  if (candidate.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(secret));
  } catch {
    return false;
  }
}

export function apiKeyUnauthorizedResponse(): Response {
  return Response.json({ error: 'No autorizado' }, { status: 401 });
}

export function apiKeyNotConfiguredResponse(): Response {
  return Response.json(
    { error: 'API de corpus legal no configurada (falta LEGAL_CORPUS_API_KEY)' },
    { status: 503 },
  );
}
