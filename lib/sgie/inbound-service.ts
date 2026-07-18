import { db } from '@/lib/db';
import { webhookReceipts, type WebhookReceiptInsert } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyResendWebhook } from '@/lib/webhook-verify';

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

/**
 * Verifica la firma de un webhook de Resend.
 *
 * Delega en `verifyResendWebhook` (Svix Ed25519, implementación canónica en
 * `lib/webhook-verify.ts`). Usa `RESEND_WEBHOOK_SECRET` (variable canónica,
 * documentada en `.env.example`). El nombre `RESEND_SIGNING_SECRET` es un
 * alias obsoleto que se acepta por compatibilidad con configuraciones
 * heredadas, pero NO debe usarse en nuevos despliegues.
 *
 * Seguridad: si no hay secreto configurado, devuelve `false` (fail-closed),
 * a diferencia de la implementación anterior que devolvía `true` (bypass).
 *
 * @param rawBody  Cuerpo crudo del webhook (string).
 * @param headers  Cabeceras HTTP de la petición (con svix-id/timestamp/signature).
 */
export function verificarWebhookResend(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET || process.env.RESEND_SIGNING_SECRET;
  if (!secret) return false;
  const result = verifyResendWebhook(rawBody, headers, secret);
  return result.ok;
}
