import { db } from '@/lib/db';
import {
  procedimientoVersiones,
  procedimientoFases,
  procedimientoTransiciones,
  expedienteFases,
  historialExpediente,
  type ProcedimientoTransicion,
  type ExpedienteFase,
} from '@/lib/schema';
import { and, eq, asc, desc, isNull } from 'drizzle-orm';
import { logSgie } from '@/lib/sgie/auditoria-sgie';

export interface InstanciarWorkflowResult {
  versionId: string;
  fases: ExpedienteFase[];
}

export async function instanciarWorkflow(
  expedienteId: string,
  tipoProcedimientoId: string,
  _creadoPor: string,
): Promise<InstanciarWorkflowResult> {
  const [version] = await db
    .select()
    .from(procedimientoVersiones)
    .where(
      and(
        eq(procedimientoVersiones.procedimientoId, tipoProcedimientoId),
        eq(procedimientoVersiones.estado, 'activo'),
      ),
    )
    .orderBy(desc(procedimientoVersiones.version))
    .limit(1);

  if (!version) {
    throw new Error(`No se encontró una versión aprobada para el procedimiento ${tipoProcedimientoId}`);
  }

  const fasesTemplate = await db
    .select()
    .from(procedimientoFases)
    .where(eq(procedimientoFases.procedimientoVersionId, version.id))
    .orderBy(asc(procedimientoFases.orden));

  if (fasesTemplate.length === 0) {
    return { versionId: version.id, fases: [] };
  }

  const fasesInstanciadas = fasesTemplate.map((ft, i) => ({
    expedienteId,
    faseId: ft.id,
    entradaEn: i === 0 ? new Date() : null,
    salidaEn: null,
    metadata: { nombre: ft.nombre, orden: ft.orden, estado: i === 0 ? 'activa' : 'pendiente' },
  }));

  const insertadas = await db
    .insert(expedienteFases)
    .values(fasesInstanciadas)
    .returning();

  return { versionId: version.id, fases: insertadas };
}

export interface TransitarFaseResult {
  ok: boolean;
  faseOrigenAnterior: string;
  faseDestinoNuevo: string;
}

export async function transitarFase(
  expedienteId: string,
  faseOrigenId: string,
  faseDestinoId: string,
  actorTipo: 'abogado' | 'admin' | 'sistema',
  actorId: string,
): Promise<TransitarFaseResult> {
  const [faseOrigen] = await db
    .select({
      id: expedienteFases.id,
      faseId: expedienteFases.faseId,
      salidaEn: expedienteFases.salidaEn,
      metadata: expedienteFases.metadata,
    })
    .from(expedienteFases)
    .where(
      and(
        eq(expedienteFases.id, faseOrigenId),
        eq(expedienteFases.expedienteId, expedienteId),
      ),
    );

  if (!faseOrigen) throw new Error('Fase de origen no encontrada');
  if (faseOrigen.salidaEn) throw new Error('La fase de origen ya está completada');

  const [faseDestino] = await db
    .select({
      id: expedienteFases.id,
      faseId: expedienteFases.faseId,
      entradaEn: expedienteFases.entradaEn,
      metadata: expedienteFases.metadata,
    })
    .from(expedienteFases)
    .where(
      and(
        eq(expedienteFases.id, faseDestinoId),
        eq(expedienteFases.expedienteId, expedienteId),
      ),
    );

  if (!faseDestino) throw new Error('Fase de destino no encontrada');
  if (faseDestino.entradaEn) throw new Error('La fase de destino ya fue iniciada');

  const [transicion] = await db
    .select()
    .from(procedimientoTransiciones)
    .where(
      and(
        eq(procedimientoTransiciones.desdeFaseId, faseOrigen.faseId),
        eq(procedimientoTransiciones.haciaFaseId, faseDestino.faseId),
      ),
    );

  if (!transicion) throw new Error('Transición no permitida entre las fases especificadas');

  if (transicion.actoresPermitidos && !transicion.actoresPermitidos.includes(actorTipo)) {
    throw new Error(`El actor "${actorTipo}" no está autorizado para esta transición`);
  }

  const [templateOrigen] = await db
    .select({ nombre: procedimientoFases.nombre })
    .from(procedimientoFases)
    .where(eq(procedimientoFases.id, faseOrigen.faseId))
    .limit(1);

  const [templateDestino] = await db
    .select({ nombre: procedimientoFases.nombre })
    .from(procedimientoFases)
    .where(eq(procedimientoFases.id, faseDestino.faseId))
    .limit(1);

  const nombreOrigen = templateOrigen?.nombre ?? 'desconocida';
  const nombreDestino = templateDestino?.nombre ?? 'desconocida';

  await db.transaction(async (tx) => {
    await tx
      .update(expedienteFases)
      .set({ salidaEn: new Date() })
      .where(eq(expedienteFases.id, faseOrigen.id));

    await tx
      .update(expedienteFases)
      .set({ entradaEn: new Date() })
      .where(eq(expedienteFases.id, faseDestino.id));

    await tx.insert(historialExpediente).values({
      expedienteId,
      accion: 'fase_transicionada',
      estadoAnterior: nombreOrigen,
      estadoNuevo: nombreDestino,
      actorId: actorId || null,
      actorTipo,
      metadata: {
        faseOrigenId: faseOrigen.id,
        faseDestinoId: faseDestino.id,
        transicionNombre: transicion.nombre,
      },
      mensaje: `Transición: ${nombreOrigen} → ${nombreDestino}`,
    });
  });

  await logSgie({
    usuarioId: actorId,
    accion: 'expediente_estado_changed',
    recurso: 'expediente_fase',
    recursoId: expedienteId,
    metadata: {
      faseOrigen: nombreOrigen,
      faseDestino: nombreDestino,
      transicionNombre: transicion.nombre,
    },
    exito: true,
  });

  return {
    ok: true,
    faseOrigenAnterior: nombreOrigen,
    faseDestinoNuevo: nombreDestino,
  };
}

