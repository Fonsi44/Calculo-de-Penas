import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  expedientes, documentosExpediente,
  extraccionesIa, correosEnviados, tareas, alertas, correccionesIa,
} from '@/lib/schema';
import { count, eq, and, sql, gte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    if (auth.rol !== 'admin') return Response.json({ error: 'Solo admin' }, { status: 403 });

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

    // Agrupaciones
    const estadosRaw = await db.execute(
      sql`SELECT estado, COUNT(*)::int as total FROM expedientes GROUP BY estado ORDER BY total DESC`
    );
    const expPorEstado = ((estadosRaw as unknown) as { rows: Array<{ estado: string; total: number }> }).rows ?? [];

    const abogadosRaw = await db.execute(
      sql`SELECT u.nombre, COUNT(ea.expediente_id)::int as total
      FROM expediente_asignaciones ea
      JOIN usuarios u ON u.id = ea.abogado_id
      WHERE ea.revocada_en IS NULL
      GROUP BY u.nombre ORDER BY total DESC`
    );
    const expPorAbogado = ((abogadosRaw as unknown) as { rows: Array<{ nombre: string; total: number }> }).rows ?? [];

    return Response.json({
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
      expPorEstado,
      expPorAbogado,
    });
  } catch (err) { return authFailureResponse(err); }
}
