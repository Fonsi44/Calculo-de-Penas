import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { expedientes, extraccionesIa, correosEnviados, documentosExpediente, expedienteAsignaciones, expedientePermisos } from '@/lib/schema';
import { and, eq, isNull, count, inArray } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

/** GET /api/sgie/metricas/autonomia — KPIs de autonomía del SGIE. Scope por abogado. */
export async function GET(req: Request) {
  try {
    const auth = await requireAbogado(req);
    const rl = await rateLimit(`sgie:metrics:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const esAdmin = auth.rol === 'admin';
    let ids: string[] = [];

    if (!esAdmin) {
      const [asig, perm] = await Promise.all([
        db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones).where(and(eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn))),
        db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos).where(and(eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn))),
      ]);
      ids = [...new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)])];
      if (ids.length === 0) {
        return Response.json({ listos_para_revision: 0, bloqueados_por_cliente: 0, documentos_completos: 0, documentos_faltantes: 0, expedientes_devueltos: 0, recordatorios_enviados: 0, docs_con_ia_completada: 0 });
      }
    }

    const expWhere = !esAdmin ? inArray(expedientes.id, ids) : undefined;
    const baseCond = expWhere ? and(isNull(expedientes.cerradoEn), expWhere) : isNull(expedientes.cerradoEn);

    // Para extracciones IA: necesita join con documentosExpediente → expedienteId
    let iaDocsPromise: Promise<{ c: number }[]>;
    if (!esAdmin && ids.length > 0) {
      iaDocsPromise = db.select({ c: count() }).from(extraccionesIa)
        .innerJoin(documentosExpediente, eq(extraccionesIa.documentoId, documentosExpediente.id))
        .where(and(
          eq(extraccionesIa.runStatus, 'completed' as never),
          eq(extraccionesIa.exito, true),
          inArray(documentosExpediente.expedienteId, ids),
        ));
    } else {
      iaDocsPromise = db.select({ c: count() }).from(extraccionesIa)
        .where(and(eq(extraccionesIa.runStatus, 'completed' as never), eq(extraccionesIa.exito, true)));
    }

    let recordatoriosPromise: Promise<{ c: number }[]>;
    if (!esAdmin && ids.length > 0) {
      recordatoriosPromise = db.select({ c: count() }).from(correosEnviados)
        .where(and(
          eq(correosEnviados.plantillaSlug, 'primer_recordatorio' as never),
          inArray(correosEnviados.expedienteId, ids),
        ));
    } else {
      recordatoriosPromise = db.select({ c: count() }).from(correosEnviados)
        .where(eq(correosEnviados.plantillaSlug, 'primer_recordatorio' as never));
    }

    const [[listos], [bloqueados], [docsCompletos], [docsFaltantes], [devueltos], [recordatorios], [iaDocs]] = await Promise.all([
      db.select({ c: count() }).from(expedientes).where(and(baseCond, eq(expedientes.estado, 'listo_para_revision' as never))),
      db.select({ c: count() }).from(expedientes).where(and(baseCond, eq(expedientes.estado, 'bloqueado_por_cliente' as never))),
      db.select({ c: count() }).from(expedientes).where(and(baseCond, eq(expedientes.estado, 'documentos_completos' as never))),
      db.select({ c: count() }).from(expedientes).where(and(baseCond, eq(expedientes.estado, 'pendiente_de_documentos' as never))),
      db.select({ c: count() }).from(expedientes).where(and(baseCond, eq(expedientes.estado, 'devuelto_por_abogado' as never))),
      recordatoriosPromise,
      iaDocsPromise,
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
