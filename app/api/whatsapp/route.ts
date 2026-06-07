import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (value?.messages?.[0]) {
    const msg = value.messages[0];
    console.log('[WhatsApp] Mensaje recibido:', JSON.stringify(msg));
  }

  return NextResponse.json({ ok: true });
}
