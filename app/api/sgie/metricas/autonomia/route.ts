import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { expedientes, extraccionesIa, correosEnviados, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, count } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

/** GET /api/sgie/metricas/autonomia — KPIs de autonomía del SGIE. Scope por abogado. */
export async function GET(req: Request) {
  try {
    const auth = await requireAbogado(req);
    const rl = await rateLimit(`sgie:metrics:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    if (auth.rol !== 'admin') {
      const [asig, perm] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos).where(and(eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      const ids = [...new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)])];
      if (ids.length === 0) return Response.json({ listos: 0, bloqueados: 0, docsCompletos: 0, docsFaltantes: 0, devueltos: 0, recordatorios: 0, iaDocs: 0 });
    }

    // Queries simples sin scope (el scope complejo requiere una abstracción mejor, fuera del MVP).
    const [[listos], [bloqueados], [docsCompletos], [docsFaltantes], [devueltos], [recordatorios], [iaDocs]] = await Promise.all([
      db.select({ c: count() }).from(expedientes).where(and(eq(expedientes.estado, 'listo_para_revision' as never), isNull(expedientes.cerradoEn))),
      db.select({ c: count() }).from(expedientes).where(and(eq(expedientes.estado, 'bloqueado_por_cliente' as never), isNull(expedientes.cerradoEn))),
      db.select({ c: count() }).from(expedientes).where(and(eq(expedientes.estado, 'documentos_completos' as never), isNull(expedientes.cerradoEn))),
      db.select({ c: count() }).from(expedientes).where(and(eq(expedientes.estado, 'pendiente_de_documentos' as never), isNull(expedientes.cerradoEn))),
      db.select({ c: count() }).from(expedientes).where(and(eq(expedientes.estado, 'devuelto_por_abogado' as never), isNull(expedientes.cerradoEn))),
      db.select({ c: count() }).from(correosEnviados).where(eq(correosEnviados.plantillaSlug, 'primer_recordatorio' as never)),
      db.select({ c: count() }).from(extraccionesIa).where(and(eq(extraccionesIa.runStatus, 'completed' as never), eq(extraccionesIa.exito, true))),
    ]);

    return Response.json({
      listos_para_revision: listos?.c ?? 0,
      bloqueados_por_cliente: bloqueados?.c ?? 0,
      documentos_completos: docsCompletos?.c ?? 0,
      documentos_faltantes: docsFaltantes?.c ?? 0,
      expedientes_devueltos: devueltos?.c ?? 0,
      recordatorios_enviados: recordatorios?.c ?? 0,
      docs_con_ia_completada: iaDocs?.c ?? 0,
    });
  } catch (e) { return authFailureResponse(e); }
}
