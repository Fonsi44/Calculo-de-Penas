import { consultaSchema, validate } from '@/lib/validation';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { sendConsultaEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { db } from '@/lib/db';
import { solicitudesConsulta } from '@/lib/schema';

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

  // Guardar en BD — siempre funciona, no depende de servicio externo
  const insertResult = await db.insert(solicitudesConsulta).values({
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono,
    email: parsed.data.email ?? null,
    motivo: parsed.data.motivo,
    resumen: parsed.data.resumen,
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
  }).returning({ id: solicitudesConsulta.id });

  const savedId = insertResult[0]?.id;

  // Intentar enviar email — best effort, no bloquea la respuesta
  if (isEmailConfigured()) {
    sendConsultaEmail({
      nombre: parsed.data.nombre,
      telefono: parsed.data.telefono,
      email: parsed.data.email ?? null,
      motivo: parsed.data.motivo,
      resumen: parsed.data.resumen,
      ip: ipFromRequest(request),
      userAgent: uaFromRequest(request),
      submittedAt: new Date(),
    }).then(result => {
      if (!result.ok) console.error('[consulta] email falló:', result.error);
    }).catch(e => {
      console.error('[consulta] error enviando email:', e);
    });
  }

  return Response.json({ ok: true, id: savedId });
}
