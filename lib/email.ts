import { Resend } from 'resend';
import { formatHondurasDateTime } from '@/lib/datetime';

let _client: Resend | null = null;

export function getClient(): Resend | null {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _client = new Resend(apiKey);
  return _client;
}

const VERIFIED_DOMAIN = 'pinedayasociadoshn.com';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? `no-reply@${VERIFIED_DOMAIN}`;
}

export function getNotificationEmail(): string {
  return process.env.CONTACT_NOTIFICATION_EMAIL ?? 'alfonsroiget@gmail.com';
}

export function getFromName(): string {
  return 'Pineda y Asociados';
}

export interface ContactEmailPayload {
  nombre: string;
  telefono: string;
  email: string | null;
  asunto: string;
  mensaje: string;
  ip?: string;
  userAgent?: string;
  submittedAt: Date;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<SendResult> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const to = getNotificationEmail();
  const from = getFromAddress();
  const replyTo = payload.email && payload.email.length > 0 ? payload.email : undefined;
  const subject = `[Web] ${payload.asunto} — ${payload.nombre}`;
  const fechaLocal = formatHondurasDateTime(payload.submittedAt, { dateStyle: 'long', timeStyle: 'short' });

  const html = `
    <h2>Nuevo mensaje desde el formulario de contacto</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td><strong>Nombre</strong></td><td>${escapeHtml(payload.nombre)}</td></tr>
      <tr><td><strong>Teléfono</strong></td><td>${escapeHtml(payload.telefono)}</td></tr>
      <tr><td><strong>Correo</strong></td><td>${escapeHtml(payload.email ?? '—')}</td></tr>
      <tr><td><strong>Asunto</strong></td><td>${escapeHtml(payload.asunto)}</td></tr>
      <tr><td><strong>Fecha (Honduras)</strong></td><td>${escapeHtml(fechaLocal)}</td></tr>
    </table>
    <h3>Mensaje</h3>
    <p style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;">${escapeHtml(payload.mensaje)}</p>
    <hr />
    <p style="font-size:12px;color:#666;">
      IP: ${escapeHtml(payload.ip ?? 'desconocida')}<br />
      UA: ${escapeHtml(payload.userAgent ?? 'desconocido')}<br />
      ISO: ${payload.submittedAt.toISOString()}
    </p>
  `.trim();

  const text = [
    'Nuevo mensaje desde el formulario de contacto',
    '',
    `Nombre: ${payload.nombre}`,
    `Teléfono: ${payload.telefono}`,
    `Correo: ${payload.email ?? '—'}`,
    `Asunto: ${payload.asunto}`,
    `Fecha (Honduras): ${fechaLocal}`,
    '',
    'Mensaje:',
    payload.mensaje,
    '',
    '---',
    `IP: ${payload.ip ?? 'desconocida'}`,
    `UA: ${payload.userAgent ?? 'desconocido'}`,
  ].join('\n');

  const fromName = getFromName();

  try {
    const { data, error } = await client.emails.send({
      from: `${fromName} <${from}>`,
      to: [to],
      replyTo,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] sendContactEmail error de API:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('[email] sendContactEmail excepción:', msg);
    return { ok: false, error: msg };
  }
}

export interface ConsultaEmailPayload {
  nombre: string;
  telefono: string;
  email: string | null;
  motivo: string;
  resumen: string;
  ip?: string;
  userAgent?: string;
  submittedAt: Date;
}

export async function sendConsultaEmail(payload: ConsultaEmailPayload): Promise<SendResult> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const to = getNotificationEmail();
  const from = getFromAddress();
  const replyTo = payload.email && payload.email.length > 0 ? payload.email : undefined;
  const subject = `[Solicitud de consulta] ${payload.motivo} — ${payload.nombre}`;
  const fechaLocal = formatHondurasDateTime(payload.submittedAt, { dateStyle: 'long', timeStyle: 'short' });

  const html = `
    <h2>Nueva solicitud de consulta desde la web</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td><strong>Nombre</strong></td><td>${escapeHtml(payload.nombre)}</td></tr>
      <tr><td><strong>Teléfono</strong></td><td>${escapeHtml(payload.telefono)}</td></tr>
      <tr><td><strong>Correo</strong></td><td>${escapeHtml(payload.email ?? '—')}</td></tr>
      <tr><td><strong>Motivo</strong></td><td>${escapeHtml(payload.motivo)}</td></tr>
      <tr><td><strong>Fecha (Honduras)</strong></td><td>${escapeHtml(fechaLocal)}</td></tr>
    </table>
    <h3>Resumen de la situación</h3>
    <p style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;">${escapeHtml(payload.resumen)}</p>
    <hr />
    <p style="font-size:12px;color:#666;">
      IP: ${escapeHtml(payload.ip ?? 'desconocida')}<br />
      UA: ${escapeHtml(payload.userAgent ?? 'desconocido')}<br />
      ISO: ${payload.submittedAt.toISOString()}
    </p>
  `.trim();

