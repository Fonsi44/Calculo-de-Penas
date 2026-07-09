/**
 * SGIE — Recordatorios al cliente (Fase 2).
 *
 * Envía emails al cliente (no al abogado) para el seguimiento documental:
 * solicitud inicial, primer y segundo recordatorio, aviso de bloqueo,
 * confirmación de recepción y solicitud de corrección.
 *
 * Idempotencia: reutiliza el patrón de `correos_enviados` con
 * `plantilla_slug + expediente_id + ventana_temporal` (una vez por ventana).
 *
 * SEGURIDAD: el token del magic link NUNCA se loguea ni se audita. El enlace
 * completo (con token) va SOLO en el HTML del email al cliente; en metadatos
 * y auditoría se registra el id del enlace, no su token.
 *
 * Resend si está configurado; si no, queda `pendiente`/`fallido` en
 * `correos_enviados` (no rompe). Referencia: docs/implementation/mvp-fase-2-...
 */
import { db } from '@/lib/db';
import {
  expedientes,
  clientes,
  enlacesMagicos,
  correosEnviados,
  documentosExpediente,
} from '@/lib/schema';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { isEmailConfigured, getClient, getFromAddress, getFromName } from '@/lib/email';
import { crearEnlace } from './enlaces-magicos';
import { SLUGS_PLANTILLAS_SEGUIMIENTO } from './config-seguimiento';

export interface ResultadoEnvio {
  enviado: boolean;
  motivo: string;
  correoId?: string;
  enlaceId?: string;
}

