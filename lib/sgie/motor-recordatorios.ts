/**
 * SGIE — Motor de recordatorios documentales (job, Fase 2).
 *
 * Job idempotente que recorre expedientes en estados de espera documental
 * ('enlace_enviado', 'documentos_parcialmente_recibidos', 'pendiente_de_documentos')
 * con obligatorios pendientes y, según los días desde la última actividad de
 * email, dispara primer/segundo recordatorio, aviso de bloqueo o bloqueo por
 * cliente. Crea tarea/alerta interna (escalado al responsable) si aplica.
 *
 * IDEMPOTENCIA: cada recordatorio se registra en `correos_enviados` con
 * ventana_temporal única (slug + expediente + ventana); el job no reenvía lo
 * ya enviado y nunca bloquea dos veces.
 *
 * SIN IA/OCR. SGIE no calcula plazos legales: los días son umbrales
 * operativos internos. Referencia: docs/implementation/mvp-fase-2-...
 */
import { db } from '@/lib/db';
import { expedientes, requisitosExpediente, correosEnviados, tareas, alertas } from '@/lib/schema';
import { and, eq, inArray, isNull, desc } from 'drizzle-orm';
import { accionSegunDias } from './config-seguimiento';
import {
  enviarRecordatorio,
  enviarAvisoBloqueo,
} from './recordatorios-cliente';
import { bloquearExpedientePorCliente } from './seguimiento-documental';
import { logSgie } from './auditoria-sgie';

const ESTADOS_EN_SEGUIMIENTO = [
  'enlace_enviado',
  'documentos_parcialmente_recibidos',
  'pendiente_de_documentos',
] as const;

export interface ResumenRecordatorios {
  revisados: number;
  recordatoriosEnviados: number;
  avisosBloqueo: number;
  bloqueados: number;
  errores: string[];
}

/**
 * Cuenta cuántos recordatorios (slug primer/segundo) se han enviado a un
 * expediente, mirando `correos_enviados`.
 */
async function contarRecordatoriosEnviados(expedienteId: string): Promise<number> {
  const rows = await db
    .select({ id: correosEnviados.id })
    .from(correosEnviados)
    .where(
      and(
        eq(correosEnviados.expedienteId, expedienteId),
        inArray(correosEnviados.plantillaSlug, ['primer_recordatorio', 'segundo_recordatorio']),
      ),
    );
  return rows.length;
}

/**
 * Fecha de referencia para el conteo de días: el máximo entre la creación del
 * expediente y el envío del último correo de seguimiento (solicitud o
 * recordatorio). Si no hay correos, usa la fecha de creación del expediente.
 */
async function fechaReferencia(expedienteId: string, creadoEn: Date | null): Promise<Date> {
  const [ultimo] = await db
    .select({ enviadoEn: correosEnviados.enviadoEn, creadoEn: correosEnviados.creadoEn })
    .from(correosEnviados)
    .where(
      and(
        eq(correosEnviados.expedienteId, expedienteId),
        inArray(correosEnviados.plantillaSlug, [
          'solicitud_documental',
          'primer_recordatorio',
          'segundo_recordatorio',
        ]),
      ),
    )
    .orderBy(desc(correosEnviados.creadoEn))
    .limit(1);
  const fallback = creadoEn ?? new Date(0);
  if (!ultimo) return fallback;
  return (ultimo.enviadoEn ?? ultimo.creadoEn) ?? fallback;
}

/** ¿El expediente tiene obligatorios pendientes (no satisfechos/no_aplica)? */
async function tieneObligatoriosPendientes(expedienteId: string): Promise<boolean> {
  const SATISFECHOS = ['subido', 'aprobado', 'texto_extraido', 'clasificado', 'ia_procesada'];
  const rows = await db
    .select({ estado: requisitosExpediente.estado, confirmado: requisitosExpediente.confirmado })
    .from(requisitosExpediente)
    .where(
      and(
        eq(requisitosExpediente.expedienteId, expedienteId),
        eq(requisitosExpediente.tipo, 'obligatorio'),
      ),
    );
  return rows.some((r) => !SATISFECHOS.includes(r.estado) && r.confirmado !== true);
}

