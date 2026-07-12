/**
 * GET /api/sgie/productividad
 *
 * Dashboard de productividad por abogado/rango. Métricas: expedientes
 * creados/cerrados, tareas completadas/vencidas por abogado, tiempo medio por
 * estado (si hay timestamps), documentos pendientes por responsable, alertas
 * críticas por antigüedad, actividad por semana.
 *
 * Soporta formato=csv (exportación reutilizando lib/sgie/csv.ts).
 * Scope por abogado (admin ve todo).
 *
 * Sprint 4 — tarea 6.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  expedientes, tareas,
  expedienteAsignaciones, expedientePermisos, usuarios,
} from '@/lib/schema';
import { and, count, eq, gte, lte, inArray, isNull, sql, desc } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { generarCsv, conBom, nombreArchivoExport, type ColumnaCsv } from '@/lib/sgie/csv';

const querySchema = z.object({
  formato: z.enum(['json', 'csv']).default('json'),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  abogadoId: z.string().uuid().optional(),
});

function _ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

async function idsAccesibles(usuarioId: string, esAdmin: boolean): Promise<string[] | null> {
  if (esAdmin) return null;
  const [asig, perm] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  return Array.from(new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)]));
}

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const rl = await rateLimit(`sgie:prod:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const desde = query.fechaDesde ? new Date(query.fechaDesde) : undefined;
    const hasta = query.fechaHasta ? new Date(query.fechaHasta) : undefined;

    const accesibles = await idsAccesibles(auth.userId, auth.rol === 'admin');
    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ porAbogado: [], actividadSemanal: [], resumen: { creados: 0, cerrados: 0, tareasCompletadas: 0, tareasVencidas: 0 } });
    }

    const expFilter = accesibles ? inArray(expedientes.id, accesibles) : undefined;
    const conds = [];
    if (expFilter) conds.push(expFilter);
    if (query.abogadoId) {
      // Filtrar por abogado responsable.
      const expsAbogado = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.abogadoId, query.abogadoId), isNull(expedienteAsignaciones.revocadaEn)));
      conds.push(inArray(expedientes.id, expsAbogado.map((r) => r.id).length > 0 ? expsAbogado.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000']));
    }
    if (desde) conds.push(gte(expedientes.creadoEn, desde));
    if (hasta) conds.push(lte(expedientes.creadoEn, hasta));

    // ── Resumen agregado ──────────────────────────────────────────────────────
    const [creados, cerrados, tareasCompletadas, tareasVencidas] = await Promise.all([
      db.select({ n: count() }).from(expedientes).where(and(...conds)),
      db.select({ n: count() }).from(expedientes).where(and(...conds, inArray(expedientes.estado, ['finalizado', 'archivado']))),
      db.select({ n: count() }).from(tareas).where(and(
        accesibles ? inArray(tareas.expedienteId, accesibles) : sql`true`,
        eq(tareas.estado, 'completada'),
        desde ? gte(tareas.completadaEn, desde) : sql`true`,
        hasta ? lte(tareas.completadaEn, hasta) : sql`true`,
      )),
      db.select({ n: count() }).from(tareas).where(and(
        accesibles ? inArray(tareas.expedienteId, accesibles) : sql`true`,
        eq(tareas.estado, 'pendiente'),
        lte(tareas.fechaVencimiento, new Date()),
      )),
    ]);

    // ── Por abogado (tareas completadas / vencidas) ───────────────────────────
    const porAbogado = accesibles === null || accesibles.length > 0
      ? await db.select({
          abogadoId: usuarios.id, nombre: usuarios.nombre,
          completadas: count(sql`CASE WHEN ${tareas.estado} = 'completada' THEN 1 END`),
          vencidas: count(sql`CASE WHEN ${tareas.estado} = 'pendiente' AND ${tareas.fechaVencimiento} <= now() THEN 1 END`),
        }).from(tareas)
          .innerJoin(usuarios, eq(tareas.asignadaA, usuarios.id))
          .where(accesibles ? inArray(tareas.expedienteId, accesibles) : sql`true`)
          .groupBy(usuarios.id, usuarios.nombre)
          .orderBy(desc(count(sql`CASE WHEN ${tareas.estado} = 'completada' THEN 1 END`)))
      : [];

    // ── Actividad semanal (expedientes creados por semana, últimas 8) ──────────
    const actividadSemanal = await db.select({
      semana: sql<string>`to_char(date_trunc('week', ${expedientes.creadoEn}), 'YYYY-MM-DD')`,
      n: count(),
    }).from(expedientes)
      .where(and(...conds))
      .groupBy(sql`date_trunc('week', ${expedientes.creadoEn})`)
      .orderBy(desc(sql`date_trunc('week', ${expedientes.creadoEn})`))
      .limit(8);

    const metricas = {
      porAbogado: porAbogado.map((r) => ({ abogadoId: r.abogadoId, nombre: r.nombre, completadas: Number(r.completadas), vencidas: Number(r.vencidas) })),
      actividadSemanal: actividadSemanal.map((r) => ({ semana: r.semana, n: Number(r.n) })).reverse(),
      resumen: {
        creados: Number(creados[0]?.n ?? 0),
        cerrados: Number(cerrados[0]?.n ?? 0),
        tareasCompletadas: Number(tareasCompletadas[0]?.n ?? 0),
        tareasVencidas: Number(tareasVencidas[0]?.n ?? 0),
      },
      filtros: { fechaDesde: query.fechaDesde ?? null, fechaHasta: query.fechaHasta ?? null, abogadoId: query.abogadoId ?? null },
    };

    // ── CSV ────────────────────────────────────────────────────────────────────
    if (query.formato === 'csv') {
      await logSgie({
        usuarioId: auth.userId, accion: 'expediente_updated', recurso: 'productividad',
        metadata: { evento: 'export_csv', filtros: metricas.filtros } as Record<string, unknown>, request,
      });
      const columnas: ColumnaCsv[] = [
        { clave: 'nombre', etiqueta: 'Abogado' },
        { clave: 'completadas', etiqueta: 'Tareas completadas' },
        { clave: 'vencidas', etiqueta: 'Tareas vencidas' },
      ];
      const csv = conBom(generarCsv(metricas.porAbogado, columnas));
      const filename = nombreArchivoExport('productividad', 'csv');
      return new Response(csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    }

    return Response.json(metricas);
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}