/** Obtiene el email del cliente de un expediente (o null). */
async function obtenerEmailCliente(expedienteId: string): Promise<{ email: string; nombre: string } | null> {
  const [exp] = await db
    .select({ clienteId: expedientes.clienteId, numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp?.clienteId) return null;
  const [cli] = await db
    .select({ email: clientes.email, nombre: clientes.nombre })
    .from(clientes)
    .where(eq(clientes.id, exp.clienteId));
  if (!cli?.email) return null;
  return { email: cli.email, nombre: cli.nombre };
}

/**
 * Obtiene un enlace mágico ACTIVO (no revocado, no expirado, con usos) para el
 * expediente, o crea uno nuevo si no hay. Devuelve { enlaceId, token } donde
 * `token` va solo en memoria para construir la URL del email.
 */
async function obtenerOCrearEnlaceActivo(
  expedienteId: string,
  actorId: string,
  clienteEmail?: string | null,
): Promise<{ enlaceId: string; token: string; creado: boolean } | null> {
  // Buscar enlace activo existente.
  const [activo] = await db
    .select({ id: enlacesMagicos.id })
    .from(enlacesMagicos)
    .where(
      and(
        eq(enlacesMagicos.expedienteId, expedienteId),
        isNull(enlacesMagicos.revocadoEn),
        lt(enlacesMagicos.usosActuales, enlacesMagicos.usosMaximos),
      ),
    )
    .orderBy(desc(enlacesMagicos.creadoEn))
    .limit(1);
  // Nota: la condición de expiración se valida en uso; aquí basta con no revocado.
  if (activo) {
    // No podemos devolver el token (solo hay hash). El cliente debe usar un
    // enlace recién emitido para recibir la URL completa. Por ello, si el
    // enlace existente no fue creado en esta operación, creamos uno nuevo para
    // poder incluir la URL en el email. (El existente queda activo igualmente.)
  }
  // Crear uno nuevo para garantizar que el email lleva la URL con token.
  const enlace = await crearEnlace(
    { expedienteId, clienteEmail: clienteEmail ?? undefined, diasExpiracion: 14, usosMaximos: 10 },
    actorId,
  );
  return { enlaceId: enlace.id, token: enlace.token, creado: true };
}

/**
 * Núcleo de envío idempotente. Construye el HTML, inserta en correos_enviados
 * con estado pendiente (idempotencia por unique slug+expediente+ventana) y
 * envía por Resend si está configurado.
 */
async function enviarEmailSeguimiento(params: {
  expedienteId: string;
  numeroInterno: string;
  destinatario: string;
  slug: string;
  ventana: string;
  asunto: string;
  cuerpoHtml: string;
  enlaceId?: string;
}): Promise<ResultadoEnvio> {
  // Idempotencia: ¿ya enviado para esta ventana?
  const [existente] = await db
    .select({ id: correosEnviados.id })
    .from(correosEnviados)
    .where(
      and(
        eq(correosEnviados.expedienteId, params.expedienteId),
        eq(correosEnviados.plantillaSlug, params.slug),
        eq(correosEnviados.ventanaTemporal, params.ventana),
      ),
    );
  if (existente) return { enviado: false, motivo: 'idempotente_ya_enviado' };

  const [insertado] = await db
    .insert(correosEnviados)
    .values({
      expedienteId: params.expedienteId,
      plantillaSlug: params.slug,
      destinatario: params.destinatario,
      asunto: params.asunto,
      cuerpoHtml: params.cuerpoHtml,
      estado: 'pendiente',
      ventanaTemporal: params.ventana,
    })
    .returning({ id: correosEnviados.id })
    .catch(() => [{ id: null }]);
  if (!insertado?.id) return { enviado: false, motivo: 'idempotente_race' };

  if (!isEmailConfigured()) {
    return { enviado: false, motivo: 'resend_no_configurado', correoId: insertado.id };
  }
  const client = getClient();
  if (!client) return { enviado: false, motivo: 'resend_no_configurado', correoId: insertado.id };

  try {
    const result = await client.emails.send({
      from: `${getFromName()} <${getFromAddress()}>`,
      to: params.destinatario,
      subject: params.asunto,
      html: params.cuerpoHtml,
    });
    await db
      .update(correosEnviados)
      .set({ estado: 'enviado', resendId: result.data?.id ?? null, enviadoEn: new Date() })
      .where(eq(correosEnviados.id, insertado.id));
    return { enviado: true, motivo: 'enviado', correoId: insertado.id, enlaceId: params.enlaceId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    await db
      .update(correosEnviados)
      .set({ estado: 'fallido', error: errorMsg.slice(0, 500) })
      .where(eq(correosEnviados.id, insertado.id));
    return { enviado: false, motivo: `error_envio: ${errorMsg}`, correoId: insertado.id };
  }
}

/** Construye la URL pública del portal de carga. El token va en la URL. */
function urlCarga(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pinedayasociadoshn.com';
  return `${base.replace(/\/+$/, '')}/cargar/${token}`;
}

function ventanaHoy(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Envía la SOLICITUD documental inicial al cliente: crea/reautiliza enlace y
 * envía email con la URL. Idempotente por día.
 */
export async function enviarSolicitudDocumental(
  expedienteId: string,
  actorId: string,
): Promise<ResultadoEnvio> {
  const [exp] = await db
    .select({ numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp) return { enviado: false, motivo: 'expediente_no_existe' };

  const cli = await obtenerEmailCliente(expedienteId);
  if (!cli) return { enviado: false, motivo: 'cliente_sin_email' };

  const enlace = await obtenerOCrearEnlaceActivo(expedienteId, actorId, cli.email);
  if (!enlace) return { enviado: false, motivo: 'no_se_pudo_crear_enlace' };

  const url = urlCarga(enlace.token);
  const cuerpoHtml = `
    <h2>Solicitud de documentación</h2>
    <p>Estimado/a <strong>${escapeHtml(cli.nombre)}</strong>,</p>
    <p>Para avanzar con su expediente <strong>${escapeHtml(exp.numeroInterno)}</strong> necesitamos que nos entregue cierta documentación.</p>
    <p>Puede subir sus documentos de forma segura a través del siguiente enlace privado:</p>
    <p><a href="${url}">${url}</a></p>
    <p>Este enlace es personal, tiene caducidad y se puede usar mientras esté activo.</p>
    <hr>
    <p style="font-size:12px;color:#64748b;">
      Pineda y Asociados — ${escapeHtml(getFromName())}.<br>
      Si no solicitó este trámite, ignore este correo.
    </p>
  `;

  return enviarEmailSeguimiento({
    expedienteId,
    numeroInterno: exp.numeroInterno,
    destinatario: cli.email,
    slug: SLUGS_PLANTILLAS_SEGUIMIENTO.solicitudDocumental,
    ventana: ventanaHoy(),
    asunto: `Solicitud de documentación — Expediente ${exp.numeroInterno}`,
    cuerpoHtml,
    enlaceId: enlace.enlaceId,
  });
}

/**
 * Envía un recordatorio (primero o segundo). Reutiliza/crea enlace activo.
 * Idempotente por día (ventana = hoy + número de recordatorio).
 */
export async function enviarRecordatorio(
  expedienteId: string,
  numero: 1 | 2,
  actorId: string,
): Promise<ResultadoEnvio> {
  const [exp] = await db
    .select({ numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp) return { enviado: false, motivo: 'expediente_no_existe' };

  const cli = await obtenerEmailCliente(expedienteId);
  if (!cli) return { enviado: false, motivo: 'cliente_sin_email' };

  const enlace = await obtenerOCrearEnlaceActivo(expedienteId, actorId, cli.email);
  if (!enlace) return { enviado: false, motivo: 'no_se_pudo_crear_enlace' };

  const url = urlCarga(enlace.token);
  const etiqueta = numero === 1 ? 'Primer recordatorio' : 'Segundo recordatorio';
  const cuerpoHtml = `
    <h2>${etiqueta}: documentación pendiente</h2>
    <p>Estimado/a <strong>${escapeHtml(cli.nombre)}</strong>,</p>
    <p>Le recordamos que aún falta documentación para su expediente <strong>${escapeHtml(exp.numeroInterno)}</strong>.</p>
    <p>Puede subir sus documentos en:</p>
    <p><a href="${url}">${url}</a></p>
    <p>Si no entrega la documentación en los próximos días, el expediente podría bloquearse temporalmente.</p>
    <hr>
    <p style="font-size:12px;color:#64748b;">Pineda y Asociados</p>
  `;

  const slug = numero === 1
    ? SLUGS_PLANTILLAS_SEGUIMIENTO.primerRecordatorio
    : SLUGS_PLANTILLAS_SEGUIMIENTO.segundoRecordatorio;

  return enviarEmailSeguimiento({
    expedienteId,
    numeroInterno: exp.numeroInterno,
    destinatario: cli.email,
    slug,
    ventana: `${ventanaHoy()}-${numero}`,
    asunto: `${etiqueta} — Expediente ${exp.numeroInterno}`,
    cuerpoHtml,
    enlaceId: enlace.enlaceId,
  });
}

/** Aviso de bloqueo inminente (antes de bloquear). */
export async function enviarAvisoBloqueo(
  expedienteId: string,
  _actorId: string,
): Promise<ResultadoEnvio> {
  const [exp] = await db
    .select({ numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp) return { enviado: false, motivo: 'expediente_no_existe' };

  const cli = await obtenerEmailCliente(expedienteId);
  if (!cli) return { enviado: false, motivo: 'cliente_sin_email' };

  const cuerpoHtml = `
    <h2>Último aviso: su expediente será bloqueado</h2>
    <p>Estimado/a <strong>${escapeHtml(cli.nombre)}</strong>,</p>
    <p>No hemos recibido la documentación solicitada para su expediente <strong>${escapeHtml(exp.numeroInterno)}</strong>.</p>
    <p>Si no la entrega a la brevedad, el expediente se bloqueará temporalmente hasta que regularice la situación.</p>
    <hr>
    <p style="font-size:12px;color:#64748b;">Pineda y Asociados</p>
  `;

  return enviarEmailSeguimiento({
    expedienteId,
    numeroInterno: exp.numeroInterno,
    destinatario: cli.email,
    slug: SLUGS_PLANTILLAS_SEGUIMIENTO.avisoBloqueo,
    ventana: ventanaHoy(),
    asunto: `Último aviso — Expediente ${exp.numeroInterno}`,
    cuerpoHtml,
  });
}

/** Confirmación de recepción de un documento. */
export async function enviarConfirmacionRecepcion(
  expedienteId: string,
  documentoId: string,
): Promise<ResultadoEnvio> {
  const [exp] = await db
    .select({ numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId));
  if (!exp) return { enviado: false, motivo: 'expediente_no_existe' };
  const cli = await obtenerEmailCliente(expedienteId);
  if (!cli) return { enviado: false, motivo: 'cliente_sin_email' };

  const cuerpoHtml = `
    <h2>Documentación recibida</h2>
    <p>Estimado/a <strong>${escapeHtml(cli.nombre)}</strong>,</p>
    <p>Hemos recibido correctamente un documento para su expediente <strong>${escapeHtml(exp.numeroInterno)}</strong>.</p>
    <p>Si falta algún documento, le avisaremos. En caso contrario, su abogado se pondrá en contacto.</p>
    <hr>
    <p style="font-size:12px;color:#64748b;">Pineda y Asociados</p>
  `;

  return enviarEmailSeguimiento({
    expedienteId,
    numeroInterno: exp.numeroInterno,
    destinatario: cli.email,
    slug: SLUGS_PLANTILLAS_SEGUIMIENTO.confirmacionRecepcion,
    ventana: `${ventanaHoy()}-${documentoId.slice(0, 8)}`,
    asunto: `Documentación recibida — Expediente ${exp.numeroInterno}`,
    cuerpoHtml,
  });
}

/** Solicitud de corrección al cliente por un documento rechazado manualmente. */
export async function enviarSolicitudCorreccion(
  documentoId: string,
  motivo: string,
  actorId: string,
): Promise<ResultadoEnvio> {
  const [doc] = await db
    .select({
      id: documentosExpediente.id,
      expedienteId: documentosExpediente.expedienteId,
      nombreOriginal: documentosExpediente.nombreOriginal,
    })
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId));
  if (!doc) return { enviado: false, motivo: 'documento_no_existe' };

  const [exp] = await db
    .select({ numeroInterno: expedientes.numeroInterno })
    .from(expedientes)
    .where(eq(expedientes.id, doc.expedienteId));
  if (!exp) return { enviado: false, motivo: 'expediente_no_existe' };

  const cli = await obtenerEmailCliente(doc.expedienteId);
  if (!cli) return { enviado: false, motivo: 'cliente_sin_email' };

  const enlace = await obtenerOCrearEnlaceActivo(doc.expedienteId, actorId, cli.email);
  const url = enlace ? urlCarga(enlace.token) : '';

  const cuerpoHtml = `
    <h2>Corrección de un documento</h2>
    <p>Estimado/a <strong>${escapeHtml(cli.nombre)}</strong>,</p>
    <p>El documento <strong>${escapeHtml(doc.nombreOriginal)}</strong> de su expediente <strong>${escapeHtml(exp.numeroInterno)}</strong> necesita corrección.</p>
    <p><em>Motivo:</em> ${escapeHtml(motivo)}</p>
    ${url ? `<p>Puede volver a subirlo en: <a href="${url}">${url}</a></p>` : ''}
    <hr>
    <p style="font-size:12px;color:#64748b;">Pineda y Asociados</p>
  `;

  return enviarEmailSeguimiento({
    expedienteId: doc.expedienteId,
    numeroInterno: exp.numeroInterno,
    destinatario: cli.email,
    slug: SLUGS_PLANTILLAS_SEGUIMIENTO.solicitudCorreccion,
    ventana: `${ventanaHoy()}-${documentoId.slice(0, 8)}`,
    asunto: `Corrección de documento — Expediente ${exp.numeroInterno}`,
    cuerpoHtml,
    enlaceId: enlace?.enlaceId,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
