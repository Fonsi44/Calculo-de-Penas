import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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

    return NextResponse.json({
      success: true,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      expires_in: tokens.expiry_date,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: message.slice(0, 500),
    }, { status: 400 });
  }
}
