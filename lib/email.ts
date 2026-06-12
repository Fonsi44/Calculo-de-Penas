import { Resend } from 'resend';
import { formatHondurasDateTime } from '@/lib/datetime';

let _client: Resend | null = null;

function getClient(): Resend | null {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
