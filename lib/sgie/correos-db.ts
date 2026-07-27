/**
 * SGIE — Plantillas de correo y envío vía Resend (Fase 5).
 *
 * CRUD de plantillas, interpolación de variables, envío idempotente con
 * reintentos. Las plantillas son administradas por admin desde el panel.
 * El envío usa Resend (via lib/email.ts) con idempotencia por
 * (expediente_id, plantilla_slug, ventana_temporal).
 *
 * Ver docs/architecture/ §22.3, §23.1.
 */
import { db } from '@/lib/db';
import { plantillasCorreo, correosEnviados, comunicacionesOutbox, webhookReceipts, type PlantillaCorreo, type PlantillaCorreoInsert, type ComunicacionOutboxInsert, type WebhookReceiptInsert } from '@/lib/schema';
import { eq, and, count, desc, ilike, or, isNull, lte, inArray } from 'drizzle-orm';
import { getClient, getFromAddress, getFromName } from '@/lib/email';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CrearPlantillaInput {
  slug: string;
  nombre: string;
  asunto: string;
  cuerpoHtml: string;
  variablesPermitidas?: string[];
  creadoPor?: string;
}

export interface ActualizarPlantillaInput {
  nombre?: string;
  asunto?: string;
  cuerpoHtml?: string;
  variablesPermitidas?: string[];
  estado?: 'borrador' | 'activa' | 'desactivada';
}

export interface EnviarCorreoPlantillaInput {
  expedienteId?: string;
  plantillaSlug: string;
  destinatario: string;
  variables?: Record<string, string>;
  enviadoPor?: string;
  ventanaTemporal?: string;
}

export interface EnviarCorreoDirectoInput {
  expedienteId?: string;
  plantillaSlug: string;
  destinatario: string;
  asunto: string;
  cuerpoHtml: string;
  enviadoPor?: string;
  ventanaTemporal?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  resendId?: string;
  error?: string;
  duplicado?: boolean;
}

// ─── CRUD Plantillas ─────────────────────────────────────────────────────────

