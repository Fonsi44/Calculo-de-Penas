import { NextRequest, NextResponse } from 'next/server';
import { sendAutoReplyEmail, getNotificationEmail, getClient } from '@/lib/email';
import { verifyResendWebhook } from '@/lib/webhook-verify';

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

/**
 * Escapa caracteres HTML para evitar inyección (XSS) en el cliente de correo
 * que visualiza el reenvío. Los datos de `from`/`subject`/`to` provienen del
 * exterior y NO son de confianza.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  // --- Verificación de firma del webhook de Resend (Svix) ---
  // El webhook recibe correos reales y dispara auto-respuestas + reenvíos al
  // buzón interno. Sin verificación de firma, cualquiera podría forjar POSTs y
  // generar spam o inyectar contenido en el correo reenviado.
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (webhookSecret) {
    // Necesitamos el cuerpo crudo para verificar la firma (el body ya parseado
    // no sirve porque la firma cubre los bytes exactos).
    const rawBody = await request.text();
    const result = verifyResendWebhook(rawBody, Object.fromEntries(request.headers), webhookSecret);
    if (!result.ok) {
      console.warn('[email/inbound] Webhook rechazado:', result.reason);
      // 401, no 200: indicamos claramente que la verificación falló. No damos
      // pistas extra al atacante más allá del hecho de que fue rechazado.
      return NextResponse.json({ error: 'Webhook no verificado' }, { status: 401 });
    }
    // Reparsear el body ya verificado.
    let event: ResendEmailReceived;
    try {
      event = JSON.parse(rawBody) as ResendEmailReceived;
    } catch {
      console.warn('[email/inbound] Body no es JSON válido tras verificación');
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    return processEvent(event);
  }

  // Si NO hay RESEND_WEBHOOK_SECRET configurado:
  // - En producción, rechazar por seguridad (no procesar webhooks sin firma).
  // - En desarrollo/test, permitir (para pruebas locales) con un aviso claro.
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

    // Reenviar el correo original al destinatario de notificaciones.
    // El HTML externo NO se inserta: se transforma a texto y se escapa para
    // evitar scripts, trackers e imágenes remotas en el cliente interno.
    const client = getClient();
    if (client && fromEmail) {
      const notificationTo = getNotificationEmail();
      if (!notificationTo) {
        console.error('[email/inbound] CONTACT_NOTIFICATION_EMAIL no configurado; reenvío omitido.');
        return NextResponse.json({ ok: false }, { status: 503 });
      }
      const textBody = data.text || data.html?.replace(/<[^>]+>/g, '') || '(sin contenido)';

      try {
        const { data: fwdData, error: fwdError } = await client.emails.send({
          from: `Reenviado — Pineda y Asociados <no-reply@pinedayasociadoshn.com>`,
          to: [notificationTo],
          replyTo: fromEmail,
          subject: `[Reenviado] ${data.subject || 'Sin asunto'} — ${fromEmail}`,
          html: `
            <h2>Correo reenviado desde ${escapeHtml(fromEmail)}</h2>
            <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>De</strong></td><td>${escapeHtml(data.from)}</td></tr>
              <tr><td><strong>Para</strong></td><td>${escapeHtml(data.to.join(', '))}</td></tr>
              <tr><td><strong>Asunto</strong></td><td>${escapeHtml(data.subject || 'Sin asunto')}</td></tr>
            </table>
            <hr/>
            <div style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(textBody)}</div>
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
