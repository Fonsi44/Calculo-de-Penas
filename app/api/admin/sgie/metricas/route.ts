import { requireAuth, authFailureResponse } from '@/lib/auth';
import { accessService } from '@/lib/access-service';
import { db } from '@/lib/db';
import {
  expedientes, documentosExpediente,
  extraccionesIa, correosEnviados, tareas, alertas, correccionesIa,
  jobsSgie, outboxEvents, comunicacionesOutbox,
} from '@/lib/schema';
import { count, eq, and, gte, sql } from 'drizzle-orm';
import { httpErrorResponse } from '@/lib/http-errors';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    await accessService.assertCapability(auth.userId, 'audit.read');
    if (auth.rol !== 'admin' && auth.rol !== 'administrador') {
      return Response.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalExp] = await db.select({ c: count() }).from(expedientes);
    const [expActivos] = await db.select({ c: count() }).from(expedientes).where(and(gte(expedientes.actualizadoEn, hace30Dias)));
    const [totalDocs] = await db.select({ c: count() }).from(documentosExpediente);
    const [docsProcesados] = await db.select({ c: count() }).from(documentosExpediente).where(and(gte(documentosExpediente.procesadoEn, hace30Dias)));

    const [iasTotal] = await db.select({ c: count() }).from(extraccionesIa);
    const [iasExitosas] = await db.select({ c: count() }).from(extraccionesIa).where(eq(extraccionesIa.exito, true));
    const [iasFallidas] = await db.select({ c: count() }).from(extraccionesIa).where(eq(extraccionesIa.exito, false));

    const [correosTotal] = await db.select({ c: count() }).from(correosEnviados);
    const [correosFallidos] = await db.select({ c: count() }).from(correosEnviados).where(eq(correosEnviados.estado, 'fallido'));

    const [tareasPendientes] = await db.select({ c: count() }).from(tareas).where(eq(tareas.estado, 'pendiente'));
    const [alertasActivas] = await db.select({ c: count() }).from(alertas).where(eq(alertas.resuelta, false));
    const [correccionesCount] = await db.select({ c: count() }).from(correccionesIa);

    const [jobsPendientes] = await db.select({ c: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'pendiente'));
    const [jobsFallidos] = await db.select({ c: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'fallido'));
    const [outboxPendientes] = await db.select({ c: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'pending'));
    const [outboxFallidos] = await db.select({ c: count() }).from(outboxEvents).where(eq(outboxEvents.status, 'failed'));
    const [comsPendientes] = await db.select({ c: count() }).from(comunicacionesOutbox).where(eq(comunicacionesOutbox.estado, 'pending'));
    const [comsFallidas] = await db.select({ c: count() }).from(comunicacionesOutbox).where(eq(comunicacionesOutbox.estado, 'failed'));

    const estadosRaw = await db.execute(
      sql`SELECT estado, COUNT(*)::int as total FROM expedientes GROUP BY estado ORDER BY total DESC`,
    );
    const expPorEstado = ((estadosRaw as unknown) as { rows: Array<{ estado: string; total: number }> }).rows ?? [];

    return Response.json({
      timestamp: new Date().toISOString(),
      totalExpedientes: Number(totalExp?.c ?? 0),
      expedientesActivos30d: Number(expActivos?.c ?? 0),
      totalDocumentos: Number(totalDocs?.c ?? 0),
      documentosProcesados30d: Number(docsProcesados?.c ?? 0),
      totalExtraccionesIa: Number(iasTotal?.c ?? 0),
      iaExitosas: Number(iasExitosas?.c ?? 0),
      iaFallidas: Number(iasFallidas?.c ?? 0),
      tasaExitoIa: iasTotal?.c ? Math.round((Number(iasExitosas?.c ?? 0) / Number(iasTotal.c)) * 100) : 0,
      totalCorreos: Number(correosTotal?.c ?? 0),
      correosFallidos: Number(correosFallidos?.c ?? 0),
      tareasPendientes: Number(tareasPendientes?.c ?? 0),
      alertasActivas: Number(alertasActivas?.c ?? 0),
      totalCorreccionesIa: Number(correccionesCount?.c ?? 0),
      jobsPendientes: Number(jobsPendientes?.c ?? 0),
      jobsFallidos: Number(jobsFallidos?.c ?? 0),
      outboxPendientes: Number(outboxPendientes?.c ?? 0),
      outboxFallidos: Number(outboxFallidos?.c ?? 0),
      comunicacionesPendientes: Number(comsPendientes?.c ?? 0),
      comunicacionesFallidas: Number(comsFallidas?.c ?? 0),
      expPorEstado,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return httpErrorResponse(err, request);
  }
}
