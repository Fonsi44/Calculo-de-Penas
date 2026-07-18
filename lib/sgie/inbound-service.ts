import { db } from '@/lib/db';
import { webhookReceipts, type WebhookReceiptInsert } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';

export interface InboundPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
  messageId: string;
  references?: string[];
}

export async function procesarInbound(payload: InboundPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const receiptValues: WebhookReceiptInsert = {
      fuente: 'resend_inbound',
      eventType: 'inbound_email',
      payload: payload as unknown as Record<string, unknown>,
      estado: 'received',
    };
    await db.insert(webhookReceipts).values(receiptValues);

    if (!payload.from || !payload.to) {
      await db
        .update(webhookReceipts)
        .set({ estado: 'ignored', error: 'Missing from/to fields' })
        .where(eq(webhookReceipts.eventType, 'inbound_email'));

      return { ok: false, error: 'Missing from/to fields' };
    }

    const subject = payload.subject ?? '';
    const text = payload.text ?? '';

    if (text.toLowerCase().includes('cancelar') || text.toLowerCase().includes('baja')) {
      return procesarBaja(payload);
    }

    if (subject.toLowerCase().includes('re:') || (payload.references && payload.references.length > 0)) {
      return procesarRespuesta(payload);
    }

    await db
      .update(webhookReceipts)
      .set({ estado: 'processed', procesadoEn: new Date() })
      .where(eq(webhookReceipts.eventType, 'inbound_email'));

    return { ok: true };
  } catch (err) {
    const errorMsg = (err as Error).message;
    return { ok: false, error: errorMsg };
  }
}

async function procesarBaja(_payload: InboundPayload): Promise<{ ok: boolean; error?: string }> {
  await db
    .update(webhookReceipts)
    .set({ estado: 'processed', procesadoEn: new Date() })
    .where(eq(webhookReceipts.eventType, 'inbound_email'));

  return { ok: true };
}

async function procesarRespuesta(_payload: InboundPayload): Promise<{ ok: boolean; error?: string }> {
  await db
    .update(webhookReceipts)
    .set({ estado: 'processed', procesadoEn: new Date() })
    .where(eq(webhookReceipts.eventType, 'inbound_email'));

  return { ok: true };
}

export async function verificarWebhookResend(payload: string | Record<string, unknown>, signature: string): Promise<boolean> {
  const signingSecret = process.env.RESEND_SIGNING_SECRET;
  if (!signingSecret) return true;

  // Resend webhook signature verification: HMAC-SHA256 of the raw body
  const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const expectedSignature = createHmac('sha256', signingSecret)
    .update(rawBody)
    .digest('hex');

  if (!signature) return false;

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
