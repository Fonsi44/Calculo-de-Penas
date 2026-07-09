import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/email';
import { verifyResendWebhook } from '@/lib/webhook-verify';

// ── Config (leídas lazy para permitir stub en tests) ────────────────────
function getAllowedDomain(): string {
  return process.env.INBOUND_ALLOWED_DOMAIN?.trim().toLowerCase() || 'pinedayasociadoshn.com';
}
function getForwardTo(): string {
  return process.env.INBOUND_FORWARD_TO?.trim() || process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || process.env.CONTACT_TO?.trim() || '';
}
function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || process.env.CONTACT_FROM?.trim() || `contacto@${getAllowedDomain()}`;
}

// ── Tipos ────────────────────────────────────────────────────────────────
interface ResendEmailReceived {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc?: string[];
    cc?: string[];
    message_id: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id: string;
    }>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function extractEmailFromHeader(header: string): string {
  const match = header.match(/<([^>]+)>/);
  return match ? match[1] : header;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Lógica principal ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (webhookSecret) {
    const rawBody = await request.text();
    const result = verifyResendWebhook(rawBody, Object.fromEntries(request.headers), webhookSecret);
    if (!result.ok) {
      console.warn('[email/inbound] Webhook rechazado:', result.reason);
      return NextResponse.json({ error: 'Webhook no verificado' }, { status: 401 });
    }
    let event: ResendEmailReceived;
    try {
      event = JSON.parse(rawBody) as ResendEmailReceived;
    } catch {
      console.warn('[email/inbound] Body no es JSON válido tras verificación');
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    return processEvent(event);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[email/inbound] RESEND_WEBHOOK_SECRET no configurado en producción. Webhook rechazado por seguridad.');
    return NextResponse.json(
      { error: 'Webhook no configurado: falta RESEND_WEBHOOK_SECRET' },
      { status: 503 },
    );
  }

  console.warn('[email/inbound] RESEND_WEBHOOK_SECRET no configurado (modo dev). Procesando sin verificar firma.');
  try {
    const event: ResendEmailReceived = await request.json();
    return processEvent(event);
  } catch (e) {
    console.error('[email/inbound] Error procesando webhook:', e instanceof Error ? e.message : 'Error');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function processEvent(event: ResendEmailReceived): Promise<Response> {
  try {
    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true });
    }

    const { data } = event;
    const fromEmail = extractEmailFromHeader(data.from);
    // ── Catch-all: detectar destinatarios del dominio ───────────────────
    // Reunir todos los destinatarios (to, cc, bcc si existen).
    const allRecipients = [
      ...(data.to ?? []),
      ...(data.cc ?? []),
      ...(data.bcc ?? []),
    ].map((r) => extractEmailFromHeader(r));

    // Filtrar solo los que pertenecen al dominio permitido.
    const domainRecipients = allRecipients.filter((r) => {
      const parts = r.split('@');
      return parts.length === 2 && parts[1].toLowerCase() === getAllowedDomain();
    });

    // Si ningún destinatario es del dominio, ignorar silenciosamente.
    if (domainRecipients.length === 0) {
      console.log('[email/inbound] Ignorado: ningún destinatario pertenece a', getAllowedDomain(), allRecipients);
      return NextResponse.json({ ok: true });
    }

    // Usar la primera dirección del dominio como "recibido para".
    const recipientAddress = domainRecipients[0];
    console.log('[email/inbound] Recibido de:', fromEmail, 'para:', recipientAddress, 'Asunto:', data.subject);

    // ── Recuperar contenido completo vía Receiving API ──────────────────
    let fullText = data.text || '';
    let fullHtml = data.html || '';
    let fullAttachments = data.attachments || [];

    if (!fullText && !fullHtml) {
      try {
        const client = getClient();
        if (client) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fullEmail: any = await client.emails.receiving.get(data.email_id);
          if (fullEmail?.data) {
            const raw = fullEmail.data;
            fullText = (raw.text as string) || fullText;
            fullHtml = (raw.html as string) || fullHtml;
            fullAttachments = (raw.attachments as typeof fullAttachments) || fullAttachments;
          }
        }
      } catch (e) {
        console.warn('[email/inbound] No se pudo recuperar cuerpo completo vía Receiving API:', e instanceof Error ? e.message : 'Error');
      }
    }

    const textBody = fullText || fullHtml?.replace(/<[^>]+>/g, '') || '(sin contenido)';

    // ── Reenviar a la bandeja de destino ───────────────────────────────
    const client = getClient();
    if (!client || !fromEmail) {
      console.warn('[email/inbound] Sin cliente Resend o sin remitente; reenvío omitido.');
      return NextResponse.json({ ok: true });
    }

    if (!getForwardTo()) {
      console.error('[email/inbound] INBOUND_getForwardTo() no configurado; reenvío omitido.');
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const subject = `[Pineda Inbound: ${recipientAddress}] ${data.subject || 'Sin asunto'}`;
    const createdDate = data.created_at
      ? new Date(data.created_at).toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })
      : '(fecha no disponible)';

    // Generar listado de adjuntos si existen.
    const attachmentsHtml = fullAttachments.length > 0
      ? `<tr><td colspan="2" style="padding:8px 0;"><strong>Adjuntos (${fullAttachments.length}):</strong></td></tr>${fullAttachments.map((a) =>
        `<tr><td style="padding:2px 0 2px 16px;font-size:13px;">📎</td><td style="padding:2px 0;font-size:13px;">${escapeHtml(a.filename)} (${escapeHtml(a.content_type)})</td></tr>`
      ).join('')}`
      : '';

    const attachmentsText = fullAttachments.length > 0
      ? `\nAdjuntos (${fullAttachments.length}):\n${fullAttachments.map((a) => `  📎 ${a.filename} (${a.content_type})`).join('\n')}`
      : '';

    try {
      const { data: fwdData, error: fwdError } = await client.emails.send({
        from: `Pineda y Asociados <${getFromAddress()}>`,
        to: [getForwardTo()],
        replyTo: fromEmail,
        subject,
        html: `
          <h2>Correo recibido para: ${escapeHtml(recipientAddress)}</h2>
          <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
            <tr><td><strong>Recibido para</strong></td><td>${escapeHtml(recipientAddress)}</td></tr>
            <tr><td><strong>De</strong></td><td>${escapeHtml(data.from)}</td></tr>
            <tr><td><strong>Para</strong></td><td>${escapeHtml(allRecipients.join(', '))}</td></tr>
            <tr><td><strong>Asunto</strong></td><td>${escapeHtml(data.subject || 'Sin asunto')}</td></tr>
            <tr><td><strong>Fecha</strong></td><td>${escapeHtml(createdDate)}</td></tr>
            ${attachmentsHtml}
          </table>
          <hr/>
          <div style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(textBody)}</div>
        `,
        text: [
          `Correo recibido para: ${recipientAddress}`,
          `Recibido para: ${recipientAddress}`,
          `De: ${data.from}`,
          `Para: ${allRecipients.join(', ')}`,
          `Asunto: ${data.subject || 'Sin asunto'}`,
          `Fecha: ${createdDate}`,
          attachmentsText,
          '',
          textBody,
        ].join('\n'),
      });

      if (fwdError) {
        console.error('[email/inbound] Error al reenviar:', fwdError);
      } else {
        console.log('[email/inbound] Correo reenviado a:', getForwardTo(), 'ID:', fwdData?.id);
      }
    } catch (e) {
      console.error('[email/inbound] Excepción reenviando:', e instanceof Error ? e.message : 'Error');
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[email/inbound] Error procesando webhook:', e instanceof Error ? e.message : 'Error');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
