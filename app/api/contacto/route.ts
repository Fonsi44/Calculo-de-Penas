import { contactoSchema, validate } from '@/lib/validation';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { sendContactEmail, sendAutoReplyEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { verifyTurnstileToken } from '@/lib/captcha';

const CONTACTO_MAX = 10;
const CONTACTO_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { keyPrefix: 'contacto', windowMs: CONTACTO_WINDOW_MS, max: CONTACTO_MAX });
  if (!rl.ok) {
    return rateLimitResponse(rl);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = validate(contactoSchema, body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  // Cloudflare Turnstile — bypass seguro si faltan claves (lib/captcha.ts).
  const turnstileOk = await verifyTurnstileToken(
    (body as Record<string, unknown>)['cf-turnstile-response'] as string | undefined,
    ip,
  );
  if (!turnstileOk) {
    return Response.json({ error: 'Verificación antispam inválida. Recargue e intente de nuevo.' }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    console.warn('[contacto] RESEND_API_KEY no configurada; mensaje no enviado', {
      ip,
      nombre: parsed.data.nombre,
    });
    return Response.json(
      { error: 'El servicio de correo no está configurado. Intente más tarde.' },
      { status: 503 },
    );
  }

  const result = await sendContactEmail({
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono,
    email: parsed.data.email ?? null,
    asunto: parsed.data.asunto,
    mensaje: parsed.data.mensaje,
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
    submittedAt: new Date(),
  });

  if (!result.ok) {
    console.error('[contacto] error al enviar email:', result.error);
    return Response.json(
      { error: 'No se pudo enviar el mensaje. Intente de nuevo más tarde.' },
      { status: 502 },
    );
  }

  // Auto-respuesta al usuario si proporcionó email
  if (parsed.data.email) {
    try {
      const autoResult = await sendAutoReplyEmail({
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        tipo: 'contacto',
        asunto: parsed.data.asunto,
      });
      if (autoResult.ok) {
        console.log('[contacto] auto-respuesta enviada:', autoResult.id);
      } else {
        console.warn('[contacto] auto-respuesta falló:', autoResult.error);
      }
    } catch (e) {
      console.error('[contacto] excepción auto-respuesta:', e instanceof Error ? e.message : 'Error');
    }
  }

  return Response.json({ ok: true, id: result.id });
}
