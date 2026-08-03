import { randomUUID } from 'node:crypto';

export const PUBLIC_FORM_EVENTS = [
  'consulta_received',
  'consulta_validation_failed',
  'consulta_captcha_failed',
  'consulta_rate_limited',
  'consulta_db_saved',
  'consulta_db_failed',
  'consulta_notification_sent',
  'consulta_notification_failed',
  'consulta_autoreply_sent',
  'consulta_autoreply_failed',
  'consulta_completed',
  'contacto_received',
  'contacto_validation_failed',
  'contacto_captcha_failed',
  'contacto_rate_limited',
  'contacto_notification_sent',
  'contacto_notification_failed',
  'contacto_autoreply_sent',
  'contacto_autoreply_failed',
  'contacto_completed',
  'email_inbound_received',
  'email_inbound_ignored',
  'email_inbound_forwarded',
  'email_inbound_failed',
  'whatsapp_webhook_received',
] as const;

type PublicFormEventName = (typeof PUBLIC_FORM_EVENTS)[number];
type PublicFormEnvironment = 'development' | 'preview' | 'production';

export interface PublicFormLogEvent {
  event: PublicFormEventName;
  requestId: string;
  requestPath?: string;
  status?: 'ok' | 'failed' | 'rejected' | 'skipped';
  httpStatus?: number;
  savedId?: string;
  provider?: 'resend' | 'turnstile' | 'neon' | 'whatsapp';
  providerMessageId?: string;
  errorCode?: string;
  durationMs?: number;
  environment?: PublicFormEnvironment;
}

const ALLOWED_FIELDS = new Set<keyof PublicFormLogEvent>([
  'event',
  'requestId',
  'requestPath',
  'status',
  'httpStatus',
  'savedId',
  'provider',
  'providerMessageId',
  'errorCode',
  'durationMs',
  'environment',
]);

const FORBIDDEN_FIELDS = new Set([
  'name', 'nombre', 'email', 'phone', 'telefono', 'resumen', 'summary',
  'message_body', 'localidad', 'fechaAudiencia', 'fechaDespido', 'hayDetencion',
  'residenciaEspana', 'disponibleLlamada', 'ip', 'userAgent', 'turnstileToken',
  'authorization', 'cookie', 'databaseUrl', 'apiKey', 'secret', 'requestBody',
]);

export function createPublicFormRequestId(): string {
  return randomUUID();
}

function environmentName(): PublicFormEnvironment {
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'preview';
  return 'development';
}

function safePath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return path.split('?')[0].slice(0, 160);
}

function safeIdentifier(value: string | undefined, maxLength = 160): string | undefined {
  if (!value) return undefined;
  return /^[A-Za-z0-9_-]+$/.test(value) ? value.slice(0, maxLength) : undefined;
}

export function logPublicFormEvent(input: PublicFormLogEvent): void {
  const source = input as PublicFormLogEvent & Record<string, unknown>;
  const invalidFields = Object.keys(source).filter(
    (key) => FORBIDDEN_FIELDS.has(key) || !ALLOWED_FIELDS.has(key as keyof PublicFormLogEvent),
  );

  if (invalidFields.length > 0 && process.env.NODE_ENV !== 'production') {
    throw new Error(`Unsafe public form log fields: ${invalidFields.join(',')}`);
  }

  const event: PublicFormLogEvent = {
    event: input.event,
    requestId: safeIdentifier(input.requestId, 64) ?? 'invalid-request-id',
    status: input.status,
    httpStatus: input.httpStatus,
    savedId: safeIdentifier(input.savedId),
    provider: input.provider,
    providerMessageId: safeIdentifier(input.providerMessageId),
    errorCode: safeIdentifier(input.errorCode, 80),
    durationMs: input.durationMs,
    requestPath: safePath(input.requestPath),
    environment: input.environment ?? environmentName(),
  };

  const clean = Object.fromEntries(
    Object.entries(event).filter(([, value]) => value !== undefined),
  );
  console.info('[public-form]', clean);
}
