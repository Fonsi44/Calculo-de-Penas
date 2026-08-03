import { consultaSchema, validate } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendConsultaEmail, sendAutoReplyEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { verifyTurnstileToken } from '@/lib/captcha';
import { db } from '@/lib/db';
import { solicitudesConsulta } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import {
  createPublicFormRequestId,
  logPublicFormEvent,
} from '@/lib/safe-public-form-logger';

const CONSULTA_MAX = 10;
const CONSULTA_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_PATH = '/api/consulta';

function errorResponse(
  error: string,
  reference: string,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json({ error, reference }, { status, headers });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = createPublicFormRequestId();
  logPublicFormEvent({ event: 'consulta_received', requestId, requestPath: REQUEST_PATH, status: 'ok' });

  const ip = getClientIp(request);
  const uaFingerprint = request.headers.get('user-agent')?.slice(0, 64) ?? 'unknown';
  const identifier = `${ip}|${uaFingerprint}`;
  const rl = await rateLimit(identifier, {
    keyPrefix: 'consulta',
    windowMs: CONSULTA_WINDOW_MS,
    max: CONSULTA_MAX,
  });
  if (!rl.ok) {
    logPublicFormEvent({
      event: 'consulta_rate_limited',
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
      {
        'Retry-After': String(rl.retryAfterSec),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logPublicFormEvent({
      event: 'consulta_validation_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 400,
      errorCode: 'VALIDATION_ERROR',
    });
    return errorResponse('JSON inválido', requestId, 400);
  }

  const parsed = validate(consultaSchema, body);
  if (!parsed.success) {
    logPublicFormEvent({
      event: 'consulta_validation_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'rejected',
      httpStatus: 400,
      errorCode: 'VALIDATION_ERROR',
    });
    return errorResponse(parsed.error, requestId, 400);
  }

  const extras: string[] = [];
  const d = parsed.data;
  if (d.medioPreferido) {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      telefono: 'Teléfono',
      email: 'Correo',
      llamada: 'Llamada programada',
    };
    extras.push(`Medio preferido: ${labels[d.medioPreferido] ?? d.medioPreferido}`);
  }
  if (d.localidad) extras.push(`Localidad/país: ${d.localidad}`);
  if (d.urgencia) {
    const labels: Record<string, string> = { normal: 'Normal', alta: 'Alta', penal: 'Urgencia penal' };
    extras.push(`Urgencia: ${labels[d.urgencia] ?? d.urgencia}`);
  }
  if (d.fechaAudiencia) extras.push(`Fecha audiencia/citación: ${d.fechaAudiencia}`);
  if (d.hayDetencion) extras.push(`¿Hay detención?: ${d.hayDetencion === 'si' ? 'Sí' : 'No'}`);
  if (d.fechaDespido) extras.push(`Fecha de despido: ${d.fechaDespido}`);
  if (d.residenciaEspana) extras.push(`Reside en España: ${d.residenciaEspana === 'si' ? 'Sí' : 'No'}`);
  if (d.disponibleLlamada) extras.push(`Disponible para llamada: ${d.disponibleLlamada === 'si' ? 'Sí' : 'No'}`);
  const resumenCompleto = extras.length > 0
    ? `${d.resumen}\n\n— Datos del formulario —\n${extras.join('\n')}`
    : d.resumen;

  const turnstileOk = await verifyTurnstileToken(
    (body as Record<string, unknown>)['cf-turnstile-response'] as string | undefined,
    ip,
  );
  if (!turnstileOk) {
    logPublicFormEvent({
      event: 'consulta_captcha_failed',
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

  let savedId: string | undefined;
  try {
    const insertResult = await db.insert(solicitudesConsulta).values({
      nombre: d.nombre,
      telefono: d.telefono,
      email: d.email ?? null,
      motivo: d.motivo,
      resumen: resumenCompleto,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      emailStatus: 'pending',
    }).returning({ id: solicitudesConsulta.id });
    savedId = insertResult[0]?.id;
  } catch {
    logPublicFormEvent({
      event: 'consulta_db_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'failed',
      httpStatus: 500,
      provider: 'neon',
      errorCode: 'DATABASE_WRITE_FAILED',
    });
    return errorResponse('No se pudo procesar la solicitud. Inténtelo de nuevo.', requestId, 500);
  }

  if (!savedId) {
    logPublicFormEvent({
      event: 'consulta_db_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'failed',
      httpStatus: 500,
      provider: 'neon',
      errorCode: 'DATABASE_WRITE_FAILED',
    });
    return errorResponse('No se pudo procesar la solicitud. Inténtelo de nuevo.', requestId, 500);
  }
  logPublicFormEvent({
    event: 'consulta_db_saved',
    requestId,
    requestPath: REQUEST_PATH,
    status: 'ok',
    savedId,
  });

  let emailOk = true;
  if (isEmailConfigured()) {
    try {
      const result = await sendConsultaEmail({
        nombre: d.nombre,
        telefono: d.telefono,
        email: d.email ?? null,
        motivo: d.motivo,
        resumen: resumenCompleto,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        submittedAt: new Date(),
      });
      if (result.ok) {
        await db.update(solicitudesConsulta)
          .set({ emailStatus: 'sent', emailId: result.id })
          .where(eq(solicitudesConsulta.id, savedId));
        logPublicFormEvent({
          event: 'consulta_notification_sent',
          requestId,
          requestPath: REQUEST_PATH,
          status: 'ok',
          provider: 'resend',
          providerMessageId: result.id,
          savedId,
        });
      } else {
        emailOk = false;
        await db.update(solicitudesConsulta)
          .set({ emailStatus: 'failed', emailError: result.errorCode })
          .where(eq(solicitudesConsulta.id, savedId));
        logPublicFormEvent({
          event: 'consulta_notification_failed',
          requestId,
          requestPath: REQUEST_PATH,
          status: 'failed',
          provider: 'resend',
          errorCode: result.errorCode ?? 'NOTIFICATION_FAILED',
          savedId,
        });
      }
    } catch {
      emailOk = false;
      await db.update(solicitudesConsulta)
        .set({ emailStatus: 'failed', emailError: 'NOTIFICATION_FAILED' })
        .where(eq(solicitudesConsulta.id, savedId));
      logPublicFormEvent({
        event: 'consulta_notification_failed',
        requestId,
        requestPath: REQUEST_PATH,
        status: 'failed',
        provider: 'resend',
        errorCode: 'NOTIFICATION_FAILED',
        savedId,
      });
    }
  } else {
    emailOk = false;
    await db.update(solicitudesConsulta)
      .set({ emailStatus: 'skipped', emailError: 'EMAIL_NOT_CONFIGURED' })
      .where(eq(solicitudesConsulta.id, savedId));
    logPublicFormEvent({
      event: 'consulta_notification_failed',
      requestId,
      requestPath: REQUEST_PATH,
      status: 'skipped',
      provider: 'resend',
      errorCode: 'EMAIL_NOT_CONFIGURED',
      savedId,
    });
  }

  if (d.email) {
    try {
      const autoResult = await sendAutoReplyEmail({
        nombre: d.nombre,
        email: d.email,
        tipo: 'consulta',
        motivo: d.motivo,
      });
      logPublicFormEvent({
        event: autoResult.ok ? 'consulta_autoreply_sent' : 'consulta_autoreply_failed',
        requestId,
        requestPath: REQUEST_PATH,
        status: autoResult.ok ? 'ok' : 'failed',
        provider: 'resend',
        providerMessageId: autoResult.ok ? autoResult.id : undefined,
        errorCode: autoResult.ok ? undefined : (autoResult.errorCode ?? 'NOTIFICATION_FAILED'),
        savedId,
      });
    } catch {
      logPublicFormEvent({
        event: 'consulta_autoreply_failed',
        requestId,
        requestPath: REQUEST_PATH,
        status: 'failed',
        provider: 'resend',
        errorCode: 'NOTIFICATION_FAILED',
        savedId,
      });
    }
  }

  logPublicFormEvent({
    event: 'consulta_completed',
    requestId,
    requestPath: REQUEST_PATH,
    status: 'ok',
    httpStatus: 200,
    savedId,
    durationMs: Date.now() - startedAt,
  });
  return Response.json({
    ok: true,
    id: savedId,
    reference: requestId,
    email: emailOk ? 'sent' : 'failed',
  });
}
