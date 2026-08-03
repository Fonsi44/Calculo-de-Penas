import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createPublicFormRequestId, logPublicFormEvent } from '@/lib/safe-public-form-logger';

export function verifyWhatsAppSignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const supplied = signature.slice('sha256='.length);
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!/^[a-f0-9]{64}$/i.test(supplied) || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
}

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
  const requestId = createPublicFormRequestId();
  const rawBody = await request.text();
  if (!verifyWhatsAppSignature(
    rawBody,
    request.headers.get('x-hub-signature-256'),
    process.env.WHATSAPP_APP_SECRET,
  )) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  let body: {
    entry?: Array<{ changes?: Array<{ value?: { messages?: unknown[] } }> }>;
  };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (value?.messages?.[0]) {
    logPublicFormEvent({
      event: 'whatsapp_webhook_received',
      requestId,
      requestPath: '/api/whatsapp',
      status: 'ok',
      provider: 'whatsapp',
    });
  }

  return NextResponse.json({ ok: true });
}