  const text = [
    'Nueva solicitud de consulta desde la web',
    '',
    `Nombre: ${payload.nombre}`,
    `Teléfono: ${payload.telefono}`,
    `Correo: ${payload.email ?? '—'}`,
    `Motivo: ${payload.motivo}`,
    `Fecha (Honduras): ${fechaLocal}`,
    '',
    'Resumen:',
    payload.resumen,
    '',
    '---',
    `IP: ${payload.ip ?? 'desconocida'}`,
    `UA: ${payload.userAgent ?? 'desconocido'}`,
  ].join('\n');

  const fromName = getFromName();

  try {
    const { data, error } = await client.emails.send({
      from: `${fromName} <${from}>`,
      to: [to],
      replyTo,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] sendConsultaEmail error de API:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('[email] sendConsultaEmail excepción:', msg);
    return { ok: false, error: msg };
  }
}

export function getAutoReplyFromAddress(): string {
  return `contacto@${VERIFIED_DOMAIN}`;
}

export function getAutoReplyFromName(): string {
  return 'Pineda y Asociados — Contacto';
}

export interface AutoReplyPayload {
  nombre: string;
  email: string;
  tipo: 'contacto' | 'consulta';
  motivo?: string;
  asunto?: string;
}

export async function sendAutoReplyEmail(payload: AutoReplyPayload): Promise<SendResult> {
  if (!payload.email) {
    return { ok: false, error: 'Sin email de destinatario' };
  }
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const from = getAutoReplyFromAddress();
  const fromName = getAutoReplyFromName();
  const subject = 'Hemos recibido su solicitud — Pineda y Asociados';

  const html = buildAutoReplyHtml(payload);
  const text = buildAutoReplyText(payload);

  try {
    const { data, error } = await client.emails.send({
      from: `${fromName} <${from}>`,
      to: [payload.email],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] sendAutoReplyEmail error de API:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('[email] sendAutoReplyEmail excepción:', msg);
    return { ok: false, error: msg };
  }
}

function buildAutoReplyHtml(payload: AutoReplyPayload): string {
  const tipoTexto = payload.tipo === 'consulta' ? 'solicitud de consulta' : 'mensaje';
  const detalleExtra = payload.tipo === 'consulta' && payload.motivo
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;"><strong style="color:#5F6368;">Motivo</strong></td><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;color:#1A1C20;">${escapeHtml(payload.motivo)}</td></tr>`
    : payload.tipo === 'contacto' && payload.asunto
      ? `<tr><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;"><strong style="color:#5F6368;">Asunto</strong></td><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;color:#1A1C20;">${escapeHtml(payload.asunto)}</td></tr>`
      : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F8F5;font-family:Manrope,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F8F5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 32px rgba(15,29,58,0.08);">

        <!-- HEADER: Barra navy con acento dorado -->
        <tr>
          <td style="background-color:#0F1D3A;padding:32px 40px 0;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td style="width:44px;height:44px;background-color:#D4AF37;border-radius:8px;text-align:center;vertical-align:middle;box-shadow:0 0 0 1px rgba(154,122,34,0.45),0 4px 10px -2px rgba(212,175,55,0.45);">
                  <span style="font-size:20px;line-height:44px;color:#0F1D3A;">⚖</span>
                </td>
                <td style="padding-left:14px;text-align:left;">
                  <span style="font-size:18px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px;font-family:Cormorant Garamond,Georgia,'Times New Roman',serif;">Pineda y Asociados</span>
                  <br>
                  <span style="font-size:10px;font-weight:600;color:#D4AF37;letter-spacing:4px;text-transform:uppercase;">Bufete multidisciplinario</span>
                </td>
              </tr>
            </table>
            <!-- Línea dorada divisoria -->
            <div style="height:3px;width:56px;background-color:#D4AF37;border-radius:2px;margin:24px auto 0;"></div>
          </td>
        </tr>

        <!-- MAIN CONTENT -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-family:Cormorant Garamond,Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#0F1D3A;letter-spacing:-0.5px;">Hemos recibido su ${tipoTexto}</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#5F6368;">Estimado(a) <strong style="color:#1A1C20;">${escapeHtml(payload.nombre)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#5F6368;">Le confirmamos que hemos recibido correctamente su ${tipoTexto}. En breve, uno de nuestros abogados se pondrá en contacto con usted para dar seguimiento a su caso.</p>

            <!-- RESUMEN DE LO ENVIADO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FCFBF8;border:1px solid #EDEAE3;border-radius:8px;margin-bottom:28px;">
              <tr><td style="padding:16px 20px;border-bottom:1px solid #EDEAE3;"><span style="font-size:12px;font-weight:700;color:#0F1D3A;letter-spacing:3px;text-transform:uppercase;">Resumen de su ${tipoTexto}</span></td></tr>
              <tr><td style="padding:8px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;"><strong style="color:#5F6368;font-size:13px;">Nombre</strong></td><td style="padding:8px 0;border-bottom:1px solid #EDEAE3;color:#1A1C20;font-size:14px;">${escapeHtml(payload.nombre)}</td></tr>
                  ${detalleExtra}
                </table>
              </td></tr>
            </table>

            <!-- PRÓXIMOS PASOS -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="padding:20px;background-color:#F3F1EB;border-radius:8px;border-left:4px solid #D4AF37;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0F1D3A;">⏳ Próximos pasos</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#5F6368;">Un abogado de nuestro equipo revisará su caso y le contactará durante nuestro horario de atención para programar una consulta personalizada.</p>
              </td></tr>
            </table>

            <!-- EMERGENCIA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background-color:#FFFFFF;border:2px solid #B22234;border-radius:8px;">
              <tr><td style="padding:20px;text-align:center;">
                <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#B22234;">🔴 ¿Emergencia con detenido o urgencia legal?</p>
                <p style="margin:0 0 16px;font-size:14px;color:#5F6368;line-height:1.5;">Si su situación requiere atención inmediata, contáctenos directamente:</p>
                <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                  <tr>
                    <td style="padding:0 8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr><td style="background-color:#0F1D3A;border-radius:6px;padding:12px 20px;text-align:center;">
                          <a href="tel:+50495363724" style="color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap;">📞 +504 9536-3724</a>
                        </td></tr>
                      </table>
                    </td>
                    <td style="padding:0 8px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr><td style="background-color:#25D366;border-radius:6px;padding:12px 20px;text-align:center;">
                          <a href="https://wa.me/50495363724?text=Hola%2C%20necesito%20asistencia%20legal%20inmediata." style="color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap;">💬 WhatsApp</a>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- DATOS DE CONTACTO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr><td style="padding:16px 20px;background-color:#FCFBF8;border:1px solid #EDEAE3;border-radius:8px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#0F1D3A;letter-spacing:3px;text-transform:uppercase;">Datos del bufete</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:3px 0;font-size:13px;color:#5F6368;vertical-align:top;padding-right:8px;">📍</td><td style="padding:3px 0;font-size:13px;color:#5F6368;">GGJ7+239, Nacaome, Valle, Honduras</td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#5F6368;vertical-align:top;padding-right:8px;">📞</td><td style="padding:3px 0;font-size:13px;color:#5F6368;"><a href="tel:+50495363724" style="color:#0F1D3A;text-decoration:none;">+504 9536-3724</a></td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#5F6368;vertical-align:top;padding-right:8px;">📧</td><td style="padding:3px 0;font-size:13px;color:#5F6368;"><a href="mailto:contacto@pinedayasociadoshn.com" style="color:#0F1D3A;text-decoration:none;">contacto@pinedayasociadoshn.com</a></td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#5F6368;vertical-align:top;padding-right:8px;">🕐</td><td style="padding:3px 0;font-size:13px;color:#5F6368;">Lun–sáb 7:00 – 20:00</td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#0F1D3A;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#8A8F95;line-height:1.5;">
              © ${new Date().getFullYear()} Pineda y Asociados. Todos los derechos reservados.
            </p>
            <p style="margin:0;font-size:11px;color:#5F6368;line-height:1.5;">
              GGJ7+239 · Nacaome, Valle · Honduras<br>
              Este mensaje fue enviado automáticamente al recibir su solicitud a través de nuestro sitio web. Por favor, no responda a este correo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

function buildAutoReplyText(payload: AutoReplyPayload): string {
  const tipoTexto = payload.tipo === 'consulta' ? 'solicitud de consulta' : 'mensaje';
  const lines = [
    `PINEDA Y ASOCIADOS — Bufete multidisciplinario`,
    ``,
    `Hemos recibido su ${tipoTexto}`,
    ``,
    `Estimado(a) ${payload.nombre},`,
    ``,
    `Le confirmamos que hemos recibido correctamente su ${tipoTexto}. En breve, uno de nuestros abogados se pondrá en contacto con usted.`,
    ``,
    `=== ${tipoTexto.toUpperCase()} ===`,
    `Nombre: ${payload.nombre}`,
    payload.tipo === 'consulta' && payload.motivo ? `Motivo: ${payload.motivo}` : null,
    payload.tipo === 'contacto' && payload.asunto ? `Asunto: ${payload.asunto}` : null,
    ``,
    `¿EMERGENCIA? Si su situación requiere atención inmediata:`,
    `Teléfono: +504 9536-3724`,
    `WhatsApp: https://wa.me/50495363724`,
    ``,
    `Datos del bufete:`,
    `Dirección: GGJ7+239, Nacaome, Valle, Honduras`,
    `Teléfono: +504 9536-3724`,
    `Email: contacto@pinedayasociadoshn.com`,
    `Horario: Lun-sáb 7:00 - 20:00`,
    ``,
    `---`,
    `© ${new Date().getFullYear()} Pineda y Asociados`,
    `Este mensaje fue enviado automáticamente.`,
  ].filter(Boolean).join('\n');
  return lines;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
