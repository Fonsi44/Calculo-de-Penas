import { Resend } from 'resend';
import { isStagingEnvironment } from '@/lib/staging-guard';
import {
  resolveStagingRecipients,
  buildStagingSubject,
  buildStagingHtml,
} from '@/lib/email-allowlist';
import { getClient, getFromAddress, getFromName } from '@/lib/email';
import { randomUUID } from 'crypto';

let _client: Resend | null = null;

function getResendClient(): Resend | null {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _client = new Resend(apiKey);
  return _client;
}

export interface StagingEmailPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface StagingEmailResult {
  ok: boolean;
  id?: string;
  correlationId: string;
  redirected: boolean;
  originalTo: string[];
  error?: string;
}

export async function sendStagingSafeEmail(
  payload: StagingEmailPayload,
): Promise<StagingEmailResult> {
  const correlationId = randomUUID();
  const client = getResendClient();

  if (!client) {
    return {
      ok: false,
      correlationId,
      redirected: false,
      originalTo: payload.to,
      error: 'RESEND_API_KEY no configurada',
    };
  }

  const { redirectedTo, isStaging, stagingTag } = resolveStagingRecipients(payload.to);
  const subject = isStaging ? buildStagingSubject(payload.subject) : payload.subject;
  const html = isStaging ? buildStagingHtml(payload.html, payload.to) : payload.html;
  const fromName = getFromName();
  const from = getFromAddress();

  const tags = [
    ...(payload.tags ?? []),
    { name: 'correlation_id', value: correlationId },
    ...(isStaging ? [{ name: 'environment', value: 'staging' }] : []),
  ];

  try {
    const { data, error } = await client.emails.send({
      from: `${fromName} <${from}>`,
      to: redirectedTo,
      replyTo: payload.replyTo,
      subject,
      html,
      text: payload.text,
      tags,
    });

    if (error) {
      return {
        ok: false,
        correlationId,
        redirected: isStaging,
        originalTo: payload.to,
        error: error.message,
      };
    }

    return {
      ok: true,
      id: data?.id,
      correlationId,
      redirected: isStaging,
      originalTo: payload.to,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return {
      ok: false,
      correlationId,
      redirected: isStaging,
      originalTo: payload.to,
      error: msg,
    };
  }
}
