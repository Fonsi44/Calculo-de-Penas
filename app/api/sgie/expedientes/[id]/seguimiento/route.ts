import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { verificarAccesoExpediente, type ContextoAbogado } from '@/lib/sgie/expedientes-db';
import { calcularEstadoDocumental } from '@/lib/sgie/seguimiento-documental';
import { db } from '@/lib/db';
import {
  expedientes,
  requisitosExpediente,
  enlacesMagicos,
  correosEnviados,
} from '@/lib/schema';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

/**
 * GET /api/sgie/expedientes/:id/seguimiento
 *
 * Resumen de seguimiento documental de un expediente: requisitos pendientes/
 * recibidos, último recordatorio, estado del enlace mágico activo y estado
 * documental calculado. Acceso por abogado con scope.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAbogado(request);
    const { id } = await params;
    const ctx: ContextoAbogado = {
      usuarioId: auth.userId,
      rol: auth.rol,
      esAdmin: auth.rol === 'admin',
    };
    const tieneAcceso = await verificarAccesoExpediente(id, ctx);
    if (!tieneAcceso) {
      return Response.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const [exp] = await db
      .select({ id: expedientes.id, estado: expedientes.estado, numeroInterno: expedientes.numeroInterno })
      .from(expedientes)
      .where(eq(expedientes.id, id));

    const requisitos = await db
      .select({
        id: requisitosExpediente.id,
        nombre: requisitosExpediente.nombre,
        tipo: requisitosExpediente.tipo,
        estado: requisitosExpediente.estado,
        orden: requisitosExpediente.orden,
        confirmado: requisitosExpediente.confirmado,
      })
      .from(requisitosExpediente)
      .where(eq(requisitosExpediente.expedienteId, id))
      .orderBy(requisitosExpediente.orden);

    const estadoDocumental = calcularEstadoDocumental(
      requisitos.map((r) => ({
        tipo: r.tipo,
        estado: r.estado,
        confirmado: r.confirmado,
        noAplica: r.confirmado === true && r.estado === 'aprobado',
      })),
    );

    // Enlace mágico activo más reciente (no revocado, con usos).
    const [enlace] = await db
      .select({
        id: enlacesMagicos.id,
        expiraEn: enlacesMagicos.expiraEn,
        usosMaximos: enlacesMagicos.usosMaximos,
        usosActuales: enlacesMagicos.usosActuales,
        creadoEn: enlacesMagicos.creadoEn,
        revocadoEn: enlacesMagicos.revocadoEn,
      })
      .from(enlacesMagicos)
      .where(
        and(
          eq(enlacesMagicos.expedienteId, id),
          isNull(enlacesMagicos.revocadoEn),
        ),
      )
      .orderBy(desc(enlacesMagicos.creadoEn))
      .limit(1);

    const enlaceActivo =
      !!enlace &&
      enlace.expiraEn &&
      new Date(enlace.expiraEn) > new Date() &&
      (enlace.usosMaximos === null || enlace.usosActuales === null || enlace.usosActuales < enlace.usosMaximos);

    // Último recordatorio/solicitud enviado.
    const [ultimoEmail] = await db
      .select({
        slug: correosEnviados.plantillaSlug,
        estado: correosEnviados.estado,
        enviadoEn: correosEnviados.enviadoEn,
        creadoEn: correosEnviados.creadoEn,
      })
      .from(correosEnviados)
      .where(
        and(
          eq(correosEnviados.expedienteId, id),
          inArray(correosEnviados.plantillaSlug, [
            'solicitud_documental',
            'primer_recordatorio',
            'segundo_recordatorio',
            'aviso_bloqueo',
          ]),
        ),
      )
      .orderBy(desc(correosEnviados.creadoEn))
      .limit(1);

    const pendientes = requisitos.filter(
      (r) => r.tipo === 'obligatorio' && r.confirmado !== true && !['subido', 'aprobado', 'texto_extraido', 'clasificado', 'ia_procesada'].includes(r.estado),
    ).length;

    return Response.json({
      expediente: { id: exp?.id, numeroInterno: exp?.numeroInterno, estado: exp?.estado },
      estadoDocumental,
      requisitos: requisitos.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        estado: r.estado,
        orden: r.orden,
        confirmado: r.confirmado,
        noAplica: r.confirmado === true && r.estado === 'aprobado',
      })),
      pendientesObligatorios: pendientes,
      enlace: enlace
        ? {
            id: enlace.id,
            activo: enlaceActivo,
            expiraEn: enlace.expiraEn,
            usosActuales: enlace.usosActuales,
            usosMaximos: enlace.usosMaximos,
            creadoEn: enlace.creadoEn,
          }
        : null,
      ultimoEmail: ultimoEmail
        ? {
            slug: ultimoEmail.slug,
            estado: ultimoEmail.estado,
            fecha: ultimoEmail.enviadoEn ?? ultimoEmail.creadoEn,
          }
        : null,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}
