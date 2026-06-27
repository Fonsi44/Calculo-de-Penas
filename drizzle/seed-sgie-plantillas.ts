/**
 * Seed de 10 plantillas base de correo SGIE.
 *
 * Ejecutar: npx tsx drizzle/seed-sgie-plantillas.ts
 * O vía npm: npm run seed:sgie:plantillas
 *
 * Idempotente: si ya existe una plantilla con el mismo slug, no la sobrescribe.
 */
import { db } from '../lib/db';
import { plantillasCorreo } from '../lib/schema';
import { eq } from 'drizzle-orm';

interface PlantillaSeed {
  slug: string;
  nombre: string;
  asunto: string;
  cuerpoHtml: string;
  variablesPermitidas: string[];
}

const PLANTILLAS: PlantillaSeed[] = [
  {
    slug: 'solicitud_documentos',
    nombre: 'Solicitud de documentos',
    asunto: 'Solicitud de documentos — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>En relación con su expediente <strong>{{numero_expediente}}</strong> ({{tipo_procedimiento}}), necesitamos que nos proporcione la siguiente documentación para continuar con su trámite:</p>
  <div style="background:#f8f9fa;border-left:4px solid #c9a84c;padding:16px;margin:16px 0;">
    <p style="margin:0;white-space:pre-wrap;">{{lista_documentos}}</p>
  </div>
  <p>Puede cargar los documentos directamente a través del siguiente enlace seguro:</p>
  <p><a href="{{enlace_carga}}" style="background:#1a1a2e;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Cargar documentos</a></p>
  <p style="font-size:13px;color:#6b7280;">Este enlace expira el {{fecha_expiracion}}.</p>
  <p>Si tiene alguna duda, no dude en contactarnos.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'tipo_procedimiento', 'lista_documentos', 'enlace_carga', 'fecha_expiracion', 'nombre_abogado'],
  },
  {
    slug: 'acuse_recibo',
    nombre: 'Acuse de recibo de documentos',
    asunto: 'Documentos recibidos — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Le confirmamos que hemos recibido correctamente los siguientes documentos para su expediente <strong>{{numero_expediente}}</strong>:</p>
  <div style="background:#f8f9fa;border-left:4px solid #22c55e;padding:16px;margin:16px 0;">
    <p style="margin:0;white-space:pre-wrap;">{{documentos_recibidos}}</p>
  </div>
  <p>Los revisaremos a la brevedad y le notificaremos cualquier novedad.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'documentos_recibidos', 'nombre_abogado'],
  },
  {
    slug: 'documentos_faltantes',
    nombre: 'Documentos faltantes',
    asunto: 'Documentación pendiente — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Hemos revisado la documentación recibida para su expediente <strong>{{numero_expediente}}</strong> y aún faltan los siguientes documentos:</p>
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;">
    <p style="margin:0;white-space:pre-wrap;">{{documentos_faltantes}}</p>
  </div>
  <p>Por favor, cargue los documentos pendientes usando el enlace seguro que le enviamos anteriormente, o solicite uno nuevo si expiró.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'documentos_faltantes', 'nombre_abogado'],
  },
  {
    slug: 'recordatorio_carga',
    nombre: 'Recordatorio de carga documental',
    asunto: 'Recordatorio: carga de documentos — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Le recordamos que aún tiene pendiente la carga de documentos para su expediente <strong>{{numero_expediente}}</strong> ({{tipo_procedimiento}}).</p>
  <p>El enlace de carga expirará el <strong>{{fecha_expiracion}}</strong>. Le recomendamos cargar los documentos lo antes posible para evitar demoras en su trámite.</p>
  <p><a href="{{enlace_carga}}" style="background:#1a1a2e;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Cargar documentos ahora</a></p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'tipo_procedimiento', 'enlace_carga', 'fecha_expiracion', 'nombre_abogado'],
  },
  {
    slug: 'enlace_expirado',
    nombre: 'Enlace de carga expirado',
    asunto: 'Enlace de carga expirado — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>El enlace de carga de documentos para su expediente <strong>{{numero_expediente}}</strong> ha expirado.</p>
  <p>No se preocupe, hemos generado un nuevo enlace para que pueda cargar sus documentos:</p>
  <p><a href="{{enlace_carga}}" style="background:#1a1a2e;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Nuevo enlace de carga</a></p>
  <p style="font-size:13px;color:#6b7280;">Este nuevo enlace expira el {{fecha_expiracion}}.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'enlace_carga', 'fecha_expiracion', 'nombre_abogado'],
  },
  {
    slug: 'documento_rechazado',
    nombre: 'Documento rechazado',
    asunto: 'Documento rechazado — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Hemos revisado el documento <strong>{{nombre_documento}}</strong> que cargó para su expediente <strong>{{numero_expediente}}</strong> y lamentablemente no cumple con los requisitos necesarios.</p>
  <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;">
    <p style="margin:0;"><strong>Motivo del rechazo:</strong> {{motivo_rechazo}}</p>
  </div>
  <p>Por favor, cargue una nueva versión del documento usando el enlace seguro:</p>
  <p><a href="{{enlace_carga}}" style="background:#1a1a2e;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Cargar documento corregido</a></p>
  <p>Si necesita ayuda para preparar el documento, no dude en contactarnos.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'nombre_documento', 'motivo_rechazo', 'enlace_carga', 'nombre_abogado'],
  },
  {
    slug: 'documento_aprobado',
    nombre: 'Documento aprobado',
    asunto: 'Documento aprobado — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Nos complace informarle que el documento <strong>{{nombre_documento}}</strong> que cargó para su expediente <strong>{{numero_expediente}}</strong> ha sido revisado y aprobado.</p>
  <p>Continuaremos con el trámite correspondiente y le mantendremos informado/a de cualquier novedad.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'nombre_documento', 'nombre_abogado'],
  },
  {
    slug: 'revision_completada',
    nombre: 'Revisión documental completada',
    asunto: 'Revisión completada — Expediente {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Le informamos que hemos completado la revisión documental de su expediente <strong>{{numero_expediente}}</strong> ({{tipo_procedimiento}}).</p>
  <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;">
    <p style="margin:0;">{{resumen_revision}}</p>
  </div>
  <p>{{mensaje_personalizado}}</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'tipo_procedimiento', 'resumen_revision', 'mensaje_personalizado', 'nombre_abogado'],
  },
  {
    slug: 'confirmacion_cita',
    nombre: 'Confirmación de cita',
    asunto: 'Cita confirmada — {{fecha_cita}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Le confirmamos la cita para su expediente <strong>{{numero_expediente}}</strong>:</p>
  <div style="background:#f8f9fa;border-left:4px solid #c9a84c;padding:16px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Fecha y hora:</strong> {{fecha_cita}}</p>
    <p style="margin:0 0 8px;"><strong>Lugar:</strong> {{lugar_cita}}</p>
    <p style="margin:0;"><strong>Tipo:</strong> {{tipo_cita}}</p>
  </div>
  <p>{{mensaje_personalizado}}</p>
  <p>Si necesita reprogramar, por favor contáctenos con al menos 24 horas de anticipación.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'fecha_cita', 'lugar_cita', 'tipo_cita', 'mensaje_personalizado', 'nombre_abogado'],
  },
  {
    slug: 'cierre_expediente',
    nombre: 'Cierre de expediente',
    asunto: 'Expediente cerrado — {{numero_expediente}}',
    cuerpoHtml: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e;">
  <div style="border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px;">
    <h2 style="color:#1a1a2e;margin:0;">Pineda y Asociados</h2>
    <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Bufete Jurídico</p>
  </div>
  <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
  <p>Le informamos que hemos procedido al cierre de su expediente <strong>{{numero_expediente}}</strong> ({{tipo_procedimiento}}).</p>
  <div style="background:#f8f9fa;border-left:4px solid #6b7280;padding:16px;margin:16px 0;">
    <p style="margin:0;"><strong>Motivo del cierre:</strong> {{motivo_cierre}}</p>
  </div>
  <p>{{mensaje_personalizado}}</p>
  <p>Agradecemos la confianza depositada en Pineda y Asociados. Quedamos a su disposición para cualquier consulta futura.</p>
  <p>Atentamente,<br><strong>{{nombre_abogado}}</strong><br>Pineda y Asociados</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:11px;color:#9ca3af;">Este mensaje es confidencial y está dirigido exclusivamente a su destinatario. Si lo ha recibido por error, por favor notifíquenoslo y elimínelo.</p>
</body>
</html>`,
    variablesPermitidas: ['nombre_cliente', 'numero_expediente', 'tipo_procedimiento', 'motivo_cierre', 'mensaje_personalizado', 'nombre_abogado'],
  },
];

async function main() {
  console.log('🌱 Sembrando plantillas de correo SGIE...\n');

  let creadas = 0;
  let existentes = 0;

  for (const p of PLANTILLAS) {
    const [existente] = await db
      .select({ id: plantillasCorreo.id })
      .from(plantillasCorreo)
      .where(eq(plantillasCorreo.slug, p.slug));

    if (existente) {
      console.log(`  ⏭  ${p.slug} (ya existe)`);
      existentes++;
      continue;
    }

    await db.insert(plantillasCorreo).values({
      slug: p.slug,
      nombre: p.nombre,
      asunto: p.asunto,
      cuerpoHtml: p.cuerpoHtml,
      variablesPermitidas: p.variablesPermitidas,
      estado: 'activa',
    });
    console.log(`  ✅ ${p.slug}`);
    creadas++;
  }

  console.log(`\n📊 Resultado: ${creadas} creadas, ${existentes} ya existentes (total ${PLANTILLAS.length})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error sembrando plantillas:', err);
  process.exit(1);
});