export async function obtenerFaseActual(expedienteId: string): Promise<(ExpedienteFase & { nombre: string }) | null> {
  const [fase] = await db
    .select({
      id: expedienteFases.id,
      expedienteId: expedienteFases.expedienteId,
      faseId: expedienteFases.faseId,
      metadata: expedienteFases.metadata,
      entradaEn: expedienteFases.entradaEn,
      salidaEn: expedienteFases.salidaEn,
      creadoEn: expedienteFases.creadoEn,
      nombre: procedimientoFases.nombre,
    })
    .from(expedienteFases)
    .innerJoin(procedimientoFases, eq(expedienteFases.faseId, procedimientoFases.id))
    .where(
      and(
        eq(expedienteFases.expedienteId, expedienteId),
        isNull(expedienteFases.salidaEn),
      ),
    )
    .orderBy(desc(expedienteFases.entradaEn))
    .limit(1);

  return fase ?? null;
}

export interface WorkflowCompleto {
  fases: Array<ExpedienteFase & { nombreTemplate: string; estado: string }>;
  transiciones: ProcedimientoTransicion[];
}

export async function obtenerWorkflow(expedienteId: string): Promise<WorkflowCompleto> {
  const fases = await db
    .select({
      id: expedienteFases.id,
      expedienteId: expedienteFases.expedienteId,
      faseId: expedienteFases.faseId,
      metadata: expedienteFases.metadata,
      entradaEn: expedienteFases.entradaEn,
      salidaEn: expedienteFases.salidaEn,
      creadoEn: expedienteFases.creadoEn,
    })
    .from(expedienteFases)
    .where(eq(expedienteFases.expedienteId, expedienteId))
    .orderBy(asc(expedienteFases.creadoEn));

  if (fases.length === 0) return { fases: [], transiciones: [] };

  const fasesCompletas = await Promise.all(
    fases.map(async (f) => {
      const [tpl] = await db
        .select({ nombre: procedimientoFases.nombre, procedimientoVersionId: procedimientoFases.procedimientoVersionId })
        .from(procedimientoFases)
        .where(eq(procedimientoFases.id, f.faseId))
        .limit(1);
      const estado = !f.entradaEn ? 'pendiente' : f.salidaEn ? 'completada' : 'activa';
      return { ...f, nombreTemplate: tpl?.nombre ?? 'desconocida', estado };
    }),
  );

  const [firstFase] = fasesCompletas;
  const [tpl] = await db
    .select({ procedimientoVersionId: procedimientoFases.procedimientoVersionId })
    .from(procedimientoFases)
    .where(eq(procedimientoFases.id, firstFase.faseId))
    .limit(1);

  let transiciones: ProcedimientoTransicion[] = [];
  if (tpl?.procedimientoVersionId) {
    transiciones = await db
      .select()
      .from(procedimientoTransiciones)
      .where(eq(procedimientoTransiciones.procedimientoVersionId, tpl.procedimientoVersionId));
  }

  return { fases: fasesCompletas, transiciones };
}

export async function validarVersionAprobada(tipoProcedimientoId: string): Promise<boolean> {
  const [version] = await db
    .select({ id: procedimientoVersiones.id })
    .from(procedimientoVersiones)
    .where(
      and(
        eq(procedimientoVersiones.procedimientoId, tipoProcedimientoId),
        eq(procedimientoVersiones.estado, 'activo'),
      ),
    )
    .orderBy(desc(procedimientoVersiones.version))
    .limit(1);

  return !!version;
}
