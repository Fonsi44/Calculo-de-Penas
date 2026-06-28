/**
 * SGIE — Notificaciones email críticas (Sprint 5, tarea 6).
 *
 * Envía email a abogados para eventos críticos: alertas críticas nuevas, tareas
 * vencidas críticas, documentos pendientes urgentes, eventos próximos críticos.
 *
 * Idempotencia: reutiliza `correos_enviados` con `ventana_temporal` por slug +
 * expediente para no duplicar (ej. una alerta crítica por expediente y día).
 *
 * Reutiliza Resend (lib/email.ts) si está configurado; si no, registra el
 * intento como pendiente (no rompe).
 *
 * Sprint 5.
 */
import { db } from '@/lib/db';
import { correosEnviados, usuarios, expedienteAsignaciones } from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { isEmailConfigured, getClient, getFromAddress, getFromName } from '@/lib/email';

export type TipoNotificacionEmail =
  | 'alerta_critica'
  | 'tarea_vencida_critica'
  | 'documento_pendiente_urgente'
  | 'evento_proximo_critico';

const SLUGS: Record<TipoNotificacionEmail, string> = {
  alerta_critica: 'alerta_critica',
  tarea_vencida_critica: 'tarea_vencida_critica',
  documento_pendiente_urgente: 'doc_pendiente_urgente',
  evento_proximo_critico: 'evento_proximo_critico',
};

export interface NotificacionEmailInput {
  tipo: TipoNotificacionEmail;
  expedienteId: string;
  numeroInterno: string;
  /** Email del destinatario (abogado responsable). */
  destinatario: string;
  destinatarioId: string;
  titulo: string;
  mensaje: string;
  /** Ventana de idempotencia (ej. '2026-06-28' = una vez por día). */
  ventana: string;
}

/**
 * Envía una notificación email crítica con idempotencia. Si ya se envió para
 * el mismo expediente + slug + ventana, no reenvía.
 *
 * Devuelve el estado del envío para auditoría.
 */
export async function enviarNotificacionEmailCritica(
  input: NotificacionEmailInput,
): Promise<{ enviado: boolean; motivo: string; correoId?: string }> {
  const slug = SLUGS[input.tipo];

  // Idempotencia: ¿ya existe un correo enviado/pendiente para esta ventana?
  const [existente] = await db.select({ id: correosEnviados.id })
    .from(correosEnviados)
    .where(and(
      eq(correosEnviados.expedienteId, input.expedienteId),
      eq(correosEnviados.plantillaSlug, slug),
      eq(correosEnviados.ventanaTemporal, input.ventana),
    ));
  if (existente) {
    return { enviado: false, motivo: 'idempotente_ya_enviado' };
  }

  const asunto = `[SGIE] ${input.titulo} — ${input.numeroInterno}`;
  const cuerpoHtml = `
    <h2>${input.titulo}</h2>
    <p><strong>Expediente:</strong> ${input.numeroInterno}</p>
    <p>${input.mensaje}</p>
    <hr>
    <p style="font-size:12px;color:#64748b;">
      Esta es una notificación automática del SGIE de Pineda y Asociados.<br>
      Revise el expediente en la intranet.
    </p>
  `;

  // Insertar con estado pendiente (idempotencia garantizada por unique).
  const [insertado] = await db.insert(correosEnviados).values({
    expedienteId: input.expedienteId,
    plantillaSlug: slug,
    destinatario: input.destinatario,
    asunto,
    cuerpoHtml,
    estado: 'pendiente',
    ventanaTemporal: input.ventana,
    enviadoPor: input.destinatarioId,
  }).returning({ id: correosEnviados.id }).catch(() => [{ id: null }]);

  // Si el unique impidió el insert (race condition), es idempotente.
  if (!insertado?.id) {
    return { enviado: false, motivo: 'idempotente_race' };
  }

  // Enviar vía Resend si está configurado.
  if (!isEmailConfigured()) {
    // Queda pendiente; no rompe. Limitación documentada.
    return { enviado: false, motivo: 'resend_no_configurado', correoId: insertado.id };
  }
  const client = getClient();
  if (!client) {
    return { enviado: false, motivo: 'resend_no_configurado', correoId: insertado.id };
  }

  try {
    const result = await client.emails.send({
      from: `${getFromName()} <${getFromAddress()}>`,
      to: input.destinatario,
      subject: asunto,
      html: cuerpoHtml,
    });
    await db.update(correosEnviados).set({
      estado: 'enviado',
      resendId: result?.id ?? null,
      enviadoEn: new Date(),
    }).where(eq(correosEnviados.id, insertado.id));
    return { enviado: true, motivo: 'enviado', correoId: insertado.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    await db.update(correosEnviados).set({
      estado: 'fallido',
      error: errorMsg.slice(0, 500),
    }).where(eq(correosEnviados.id, insertado.id));
    return { enviado: false, motivo: `error_envio: ${errorMsg}`, correoId: insertado.id };
  }
}

/**
 * Obtiene el email del abogado responsable de un expediente.
 */
export async function obtenerEmailResponsable(expedienteId: string): Promise<{ id: string; email: string; nombre: string } | null> {
  const [row] = await db.select({
    id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre,
  }).from(expedienteAsignaciones)
    .innerJoin(usuarios, eq(expedienteAsignaciones.abogadoId, usuarios.id))
    .where(and(eq(expedienteAsignaciones.expedienteId, expedienteId), isNull(expedienteAsignaciones.revocadaEn)))
    .limit(1);
  return row ?? null;
}
