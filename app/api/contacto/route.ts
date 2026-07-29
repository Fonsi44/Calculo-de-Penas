import { contactoSchema, validate } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendContactEmail, sendAutoReplyEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { verifyTurnstileToken } from '@/lib/captcha';
import {
  createPublicFormRequestId,
  logPublicFormEvent,
} from '@/lib/safe-public-form-logger';

const CONTACTO_MAX = 10;
const CONTACTO_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_PATH = '/api/contacto';

function errorResponse(error: string, reference: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error, reference }, { status, headers });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = createPublicFormRequestId();
  logPublicFormEvent({ event: 'contacto_received', requestId, requestPath: REQUEST_PATH, status: 'ok' });

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, {
    keyPrefix: 'contacto',
    windowMs: CONTACTO_WINDOW_MS,
    max: CONTACTO_MAX,
  });
  if (!rl.ok) {
    logPublicFormEvent({
      event: 'contacto_rate_limited',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 429,
      errorCode: 'RATE_LIMITED',
    });
    return errorResponse(
      'Demasiadas solicitudes. Intente de nuevo más tarde.',
      requestId,
      429,
      { 'Retry-After': String(rl.retryAfterSec) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logPublicFormEvent({
      event: 'contacto_validation_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 400,
      errorCode: 'VALIDATION_ERROR',
    });
    return errorResponse('JSON inválido', requestId, 400);
  }

  const parsed = validate(contactoSchema, body);
  if (!parsed.success) {
    logPublicFormEvent({
      event: 'contacto_validation_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 400,
      errorCode: 'VALIDATION_ERROR',
    });
    return errorResponse(parsed.error, requestId, 400);
  }

  const turnstileOk = await verifyTurnstileToken(
    (body as Record<string, unknown>)['cf-turnstile-response'] as string | undefined,
    ip,
  );
  if (!turnstileOk) {
    logPublicFormEvent({
      event: 'contacto_captcha_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 400,
      provider: 'turnstile',
      errorCode: 'CAPTCHA_FAILED',
    });
    return errorResponse(
      'Verificación antispam inválida. Recargue e intente de nuevo.',
      requestId,
      400,
    );
  }

  if (!isEmailConfigured()) {
    logPublicFormEvent({
      event: 'contacto_notification_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'skipped',
      httpStatus: 503,
      provider: 'resend',
      errorCode: 'EMAIL_NOT_CONFIGURED',
    });
    return errorResponse('El servicio de correo no está configurado. Intente más tarde.', requestId, 503);
  }

  let result;
  try {
    result = await sendContactEmail({
      nombre: parsed.data.nombre,
      telefono: parsed.data.telefono,
      email: parsed.data.email ?? null,
      asunto: parsed.data.asunto,
      mensaje: parsed.data.mensaje,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      submittedAt: new Date(),
    });
  } catch {
    result = { ok: false, errorCode: 'EMAIL_PROVIDER_REQUEST_FAILED' } as const;
  }

  if (!result.ok) {
    logPublicFormEvent({
      event: 'contacto_notification_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'failed',
      httpStatus: 502,
      provider: 'resend',
      errorCode: result.errorCode ?? 'NOTIFICATION_FAILED',
    });
    return errorResponse('No se pudo enviar el mensaje. Intente de nuevo más tarde.', requestId, 502);
  }
  logPublicFormEvent({
    event: 'contacto_notification_sent',
    requestId,
    requestPath: REQUEST_PATH,
    status: 'ok',
    provider: 'resend',
    providerMessageId: result.id,
  });

  if (parsed.data.email) {
    try {
      const autoResult = await sendAutoReplyEmail({
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        tipo: 'contacto',
        asunto: parsed.data.asunto,
      });
      logPublicFormEvent({
        event: autoResult.ok ? 'contacto_autoreply_sent' : 'contacto_autoreply_failed',
        requestId,
        requestPath: REQUEST_PATH,
        status: autoResult.ok ? 'ok' : 'failed',
        provider: 'resend',
        providerMessageId: autoResult.ok ? autoResult.id : undefined,
        errorCode: autoResult.ok ? undefined : (autoResult.errorCode ?? 'NOTIFICATION_FAILED'),
      });
    } catch {
      logPublicFormEvent({
        event: 'contacto_autoreply_failed',
        requestId,
        requestPath: REQUEST_PATH,
        status: 'failed',
        provider: 'resend',
        errorCode: 'NOTIFICATION_FAILED',
      });
    }
  }

  logPublicFormEvent({
    event: 'contacto_completed',
    requestId,
    requestPath: REQUEST_PATH,
    status: 'ok',
    httpStatus: 200,
    providerMessageId: result.id,
    durationMs: Date.now() - startedAt,
  });
  return Response.json({ ok: true, id: result.id, reference: requestId });
}