/** Actor sistema para auditoría de acciones automáticas. */
const ACTOR_SISTEMA = '00000000-0000-0000-0000-000000000000';

/**
 * Procesa los expedientes en seguimiento y dispara las acciones que tocan.
 * Idempotente: seguro llamarlo varias veces al día.
 */
export async function procesarRecordatoriosPendientes(): Promise<ResumenRecordatorios> {
  const resumen: ResumenRecordatorios = {
    revisados: 0,
    recordatoriosEnviados: 0,
    avisosBloqueo: 0,
    bloqueados: 0,
    errores: [],
  };

  let expedientesEnEspera: Array<{ id: string; creadoEn: Date | null; responsableId: string | null }>;
  try {
    expedientesEnEspera = await db
      .select({
        id: expedientes.id,
        creadoEn: expedientes.creadoEn,
        responsableId: expedientes.responsableId,
      })
      .from(expedientes)
      .where(
        and(
          inArray(expedientes.estado, [...ESTADOS_EN_SEGUIMIENTO]),
          isNull(expedientes.cerradoEn),
        ),
      )
      .limit(200);
  } catch (err) {
    resumen.errores.push(`consulta expedientes: ${(err as Error).message}`);
    return resumen;
  }

  for (const exp of expedientesEnEspera) {
    resumen.revisados++;
    try {
      const pendientes = await tieneObligatoriosPendientes(exp.id);
      if (!pendientes) continue; // nada que recordar

      const ref = await fechaReferencia(exp.id, exp.creadoEn);
      const dias = Math.floor((Date.now() - ref.getTime()) / 86_400_000);
      const enviados = await contarRecordatoriosEnviados(exp.id);
      const accion = accionSegunDias(dias, enviados);

      if (accion === 'ninguna') continue;

      const actor = exp.responsableId ?? ACTOR_SISTEMA;

      if (accion === 'primer' || accion === 'segundo') {
        const numero = accion === 'primer' ? 1 : 2;
        const r = await enviarRecordatorio(exp.id, numero, actor);
        if (r.enviado) resumen.recordatoriosEnviados++;
      } else if (accion === 'aviso_bloqueo') {
        const r = await enviarAvisoBloqueo(exp.id, actor);
        if (r.enviado) resumen.avisosBloqueo++;
      } else if (accion === 'bloquear') {
        await bloquearExpedientePorCliente(exp.id, actor);
        resumen.bloqueados++;
        // Escalado interno: tarea + alerta al responsable.
        await crearEscaladoInterno(exp.id, exp.responsableId, 'expediente bloqueado por falta de respuesta del cliente');
      }
    } catch (err) {
      resumen.errores.push(`expediente ${exp.id}: ${(err as Error).message}`);
    }
  }

  return resumen;
}

/**
 * Crea una tarea y una alerta interna de escalado (si el modelo lo permite) y
 * registra auditoría de escalado. No rompe si la inserción falla: el flujo
 * principal (bloqueo) ya completó su acción.
 */
async function crearEscaladoInterno(
  expedienteId: string,
  responsableId: string | null,
  mensaje: string,
): Promise<void> {
  try {
    await db.insert(tareas).values({
      expedienteId,
      asignadaA: responsableId,
      titulo: 'Escalado: expediente bloqueado por cliente',
      descripcion: mensaje,
      estado: 'pendiente',
      prioridad: 'alta',
      automatica: true,
    });
  } catch {
    // Sin tabla de tareas suficiente o error: continuar.
  }
  try {
    await db.insert(alertas).values({
      expedienteId,
      tipo: 'documento',
      severidad: 'advertencia',
      titulo: 'Expediente bloqueado por cliente',
      mensaje,
    });
  } catch {
    // idem
  }
  try {
    await logSgie({
      usuarioId: responsableId ?? ACTOR_SISTEMA,
      accion: 'internal_escalation_created',
      recurso: 'expediente',
      recursoId: expedienteId,
      mensaje,
      metadata: { origen: 'motor_recordatorios' },
      exito: true,
    });
  } catch {
    // idem
  }
}
