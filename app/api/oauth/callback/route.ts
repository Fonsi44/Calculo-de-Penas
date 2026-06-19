import { NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Endpoint de callback OAuth2 de Google.
 *
 * ⚠️  DISEÑO Y RIESGO DOCUMENTADO:
 * Este endpoint está protegido por el proxy de edge (`proxy.ts`): cualquier
 * petición a `/api/oauth/callback` SIN cookie JWT válida recibe 401 antes de
 * llegar aquí (la ruta NO está en `PUBLIC_API_EXACT` ni `PUBLIC_API_PREFIXES`).
 * Es decir, solo un usuario autenticado de la intranet puede invocarlo.
 *
 * El flujo OAuth REAL de obtención de refresh token NO usa este endpoint: usa
 * un servidor localhost propio (`scripts/oauth-get-refresh-token.mjs`) que
 * recibe el callback en http://localhost:3000. Este endpoint existe solo como
 * redirect URI alternativa listada en `scripts/oauth-url.mjs`.
 *
 * Por seguridad, NO devolvemos el `refresh_token` en el cuerpo de la respuesta
 * HTTP (un token que viaja en JSON puede quedar en logs de proxy/gateway).
 * Si en el futuro se necesita obtener el token desde aquí, escribirlo a un
 * almacén seguro server-side y devolver solo `{ success: true }`.
 *
 * Validación de `state`: el flujo actual es manual (un admin genera la URL y
 * la visita). No se implementa `state` CSRF porque no hay sesión de navegador
 * que proteger más allá del token JWT ya exigido por el proxy. Si se convierte
 * en un flujo de navegador interactivo, añadir `state` obligatorio.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Falta code', { status: 400 });
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Faltan credenciales', { status: 500 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/oauth/callback`;

  try {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);

    // Log server-side del éxito (sin imprimir el token). El refresh_token se
    // gestiona desde el script local; aquí solo confirmamos que el intercambio
    // funcionó y exponemos metadatos no sensibles.
    console.log('[oauth/callback] Intercambio de code OK. scopes:', tokens.scope);

    return NextResponse.json({
      success: true,
      scope: tokens.scope,
      // No devolvemos refresh_token ni access_token en el body.
      // expiry_date es metadato no sensible (cuándo expira el access token).
      expires_in: tokens.expiry_date,
      hasRefreshToken: Boolean(tokens.refresh_token),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: message.slice(0, 500),
    }, { status: 400 });
  }
}
