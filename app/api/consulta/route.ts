import { consultaSchema, validate } from '@/lib/validation';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { sendConsultaEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';

const CONSULTA_MAX = 10;
const CONSULTA_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const uaFingerprint = request.headers.get('user-agent')?.slice(0, 64) ?? 'unknown';
  const identifier = `${ip}|${uaFingerprint}`;
  const rl = await rateLimit(identifier, { keyPrefix: 'consulta', windowMs: CONSULTA_WINDOW_MS, max: CONSULTA_MAX });
  if (!rl.ok) {
    return rateLimitResponse(rl);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = validate(consultaSchema, body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    console.warn('[consulta] RESEND_API_KEY no configurada; mensaje no enviado', {
      ip,
      nombre: parsed.data.nombre,
    });
    return Response.json(
      { error: 'El servicio de correo no está configurado. Intente más tarde.' },
      { status: 503 },
    );
  }

  const result = await sendConsultaEmail({
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono,
    email: parsed.data.email ?? null,
    motivo: parsed.data.motivo,
    resumen: parsed.data.resumen,
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
    submittedAt: new Date(),
  });

  if (!result.ok) {
    console.error('[consulta] error al enviar email:', result.error);
    return Response.json(
      { error: 'No se pudo enviar la solicitud. Intente de nuevo más tarde.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, id: result.id });
}
