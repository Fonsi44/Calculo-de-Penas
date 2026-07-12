import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { expedientes, expedienteAsignaciones, expedientePermisos, alertas, tareas, documentosExpediente, correosEnviados, clientes, tiposProcedimiento, usuarios } from '@/lib/schema';
import { and, eq, isNull, inArray, count, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const esAdmin = auth.rol === 'admin';

    // IDs de expedientes accesibles
    let accesibles: string[] | null = null;
    if (!esAdmin) {
      const [asignados, permitidos] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
          .where(and(eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
          .where(and(eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      const ids = new Set<string>();
      [...asignados, ...permitidos].forEach(r => ids.add(r.id));
      accesibles = Array.from(ids);
      if (accesibles.length === 0) {
        return Response.json({ expedientes: [], total: 0, metricas: { listosRevisar: 0, conFaltantes: 0, listosFirma: 0, alertasActivas: 0, tareasHoy: 0, documentosPendientes: 0, correosFallidos: 0, total: 0 } });
      }
    }

    const expCond = accesibles ? inArray(expedientes.id, accesibles) : undefined;
    const expWhere = expCond ?? undefined;

    // Expedientes
    const rows = await db.select({
      id: expedientes.id, numeroInterno: expedientes.numeroInterno, estado: expedientes.estado,
      prioridad: expedientes.prioridad, actualizadoEn: expedientes.actualizadoEn,
      clienteNombre: clientes.nombre, tipoProcedimientoNombre: tiposProcedimiento.nombre,
      responsableNombre: usuarios.nombre,
    }).from(expedientes).leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
      .leftJoin(usuarios, eq(expedientes.responsableId, usuarios.id))
      .where(expWhere).orderBy(desc(expedientes.actualizadoEn)).limit(50);

    // Métricas
    const listosRevisar = rows.filter(e => ['pendiente_validacion_abogado', 'analisis_completado'].includes(e.estado)).length;
    const conFaltantes = rows.filter(e => ['pendiente_de_documentos', 'enlace_enviado', 'documentos_parcialmente_recibidos', 'inconsistencias_detectadas'].includes(e.estado)).length;
    const listosFirma = rows.filter(e => e.estado === 'pendiente_de_firma').length;

    // Alertas activas
    let alertasCount = 0;
    if (accesibles) {
      const [r] = await db.select({ c: count() }).from(alertas)
        .where(and(inArray(alertas.expedienteId, accesibles), eq(alertas.resuelta, false)));
      alertasCount = r?.c ?? 0;
    } else {
      const [r] = await db.select({ c: count() }).from(alertas).where(eq(alertas.resuelta, false));
      alertasCount = r?.c ?? 0;
    }

    // Tareas pendientes
    let tareasCount = 0;
    if (accesibles) {
      const [r] = await db.select({ c: count() }).from(tareas)
        .where(and(inArray(tareas.expedienteId, accesibles), eq(tareas.estado, 'pendiente')));
      tareasCount = r?.c ?? 0;
    } else {
      const [r] = await db.select({ c: count() }).from(tareas).where(eq(tareas.estado, 'pendiente'));
      tareasCount = r?.c ?? 0;
    }

    // Documentos pendientes de aprobación
    let docsPendientes = 0;
    const docCondBase = eq(documentosExpediente.estado, 'pendiente_abogado');
    if (accesibles) {
      const [r] = await db.select({ c: count() }).from(documentosExpediente)
        .where(and(docCondBase, inArray(documentosExpediente.expedienteId, accesibles)));
      docsPendientes = r?.c ?? 0;
    } else {
      const [r] = await db.select({ c: count() }).from(documentosExpediente).where(docCondBase);
      docsPendientes = r?.c ?? 0;
    }

    // Correos fallidos (global, no scope)
    const [correosR] = await db.select({ c: count() }).from(correosEnviados).where(eq(correosEnviados.estado, 'fallido'));

    return Response.json({
      expedientes: rows,
      total: rows.length,
      metricas: {
        listosRevisar, conFaltantes, listosFirma,
        alertasActivas: alertasCount, tareasHoy: tareasCount,
        documentosPendientes: docsPendientes,
        correosFallidos: correosR?.c ?? 0,
        total: rows.length,
      },
    });
  } catch (err) { return authFailureResponse(err); }
}