export async function listarPlantillas(params?: {
  estado?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ plantillas: PlantillaCorreo[]; total: number }> {
  const conditions = [];
  if (params?.estado) {
    conditions.push(eq(plantillasCorreo.estado, params.estado as 'borrador' | 'activa' | 'desactivada'));
  }
  if (params?.q) {
    const q = `%${params.q}%`;
    conditions.push(
      or(
        ilike(plantillasCorreo.nombre, q),
        ilike(plantillasCorreo.slug, q),
        ilike(plantillasCorreo.asunto, q),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(plantillasCorreo)
    .where(where);

  const plantillas = await db
    .select()
    .from(plantillasCorreo)
    .where(where)
    .orderBy(desc(plantillasCorreo.actualizadoEn), desc(plantillasCorreo.creadoEn))
    .limit(params?.limit ?? 50)
    .offset(params?.offset ?? 0);

  return { plantillas, total: countRow?.total ?? 0 };
}

export async function obtenerPlantilla(id: string): Promise<PlantillaCorreo | null> {
  const [plantilla] = await db
    .select()
    .from(plantillasCorreo)
    .where(eq(plantillasCorreo.id, id));
  return plantilla ?? null;
}

export async function obtenerPlantillaPorSlug(slug: string): Promise<PlantillaCorreo | null> {
  const [plantilla] = await db
    .select()
    .from(plantillasCorreo)
    .where(eq(plantillasCorreo.slug, slug));
  return plantilla ?? null;
}

export async function crearPlantilla(input: CrearPlantillaInput): Promise<PlantillaCorreo> {
  const values: PlantillaCorreoInsert = {
    slug: input.slug,
    nombre: input.nombre,
    asunto: input.asunto,
    cuerpoHtml: input.cuerpoHtml,
    variablesPermitidas: input.variablesPermitidas ?? [],
    estado: 'borrador',
    creadoPor: input.creadoPor ?? null,
  };
  const [plantilla] = await db.insert(plantillasCorreo).values(values).returning();
  return plantilla;
}

export async function actualizarPlantilla(id: string, input: ActualizarPlantillaInput): Promise<PlantillaCorreo | null> {
  const sets: Partial<PlantillaCorreoInsert> = { actualizadoEn: new Date() };
  if (input.nombre !== undefined) sets.nombre = input.nombre;
  if (input.asunto !== undefined) sets.asunto = input.asunto;
  if (input.cuerpoHtml !== undefined) sets.cuerpoHtml = input.cuerpoHtml;
  if (input.variablesPermitidas !== undefined) sets.variablesPermitidas = input.variablesPermitidas;
  if (input.estado !== undefined) sets.estado = input.estado;

  const [actualizada] = await db
    .update(plantillasCorreo)
    .set(sets)
    .where(eq(plantillasCorreo.id, id))
    .returning();
  return actualizada ?? null;
}

// ─── Interpolación ───────────────────────────────────────────────────────────

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

export function interpolarPlantilla(
  plantilla: PlantillaCorreo,
  variables: Record<string, string>,
): { asunto: string; cuerpoHtml: string } {
  let asunto = plantilla.asunto;
  let cuerpoHtml = plantilla.cuerpoHtml;

  const permitidas = new Set(plantilla.variablesPermitidas ?? []);

  for (const [clave, valor] of Object.entries(variables)) {
    if (permitidas.size > 0 && !permitidas.has(clave)) continue;
    const patron = new RegExp(`\\{\\{\\s*${escapeRegex(clave)}\\s*\\}\\}`, 'g');
    const reemplazo = escaparHtml(valor);
    asunto = asunto.replace(patron, reemplazo);
    cuerpoHtml = cuerpoHtml.replace(patron, reemplazo);
  }

  return { asunto, cuerpoHtml };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Envío de correo ─────────────────────────────────────────────────────────

export async function enviarCorreoPlantilla(input: EnviarCorreoPlantillaInput): Promise<SendResult> {
  const plantilla = await obtenerPlantillaPorSlug(input.plantillaSlug);
  if (!plantilla) {
    return { ok: false, error: `Plantilla no encontrada: ${input.plantillaSlug}` };
  }
  if (plantilla.estado !== 'activa') {
    return { ok: false, error: `La plantilla ${input.plantillaSlug} no está activa` };
  }

  const variables = input.variables ?? {};
  const { asunto, cuerpoHtml } = interpolarPlantilla(plantilla, variables);

  return enviarCorreo({
    expedienteId: input.expedienteId,
    plantillaSlug: input.plantillaSlug,
    destinatario: input.destinatario,
    asunto,
    cuerpoHtml,
    enviadoPor: input.enviadoPor,
    ventanaTemporal: input.ventanaTemporal,
  });
}

export async function enviarCorreo(input: EnviarCorreoDirectoInput): Promise<SendResult> {
  const ventana = input.ventanaTemporal ?? new Date().toISOString().slice(0, 10);

  // Crear registro — idempotencia vía UNIQUE (expediente_id, plantilla_slug, ventana_temporal)
  const [registro] = await db
    .insert(correosEnviados)
    .values({
      expedienteId: input.expedienteId ?? null,
      plantillaSlug: input.plantillaSlug,
      destinatario: input.destinatario,
      asunto: input.asunto,
      cuerpoHtml: input.cuerpoHtml,
      estado: 'pendiente',
      ventanaTemporal: ventana,
      intentos: 0,
      enviadoPor: input.enviadoPor ?? null,
    })
    .onConflictDoNothing({
      target: [correosEnviados.expedienteId, correosEnviados.plantillaSlug, correosEnviados.ventanaTemporal],
    })
    .returning({ id: correosEnviados.id });

  if (!registro) {
    // Ya existe un correo para esta ventana — no duplicar
    return { ok: false, duplicado: true, error: 'Correo ya enviado en esta ventana temporal' };
  }

  // Enviar vía Resend
  const resendClient = getClient();
  if (!resendClient) {
    await db
      .update(correosEnviados)
      .set({ estado: 'fallido', error: 'RESEND_API_KEY no configurada' })
      .where(eq(correosEnviados.id, registro.id));
    return { ok: false, id: registro.id, error: 'RESEND_API_KEY no configurada' };
  }

  try {
    const resendResult = await resendClient.emails.send({
      from: `${getFromName()} <${getFromAddress()}>`,
      to: [input.destinatario],
      subject: input.asunto,
      html: input.cuerpoHtml,
    });

    if (resendResult.error) {
      await db
        .update(correosEnviados)
        .set({
          estado: 'fallido',
          error: resendResult.error.message ?? 'Error desconocido de Resend',
          intentos: 1,
        })
        .where(eq(correosEnviados.id, registro.id));
      return { ok: false, id: registro.id, error: resendResult.error.message };
    }

    await db
      .update(correosEnviados)
      .set({
        estado: 'enviado',
        resendId: resendResult.data?.id ?? null,
        enviadoEn: new Date(),
        intentos: 1,
      })
      .where(eq(correosEnviados.id, registro.id));

    return { ok: true, id: registro.id, resendId: resendResult.data?.id ?? undefined };
  } catch (err) {
    const errorMsg = (err as Error).message;
    await db
      .update(correosEnviados)
      .set({ estado: 'fallido', error: errorMsg, intentos: 1 })
      .where(eq(correosEnviados.id, registro.id));
    return { ok: false, id: registro.id, error: errorMsg };
  }
}

export async function reintentarCorreo(correoId: string): Promise<SendResult> {
  const [registro] = await db
    .select()
    .from(correosEnviados)
    .where(eq(correosEnviados.id, correoId));

  if (!registro) {
    return { ok: false, error: 'Correo no encontrado' };
  }
  if (registro.estado !== 'fallido' && registro.estado !== 'reintentando') {
    return { ok: false, error: `El correo no está en estado reintentable (${registro.estado})` };
  }

  await db
    .update(correosEnviados)
    .set({ estado: 'reintentando', intentos: (registro.intentos ?? 0) + 1 })
    .where(eq(correosEnviados.id, correoId));

  const resendClient = getClient();
  if (!resendClient) {
    await db
      .update(correosEnviados)
      .set({ estado: 'fallido', error: 'RESEND_API_KEY no configurada' })
      .where(eq(correosEnviados.id, correoId));
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  try {
    const resendResult = await resendClient.emails.send({
      from: `${getFromName()} <${getFromAddress()}>`,
      to: [registro.destinatario],
      subject: registro.asunto,
      html: registro.cuerpoHtml,
    });

    if (resendResult.error) {
      await db
        .update(correosEnviados)
        .set({ estado: 'fallido', error: resendResult.error.message ?? 'Error de Resend' })
        .where(eq(correosEnviados.id, correoId));
      return { ok: false, id: correoId, error: resendResult.error.message };
    }

    await db
      .update(correosEnviados)
      .set({ estado: 'enviado', resendId: resendResult.data?.id ?? null, enviadoEn: new Date() })
      .where(eq(correosEnviados.id, correoId));

    return { ok: true, id: correoId, resendId: resendResult.data?.id ?? undefined };
  } catch (err) {
    const errorMsg = (err as Error).message;
    await db
      .update(correosEnviados)
      .set({ estado: 'fallido', error: errorMsg })
      .where(eq(correosEnviados.id, correoId));
    return { ok: false, id: correoId, error: errorMsg };
  }
}

export async function listarCorreos(params?: {
  expedienteId?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}): Promise<{ correos: typeof correosEnviados.$inferSelect[]; total: number }> {
  const conditions = [];
  if (params?.expedienteId) {
    conditions.push(eq(correosEnviados.expedienteId, params.expedienteId));
  }
  if (params?.estado) {
    conditions.push(eq(correosEnviados.estado, params.estado as 'pendiente' | 'enviado' | 'fallido' | 'reintentando'));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(correosEnviados)
    .where(where);

  const correos = await db
    .select()
    .from(correosEnviados)
    .where(where)
    .orderBy(desc(correosEnviados.creadoEn))
    .limit(params?.limit ?? 50)
    .offset(params?.offset ?? 0);

  return { correos, total: countRow?.total ?? 0 };
}

// ─── Outbox ──────────────────────────────────────────────────────────────────

export async function enviarCorreoConOutbox(input: {
  expedienteId?: string;
  tipo: string;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  programadoPara?: Date;
  creadoPor?: string;
}): Promise<{ ok: boolean; id?: string }> {
  const values: ComunicacionOutboxInsert = {
    expedienteId: input.expedienteId ?? null,
    tipo: input.tipo,
    destinatario: input.destinatario,
    asunto: input.asunto,
    cuerpo: input.cuerpo,
    estado: 'pending',
    programadoPara: input.programadoPara ?? null,
    creadoPor: input.creadoPor ?? null,
  };

  const [record] = await db.insert(comunicacionesOutbox).values(values).returning({ id: comunicacionesOutbox.id });

  await logSgie({
    usuarioId: input.creadoPor ?? '00000000-0000-0000-0000-000000000000',
    accion: 'comunicacion_created',
    recurso: 'comunicaciones_outbox',
    recursoId: record.id,
    metadata: { expedienteId: input.expedienteId, tipo: input.tipo, destinatario: input.destinatario },
  });

  return { ok: true, id: record.id };
}

export async function procesarOutboxComunicaciones(
  limite: number = 10,
): Promise<{ procesadas: number; fallidas: number }> {
  const pendientes = await db
    .select()
    .from(comunicacionesOutbox)
    .where(
      and(
        eq(comunicacionesOutbox.estado, 'pending'),
        or(
          isNull(comunicacionesOutbox.programadoPara),
          lte(comunicacionesOutbox.programadoPara, new Date()),
        ),
      ),
    )
    .orderBy(comunicacionesOutbox.creadoEn)
    .limit(limite);

  let procesadas = 0;
  let fallidas = 0;

  for (const item of pendientes) {
    try {
      await db
        .update(comunicacionesOutbox)
        .set({ estado: 'sending' })
        .where(eq(comunicacionesOutbox.id, item.id));

      const resendClient = getClient();
      if (!resendClient) {
        await db
          .update(comunicacionesOutbox)
          .set({
            estado: 'failed',
            error: 'RESEND_API_KEY no configurada',
            intentos: (item.intentos ?? 0) + 1,
          })
          .where(eq(comunicacionesOutbox.id, item.id));
        fallidas++;
        await logSgie({
          usuarioId: '00000000-0000-0000-0000-000000000000',
          accion: 'comunicacion_failed',
          recurso: 'comunicaciones_outbox',
          recursoId: item.id,
          metadata: { error: 'RESEND_API_KEY no configurada' },
        });
        continue;
      }

      const resendResult = await resendClient.emails.send({
        from: `${getFromName()} <${getFromAddress()}>`,
        to: [item.destinatario],
        subject: item.asunto ?? '',
        html: item.cuerpo ?? '',
      });

      if (resendResult.error) {
        const nuevosIntentos = (item.intentos ?? 0) + 1;
        const esFinal = nuevosIntentos >= (item.maxIntentos ?? 3);
        await db
          .update(comunicacionesOutbox)
          .set({
            estado: esFinal ? 'failed' : 'pending',
            error: resendResult.error.message ?? 'Error de Resend',
            intentos: nuevosIntentos,
          })
          .where(eq(comunicacionesOutbox.id, item.id));
        if (esFinal) fallidas++;
        continue;
      }

      await db
        .update(comunicacionesOutbox)
        .set({
          estado: 'sent',
          enviadoEn: new Date(),
          intentos: (item.intentos ?? 0) + 1,
        })
        .where(eq(comunicacionesOutbox.id, item.id));

      procesadas++;

      await logSgie({
        usuarioId: '00000000-0000-0000-0000-000000000000',
        accion: 'comunicacion_sent',
        recurso: 'comunicaciones_outbox',
        recursoId: item.id,
        metadata: { destinatario: item.destinatario, tipo: item.tipo },
      });
    } catch (err) {
      await db
        .update(comunicacionesOutbox)
        .set({
          estado: 'failed',
          error: (err as Error).message,
          intentos: (item.intentos ?? 0) + 1,
        })
        .where(eq(comunicacionesOutbox.id, item.id));
      fallidas++;
    }
  }

  return { procesadas, fallidas };
}

// ─── Webhooks Resend ─────────────────────────────────────────────────────────

export interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    created_at?: string;
    delivered_at?: string;
    bounced_at?: string;
    complaint_at?: string;
    opened_at?: string;
    clicked_at?: string;
    summary?: string;
    bounce?: { bounce_type?: string; reason?: string };
    complaint?: { complaint_type?: string };
  };
}

export async function webhookResend(
  payload: ResendWebhookPayload,
): Promise<{ ok: boolean }> {
  const eventType = payload.type;
  const resendId = payload.data.email_id;

  // Crear receipt
  const receiptValues: WebhookReceiptInsert = {
    fuente: 'resend',
    eventType,
    payload: payload as unknown as Record<string, unknown>,
    estado: 'received',
  };
  await db.insert(webhookReceipts).values(receiptValues);

  // Buscar correo por resendId
  const [correo] = await db
    .select()
    .from(correosEnviados)
    .where(eq(correosEnviados.resendId, resendId));

  if (!correo) {
    // Webhook para un correo no rastreado en el sistema
    await db.update(webhookReceipts).set({ estado: 'ignored' }).where(eq(webhookReceipts.eventType, eventType));
    return { ok: true };
  }

  const updates: Record<string, unknown> = {};

  switch (eventType) {
    case 'email.delivered':
      updates.estado = 'enviado';
      updates.enviadoEn = payload.data.delivered_at ? new Date(payload.data.delivered_at) : new Date();
      break;
    case 'email.bounced':
      updates.estado = 'fallido';
      updates.error = `Rebotado: ${payload.data.bounce?.reason ?? payload.data.summary ?? 'sin detalle'}`;
      break;
    case 'email.complaint':
      updates.estado = 'fallido';
      updates.error = `Queja: ${payload.data.complaint?.complaint_type ?? 'spam'}`;
      break;
    case 'email.opened':
      updates.opened_at = payload.data.opened_at ? new Date(payload.data.opened_at) : new Date();
      break;
    case 'email.clicked':
      updates.clicked_at = payload.data.clicked_at ? new Date(payload.data.clicked_at) : new Date();
      break;
    default:
      break;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(correosEnviados)
      .set(updates as never)
      .where(eq(correosEnviados.id, correo.id));
  }

  await db
    .update(webhookReceipts)
    .set({ estado: 'processed', procesadoEn: new Date() })
    .where(eq(webhookReceipts.eventType, eventType));

  const accion = eventType === 'email.bounced'
    ? 'comunicacion_bounced'
    : eventType === 'email.delivered'
      ? 'comunicacion_sent'
      : 'webhook_processed';

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: accion as 'comunicacion_sent' | 'comunicacion_failed' | 'comunicacion_bounced' | 'webhook_processed',
    recurso: 'correos_enviados',
    recursoId: correo.id,
    metadata: { resendId, eventType, estadoFinal: updates.estado ?? 'actualizado' },
  });

  return { ok: true };
}

// ─── Supresión de destinatarios ──────────────────────────────────────────────

export async function suprimirDestinatario(email: string): Promise<{ suprimidos: number }> {
  const result = await db
    .update(comunicacionesOutbox)
    .set({ estado: 'cancelled', error: 'Destinatario suprimido' })
    .where(
      and(
        eq(comunicacionesOutbox.destinatario, email),
        inArray(comunicacionesOutbox.estado, ['pending', 'sending']),
      ),
    )
    .returning({ id: comunicacionesOutbox.id });

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: 'comunicacion_suppressed',
    recurso: 'comunicaciones_outbox',
    metadata: { email, suprimidos: result.length },
  });

  return { suprimidos: result.length };
}

// ─── Cancelar recordatorios ──────────────────────────────────────────────────

export async function cancelarRecordatoriosSiCumplido(
  expedienteId: string,
  requisitoId: string,
): Promise<{ cancelados: number }> {
  const pendientes = await db
    .select()
    .from(comunicacionesOutbox)
    .where(
      and(
        eq(comunicacionesOutbox.expedienteId, expedienteId),
        eq(comunicacionesOutbox.tipo, 'recordatorio'),
        eq(comunicacionesOutbox.estado, 'pending'),
      ),
    );

  if (pendientes.length === 0) return { cancelados: 0 };

  const ids = pendientes.map((r) => r.id);

  await db
    .update(comunicacionesOutbox)
    .set({ estado: 'cancelled', error: 'Requisito cumplido — recordatorio cancelado' })
    .where(inArray(comunicacionesOutbox.id, ids));

  await logSgie({
    usuarioId: '00000000-0000-0000-0000-000000000000',
    accion: 'comunicacion_suppressed',
    recurso: 'comunicaciones_outbox',
    recursoId: expedienteId,
    metadata: { expedienteId, requisitoId, cancelados: ids.length },
  });

  return { cancelados: ids.length };
}
