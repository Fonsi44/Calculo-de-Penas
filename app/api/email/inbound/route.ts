import { NextRequest, NextResponse } from 'next/server';
import { sendAutoReplyEmail, getNotificationEmail, getClient } from '@/lib/email';

interface ResendEmailReceived {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc: string[];
    cc: string[];
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

function extractEmailFromHeader(header: string): string {
  const match = header.match(/<([^>]+)>/);
  return match ? match[1] : header;
}

function extractNameFromHeader(header: string): string {
  const match = header.match(/^([^<]+)</);
  return match ? match[1].trim().replace(/"/g, '') : '';
}

export async function POST(request: NextRequest) {
  try {
    const event: ResendEmailReceived = await request.json();

    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true });
    }

    const { data } = event;
    const fromEmail = extractEmailFromHeader(data.from);
    const fromName = extractNameFromHeader(data.from) || fromEmail;

    console.log('[email/inbound] Recibido de:', fromEmail, 'Asunto:', data.subject);

    // Enviar auto-respuesta
    const autoResult = await sendAutoReplyEmail({
      nombre: fromName,
      email: fromEmail,
      tipo: 'contacto',
      asunto: data.subject,
    });

    if (autoResult.ok) {
      console.log('[email/inbound] Auto-respuesta enviada a:', fromEmail, 'ID:', autoResult.id);
    } else {
      console.warn('[email/inbound] Auto-respuesta falló:', autoResult.error);
    }

    // Reenviar el correo original al destinatario de notificaciones
    const client = getClient();
    if (client && fromEmail) {
      const notificationTo = getNotificationEmail();
      const textBody = data.text || data.html?.replace(/<[^>]+>/g, '') || '(sin contenido)';

      try {
        const { data: fwdData, error: fwdError } = await client.emails.send({
          from: `Reenviado — Pineda y Asociados <no-reply@pinedayasociadoshn.com>`,
          to: [notificationTo],
          replyTo: fromEmail,
          subject: `[Reenviado] ${data.subject || 'Sin asunto'} — ${fromEmail}`,
          html: `
            <h2>Correo reenviado desde ${fromEmail}</h2>
            <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>De</strong></td><td>${data.from}</td></tr>
              <tr><td><strong>Para</strong></td><td>${data.to.join(', ')}</td></tr>
              <tr><td><strong>Asunto</strong></td><td>${data.subject || 'Sin asunto'}</td></tr>
            </table>
            <hr/>
            <div style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${data.html || textBody}</div>
          `,
          text: [
            `Correo reenviado desde ${fromEmail}`,
            `De: ${data.from}`,
            `Para: ${data.to.join(', ')}`,
            `Asunto: ${data.subject || 'Sin asunto'}`,
            '',
            textBody,
          ].join('\n'),
        });

        if (fwdError) {
          console.error('[email/inbound] Error al reenviar:', fwdError);
        } else {
          console.log('[email/inbound] Correo reenviado a:', notificationTo, 'ID:', fwdData?.id);
        }
      } catch (e) {
        console.error('[email/inbound] Excepción reenviando:', e instanceof Error ? e.message : 'Error');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[email/inbound] Error procesando webhook:', e instanceof Error ? e.message : 'Error');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
