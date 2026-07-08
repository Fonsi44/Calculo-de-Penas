/**
 * Verificación server-side de Cloudflare Turnstile para formularios públicos.
 *
 * Comportamiento por entorno:
 *  - Si `TURNSTILE_SECRET_KEY` Y `TURNSTILE_SITE_KEY` están definidos → valida
 *    el token del cliente contra siteverify.
 *  - Si falta alguna clave en producción → fail-closed (`false`).
 *  - Si falta alguna clave en desarrollo/test → bypass local para no bloquear
 *    pruebas ni flujos de desarrollo.
 *
 * Variables de entorno (.env.example):
 *  - TURNSTILE_SITE_KEY        (server-side check + referencia)
 *  - TURNSTILE_SECRET_KEY      (siempre server-side, NUNCA expuesta al cliente)
 *  - NEXT_PUBLIC_TURNSTILE_SITE_KEY  (la que lee el widget en cliente)
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isCaptchaEnabled(): boolean {
  return !!(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);
}

/**
 * Verifica un token de Turnstile contra Cloudflare.
 * @param token Token `cf-turnstile-response` enviado por el widget cliente.
 * @param ip IP del cliente (opcional, refuerza la verificación).
 * @returns `true` si el token es válido. En desarrollo/test también devuelve
 *          `true` si faltan claves. En producción, faltan claves = `false`.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip?: string | null,
): Promise<boolean> {
  if (!isCaptchaEnabled()) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[captcha] TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY no configuradas en producción — fail-closed.');
      return false;
    }
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[captcha] TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY no configuradas — bypass solo desarrollo.');
    }
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.append('secret', process.env.TURNSTILE_SECRET_KEY!);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      // siteverify es quick; 5s es suficiente y evita colgar el request.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error('[captcha] siteverify HTTP', res.status);
      // Fail-closed: si Cloudflare no responde 200, rechazamos. Mejor
      // bloquear un envío legítimo que aceptar uno sin verificar.
      return false;
    }

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      console.warn('[captcha] token inválido:', data['error-codes']);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[captcha] error verificando token:', (e as Error).message);
    // Fail-closed en timeout/error de red.
    return false;
  }
}
