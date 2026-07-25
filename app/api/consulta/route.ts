import { consultaSchema, validate } from '@/lib/validation';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { sendConsultaEmail, sendAutoReplyEmail, isEmailConfigured } from '@/lib/email';
import { ipFromRequest, uaFromRequest } from '@/lib/audit';
import { verifyTurnstileToken } from '@/lib/captcha';
import { db } from '@/lib/db';
import { solicitudesConsulta } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

  // FASE 2: los campos opcionales (medio preferido, localidad, urgencia y
  // condicionales) se agregan al resumen que se persiste en DB y se envía por
  // email. No se añaden columnas a solicitudesConsulta (no se migra el schema,
  // restricción §7 AGENTS.md). Solo se incluyen los campos con valor real.
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
    const uLabels: Record<string, string> = {
      normal: 'Normal',
      alta: 'Alta',
      penal: 'Urgencia penal',
    };
    extras.push(`Urgencia: ${uLabels[d.urgencia] ?? d.urgencia}`);
  }
  if (d.fechaAudiencia) extras.push(`Fecha audiencia/citación: ${d.fechaAudiencia}`);
  if (d.hayDetencion) extras.push(`¿Hay detención?: ${d.hayDetencion === 'si' ? 'Sí' : 'No'}`);
  if (d.fechaDespido) extras.push(`Fecha de despido: ${d.fechaDespido}`);
  if (d.residenciaEspana) extras.push(`Reside en España: ${d.residenciaEspana === 'si' ? 'Sí' : 'No'}`);
  if (d.disponibleLlamada) extras.push(`Disponible para llamada: ${d.disponibleLlamada === 'si' ? 'Sí' : 'No'}`);
  const resumenCompleto = extras.length > 0
    ? `${d.resumen}\n\n— Datos del formulario —\n${extras.join('\n')}`
    : d.resumen;

  // Cloudflare Turnstile — bypass seguro si faltan claves (lib/captcha.ts).
  const turnstileOk = await verifyTurnstileToken(
    (body as Record<string, unknown>)['cf-turnstile-response'] as string | undefined,
    ip,
  );
  if (!turnstileOk) {
    return Response.json({ error: 'Verificación antispam inválida. Recargue e intente de nuevo.' }, { status: 400 });
  }

  // Guardar en BD — siempre funciona, no depende de servicio externo
  const insertResult = await db.insert(solicitudesConsulta).values({
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono,
    email: parsed.data.email ?? null,
    motivo: parsed.data.motivo,
    resumen: resumenCompleto,
    ip: ipFromRequest(request),
    userAgent: uaFromRequest(request),
    emailStatus: 'pending',
  }).returning({ id: solicitudesConsulta.id });

  const savedId = insertResult[0]?.id;
  if (!savedId) {
    console.error('[consulta] no se pudo insertar en DB');
    return Response.json({ error: 'Error al guardar la solicitud' }, { status: 500 });
  }

  // Enviar email — ahora es parte del flujo principal con actualización en DB
  let emailOk = true;

  if (isEmailConfigured()) {
    try {
      const result = await sendConsultaEmail({
        nombre: parsed.data.nombre,
        telefono: parsed.data.telefono,
        email: parsed.data.email ?? null,
        motivo: parsed.data.motivo,
        resumen: resumenCompleto,
        ip: ipFromRequest(request),
        userAgent: uaFromRequest(request),
        submittedAt: new Date(),
      });

      if (result.ok) {
        await db.update(solicitudesConsulta)
          .set({ emailStatus: 'sent', emailId: result.id })
          .where(eq(solicitudesConsulta.id, savedId));
        console.log('[consulta] email enviado correctamente:', result.id);
      } else {
        emailOk = false;
        const errorMsg = result.error ?? 'Error desconocido';
        console.error('[consulta] email falló:', errorMsg);
        await db.update(solicitudesConsulta)
          .set({ emailStatus: 'failed', emailError: errorMsg })
          .where(eq(solicitudesConsulta.id, savedId));
      }
    } catch (e) {
      emailOk = false;
      const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
      console.error('[consulta] excepción enviando email:', errorMsg);
      await db.update(solicitudesConsulta)
        .set({ emailStatus: 'failed', emailError: errorMsg })
        .where(eq(solicitudesConsulta.id, savedId));
    }
  } else {
    await db.update(solicitudesConsulta)
      .set({ emailStatus: 'skipped', emailError: 'RESEND_API_KEY no configurada' })
      .where(eq(solicitudesConsulta.id, savedId));
  }

  // Auto-respuesta al usuario si proporcionó email
  console.log('[consulta] debug auto-reply: email=', parsed.data.email, 'tipo=', typeof parsed.data.email);
  if (parsed.data.email) {
    console.log('[consulta] debug auto-reply: intentando enviar a', parsed.data.email);
    try {
      const autoResult = await sendAutoReplyEmail({
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        tipo: 'consulta',
        motivo: parsed.data.motivo,
      });
      if (autoResult.ok) {
        console.log('[consulta] auto-respuesta enviada:', autoResult.id);
      } else {
        console.warn('[consulta] auto-respuesta falló:', autoResult.error);
      }
    } catch (e) {
      console.error('[consulta] excepción auto-respuesta:', e instanceof Error ? e.message : 'Error');
    }
  } else {
    console.log('[consulta] debug auto-reply: email vacío, se omite');
  }

  // Siempre devolvemos ok aunque el email falle (la consulta está guardada)
  return Response.json({
    ok: true,
    id: savedId,
    email: emailOk ? 'sent' : 'failed',
  });
}
